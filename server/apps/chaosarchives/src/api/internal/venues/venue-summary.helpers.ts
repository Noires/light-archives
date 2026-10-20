import { VenueNextEventDto } from '@app/shared/dto/venues/venue-summary.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';

export const VENUE_LOCATION_LABELS: Record<VenueLocation, string> = {
  [VenueLocation.OPEN_WORLD]: 'Offene Welt',
  [VenueLocation.HOUSE]: 'Haus',
  [VenueLocation.APARTMENT]: 'Wohnung',
};

export const HOUSING_AREA_LABELS: Record<HousingArea, string> = {
  [HousingArea.MIST]: 'Dorf des Nebels',
  [HousingArea.LAVENDER_BEDS]: 'Lavendelbeete',
  [HousingArea.GOBLET]: 'Kelchkuppe',
  [HousingArea.SHIROGANE]: 'Shirogane',
  [HousingArea.EMPYREUM]: 'Empyreum',
};

/**
 * Directory tags for a venue: the owner's own tags first, then the location type and housing area
 * (German labels). Case-insensitive duplicates and empty values are dropped.
 */
export function deriveVenueTags(
  ownTags: string[],
  location: VenueLocation | null | undefined,
  housingArea: HousingArea | null | undefined,
): string[] {
  const candidates = [
    ...ownTags,
    location ? VENUE_LOCATION_LABELS[location] : undefined,
    location !== VenueLocation.OPEN_WORLD && housingArea ? HOUSING_AREA_LABELS[housingArea] : undefined,
  ];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const tag = (candidate || '').trim();
    const key = tag.toLowerCase();

    if (tag && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }

  return result;
}

export interface VenueEventRow {
  venueId: number;
  id: number;
  title: string;
  startDateTime: Date;
  endDateTime: Date | null;
}

/**
 * Picks the next relevant event per venue: an event that is still running or starts in the future
 * (events without an end count until their start). Earliest start wins, ties by lowest id.
 */
export function selectNextEvents(rows: VenueEventRow[], now: Date): Map<number, VenueNextEventDto> {
  const best = new Map<number, VenueEventRow>();
  const nowMs = now.getTime();

  for (const row of rows) {
    const startMs = row.startDateTime.getTime();
    const endMs = row.endDateTime ? row.endDateTime.getTime() : startMs;

    if (endMs < nowMs) {
      continue;
    }

    const current = best.get(row.venueId);

    if (
      !current
      || startMs < current.startDateTime.getTime()
      || (startMs === current.startDateTime.getTime() && row.id < current.id)
    ) {
      best.set(row.venueId, row);
    }
  }

  const result = new Map<number, VenueNextEventDto>();

  for (const [venueId, row] of best) {
    result.set(venueId, { id: row.id, title: row.title, startDateTime: row.startDateTime.getTime() });
  }

  return result;
}
