import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import { deriveVenueTags, selectNextEvents, VenueEventRow } from './venue-summary.helpers';

describe('deriveVenueTags', () => {
  it('appends location and housing area labels after own tags', () => {
    expect(deriveVenueTags(['Taverne', 'Musik'], VenueLocation.HOUSE, HousingArea.MIST))
      .toEqual(['Taverne', 'Musik', 'Haus', 'Dorf des Nebels']);
  });

  it('ignores the housing area for open world venues', () => {
    expect(deriveVenueTags([], VenueLocation.OPEN_WORLD, HousingArea.GOBLET)).toEqual(['Offene Welt']);
  });

  it('drops empty values and case-insensitive duplicates', () => {
    expect(deriveVenueTags(['', ' haus ', 'Bar', 'bar'], VenueLocation.HOUSE, null)).toEqual(['haus', 'Bar']);
  });
});

describe('selectNextEvents', () => {
  const now = new Date('2026-10-18T18:00:00Z');
  const row = (venueId: number, id: number, start: string, end: string | null = null): VenueEventRow => ({
    venueId,
    id,
    title: `Event ${id}`,
    startDateTime: new Date(start),
    endDateTime: end ? new Date(end) : null,
  });

  it('picks the earliest upcoming event per venue', () => {
    const result = selectNextEvents([
      row(1, 10, '2026-10-20T19:00:00Z'),
      row(1, 11, '2026-10-19T19:00:00Z'),
      row(2, 12, '2026-10-25T19:00:00Z'),
    ], now);

    expect(result.get(1)).toEqual({ id: 11, title: 'Event 11', startDateTime: new Date('2026-10-19T19:00:00Z').getTime() });
    expect(result.get(2)?.id).toBe(12);
  });

  it('prefers a running event over a later one', () => {
    const result = selectNextEvents([
      row(1, 20, '2026-10-18T20:00:00Z'),
      row(1, 21, '2026-10-18T17:00:00Z', '2026-10-18T19:00:00Z'),
    ], now);

    expect(result.get(1)?.id).toBe(21);
  });

  it('skips finished events and events without end that already started', () => {
    const result = selectNextEvents([
      row(1, 30, '2026-10-18T15:00:00Z', '2026-10-18T17:00:00Z'),
      row(1, 31, '2026-10-18T17:30:00Z'),
    ], now);

    expect(result.has(1)).toBe(false);
  });

  it('breaks ties by lowest id', () => {
    const result = selectNextEvents([
      row(1, 41, '2026-10-19T19:00:00Z'),
      row(1, 40, '2026-10-19T19:00:00Z'),
    ], now);

    expect(result.get(1)?.id).toBe(40);
  });
});
