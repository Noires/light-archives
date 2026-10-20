import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt } from 'class-validator';
import { REACTION_TARGET_TYPES, ReactionKind, ReactionTargetType } from '../../enums/reaction.enum';

export type ReactionCountsDto = { [kind in ReactionKind]?: number };

/** ER2-807: also embedded (optionally) as `reactionCounts` / `myReactions` in StoryDto and ImageDto. */
export interface ReactionSummaryDto {
  reactionCounts: ReactionCountsDto;
  myReactions: ReactionKind[];
}

/** ER2-807: body of POST /reactions/toggle */
export class ReactionToggleRequestDto {
  @IsIn(REACTION_TARGET_TYPES as ReactionTargetType[])
  targetType: ReactionTargetType;

  @Type(() => Number)
  @IsInt()
  targetId: number;

  // Validated per target type in the service
  @IsIn(Object.values(ReactionKind))
  kind: ReactionKind;

  @Type(() => Number)
  @IsInt()
  characterId: number;
}

export class ReactionHiddenRequestDto {
  @IsBoolean()
  hidden: boolean;
}

/** ER2-807: moderator view of single reactions */
export interface ReactionModerationDto {
  id: number;
  targetType: ReactionTargetType;
  targetId: number;
  kind: ReactionKind;
  hidden: boolean;
  characterId: number;
  characterName: string;
  characterServer: string;
  createdAt: number;
}
