import { EventCreaterResultDto } from '@app/shared/dto/events/event-create-result.dto';
import { EventEditDto } from '@app/shared/dto/events/event-edit.dto';
import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { EventSummariesDto } from '@app/shared/dto/events/event-summaries.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import APITransport from './api-transport';

export default class EventsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('events');
  }

  async getEvents(params: { refresh: boolean }): Promise<EventSummariesDto> {
    return this.transport.get<EventSummariesDto>('', params);
  }

  async getEvent(id: number): Promise<EventDto> {
    return this.transport.tokenGet<EventDto>(`${id}`);
  }

  async getEventForEdit(id: number): Promise<EventEditDto> {
    return this.transport.authGet<EventEditDto>(`${id}`, { edit: true });
  }

  async createEvent(event: EventEditDto, characterId: number): Promise<EventCreaterResultDto> {
    // Include characterId in the DTO
    event.characterId = characterId;
    return this.transport.authPost<EventCreaterResultDto>('', event);
  }

  async updateEvent(id: number, event: EventEditDto): Promise<EventEditDto> {
    return this.transport.authPut<EventEditDto>(`${id}`, event);
  }

  async deleteEvent(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }

  /**
   * Register (closed events) or RSVP (open events). `kind` defaults to 'going' on the server.
   * Calling again with a different kind switches the existing registration.
   */
  async registerForEvent(id: number, characterId: number, kind?: EventRegistrationKind): Promise<void> {
    return this.transport.authPost<void>(`${id}/registrations`, kind ? { characterId, kind } : { characterId });
  }

  async unregisterForEvent(id: number, characterId: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}/registrations/${characterId}`);
  }

  /** Public download URL of a single event as iCalendar (text/calendar). Usable directly as an <a href>. */
  getEventIcsUrl(id: number): string {
    return `${this.transport.prefix}${id}/ics`;
  }

  /**
   * iCalendar feed (as text) of all events the current user's characters registered for.
   * Requires a token, so it cannot be used as a plain link; wrap the result in a Blob to download.
   */
  async getMyEventsIcs(): Promise<string> {
    return this.transport.authGet<string>('my.ics');
  }

  async searchEvents(query: string): Promise<EventSearchResultDto[]> {
    return this.transport.authGet<EventSearchResultDto[]>('search', { query });
  }

  async getEventsForMonth(year: number, month: number): Promise<EventSummaryDto[]> {
    return this.transport.tokenGet<EventSummaryDto[]>(`month/${year}/${month}`);
  }

  async getEventsForVenue(venueId: number, timeRange: 'upcoming' | 'past' | 'all' = 'upcoming'): Promise<EventSummaryDto[]> {
    return this.transport.tokenGet<EventSummaryDto[]>(`venue/${venueId}`, { timeRange });
  }
}
