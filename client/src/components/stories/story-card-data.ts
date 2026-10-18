import type { ReactionCountsDto } from '@app/shared/dto/reactions/reaction.dto';
import type { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';

/**
 * ER2-604 — StorySummaryDto plus fields a newer API may add to the list
 * response. All optional: the directory hides filters and badges whose data
 * is missing. ER2 round 2 put authorServer, contentNotes, series, wordCount
 * and reactionCounts on StorySummaryDto; readingMinutes / reactionCount stay
 * as aliases.
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

/** Content notes of a story, empty when the API sends none (older versions). */
export function storyContentNotes(story: { contentNotes?: unknown }): string[] {
  const notes = story.contentNotes;
  return Array.isArray(notes) ? notes.filter((note): note is string => typeof note === 'string' && !!note.trim()) : [];
}

/** CW badge label: the note itself when there is one, else the count. */
export function contentNotesLabel(notes: string[]): string {
  if (notes.length === 0) {
    return '';
  }
  return notes.length === 1 ? notes[0] : `${notes.length} Inhaltswarnungen`;
}
