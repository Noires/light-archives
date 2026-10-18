import { StoryType } from "@app/shared/enums/story-type.enum";
import { ReactionCountsDto } from "../reactions/reaction.dto";

export interface StorySummaryDto {
	id: number;
	title: string;
	author: string;
	createdAt: number;
	type: StoryType;
	excerpt?: string;
	// ER2-810 (optional)
	published?: boolean;
	// ER2 round 2 (optional, read only)
	authorServer?: string;
	contentNotes?: string[];
	seriesTitle?: string|null;
	seriesIndex?: number|null;
	/** words in the content with HTML stripped */
	wordCount?: number;
	reactionCounts?: ReactionCountsDto;
}
