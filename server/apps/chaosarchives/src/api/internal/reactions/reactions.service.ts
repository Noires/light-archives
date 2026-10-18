import { UserInfo } from '@app/auth/model/user-info';
import { Character, Image, Reaction, Story } from '@app/entity';
import {
  ReactionCountsDto,
  ReactionModerationDto,
  ReactionSummaryDto,
  ReactionToggleRequestDto,
} from '@app/shared/dto/reactions/reaction.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { isReactionKindAllowed, ReactionKind, ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { isQueryFailedError } from '../../../common/db';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction) private readonly reactionRepo: Repository<Reaction>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(Image) private readonly imageRepo: Repository<Image>,
  ) {}

  /** Adds the reaction if absent, removes it if present. One reaction per kind per character. */
  async toggle(request: ReactionToggleRequestDto, user: UserInfo): Promise<ReactionSummaryDto> {
    const { targetType, targetId, kind, characterId } = request;

    if (!isReactionKindAllowed(targetType, kind)) {
      throw new BadRequestException(`Reaction "${kind}" is not allowed for ${targetType}`);
    }

    if (!user.characters.some((character) => character.id === characterId)) {
      throw new ForbiddenException('Invalid character id');
    }

    const character = await this.characterRepo.findOne({
      where: { id: characterId, user: { id: user.id }, verifiedAt: Not(IsNull()) },
    });

    if (!character) {
      throw new BadRequestException('Character not found or not verified');
    }

    await this.assertTargetExists(targetType, targetId);

    const existing = await this.reactionRepo.findOne({
      where: { targetType, targetId, kind, character: { id: characterId } },
    });

    if (existing) {
      // A reaction hidden by moderation stays in place, so it cannot be re-added unhidden
      if (!existing.hidden) {
        await this.reactionRepo.remove(existing);
      }
    } else {
      try {
        await this.reactionRepo.save(this.reactionRepo.create({ targetType, targetId, kind, character, hidden: false }));
      } catch (e) {
        // Concurrent double click: the unique constraint already holds the reaction
        if (!(isQueryFailedError(e) && e.code === 'ER_DUP_ENTRY')) {
          throw e;
        }
      }
    }

    return this.getSummary(targetType, targetId, user, characterId);
  }

  /**
   * Counts (hidden reactions excluded) and the current user's reactions. With `characterId`,
   * `myReactions` only covers that character, otherwise all of the user's characters.
   */
  async getSummary(
    targetType: ReactionTargetType,
    targetId: number,
    user?: UserInfo,
    characterId?: number,
  ): Promise<ReactionSummaryDto> {
    return (await this.getSummaries(targetType, [targetId], user, characterId)).get(targetId)
      || { reactionCounts: {}, myReactions: [] };
  }

  async getSummaries(
    targetType: ReactionTargetType,
    targetIds: number[],
    user?: UserInfo,
    characterId?: number,
  ): Promise<Map<number, ReactionSummaryDto>> {
    const result = new Map<number, ReactionSummaryDto>();

    if (targetIds.length === 0) {
      return result;
    }

    for (const id of targetIds) {
      result.set(id, { reactionCounts: {}, myReactions: [] });
    }

    const rows: { targetId: number; kind: ReactionKind; count: string }[] = await this.reactionRepo
      .createQueryBuilder('reaction')
      .select('reaction.targetId', 'targetId')
      .addSelect('reaction.kind', 'kind')
      .addSelect('COUNT(*)', 'count')
      .where('reaction.targetType = :targetType', { targetType })
      .andWhere('reaction.targetId IN (:...targetIds)', { targetIds })
      .andWhere('reaction.hidden = :hidden', { hidden: false })
      .groupBy('reaction.targetId')
      .addGroupBy('reaction.kind')
      .getRawMany();

    for (const row of rows) {
      const summary = result.get(Number(row.targetId));

      if (summary) {
        (summary.reactionCounts as ReactionCountsDto)[row.kind] = Number(row.count);
      }
    }

    const characterIds = characterId
      ? (user?.characters || []).filter((ch) => ch.id === characterId).map((ch) => ch.id)
      : (user?.characters || []).map((ch) => ch.id);

    if (characterIds.length > 0) {
      const mine = await this.reactionRepo.find({
        where: {
          targetType,
          targetId: In(targetIds),
          character: { id: In(characterIds) },
        },
      });

      for (const reaction of mine) {
        const summary = result.get(reaction.targetId);

        if (summary && !summary.myReactions.includes(reaction.kind)) {
          summary.myReactions.push(reaction.kind);
        }
      }
    }

    return result;
  }

  async listForModeration(targetType: ReactionTargetType, targetId: number): Promise<ReactionModerationDto[]> {
    const reactions = await this.reactionRepo.find({
      where: { targetType, targetId },
      relations: ['character', 'character.server'],
      order: { createdAt: 'DESC' },
    });

    return reactions.map((reaction) => ({
      id: reaction.id,
      targetType: reaction.targetType,
      targetId: reaction.targetId,
      kind: reaction.kind,
      hidden: reaction.hidden,
      characterId: reaction.character.id,
      characterName: reaction.character.name,
      characterServer: reaction.character.server?.name || '',
      createdAt: reaction.createdAt.getTime(),
    }));
  }

  async setHidden(reactionId: number, hidden: boolean): Promise<void> {
    const result = await this.reactionRepo.update({ id: reactionId }, { hidden });

    if (!result.affected) {
      throw new NotFoundException('Reaction not found');
    }
  }

  private async assertTargetExists(targetType: ReactionTargetType, targetId: number): Promise<void> {
    let exists = false;

    if (targetType === ReactionTargetType.STORY) {
      exists = !!(await this.storyRepo.findOne({ where: { id: targetId }, select: ['id'] }));
    } else if (targetType === ReactionTargetType.IMAGE) {
      const image = await this.imageRepo.findOne({ where: { id: targetId }, select: ['id', 'category'] });
      exists = !!image && image.category !== ImageCategory.UNLISTED;
    }

    if (!exists) {
      throw new NotFoundException('Reaction target not found');
    }
  }
}
