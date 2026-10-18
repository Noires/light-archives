// ER2-505 / ER2-509 — structured venue location and the teleport command.
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';

export interface VenueLocationSource {
	server?: string;
	location?: VenueLocation | null;
	housingArea?: HousingArea | null;
	ward?: number | null;
	plot?: number | null;
	room?: string | null;
	subdivision?: boolean | null;
	address?: string | null;
}

export interface LocationRow {
	label: string;
	value: string;
}

export const HOUSING_AREA_LABELS: Record<string, string> = {
	[HousingArea.MIST]: 'Dorf des Nebels',
	[HousingArea.LAVENDER_BEDS]: 'Lavendelbeete',
	[HousingArea.GOBLET]: 'Kelchkuppe',
	[HousingArea.SHIROGANE]: 'Shirogane',
	[HousingArea.EMPYREUM]: 'Empyreum',
};

// Lifestream's `/li` parser understands the English district names on every
// client language, so the command uses those.
const HOUSING_AREA_COMMAND: Record<string, string> = {
	[HousingArea.MIST]: 'Mist',
	[HousingArea.LAVENDER_BEDS]: 'Lavender Beds',
	[HousingArea.GOBLET]: 'Goblet',
	[HousingArea.SHIROGANE]: 'Shirogane',
	[HousingArea.EMPYREUM]: 'Empyreum',
};

const SUBDIVISION_OFFSET = 30;

export function hasHousing(venue: VenueLocationSource | null | undefined): boolean {
	return !!venue
		&& !!venue.location
		&& venue.location !== VenueLocation.OPEN_WORLD
		&& !!venue.housingArea
		&& !!venue.ward;
}

function plotNumber(venue: VenueLocationSource): number | null {
	if (!venue.plot) {
		return null;
	}
	return venue.subdivision && venue.plot <= SUBDIVISION_OFFSET ? venue.plot + SUBDIVISION_OFFSET : venue.plot;
}

/** Welt / Wohngebiet / Bezirk / Haus rows; Welt / Ort for open-world venues. */
export function locationRows(venue: VenueLocationSource | null | undefined): LocationRow[] {
	if (!venue) {
		return [];
	}
	const rows: LocationRow[] = [];
	if (venue.server) {
		rows.push({ label: 'Welt', value: venue.server });
	}
	if (hasHousing(venue)) {
		rows.push({ label: 'Wohngebiet', value: HOUSING_AREA_LABELS[venue.housingArea as string] || '' });
		rows.push({ label: 'Bezirk', value: `${String(venue.ward)}${venue.subdivision ? ' (Erweiterung)' : ''}` });
		if (venue.location === VenueLocation.HOUSE && venue.plot) {
			rows.push({ label: 'Haus', value: `Nr. ${String(plotNumber(venue))}` });
		} else if (venue.location === VenueLocation.APARTMENT && venue.room) {
			rows.push({ label: 'Wohnung', value: `${venue.room}` });
		}
	} else if (venue.address) {
		rows.push({ label: 'Ort', value: venue.address });
	}
	return rows;
}

/** One-line German address. */
export function addressText(venue: VenueLocationSource | null | undefined): string {
	if (!venue) {
		return '';
	}
	if (!hasHousing(venue)) {
		return venue.address || '';
	}
	const area = HOUSING_AREA_LABELS[venue.housingArea as string] || '';
	let text = `${area}, Bezirk ${String(venue.ward)}`;
	if (venue.location === VenueLocation.HOUSE && venue.plot) {
		text += `, Haus ${String(plotNumber(venue))}`;
	} else if (venue.location === VenueLocation.APARTMENT && venue.room) {
		text += `, Wohnung ${venue.room}`;
	}
	if (venue.subdivision) {
		text += ' (Erweiterung)';
	}
	return text;
}

/** `/li <Welt> <Wohngebiet> <Bezirk> <Haus>`, or '' when the data is incomplete. */
export function teleportCommand(venue: VenueLocationSource | null | undefined): string {
	if (!venue || !venue.server || !hasHousing(venue)) {
		return '';
	}
	const area = HOUSING_AREA_COMMAND[venue.housingArea as string];
	if (!area) {
		return '';
	}
	const parts = [ '/li', venue.server, area, String(venue.ward) ];
	if (venue.location === VenueLocation.HOUSE) {
		const plot = plotNumber(venue);
		if (!plot) {
			return '';
		}
		parts.push(String(plot));
	}
	return parts.join(' ');
}
