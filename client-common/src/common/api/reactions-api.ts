import {
  ReactionModerationDto,
  ReactionSummaryDto,
  ReactionToggleRequestDto,
} from '@app/shared/dto/reactions/reaction.dto';
import { ReactionTargetType } from '@app/shared/enums/reaction.enum';
import APITransport from './api-transport';

/** ER2-807: reactions on stories and images (fixed German set, see REACTION_KINDS_BY_TARGET). */
export default class ReactionsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('reactions');
  }

  /** Adds or removes one reaction kind for the given own character; returns fresh counts. */
  async toggleReaction(request: ReactionToggleRequestDto): Promise<ReactionSummaryDto> {
    return this.transport.authPost<ReactionSummaryDto>('toggle', request);
  }

  /** Counts + own reactions (of `characterId`, or of all own characters when omitted). */
  async getReactions(targetType: ReactionTargetType, targetId: number, characterId?: number): Promise<ReactionSummaryDto> {
    return this.transport.tokenGet<ReactionSummaryDto>(
      `${targetType}/${targetId}`,
      characterId ? { characterId } : undefined,
    );
  }

  /** Moderators: single reactions incl. hidden ones. */
  async getReactionsForModeration(targetType: ReactionTargetType, targetId: number): Promise<ReactionModerationDto[]> {
    return this.transport.authGet<ReactionModerationDto[]>(`${targetType}/${targetId}/all`);
  }

  /** Moderators: hide or unhide a reaction. */
  async setReactionHidden(reactionId: number, hidden: boolean): Promise<void> {
    return this.transport.authPut<void>(`${reactionId}/hidden`, { hidden });
  }
}
