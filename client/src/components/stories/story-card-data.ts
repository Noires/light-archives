import type { ReactionCountsDto } from '@app/shared/dto/reactions/reaction.dto';
import type { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';

/**
 * ER2-604 — StorySummaryDto plus fields a newer API may add to the list
 * response. All optional: the directory hides filters and badges whose data
 * is missing.
 */
export type StoryCardData = StorySummaryDto & {
  authorServer?: string;
  contentNotes?: string[];
  seriesTitle?: string | null;
  seriesIndex?: number | null;
  wordCount?: number;
  readingMinutes?: number;
  reactionCount?: number;
  reactionCounts?: ReactionCountsDto;
};
