import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** ER2 social: in-app notification kinds. */
export type NotificationType =
  | 'series-part'
  | 'author-story'
  | 'venue-event'
  | 'event-reminder'
  | 'event-registration'
  | 'image-tag';

export const NOTIFICATION_TYPES: readonly NotificationType[] = Object.freeze([
  'series-part',
  'author-story',
  'venue-event',
  'event-reminder',
  'event-registration',
  'image-tag',
] as NotificationType[]);

export const NOTIFICATION_RETENTION_DAYS = 90;
export const REMINDER_MINUTES_MIN = 5;
export const REMINDER_MINUTES_MAX = 1440;
export const REMINDER_MINUTES_DEFAULT = 30;

export interface NotificationDto {
  id?: number;
  type?: NotificationType;
  /** German text */
  title?: string;
  body?: string | null;
  /** client route, e.g. /story/12 */
  link?: string;
  /** epoch millis or null when unread */
  readAt?: number | null;
  /** epoch millis */
  createdAt?: number;
}

export interface NotificationUnreadCountDto {
  count?: number;
}

/**
 * In-app notifications are on per type by default. Discord DMs are strictly opt-in
 * (`discordDm`, default false) and can be switched off at any time.
 */
export interface NotificationPreferencesDto {
  seriesPart?: boolean;
  authorStory?: boolean;
  venueEvent?: boolean;
  eventReminder?: boolean;
  eventRegistration?: boolean;
  imageTag?: boolean;
  discordDm?: boolean;
  reminderMinutes?: number;
}

export type NotificationPreferenceFlag = Exclude<keyof NotificationPreferencesDto, 'discordDm' | 'reminderMinutes'>;

export const NOTIFICATION_PREFERENCE_FLAG: Readonly<{ [type in NotificationType]: NotificationPreferenceFlag }> = Object.freeze({
  'series-part': 'seriesPart',
  'author-story': 'authorStory',
  'venue-event': 'venueEvent',
  'event-reminder': 'eventReminder',
  'event-registration': 'eventRegistration',
  'image-tag': 'imageTag',
});

/** Body of PUT /notifications/preferences; omitted fields stay unchanged. */
export class NotificationPreferencesUpdateDto implements NotificationPreferencesDto {
  @IsOptional() @IsBoolean() seriesPart?: boolean;

  @IsOptional() @IsBoolean() authorStory?: boolean;

  @IsOptional() @IsBoolean() venueEvent?: boolean;

  @IsOptional() @IsBoolean() eventReminder?: boolean;

  @IsOptional() @IsBoolean() eventRegistration?: boolean;

  @IsOptional() @IsBoolean() imageTag?: boolean;

  @IsOptional() @IsBoolean() discordDm?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(REMINDER_MINUTES_MIN)
  @Max(REMINDER_MINUTES_MAX)
  reminderMinutes?: number;
}

/** Query of GET /notifications */
export class NotificationListQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
