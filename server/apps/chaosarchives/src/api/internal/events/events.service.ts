import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { Character, ContentNote, Event, EventAnnouncement, EventLocation, EventRegistration, Image, Server, Venue } from '@app/entity';
import { BannerDto } from '@app/shared/dto/characters/banner.dto';
import { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventAnnouncementDto } from '@app/shared/dto/events/event-announcement.dto';
import { EventCreaterResultDto } from '@app/shared/dto/events/event-create-result.dto';
import { EventEditDto } from '@app/shared/dto/events/event-edit.dto';
import { EventIconDto } from '@app/shared/dto/events/event-icon.dto';
import { EventLinkDto } from '@app/shared/dto/events/event-link.dto';
import { EventLocationDto } from '@app/shared/dto/events/event-location.dto';
import { EventParticipantDto } from '@app/shared/dto/events/event-participant.dto';
import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { EventSummariesDto } from '@app/shared/dto/events/event-summaries.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import html from '@app/shared/html';
import SharedConstants from '@app/shared/SharedConstants';
import { isValidUrl } from '@app/shared/validation/validators';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime, Duration } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { Connection, EntityManager, In, IsNull, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { Contains } from '../../../common/db';
import { getBannerAspectRatioErrorMessage } from '../../../common/image-requirements';
import utils from '../../../common/utils';
import { ImagesService } from '../images/images.service';
import { ChocoboChronicleService } from './chocobo-chronicle.service';
import { CrescentMoonPublishingService } from './crescent-moon-publishing.service';
import { ExternalEvent } from './model/external-event';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  private readonly CACHE_DURATION_SHORT_MS = Duration.fromObject({ minutes: 5 }).toMillis();

  private readonly MAX_RESULTS = 10;

  constructor(
    private readonly cmpService: CrescentMoonPublishingService,
    private readonly ccService: ChocoboChronicleService,
    private readonly imagesService: ImagesService,
    private readonly connection: Connection,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRedis()
    private readonly redisService: Redis,
    private readonly httpService: HttpService,
  ) {}

  async getEvent(id: number, edit: boolean, user?: UserInfo): Promise<BaseEventDto> {
    // TODO: optimize query
    const event = await this.eventRepo.findOne({
      where: {
        id,
      },
      relations: [
        'owner',
        'owner.user',
        'locations',
        'locations.server',
        'locations.venue',
        'banner',
        'banner.owner',
        'discordBanner',
        'discordBanner.owner',
        'icon',
        'icon.owner',
        'contentNotes',
        'registrations',
        'registrations.character',
        'registrations.character.server',
      ],
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.toEventDto(event, edit, user);
  }

  async createEvent(eventDto: EventEditDto, characterId: number, user: UserInfo): Promise<EventCreaterResultDto> {
    const eventEntity = await this.connection.transaction(async (em) => {
      const character = await getVerifiedCharacter(em, characterId, user);

      const event = new Event();
      event.locations = [];
      event.announcements = Promise.resolve([]);
      event.owner = character;
      event.source = EventSource.WEBSITE;
      await this.updateEventInternal(em, event, eventDto);
      return event;
    });

    void this.notifySteward(eventEntity); // no await

    const result = (await this.toEventDto(eventEntity, true, user)) as EventCreaterResultDto;
    result.id = eventEntity.id;
    return result;
  }

  async updateEvent(eventId: number, eventDto: EventEditDto, user: UserInfo): Promise<EventEditDto> {
    const eventEntity = await this.connection.transaction(async (em) => {
      const event = await em.getRepository(Event).findOne({
        where: {
          id: eventId,
          owner: {
            user: {
              id: user.id,
            },
          },
        },
        relations: ['owner', 'owner.user', 'locations', 'locations.server', 'locations.venue', 'banner', 'banner.owner', 'discordBanner', 'discordBanner.owner', 'icon', 'icon.owner', 'contentNotes'],
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      await this.updateEventInternal(em, event, eventDto);
      return event;
    });

    void this.notifySteward(eventEntity); // no await
    return this.toEventDto(eventEntity, true, user) as Promise<EventEditDto>;
  }

  private async updateEventInternal(em: EntityManager, eventEntity: Event, eventDto: EventEditDto): Promise<void> {
    const event = eventEntity;
    event.title = eventDto.title;
    event.startDateTime = new Date(eventDto.startDateTime);
    event.endDateTime = eventDto.endDateTime ? new Date(eventDto.endDateTime) : null;
    event.details = html.sanitize(eventDto.details);
    event.oocDetails = html.sanitize(eventDto.oocDetails);
    const links = this.normalizeLinks(eventDto.links, eventDto.link, eventDto.linkText);

    for (const link of links) {
      if (!isValidUrl(link.url)) {
        throw new BadRequestException(`Invalid event link: ${link.url}`);
      }
    }

    event.links = links;
    event.link = links[0]?.url || '';
    event.linkText = links[0]?.label || '';
    event.contact = eventDto.contact;
    const normalizedEventType = this.normalizeEventType(eventDto.eventType);
    event.eventType = normalizedEventType;
    event.adultOnly = eventDto.adultOnly ?? (this.isLegacyAdultType(eventDto.eventType) || event.adultOnly || false);
    event.closedEvent = !!eventDto.closedEvent;
    event.registrationDeadlineDays = event.closedEvent
      ? this.normalizeRegistrationDeadlineDays(eventDto.registrationDeadlineDays)
      : null;
    event.registrationDeadlineTime = event.closedEvent
      ? this.normalizeOptionalTime(eventDto.registrationDeadlineTime, 'registrationDeadlineTime')
      : null;
    event.extraInfo = html.sanitize(eventDto.extraInfo || '');
    if (eventDto.contentNotes !== undefined) {
      event.contentNotes = eventDto.contentNotes
        .filter(note => note !== '')
        .map((note) => new ContentNote({ name: note }));
    }

    if (eventDto.banner && eventDto.banner.id) {
      const banner = await em.getRepository(Image).findOne({
        where: {
          id: eventDto.banner.id,
          owner: {
            user: {
              id: event.owner.user.id,
            },
          },
        },
        relations: ['owner', 'owner.user'],
      });

      if (!banner) {
        throw new BadRequestException('Banner not found');
      }

      if (banner.width / banner.height < SharedConstants.MIN_BANNER_ASPECT_RATIO) {
        throw new BadRequestException(
          getBannerAspectRatioErrorMessage(
            'Banner',
            banner.width,
            banner.height,
            SharedConstants.MIN_BANNER_ASPECT_RATIO,
          ),
        );
      }

      event.banner = Promise.resolve(banner);
    } else {
      event.banner = Promise.resolve(null as unknown as Image);
    }

    if (eventDto.icon && eventDto.icon.id) {
      const icon = await em.getRepository(Image).findOne({
        where: {
          id: eventDto.icon.id,
          owner: {
            user: {
              id: event.owner.user.id,
            },
          },
        },
        relations: ['owner', 'owner.user'],
      });

      if (!icon) {
        throw new BadRequestException('Icon not found');
      }

      event.icon = Promise.resolve(icon);
    } else {
      event.icon = Promise.resolve(null as unknown as Image);
    }

    if (eventDto.discordBanner && eventDto.discordBanner.id) {
      const discordBanner = await em.getRepository(Image).findOne({
        where: {
          id: eventDto.discordBanner.id,
          owner: {
            user: {
              id: event.owner.user.id,
            },
          },
        },
        relations: ['owner', 'owner.user'],
      });

      if (!discordBanner) {
        throw new BadRequestException('Discord banner not found');
      }

      if (discordBanner.width / discordBanner.height < SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
        throw new BadRequestException(
          getBannerAspectRatioErrorMessage(
            'Discord banner',
            discordBanner.width,
            discordBanner.height,
            SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO,
          ),
        );
      }

      event.discordBanner = Promise.resolve(discordBanner);
    } else {
      event.discordBanner = Promise.resolve(null as unknown as Image);
    }

    if (eventDto.locations.length === 0) {
      throw new BadRequestException('Event must have at least one location');
    }
    const dtoLocation = eventDto.locations[0];
    const existingLocations = event.locations || [];
    let location = dtoLocation.id
      ? existingLocations.find((candidate) => candidate.id === dtoLocation.id)
      : undefined;

    if (!location && existingLocations.length > 0) {
      location = existingLocations[0];
    }

    if (!location) {
      location = new EventLocation();
      location.event = event;
    }

    const locationsToRemove = existingLocations.filter((candidate) => candidate !== location);
    if (locationsToRemove.length > 0) {
      await Promise.all(locationsToRemove.map((candidate) => em.remove(candidate)));
    }

    location.name = dtoLocation.name;
    location.address = dtoLocation.address;
    location.link = dtoLocation.link;
    location.linkText = dtoLocation.link ? (dtoLocation.linkText || '') : '';

    if (location.link && !isValidUrl(location.link)) {
      throw new BadRequestException(`Invalid location link: ${location.link}`);
    }

    if (dtoLocation.venueId) {
      const venue = await em.getRepository(Venue).findOne({
        where: {
          id: dtoLocation.venueId,
        },
        relations: ['server'],
      });

      if (!venue) {
        throw new BadRequestException(`Venue ${dtoLocation.venueId} not found`);
      }

      location.venue = venue;
      location.server = venue.server;
    } else {
      location.venue = null;
      const server = await em.getRepository(Server).findOne({
        where: {
          name: dtoLocation.server,
        },
      });

      if (!server) {
        throw new BadRequestException(`Server ${dtoLocation.server} not found`);
      }

      location.server = server;
    }

    event.locations = [location];

    // Update announcements; O(n^2) filters used for code clarity, since number of notifications is small
    const dtoAnnouncementIds = eventDto.announcements.map((notification) => notification.id).filter((id) => !!id);
    const announcements: EventAnnouncement[] = [];
    const reusedAnnouncements: EventAnnouncement[] = [];
    const announcementsToRemove: EventAnnouncement[] = [];

    for (const announcement of await event.announcements) {
      if (dtoAnnouncementIds.includes(announcement.id)) {
        reusedAnnouncements.push(announcement);
      } else {
        announcementsToRemove.push(announcement);
      }
    }

    if (announcementsToRemove.length > 0) {
      await Promise.all(announcementsToRemove.map((announcement) => em.remove(announcement)));
    }

    for (const dtoAnnouncement of eventDto.announcements) {
      let announcement = reusedAnnouncements.find((n) => n.id === dtoAnnouncement.id);

      if (!announcement) {
        announcement = new EventAnnouncement();
        announcement.event = event;
      }

      announcements.push(announcement);
      announcement.content = dtoAnnouncement.content;
      announcement.minutesBefore = dtoAnnouncement.minutesBefore;
      announcement.postAt = DateTime.fromJSDate(event.startDateTime)
        .minus({ minutes: announcement.minutesBefore })
        .toJSDate();
    }

    event.announcements = Promise.resolve(announcements);
    await em.getRepository(Event).save(event);
  }

  async deleteEvent(eventId: number, user: UserInfo): Promise<void> {
    const eventEntity = await this.connection.transaction(async (em) => {
      const eventRepo = em.getRepository(Event);
      const event = await eventRepo.findOne({
        where: {
          id: eventId,
          owner: {
            user: {
              id: user.id,
            },
          },
        },
        relations: ['owner'],
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      await eventRepo.update({
        id: event.id,
      }, {
        banner: null,
        discordBanner: null,
        icon: null,
      } as unknown as QueryDeepPartialEntity<Event>);

      await eventRepo.softRemove(event);
      return event;
    });

    void this.notifySteward(eventEntity); // no await
  }

  async registerForEvent(eventId: number, characterId: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const event = await em.getRepository(Event).findOne({
        where: {
          id: eventId,
        },
        relations: ['owner', 'owner.user'],
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      this.assertRegistrationAllowed(event);
      const character = await getVerifiedCharacter(em, characterId, user);
      const registrationRepo = em.getRepository(EventRegistration);
      const existingRegistration = await registrationRepo.findOne({
        where: {
          event: { id: event.id },
          character: { id: character.id },
        },
        relations: ['event', 'character'],
      });

      if (existingRegistration) {
        return;
      }

      const registration = registrationRepo.create({
        event,
        character,
      });
      await registrationRepo.save(registration);
    });
  }

  async unregisterForEvent(eventId: number, characterId: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const event = await em.getRepository(Event).findOne({
        where: {
          id: eventId,
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      this.assertRegistrationAllowed(event);
      const character = await getVerifiedCharacter(em, characterId, user);
      const registrationRepo = em.getRepository(EventRegistration);
      const registration = await registrationRepo.findOne({
        where: {
          event: { id: event.id },
          character: { id: character.id },
        },
        relations: ['event', 'character'],
      });

      if (!registration) {
        return;
      }

      await registrationRepo.remove(registration);
    });
  }

  private async notifySteward(event: Event): Promise<void> {
    try {
      this.logger.debug(`Notifying Steward about event ${event.id} change`);
      await firstValueFrom(this.httpService.post(`${serverConfiguration.stewardWebhookUrl}/event`, { eventId: event.id }));
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(e.message, e.stack);
      } else {
        this.logger.error(e);
      }
    }
  }

  async getEvents(refreshExternal = false): Promise<EventSummariesDto> {
    const eventsTimestamp = await this.redisService.get('eventsTimestamp');
    let eventsUpToDate = false;

    if (eventsTimestamp) {
      const date = DateTime.fromMillis(parseInt(eventsTimestamp, 10));

      if (DateTime.now().diff(date).toMillis() <= this.CACHE_DURATION_SHORT_MS) {
        eventsUpToDate = true;
      }
    }

    if (!refreshExternal || eventsUpToDate) {
      return {
        events: await this.getEventsFromDatabase(),
        eventsUpToDate,
      };
    }

    // Not cached - fetch and cache
    const [cmpEvents, ccEvents] = await Promise.all([this.cmpService.fetchEvents(), this.ccService.fetchEvents()]);

    const events = [...cmpEvents, ...ccEvents].sort((e1, e2) =>
      utils.compareNumbers(e1.startDateTime, e2.startDateTime),
    );
    await this.saveEvents(events);
    await this.redisService.set('eventsTimestamp', Date.now().toString());
    return {
      events: await this.getEventsFromDatabase(),
      eventsUpToDate: true,
    };
  }

  private async getEventsFromDatabase(): Promise<EventSummaryDto[]> {
    const startOfDay = DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).startOf('day');
    const events = await this.eventRepo.find({
      where: [
        {
          startDateTime: MoreThanOrEqual(startOfDay.toJSDate()),
          hidden: false,
        },
        {
          endDateTime: MoreThanOrEqual(startOfDay.toJSDate()),
          hidden: false,
        },
      ],
      order: {
        startDateTime: 'ASC',
        createdAt: 'ASC',
      },
      take: this.MAX_RESULTS,
      relations: ['locations', 'locations.server', 'locations.venue', 'icon', 'icon.owner', 'contentNotes'],
    });

    return Promise.all(events.map((event) => this.toEventSummaryDto(event)));
  }

  private async saveEvents(events: ExternalEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await this.connection.transaction(async (em) => {
      const links = events.map((event) => event.link);
      const eventRepo = em.getRepository(Event);
      const existingEvents = await eventRepo.find({
        where: {
          externalSourceLink: In(links),
        },
        relations: ['locations'],
      });
      const existingEventsByLink = new Map<string, Event>();

      for (const existingEvent of existingEvents) {
        existingEventsByLink.set(existingEvent.externalSourceLink, existingEvent);
      }

      const savedEvents: Event[] = [];
      const serverNames = new Set(
        events
          .map((event) => event.locations.map((location) => location.server))
          .flat()
          .filter((serverName) => !!serverName),
      );
      const serversByName = new Map<string, Server>();

      if (serverNames.size > 0) {
        const servers = await em.getRepository(Server).find({
          where: {
            name: In(Array.from(serverNames)),
          },
        });

        for (const server of servers) {
          serversByName.set(server.name, server);
        }
      }

      const locationsToRemove: EventLocation[] = [];

      for (const eventDto of events) {
        const event =
          existingEventsByLink.get(eventDto.link) ||
          eventRepo.create({
            locations: [],
          });

      event.title = eventDto.title;
      event.details = html.sanitize(eventDto.details);
      event.startDateTime = new Date(eventDto.startDateTime);
      event.endDateTime = eventDto.endDateTime ? new Date(eventDto.endDateTime) : null;
      event.source = eventDto.source;
      event.eventType = EventType.RP;
      event.adultOnly = false;
      event.closedEvent = false;
      event.registrationDeadlineDays = null;
      event.registrationDeadlineTime = null;
      event.extraInfo = '';
      event.externalSourceLink = eventDto.link;
      event.links = [];
      event.linkText = '';

        const dtoLocations = eventDto.locations;

        if (event.locations.length > dtoLocations.length) {
          for (let i = dtoLocations.length; i < event.locations.length; i++) {
            locationsToRemove.push(event.locations[i]);
          }

          event.locations.splice(dtoLocations.length, event.locations.length - dtoLocations.length);
        } else if (event.locations.length < dtoLocations.length) {
          for (let i = event.locations.length; i < dtoLocations.length; i++) {
            const location = new EventLocation();
            location.event = event;
            event.locations.push(location);
          }
        }

        for (let i = 0; i < dtoLocations.length; i++) {
          const location = event.locations[i];
          const locationDto = dtoLocations[i];

          location.name = locationDto.name;
          location.address = locationDto.address;
          location.link = locationDto.link;
          location.linkText = '';

          if (location.link && !isValidUrl(location.link)) {
            throw new BadRequestException(`Invalid location link: ${location.link}`);
          }

          const server = serversByName.get(locationDto.server);

          if (!server) {
            throw new BadRequestException(`World server not found: ${server}`);
          }

          location.server = server;
        }

        savedEvents.push(event);
      }

      if (locationsToRemove.length > 0) {
        await Promise.all(locationsToRemove.map((location) => em.remove(location)));
      }

      await eventRepo.save(savedEvents);
    });
  }

  async search(query: string): Promise<EventSearchResultDto[]> {
    const results = await this.eventRepo.find({
      where: {
        title: Contains(query),
      },
      take: 10,
      select: ['id', 'title', 'startDateTime'],
    });

    return results.map((event) => ({
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime.getTime(),
    }));
  }

  async getByMonth(year: number, month: number): Promise<EventSummaryDto[]> {
    const startOfMonth = DateTime.fromObject(
      {
        year,
        month,
        day: 1,
      },
      {
        zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
      },
    );

    const endOfMonth = startOfMonth.plus({ months: 1 });

    const events = await this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.locations', 'location')
      .leftJoinAndSelect('location.server', 'server')
      .leftJoinAndSelect('location.venue', 'venue')
      .leftJoinAndSelect('event.icon', 'icon')
      .leftJoinAndSelect('icon.owner', 'iconOwner')
      .leftJoinAndSelect('event.contentNotes', 'contentNotes')
      .where('event.startDateTime >= :startOfMonth', { startOfMonth: startOfMonth.toJSDate() })
      .andWhere('event.startDateTime < :endOfMonth', { endOfMonth: endOfMonth.toJSDate() })
      .andWhere('event.hidden = :hidden', { hidden: false })
      .orderBy({
        'event.startDateTime': 'ASC',
        'event.createdAt': 'ASC',
      })
      .getMany();

    return Promise.all(events.map((event) => this.toEventSummaryDto(event)));
  }

  async getEventsForVenue(
    venueId: number,
    timeRange: 'upcoming' | 'past' | 'all' = 'upcoming',
  ): Promise<EventSummaryDto[]> {
    const startOfDay = DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).startOf('day');
    const query = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.locations', 'location')
      .leftJoinAndSelect('location.server', 'server')
      .leftJoinAndSelect('location.venue', 'venue')
      .leftJoinAndSelect('event.icon', 'icon')
      .leftJoinAndSelect('icon.owner', 'iconOwner')
      .leftJoinAndSelect('event.contentNotes', 'contentNotes')
      .where('venue.id = :venueId', { venueId })
      .andWhere('event.hidden = :hidden', { hidden: false });

    if (timeRange === 'upcoming') {
      query.andWhere('(event.startDateTime >= :startOfDay OR event.endDateTime >= :startOfDay)', {
        startOfDay: startOfDay.toJSDate(),
      });
      query.orderBy({
        'event.startDateTime': 'ASC',
        'event.createdAt': 'ASC',
      });
    } else if (timeRange === 'past') {
      query.andWhere('(event.endDateTime < :startOfDay OR (event.endDateTime IS NULL AND event.startDateTime < :startOfDay))', {
        startOfDay: startOfDay.toJSDate(),
      });
      query.orderBy({
        'event.startDateTime': 'DESC',
        'event.createdAt': 'DESC',
      });
    } else {
      query.orderBy({
        'event.startDateTime': 'ASC',
        'event.createdAt': 'ASC',
      });
    }

    const events = await query.distinct(true).getMany();

    return Promise.all(events.map((event) => this.toEventSummaryDto(event)));
  }

  private normalizeEventType(eventType?: EventType | null): EventType {
    if (!eventType || this.isLegacyAdultType(eventType)) {
      return EventType.RP;
    }
    return eventType;
  }

  private isLegacyAdultType(eventType?: EventType | null): boolean {
    return eventType === EventType.ADULT;
  }

  private resolveAdultOnly(event: Event): boolean {
    return event.adultOnly || this.isLegacyAdultType(event.eventType);
  }

  private getRegistrationDeadlineAt(event: Event): Date | null {
    if (!event.closedEvent) {
      return null;
    }

    const deadlineDays = event.registrationDeadlineDays ?? 0;
    let deadline = DateTime.fromJSDate(event.startDateTime).minus({ days: deadlineDays });

    if (event.registrationDeadlineTime) {
      const [hour, minute] = event.registrationDeadlineTime.split(':').map((part) => parseInt(part, 10));
      deadline = deadline.set({ hour, minute, second: 0, millisecond: 0 });
    }

    return deadline.toJSDate();
  }

  private isRegistrationOpen(event: Event): boolean {
    const deadlineAt = this.getRegistrationDeadlineAt(event);
    if (!deadlineAt) {
      return false;
    }

    return Date.now() <= deadlineAt.getTime();
  }

  private assertRegistrationAllowed(event: Event): void {
    if (!event.closedEvent) {
      throw new BadRequestException('Registrations are only available for closed events');
    }

    if (!this.isRegistrationOpen(event)) {
      throw new BadRequestException('Registration deadline has passed');
    }
  }

  private async toEventSummaryDto(event: Event): Promise<EventSummaryDto> {
    const icon = await event.icon;
    const eventType = this.normalizeEventType(event.eventType);
    const adultOnly = this.resolveAdultOnly(event);

    if (icon) {
      await this.imagesService.ensureIconThumb(icon);
    }

    return {
      id: event.id,
      title: event.title,
      icon: !icon
        ? null
        : new EventIconDto({
            id: icon.id,
            previewUrl: this.imagesService.getThumbUrl(icon),
            url: this.imagesService.getUrl(icon),
            thumbUrl: this.imagesService.getIconUrl(icon),
            width: icon.width,
            height: icon.height,
          }),
      startDateTime: event.startDateTime.getTime(),
      endDateTime: event.endDateTime ? event.endDateTime.getTime() : null,
      link: event.externalSourceLink || '',
      linkText: event.linkText || '',
      links: this.normalizeLinks(event.links, event.externalSourceLink || event.link, event.linkText),
      source: event.source,
      eventType,
      adultOnly,
      closedEvent: event.closedEvent,
      registrationDeadlineDays: event.registrationDeadlineDays,
      registrationDeadlineTime: event.registrationDeadlineTime || null,
      contentNotes: (event.contentNotes || []).map((note) => note.name),
      locations: event.locations.map((location) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        server: location.server?.name || '',
        link: location.link,
        linkText: location.linkText || '',
        venueId: location.venue?.id,
      })),
    };
  }

  private async toEventDto(event: Event, edit: boolean, user?: UserInfo): Promise<BaseEventDto> {
    const banner = await event.banner;
    const discordBanner = await event.discordBanner;
    const icon = await event.icon;
    const eventType = this.normalizeEventType(event.eventType);
    const adultOnly = this.resolveAdultOnly(event);
    const registrationDeadlineAt = this.getRegistrationDeadlineAt(event);
    const registrationOpen = this.isRegistrationOpen(event);
    const userCharacterIds = user?.characters?.map((character) => character.id) || [];
    const registrations = (event.registrations || []).slice().sort((a, b) =>
      utils.compareNumbers(a.createdAt.getTime(), b.createdAt.getTime()),
    );
    const myRegistrationCharacterIds = registrations
      .map((registration) => registration.character?.id)
      .filter((characterId): characterId is number => !!characterId && userCharacterIds.includes(characterId));
    const canManageParticipants = event.owner?.user?.id === user?.id;
    const participants = registrations.map((registration) =>
      new EventParticipantDto({
        characterId: registration.character.id,
        name: registration.character.name,
        server: registration.character.server?.name || '',
        avatar: registration.character.avatar,
        registeredAt: registration.createdAt.getTime(),
      }),
    );
    let announcements: EventAnnouncement[] = [];
    let images: ImageSummaryDto[] = [];

    if (icon) {
      await this.imagesService.ensureIconThumb(icon);
    }

    if (edit) {
      announcements = await event.announcements;
    } else {
      images = (await this.imagesService.getImages({ eventId: event.id })).data;
    }

    const properties = {
      title: event.title,
      mine: event.owner?.user?.id === user?.id,
      details: event.details,
      oocDetails: event.oocDetails,
      startDateTime: event.startDateTime.getTime(),
      endDateTime: event.endDateTime ? event.endDateTime.getTime() : null,
      link: event.externalSourceLink || event.link,
      linkText: event.linkText || '',
      links: this.normalizeLinks(event.links, event.externalSourceLink || event.link, event.linkText),
      contact: event.contact,
      eventType,
      adultOnly,
      closedEvent: event.closedEvent,
      registrationDeadlineDays: event.registrationDeadlineDays,
      registrationDeadlineTime: event.registrationDeadlineTime || null,
      contentNotes: (event.contentNotes || []).map((note) => note.name),
      extraInfo: event.extraInfo || '',
      banner: !banner
        ? null
        : new BannerDto({
            id: banner.id,
            url: this.imagesService.getUrl(banner),
            width: banner.width,
            height: banner.height,
          }),
      discordBanner: !discordBanner
        ? null
        : new BannerDto({
            id: discordBanner.id,
            url: this.imagesService.getUrl(discordBanner),
            width: discordBanner.width,
            height: discordBanner.height,
          }),
      icon: !icon
        ? null
        : new EventIconDto({
            id: icon.id,
            previewUrl: this.imagesService.getThumbUrl(icon),
            url: this.imagesService.getUrl(icon),
            thumbUrl: this.imagesService.getIconUrl(icon),
            width: icon.width,
            height: icon.height,
          }),
      locations: event.locations.map(location => new EventLocationDto({
        id: location.id,
        name: location.name,
        address: location.address,
        server: location.server?.name || '',
        link: location.link,
        linkText: location.linkText || '',
        venueId: location.venue?.id,
      })),
    };

    if (!edit) {
      return new EventDto({
        ...properties,
        images,
        registrationDeadlineAt: registrationDeadlineAt ? registrationDeadlineAt.getTime() : null,
        registrationOpen,
        participantCount: registrations.length,
        userRegistered: myRegistrationCharacterIds.length > 0,
        myRegistrationCharacterIds,
        canManageParticipants,
        participants: canManageParticipants ? participants : [],
      });
    }

    return new EventEditDto({
      ...properties,
      announcements: announcements.map(
        (announcement) =>
          new EventAnnouncementDto({
            id: announcement.id,
            minutesBefore: announcement.minutesBefore,
            content: announcement.content,
          }),
      ),
    });
  }

  private normalizeLinks(
    links: EventLinkDto[] | null | undefined,
    legacyLink?: string | null,
    legacyLabel?: string | null,
  ): EventLinkDto[] {
    const normalized = (links || [])
      .map((link) => ({
        url: (link?.url || '').trim(),
        label: (link?.label || '').trim(),
      }))
      .filter((link) => link.url.length > 0)
      .map((link) => new EventLinkDto({
        url: link.url,
        label: link.label || undefined,
      }));

    if (normalized.length === 0) {
      const url = (legacyLink || '').trim();
      if (url.length > 0) {
        return [
          new EventLinkDto({
            url,
            label: (legacyLabel || '').trim() || undefined,
          }),
        ];
      }
    }

    return normalized;
  }

  private normalizeRegistrationDeadlineDays(value: number | null | undefined): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    return Math.max(0, Math.floor(value));
  }

  private normalizeOptionalTime(value: string | null | undefined, fieldName: string): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return normalized;
  }
}
