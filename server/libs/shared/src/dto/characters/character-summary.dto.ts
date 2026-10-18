import { NewsRole } from "@app/shared/enums/news-role.enum";
import { Race } from "@app/shared/enums/race.enum";
import { Tribe } from "@app/shared/enums/tribe.enum";
import { RpPresenceFieldsDto } from "./rp-presence.dto";

// ER2-806: rpStatus / rpLocation / rpStatusExpiresAt are optional
export interface CharacterSummaryDto extends RpPresenceFieldsDto {
	name: string;
	profession?: string;
	server: string;
	avatar: string;
	race: Race;
	tribe: Tribe;
	newsRole?: NewsRole;
}
