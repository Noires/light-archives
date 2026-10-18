import { GroupSummaryExtrasDto } from "../common/group-summary-extras.dto";

// ER2 round 2: memberCount, memberAvatars, nextEvent (optional) from GroupSummaryExtrasDto
export interface FreeCompanySummaryDto extends GroupSummaryExtrasDto {
	// ER2 round 2 (optional)
	id?: number;
	/** FC tag from the Lodestone, without the guillemets */
	tag?: string;
	name: string;
	goal: string;
	crest: string[];
	server: string;
	// ER2-810 (optional)
	recruiting?: boolean | null;
}
