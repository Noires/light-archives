import { HousingArea } from "@app/shared/enums/housing-area.enum";
import { VenueOpeningStatusDto } from "./venue-opening-hours.dto";

// ER2-805: openNow / opensAt / closesAt / openingHours / openingHoursDerived are optional
export interface VenueSummaryDto extends VenueOpeningStatusDto {
	id: number;
	name: string;
	server: string;
	address: string;
	housingArea: HousingArea|null;
	purpose: string;
}
