import { UserInfo } from '@app/auth/model/user-info';
import { Character, Follow, Story, Venue } from '@app/entity';
import { FollowDto, FollowStatusDto, FollowTargetType } from '@app/shared/dto/social/follow.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { isQueryFailedError } from '../../../common/db';

const NUMERIC_KEY = /^[1-9][0-9]{0,9}$/;
const SERIES_KEY = /^([1-9][0-9]{0,9}):(.+)$/s;

/** Splits a series key `${authorCharacterId}:${seriesTitle}`; null if malformed. */
export function parseSeriesKey(key: string): { authorCharacterId: number; seriesTitle: string } | null {
  const match = SERIES_KEY.exec(key);
  return match ? { authorCharacterId: parseInt(match[1], 10), seriesTitle: match[2] } : null;
}

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private readonly followRepo: Repository<Follow>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Venue) private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
  ) {}

  async follow(targetType: FollowTargetType, targetKey: string, user: UserInfo): Promise<FollowStatusDto> {
    await this.assertTargetExists(targetType, targetKey);
    const existing = await this.followRepo.findOne({ where: { user: { id: user.id }, targetType, targetKey } });

    if (!existing) {
      try {
        await this.followRepo.save(this.followRepo.create({ user: { id: user.id }, targetType, targetKey }));
      } catch (e) {
        // Concurrent double click: the unique constraint already holds the follow
        if (!(isQueryFailedError(e) && e.code === 'ER_DUP_ENTRY')) {
          throw e;
        }
      }
    }

    return this.getStatus(targetType, targetKey, user);
  }

  async unfollow(targetType: FollowTargetType, targetKey: string, user: UserInfo): Promise<void> {
    await this.followRepo.delete({ user: { id: user.id }, targetType, targetKey });
  }

  async getMine(user: UserInfo): Promise<FollowDto[]> {
    const follows = await this.followRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    return follows.map((follow) => ({
      targetType: follow.targetType,
      targetKey: follow.targetKey,
      createdAt: follow.createdAt.getTime(),
    }));
  }

  async getStatus(targetType: FollowTargetType, targetKey: string, user: UserInfo): Promise<FollowStatusDto> {
    const [following, followerCount] = await Promise.all([
      this.followRepo.exists({ where: { user: { id: user.id }, targetType, targetKey } }),
      this.followRepo.count({ where: { targetType, targetKey } }),
    ]);

    return { following, followerCount };
  }

  /** User ids following any of the given keys of one target type, deduplicated. */
  async getFollowerUserIds(targetType: FollowTargetType, targetKeys: string[]): Promise<number[]> {
    if (targetKeys.length === 0) {
      return [];
    }

    const rows: { userId: number }[] = await this.followRepo
      .createQueryBuilder('follow')
      .select('DISTINCT follow.userId', 'userId')
      .where('follow.targetType = :targetType', { targetType })
      .andWhere('follow.targetKey IN (:...targetKeys)', { targetKeys })
      .getRawMany();

    return rows.map((row) => Number(row.userId));
  }

  private async assertTargetExists(targetType: FollowTargetType, targetKey: string): Promise<void> {
    let exists = false;

    if (targetType === 'character' || targetType === 'author') {
      exists = NUMERIC_KEY.test(targetKey) && await this.characterRepo.exists({
        where: { id: parseInt(targetKey, 10), verifiedAt: Not(IsNull()) },
      });
    } else if (targetType === 'venue') {
      exists = NUMERIC_KEY.test(targetKey) && await this.venueRepo.exists({ where: { id: parseInt(targetKey, 10) } });
    } else if (targetType === 'story-series') {
      const parsed = parseSeriesKey(targetKey);

      if (!parsed) {
        throw new BadRequestException('Invalid series key');
      }

      exists = await this.storyRepo.exists({
        where: {
          owner: { id: parsed.authorCharacterId },
          seriesTitle: parsed.seriesTitle,
          published: true,
        },
      });
    }

    if (!exists) {
      throw new NotFoundException('Follow target not found');
    }
  }

}
