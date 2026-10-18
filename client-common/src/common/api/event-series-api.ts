import { EventOccurrenceDto, EventSeriesDto } from '@app/shared/dto/events/event-series.dto';
import APITransport from './api-transport';

/** ER2-804: recurring event series. */
export default class EventSeriesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('event-series');
  }

  /** Series owned by any of the current user's characters. */
  async getMySeries(): Promise<EventSeriesDto[]> {
    return this.transport.authGet<EventSeriesDto[]>('mine');
  }

  /** Series incl. German `label` and the next 3 occurrences. */
  async getSeries(id: number): Promise<EventSeriesDto> {
    return this.transport.tokenGet<EventSeriesDto>(`${id}`);
  }

  /** Next occurrences in server time (1..12, default 3). */
  async getNextOccurrences(id: number, count = 3): Promise<EventOccurrenceDto[]> {
    return this.transport.get<EventOccurrenceDto[]>(`${id}/next`, { count });
  }

  /** `series.characterId` (owner) is required. */
  async createSeries(series: EventSeriesDto): Promise<EventSeriesDto> {
    return this.transport.authPost<EventSeriesDto>('', series);
  }

  async updateSeries(id: number, series: EventSeriesDto): Promise<EventSeriesDto> {
    return this.transport.authPut<EventSeriesDto>(`${id}`, series);
  }
}
