import {
  NotificationDto,
  NotificationPreferencesDto,
  NotificationUnreadCountDto,
} from '@app/shared/dto/social/notification.dto';
import APITransport from './api-transport';

/** ER2 social: in-app notifications and their preferences. Not yet available on older API versions. */
export default class NotificationsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('notifications');
  }

  async getNotifications(options: { unreadOnly?: boolean; limit?: number } = {}): Promise<NotificationDto[]> {
    const params: { unreadOnly?: string; limit?: number } = {};

    if (options.unreadOnly) {
      params.unreadOnly = 'true';
    }

    if (options.limit) {
      params.limit = options.limit;
    }

    return this.transport.authGet<NotificationDto[]>('', params);
  }

  async getUnreadCount(): Promise<NotificationUnreadCountDto> {
    return this.transport.authGet<NotificationUnreadCountDto>('unread-count');
  }

  async markRead(id: number): Promise<void> {
    return this.transport.authPut<void>(`${id}/read`, {});
  }

  async markAllRead(): Promise<void> {
    return this.transport.authPut<void>('read-all', {});
  }

  async deleteNotification(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }

  async getPreferences(): Promise<NotificationPreferencesDto> {
    return this.transport.authGet<NotificationPreferencesDto>('preferences');
  }

  /** Omitted fields stay unchanged. */
  async updatePreferences(preferences: NotificationPreferencesDto): Promise<NotificationPreferencesDto> {
    return this.transport.authPut<NotificationPreferencesDto>('preferences', preferences);
  }
}
