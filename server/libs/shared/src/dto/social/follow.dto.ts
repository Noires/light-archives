import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * ER2 social: what a user can follow.
 * - character: character id
 * - venue: venue id
 * - story-series: `${authorCharacterId}:${seriesTitle}`
 * - author: author character id (stories)
 */
export type FollowTargetType = 'character' | 'venue' | 'story-series' | 'author';

export const FOLLOW_TARGET_TYPES: readonly FollowTargetType[] = Object.freeze([
  'character',
  'venue',
  'story-series',
  'author',
] as FollowTargetType[]);

export const FOLLOW_TARGET_KEY_MAX_LENGTH = 160;

/** Series follow key: `${authorCharacterId}:${seriesTitle}` */
export function storySeriesFollowKey(authorCharacterId: number, seriesTitle: string): string {
  return `${authorCharacterId}:${seriesTitle}`;
}

/** Body of PUT /follows */
export class FollowRequestDto {
  @IsIn(FOLLOW_TARGET_TYPES as FollowTargetType[])
  targetType: FollowTargetType;

  @IsString()
  @MinLength(1)
  @MaxLength(FOLLOW_TARGET_KEY_MAX_LENGTH)
  targetKey: string;
}

/** Query of GET /follows/status */
export class FollowStatusQueryDto extends FollowRequestDto {}

export interface FollowDto {
  targetType?: FollowTargetType;
  targetKey?: string;
  /** epoch millis */
  createdAt?: number;
}

export interface FollowStatusDto {
  following?: boolean;
  followerCount?: number;
}
