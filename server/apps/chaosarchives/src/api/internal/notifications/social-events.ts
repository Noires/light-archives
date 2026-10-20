import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';

/**
 * ER2 social: domain events (EventEmitter2) consumed by the notifications module.
 * Emitters only send ids and plain values, listeners load what they need.
 */
export const SocialEvents = Object.freeze({
  /** stories.service: a published story was created, or a draft became published */
  STORY_PUBLISHED: 'story.published',
  /** events.service: a non-hidden event was created */
  EVENT_CREATED: 'event.created',
  /** events.service: a new registration (not a kind change) */
  EVENT_REGISTRATION_CREATED: 'event.registration.created',
  /** images (other agent): a character was tagged on an image */
  IMAGE_TAG_REQUESTED: 'image.tag.requested',
});

export interface StoryPublishedEvent {
  storyId: number;
  actorUserId: number;
}

export interface EventCreatedEvent {
  eventId: number;
  actorUserId: number;
}

export interface EventRegistrationCreatedEvent {
  eventId: number;
  eventTitle: string;
  ownerUserId: number | null;
  characterName: string;
  kind: EventRegistrationKind;
  actorUserId: number;
}

export interface ImageTagRequestedEvent {
  taggedCharacterId: number;
  imageId: number;
  byCharacterName: string;
  /** optional: lets the listener skip self-tags */
  byUserId?: number;
}
