import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

/** ER2 social: what a user can bookmark ("Merkliste"). */
export type BookmarkTargetType = 'venue' | 'character' | 'event' | 'story';

export const BOOKMARK_TARGET_TYPES: readonly BookmarkTargetType[] = Object.freeze([
  'venue',
  'character',
  'event',
  'story',
] as BookmarkTargetType[]);

/** Body of PUT /bookmarks */
export class BookmarkRequestDto {
  @IsIn(BOOKMARK_TARGET_TYPES as BookmarkTargetType[])
  targetType: BookmarkTargetType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetId: number;
}

/** Query of GET /bookmarks/status */
export class BookmarkStatusQueryDto extends BookmarkRequestDto {}

export interface BookmarkDto {
  targetType?: BookmarkTargetType;
  targetId?: number;
  /** epoch millis */
  createdAt?: number;
  /** false when the target was deleted, hidden or unpublished; title/link/imageUrl are then null */
  available?: boolean;
  title?: string | null;
  /** e.g. server name, event start or story author */
  subtitle?: string | null;
  /** client route */
  link?: string | null;
  imageUrl?: string | null;
}

export interface BookmarkStatusDto {
  bookmarked?: boolean;
}
