import { HousingArea } from "@app/shared/enums/housing-area.enum";
import { VenueOpeningStatusDto } from "./venue-opening-hours.dto";

export interface VenueNextEventDto {
	id: number;
	title: string;
	/** epoch millis */
	startDateTime: number;
}

// ER2-805: openNow / opensAt / closesAt / openingHours / openingHoursDerived are optional
export interface VenueSummaryDto extends VenueOpeningStatusDto {
	id: number;
	name: string;
	server: string;
	address: string;
	housingArea: HousingArea|null;
	purpose: string;
	// ER2 round 2 (optional, read only)
	bannerUrl?: string|null;
	/** own tags, then location type and housing area (German labels) */
	tags?: string[];
	/** venue flag, falls back to the event template's adult flag */
	adultOnly?: boolean;
	/** next running or upcoming non-hidden event linked to this venue */
	nextEvent?: VenueNextEventDto|null;
}
