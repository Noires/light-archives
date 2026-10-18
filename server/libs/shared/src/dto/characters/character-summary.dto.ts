import { NewsRole } from "@app/shared/enums/news-role.enum";
import { Race } from "@app/shared/enums/race.enum";
import { Tribe } from "@app/shared/enums/tribe.enum";
import { RpPresenceFieldsDto } from "./rp-presence.dto";
import { CommunityRole } from "../communities/community-member.dto";

// ER2-806: rpStatus / rpLocation / rpStatusExpiresAt are optional
export interface CharacterSummaryDto extends RpPresenceFieldsDto {
	name: string;
	profession?: string;
	server: string;
	avatar: string;
	race: Race;
	tribe: Tribe;
	newsRole?: NewsRole;
	// ER2 round 2 (optional)
	id?: number;
	bannerUrl?: string | null;
	/** lore title line ("Titel"), may contain [[wikilinks]] */
	title?: string | null;
	/** epoch millis of the last profile change (updatedAt) */
	lastActiveAt?: number;
	playStyleTags?: string[];
	accentColor?: string | null;
	/** only when the list is filtered by communityId */
	communityRole?: CommunityRole;
}
