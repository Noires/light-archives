import { EventCreaterResultDto } from '@app/shared/dto/events/event-create-result.dto';
import { EventEditDto } from '@app/shared/dto/events/event-edit.dto';
import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { EventSummariesDto } from '@app/shared/dto/events/event-summaries.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
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

  async searchEvents(query: string): Promise<EventSearchResultDto[]> {
    return this.transport.authGet<EventSearchResultDto[]>('search', { query });
  }

  async getEventsForMonth(year: number, month: number): Promise<EventSummaryDto[]> {
    return this.transport.tokenGet<EventSummaryDto[]>(`month/${year}/${month}`);
  }

  async getEventsForVenue(venueId: number): Promise<EventSummaryDto[]> {
    return this.transport.tokenGet<EventSummaryDto[]>(`venue/${venueId}`);
  }
}
