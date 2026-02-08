import { NewsRole } from "@app/shared/enums/news-role.enum";
import { Race } from "@app/shared/enums/race.enum";
import { Tribe } from "@app/shared/enums/tribe.enum";

export interface CharacterSummaryDto {
	name: string;
	profession?: string;
	server: string;
	avatar: string;
	race: Race;
	tribe: Tribe;
	newsRole?: NewsRole;
}
