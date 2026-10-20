import { GroupSummaryExtrasDto } from "../common/group-summary-extras.dto";

// ER2 round 2: memberCount, memberAvatars, nextEvent (optional) from GroupSummaryExtrasDto
export interface CommunitySummaryDto extends GroupSummaryExtrasDto {
	id: number;
	name: string;
	goal: string;
	// ER2-810 (optional)
	recruiting?: boolean | null;
}
