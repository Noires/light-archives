import { Notification, NotificationPreference } from '@app/entity';
import {
  NOTIFICATION_PREFERENCE_FLAG,
  NOTIFICATION_RETENTION_DAYS,
  NotificationDto,
  NotificationPreferencesDto,
  NotificationPreferencesUpdateDto,
  NotificationType,
  REMINDER_MINUTES_DEFAULT,
} from '@app/shared/dto/social/notification.dto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Repository } from 'typeorm';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body?: string | null;
  link: string;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Readonly<Required<NotificationPreferencesDto>> = Object.freeze({
  seriesPart: true,
  authorStory: true,
  venueEvent: true,
  eventReminder: true,
  eventRegistration: true,
  imageTag: true,
  discordDm: false,
  reminderMinutes: REMINDER_MINUTES_DEFAULT,
});

const TITLE_MAX = 255;
const LINK_MAX = 255;
const BODY_MAX = 2000;

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function toPreferencesDto(pref?: NotificationPreference | null): Required<NotificationPreferencesDto> {
  if (!pref) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  return {
    seriesPart: pref.seriesPart,
    authorStory: pref.authorStory,
    venueEvent: pref.venueEvent,
    eventReminder: pref.eventReminder,
    eventRegistration: pref.eventRegistration,
    imageTag: pref.imageTag,
    discordDm: pref.discordDm,
    reminderMinutes: pref.reminderMinutes,
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference) private readonly preferenceRepo: Repository<NotificationPreference>,
  ) {}

  /** Creates an in-app notification for one user, unless the user switched this type off. */
  async notify(userId: number, payload: NotificationPayload): Promise<void> {
    await this.notifyMany([userId], payload);
  }

  /** Creates the same in-app notification for several users, respecting each user's preferences. */
  async notifyMany(userIds: number[], payload: NotificationPayload): Promise<number[]> {
    const uniqueIds = [...new Set(userIds)];

    if (uniqueIds.length === 0) {
      return [];
    }

    const prefs = await this.getPreferencesForUsers(uniqueIds);
    const flag = NOTIFICATION_PREFERENCE_FLAG[payload.type];
    const recipients = uniqueIds.filter((id) => prefs.get(id)?.[flag] !== false);

    if (recipients.length > 0) {
      await this.notificationRepo.insert(recipients.map((id) => ({
        user: { id },
        type: payload.type,
        title: clip(payload.title, TITLE_MAX),
        body: payload.body ? clip(payload.body, BODY_MAX) : null,
        link: clip(payload.link, LINK_MAX),
        readAt: null,
      })));
    }

    return recipients;
  }

  /** Preferences per user; users without a stored row get the defaults. */
  async getPreferencesForUsers(userIds: number[]): Promise<Map<number, Required<NotificationPreferencesDto>>> {
    const result = new Map<number, Required<NotificationPreferencesDto>>();

    if (userIds.length === 0) {
      return result;
    }

    const rows = await this.preferenceRepo.find({
      where: { user: { id: In(userIds) } },
      relations: ['user'],
    });

    for (const id of userIds) {
      result.set(id, { ...DEFAULT_NOTIFICATION_PREFERENCES });
    }

    for (const row of rows) {
      result.set(row.user.id, toPreferencesDto(row));
    }

    return result;
  }

  async list(userId: number, unreadOnly: boolean, limit: number): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepo.find({
      where: { user: { id: userId }, ...(unreadOnly ? { readAt: IsNull() } : {}) },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: limit,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      readAt: notification.readAt ? notification.readAt.getTime() : null,
      createdAt: notification.createdAt.getTime(),
    }));
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({ where: { user: { id: userId }, readAt: IsNull() } });
  }

  async markRead(userId: number, id: number): Promise<void> {
    const notification = await this.notificationRepo.findOne({ where: { id, user: { id: userId } } });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      await this.notificationRepo.update({ id }, { readAt: new Date() });
    }
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepo.update({ user: { id: userId }, readAt: IsNull() }, { readAt: new Date() });
  }

  async delete(userId: number, id: number): Promise<void> {
    const result = await this.notificationRepo.delete({ id, user: { id: userId } });

    if (!result.affected) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getPreferences(userId: number): Promise<Required<NotificationPreferencesDto>> {
    const pref = await this.preferenceRepo.findOne({ where: { user: { id: userId } } });
    return toPreferencesDto(pref);
  }

  async updatePreferences(userId: number, update: NotificationPreferencesUpdateDto): Promise<Required<NotificationPreferencesDto>> {
    const existing = await this.preferenceRepo.findOne({ where: { user: { id: userId } } });
    const pref = existing || this.preferenceRepo.create({ ...DEFAULT_NOTIFICATION_PREFERENCES, user: { id: userId } });

    for (const key of Object.keys(DEFAULT_NOTIFICATION_PREFERENCES) as (keyof NotificationPreferencesDto)[]) {
      if (update[key] !== undefined) {
        (pref as unknown as Record<string, unknown>)[key] = update[key];
      }
    }

    await this.preferenceRepo.save(pref);
    return toPreferencesDto(pref);
  }

  /** DSGVO retention: notifications are kept for 90 days. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async deleteExpired(now = new Date()): Promise<void> {
    const cutoff = new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    try {
      const result = await this.notificationRepo.delete({ createdAt: LessThan(cutoff) });
      this.logger.log(`Deleted ${result.affected || 0} notifications older than ${NOTIFICATION_RETENTION_DAYS} days`);
    } catch (e) {
      this.logger.error(e instanceof Error ? e.message : e);
    }
  }
}
