import { BookmarkDto, BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';

/** Raw lookup rows; the image columns are null when there is no image. */
export interface VenueRow { id: number; name: string; serverName: string | null; imageOwnerId: number | null; imageHash: string | null; imageFilename: string | null }
export interface CharacterRow { id: number; name: string; serverName: string | null; avatar: string | null; showAvatar: boolean | number | null }
export interface EventRow { id: number; title: string; startDateTime: Date | string; hidden: boolean | number; imageOwnerId: number | null; imageHash: string | null; imageFilename: string | null }
export interface StoryRow { id: number; title: string; published: boolean | number; authorName: string | null }

export interface BookmarkTargetInfo {
  title: string;
  subtitle: string | null;
  link: string;
  imageUrl: string | null;
}

export type ImageUrlBuilder = (path: string) => string;

export interface BookmarkLike {
  targetType: BookmarkTargetType;
  targetId: number;
  createdAt: Date;
}

export function characterLink(serverName: string, name: string): string {
  return `/${serverName}/${name.replace(/ /g, '_')}`;
}

function thumbUrl(row: { imageOwnerId: number | null; imageHash: string | null; imageFilename: string | null }, imageUrl: ImageUrlBuilder): string | null {
  return row.imageOwnerId && row.imageHash && row.imageFilename
    ? imageUrl(`${row.imageOwnerId}/${row.imageHash}/thumb_${row.imageFilename}`)
    : null;
}

export function venueInfo(row: VenueRow, imageUrl: ImageUrlBuilder): BookmarkTargetInfo {
  return { title: row.name, subtitle: row.serverName, link: `/venue/${row.id}`, imageUrl: thumbUrl(row, imageUrl) };
}

export function characterInfo(row: CharacterRow): BookmarkTargetInfo {
  return {
    title: row.name,
    subtitle: row.serverName,
    link: row.serverName ? characterLink(row.serverName, row.name) : '/',
    // Respect the character's own "show avatar" setting
    imageUrl: row.avatar && row.showAvatar !== false && row.showAvatar !== 0 ? row.avatar : null,
  };
}

/** Hidden events are not available. */
export function eventInfo(row: EventRow, imageUrl: ImageUrlBuilder): BookmarkTargetInfo | null {
  if (row.hidden === true || row.hidden === 1) {
    return null;
  }

  const start = DateTime.fromJSDate(new Date(row.startDateTime)).setZone(SharedConstants.FFXIV_SERVER_TIMEZONE);
  return {
    title: row.title,
    subtitle: `${start.toFormat('dd.LL.yyyy, HH:mm')} Uhr`,
    link: `/event/${row.id}`,
    imageUrl: thumbUrl(row, imageUrl),
  };
}

/** Unpublished stories (drafts) are not available. */
export function storyInfo(row: StoryRow): BookmarkTargetInfo | null {
  if (row.published === false || row.published === 0) {
    return null;
  }

  return { title: row.title, subtitle: row.authorName, link: `/story/${row.id}`, imageUrl: null };
}

/** Groups target ids per type, deduplicated, for one batched lookup per type. */
export function groupTargetIds(bookmarks: BookmarkLike[]): Map<BookmarkTargetType, number[]> {
  const result = new Map<BookmarkTargetType, number[]>();

  for (const bookmark of bookmarks) {
    const ids = result.get(bookmark.targetType) || [];

    if (!ids.includes(bookmark.targetId)) {
      ids.push(bookmark.targetId);
    }

    result.set(bookmark.targetType, ids);
  }

  return result;
}

export function infoKey(targetType: BookmarkTargetType, targetId: number): string {
  return `${targetType}:${targetId}`;
}

export function toBookmarkDto(bookmark: BookmarkLike, info: BookmarkTargetInfo | null | undefined): BookmarkDto {
  return {
    targetType: bookmark.targetType,
    targetId: bookmark.targetId,
    createdAt: bookmark.createdAt.getTime(),
    available: !!info,
    title: info?.title ?? null,
    subtitle: info?.subtitle ?? null,
    link: info?.link ?? null,
    imageUrl: info?.imageUrl ?? null,
  };
}
