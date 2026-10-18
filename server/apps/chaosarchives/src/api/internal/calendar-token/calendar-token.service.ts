import { serverConfiguration } from '@app/configuration';
import { CalendarToken, Character, Event, EventRegistration } from '@app/entity';
import { CalendarTokenDto } from '@app/shared/dto/social/calendar-token.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { buildIcsCalendar, htmlToIcsPlainText, IcsEvent } from '../events/ics';
import { calendarFeedUrl, generateCalendarToken, isCalendarTokenFormat } from './calendar-token.util';

const MAX_EVENTS = 500;

/** Same mapping as the per-event export in events.service (kept local to avoid touching that file). */
export function toIcsEvent(event: Event, frontendRoot: string): IcsEvent {
  const root = frontendRoot.replace(/\/+$/, '');
  let host = 'elpisgarten';

  try {
    host = new URL(root).host || host;
  } catch {
    // keep fallback host
  }

  const location = (event.locations || [])
    .map((loc) => [loc.name, loc.address, loc.server?.name].filter((part) => !!part && part.trim()).join(', '))
    .filter((loc) => loc.length > 0)
    .join(' / ');

  return {
    uid: `event-${event.id}@${host}`,
    start: event.startDateTime,
    end: event.endDateTime,
    summary: event.title,
    location: location || null,
    url: root ? `${root}/event/${event.id}` : null,
    description: htmlToIcsPlainText(event.details || '') || null,
    lastModified: event.updatedAt || null,
  };
}

@Injectable()
export class CalendarTokenService {
  constructor(
    @InjectRepository(CalendarToken) private readonly tokenRepo: Repository<CalendarToken>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventRegistration) private readonly registrationRepo: Repository<EventRegistration>,
    private readonly bookmarksService: BookmarksService,
  ) {}

  async get(userId: number): Promise<CalendarTokenDto | null> {
    const token = await this.tokenRepo.findOne({ where: { user: { id: userId } } });
    return token ? this.toDto(token) : null;
  }

  /** Creates the token, or replaces it (the old feed URL stops working). */
  async createOrRotate(userId: number): Promise<CalendarTokenDto> {
    await this.tokenRepo.delete({ user: { id: userId } });
    const token = await this.tokenRepo.save(this.tokenRepo.create({ user: { id: userId }, token: generateCalendarToken() }));
    return this.toDto(token);
  }

  async revoke(userId: number): Promise<void> {
    await this.tokenRepo.delete({ user: { id: userId } });
  }

  /** Upcoming events the user's characters registered for, plus bookmarked events; hidden ones excluded. */
  async getFeed(token: string): Promise<string> {
    const calendarToken = isCalendarTokenFormat(token)
      ? await this.tokenRepo.findOne({ where: { token }, relations: ['user'] })
      : null;

    if (!calendarToken) {
      throw new NotFoundException('Calendar not found');
    }

    const userId = calendarToken.user.id;
    const now = new Date();
    const since = DateTime.fromJSDate(now).minus({ days: 1 }).toJSDate();
    const characters = await this.characterRepo.find({ where: { user: { id: userId } }, select: ['id'] });
    const characterIds = characters.map((character) => character.id);
    const eventIds = new Set(await this.bookmarksService.getBookmarkedEventIds(userId));

    if (characterIds.length > 0) {
      const rows: { eventId: number }[] = await this.registrationRepo
        .createQueryBuilder('registration')
        .innerJoin('registration.event', 'event')
        .select('DISTINCT event.id', 'eventId')
        .where('registration.characterId IN (:...characterIds)', { characterIds })
        .andWhere('(event.startDateTime >= :since OR event.endDateTime >= :now)', { since, now })
        .limit(MAX_EVENTS)
        .getRawMany();
      rows.forEach((row) => eventIds.add(Number(row.eventId)));
    }

    let events: Event[] = [];

    if (eventIds.size > 0) {
      events = await this.eventRepo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.locations', 'location')
        .leftJoinAndSelect('location.server', 'server')
        .where('event.id IN (:...eventIds)', { eventIds: [...eventIds] })
        .andWhere('event.hidden = :hidden', { hidden: false })
        .andWhere('(event.startDateTime >= :since OR event.endDateTime >= :now)', { since, now })
        .orderBy('event.startDateTime', 'ASC')
        .take(MAX_EVENTS)
        .getMany();
    }

    return buildIcsCalendar(events.map((event) => toIcsEvent(event, serverConfiguration.frontendRoot || '')), {
      name: 'Elpisgarten – Mein Kalender',
      timezone: SharedConstants.FFXIV_SERVER_TIMEZONE,
      now,
    });
  }

  private toDto(token: CalendarToken): CalendarTokenDto {
    return {
      url: calendarFeedUrl(serverConfiguration.frontendRoot || '', token.token),
      createdAt: token.createdAt.getTime(),
    };
  }
}
