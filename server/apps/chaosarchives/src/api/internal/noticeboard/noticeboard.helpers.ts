export const NOTICEBOARD_EXCERPT_LENGTH = 240;

/** Prefix of the HTML content loaded for list excerpts (enough markup for ~240 plain characters). */
export const NOTICEBOARD_EXCERPT_SOURCE_LENGTH = 4000;

export interface PinnableItem {
  pinned: boolean;
  pinnedAt: Date | null;
  createdAt: Date;
}

/**
 * List order: pinned items first (most recently pinned first), then everything by creation date,
 * newest first. Mirrors the SQL ORDER BY in NoticeboardService.
 */
export function comparePinnedFirst(a: PinnableItem, b: PinnableItem): number {
  if (a.pinned !== b.pinned) {
    return a.pinned ? -1 : 1;
  }

  if (a.pinned && b.pinned) {
    const pinnedDelta = (b.pinnedAt?.getTime() || 0) - (a.pinnedAt?.getTime() || 0);

    if (pinnedDelta !== 0) {
      return pinnedDelta;
    }
  }

  return b.createdAt.getTime() - a.createdAt.getTime();
}

/** Drops a tag cut off by a SQL LEFT() so it does not leak into the excerpt. */
export function dropTruncatedTag(htmlPrefix: string): string {
  return htmlPrefix.replace(/<[^>]*$/, '');
}
