import { Race } from "@app/shared/enums/race.enum";
import { Tribe } from "@app/shared/enums/tribe.enum";

export interface CharacterRefreshResultDto {
	name: string;
	race: Race;
	tribe: Tribe;
	server: string;
	avatar: string;
}
