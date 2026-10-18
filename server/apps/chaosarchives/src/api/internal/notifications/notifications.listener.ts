import { Character, Event, Story, Venue } from '@app/entity';
import { storySeriesFollowKey } from '@app/shared/dto/social/follow.dto';
import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from './notifications.service';
import {
  EventCreatedEvent,
  EventRegistrationCreatedEvent,
  ImageTagRequestedEvent,
  SocialEvents,
  StoryPublishedEvent,
} from './social-events';

/**
 * Splits story followers into series followers and author followers. Someone following both
 * gets only the (more specific) series notification. Excluded users (the actor and the
 * author's own account) are never notified.
 */
export function splitStoryRecipients(
  seriesFollowerIds: number[],
  authorFollowerIds: number[],
  excludedUserIds: (number | null | undefined)[],
): { seriesPart: number[]; authorStory: number[] } {
  const excluded = new Set(excludedUserIds);
  const seriesPart = [...new Set(seriesFollowerIds)].filter((id) => !excluded.has(id));
  const inSeries = new Set(seriesPart);
  const authorStory = [...new Set(authorFollowerIds)].filter((id) => !excluded.has(id) && !inSeries.has(id));
  return { seriesPart, authorStory };
}

/** Event start in the server time zone, e.g. "18.10.2026, 20:00". */
export function formatEventStart(date: Date): string {
  return DateTime.fromJSDate(date).setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).toFormat('dd.LL.yyyy, HH:mm');
}

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly followsService: FollowsService,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
  ) {}

  @OnEvent(SocialEvents.STORY_PUBLISHED, { async: true })
  async onStoryPublished(payload: StoryPublishedEvent): Promise<void> {
    await this.guard('story.published', async () => {
      const story = await this.storyRepo.findOne({
        where: { id: payload.storyId, published: true },
        relations: ['owner', 'owner.user'],
      });

      if (!story || !story.owner) {
        return;
      }

      const authorId = story.owner.id;
      const [seriesFollowers, authorFollowers] = await Promise.all([
        story.seriesTitle
          ? this.followsService.getFollowerUserIds('story-series', [storySeriesFollowKey(authorId, story.seriesTitle)])
          : Promise.resolve([]),
        this.followsService.getFollowerUserIds('author', [String(authorId)]),
      ]);
      const recipients = splitStoryRecipients(seriesFollowers, authorFollowers, [payload.actorUserId, story.owner.user?.id]);
      const link = `/story/${story.id}`;

      if (story.seriesTitle) {
        await this.notificationsService.notifyMany(recipients.seriesPart, {
          type: 'series-part',
          title: `Neuer Teil in „${story.seriesTitle}“`,
          body: `${story.owner.name}: ${story.title}`,
          link,
        });
      }

      await this.notificationsService.notifyMany(recipients.authorStory, {
        type: 'author-story',
        title: `${story.owner.name} hat eine neue Geschichte veröffentlicht`,
        body: story.title,
        link,
      });
    });
  }

  @OnEvent(SocialEvents.EVENT_CREATED, { async: true })
  async onEventCreated(payload: EventCreatedEvent): Promise<void> {
    await this.guard('event.created', async () => {
      const event = await this.eventRepo.findOne({
        where: { id: payload.eventId },
        relations: ['locations', 'locations.venue', 'owner', 'owner.user'],
      });

      if (!event || event.hidden) {
        return;
      }

      const excluded = new Set([payload.actorUserId, event.owner?.user?.id].filter((id) => id != null));
      const notified = new Set<number>();
      const venues = (event.locations || []).map((location) => location.venue).filter((venue): venue is Venue => !!venue);

      for (const venue of venues) {
        const followers = await this.followsService.getFollowerUserIds('venue', [String(venue.id)]);
        const recipients = followers.filter((id) => !excluded.has(id) && !notified.has(id));
        recipients.forEach((id) => notified.add(id));

        await this.notificationsService.notifyMany(recipients, {
          type: 'venue-event',
          title: `Neue Veranstaltung bei ${venue.name}`,
          body: `${event.title} · ${formatEventStart(event.startDateTime)} Uhr`,
          link: `/event/${event.id}`,
        });
      }
    });
  }

  @OnEvent(SocialEvents.EVENT_REGISTRATION_CREATED, { async: true })
  async onEventRegistrationCreated(payload: EventRegistrationCreatedEvent): Promise<void> {
    await this.guard('event.registration.created', async () => {
      if (!payload.ownerUserId || payload.ownerUserId === payload.actorUserId) {
        return;
      }

      const verb = payload.kind === EventRegistrationKind.INTERESTED ? 'interessiert sich für' : 'hat sich angemeldet für';
      await this.notificationsService.notify(payload.ownerUserId, {
        type: 'event-registration',
        title: `${payload.characterName} ${verb} „${payload.eventTitle}“`,
        body: null,
        link: `/event/${payload.eventId}`,
      });
    });
  }

  @OnEvent(SocialEvents.IMAGE_TAG_REQUESTED, { async: true })
  async onImageTagRequested(payload: ImageTagRequestedEvent): Promise<void> {
    await this.guard('image.tag.requested', async () => {
      const character = await this.characterRepo.findOne({
        where: { id: payload.taggedCharacterId },
        relations: ['user'],
      });
      const userId = character?.user?.id;

      if (!userId || userId === payload.byUserId) {
        return;
      }

      await this.notificationsService.notify(userId, {
        type: 'image-tag',
        title: `${payload.byCharacterName} möchte ${character.name} auf einem Bild markieren`,
        body: null,
        link: '/meine-inhalte',
      });
    });
  }

  /** Notifications are best effort: never let a failure reach the emitting request. */
  private async guard(name: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (e) {
      if (e instanceof Error) {
        this.logger.error(`${name}: ${e.message}`, e.stack);
      } else {
        this.logger.error(`${name}: ${String(e)}`);
      }
    }
  }
}
