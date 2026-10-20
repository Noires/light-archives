import { CalendarTokenDto } from '@app/shared/dto/social/calendar-token.dto';
import APITransport from './api-transport';

/**
 * ER2 social: personal calendar subscription URL (registered + bookmarked events).
 * Not yet available on older API versions.
 */
export default class CalendarTokenAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('calendar-token');
  }

  /** The current subscription, or null if none exists. */
  async getCalendarToken(): Promise<CalendarTokenDto | null> {
    return (await this.transport.authGet<CalendarTokenDto | ''>('')) || null;
  }

  /** Creates the subscription URL, or replaces it (the old URL stops working). */
  async createCalendarToken(): Promise<CalendarTokenDto> {
    return this.transport.authPost<CalendarTokenDto>('', {});
  }

  async revokeCalendarToken(): Promise<void> {
    return this.transport.authDelete<void>('');
  }
}
