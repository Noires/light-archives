import { UserInfo } from '@app/auth/model/user-info';
import { Character, Image, Reaction, Story } from '@app/entity';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { ReactionKind, ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { Role } from '@app/shared/enums/role.enum';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { ReactionsService } from './reactions.service';

type StoredReaction = {
  id: number;
  targetType: ReactionTargetType;
  targetId: number;
  kind: ReactionKind;
  character: { id: number };
  hidden: boolean;
};

/** In-memory reaction repository that enforces the (targetType, targetId, character, kind) unique key. */
function createReactionRepo() {
  const rows: StoredReaction[] = [];
  let nextId = 1;
  const matches = (row: StoredReaction, where: any) =>
    row.targetType === where.targetType
    && row.targetId === where.targetId
    && row.kind === where.kind
    && row.character.id === where.character.id;

  const repo = {
    rows,
    findOne: jest.fn(async ({ where }: any) => rows.find((row) => matches(row, where)) || null),
    find: jest.fn(async () => []),
    create: jest.fn((data: any) => ({ ...data })),
    save: jest.fn(async (entity: any) => {
      const row = { ...entity, character: { id: entity.character.id } } as StoredReaction;
      if (rows.some((existing) => matches(existing, row))) {
        const error = new QueryFailedError('INSERT', [], new Error('Duplicate entry')) as QueryFailedError & { code: string };
        error.code = 'ER_DUP_ENTRY';
        throw error;
      }
      row.id = nextId++;
      rows.push(row);
      return row;
    }),
    remove: jest.fn(async (entity: StoredReaction) => {
      const index = rows.findIndex((row) => row.id === entity.id);
      if (index >= 0) {
        rows.splice(index, 1);
      }
      return entity;
    }),
    createQueryBuilder: jest.fn(() => {
      const qb: any = {};
      ['select', 'addSelect', 'where', 'andWhere', 'groupBy', 'addGroupBy'].forEach((method) => {
        qb[method] = jest.fn(() => qb);
      });
      qb.getRawMany = jest.fn(async () => {
        const counts = new Map<string, number>();
        rows.filter((row) => !row.hidden).forEach((row) => {
          const key = `${row.targetId}|${row.kind}`;
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([key, count]) => {
          const [targetId, kind] = key.split('|');
          return { targetId: Number(targetId), kind, count: String(count) };
        });
      });
      return qb;
    }),
  };

  return repo;
}

const user = new UserInfo({
  id: 1,
  role: Role.USER,
  characters: [{ id: 10 } as any, { id: 11 } as any],
  termsAcceptedAt: null,
  telemetryConsentStatus: undefined as any,
  telemetryConsentVersion: 0,
  telemetryConsentUpdatedAt: null,
});

describe('ReactionsService.toggle', () => {
  let reactionRepo: ReturnType<typeof createReactionRepo>;
  let service: ReactionsService;
  const characterRepo = { findOne: jest.fn(async ({ where }: any) => ({ id: where.id })) };
  const storyRepo = { findOne: jest.fn(async ({ where }: any) => (where.id === 5 ? { id: 5 } : null)) };
  const imageRepo = {
    findOne: jest.fn(async ({ where }: any) => {
      if (where.id === 7) {
        return { id: 7, category: ImageCategory.ARTWORK };
      }
      if (where.id === 8) {
        return { id: 8, category: ImageCategory.UNLISTED };
      }
      return null;
    }),
  };

  beforeEach(() => {
    reactionRepo = createReactionRepo();
    service = new ReactionsService(
      reactionRepo as unknown as Repository<Reaction>,
      characterRepo as unknown as Repository<Character>,
      storyRepo as unknown as Repository<Story>,
      imageRepo as unknown as Repository<Image>,
    );
  });

  const toggleStory = (kind = ReactionKind.GAENSEHAUT, characterId = 10) => service.toggle({
    targetType: ReactionTargetType.STORY,
    targetId: 5,
    kind,
    characterId,
  }, user);

  it('adds a reaction on first toggle and removes it on the second', async () => {
    const added = await toggleStory();
    expect(reactionRepo.rows).toHaveLength(1);
    expect(added.reactionCounts[ReactionKind.GAENSEHAUT]).toBe(1);

    const removed = await toggleStory();
    expect(reactionRepo.rows).toHaveLength(0);
    expect(removed.reactionCounts[ReactionKind.GAENSEHAUT]).toBeUndefined();
  });

  it('keeps one reaction per kind per character but allows different kinds and characters', async () => {
    await toggleStory(ReactionKind.GAENSEHAUT, 10);
    await toggleStory(ReactionKind.SPANNEND, 10);
    const summary = await toggleStory(ReactionKind.GAENSEHAUT, 11);

    expect(reactionRepo.rows).toHaveLength(3);
    expect(summary.reactionCounts[ReactionKind.GAENSEHAUT]).toBe(2);
    expect(summary.reactionCounts[ReactionKind.SPANNEND]).toBe(1);
  });

  it('treats a concurrent duplicate insert as already reacted', async () => {
    // Simulate a race: the lookup misses, but the row exists when inserting
    reactionRepo.rows.push({
      id: 99,
      targetType: ReactionTargetType.STORY,
      targetId: 5,
      kind: ReactionKind.GAENSEHAUT,
      character: { id: 10 },
      hidden: false,
    });
    reactionRepo.findOne.mockResolvedValueOnce(null);

    await expect(toggleStory()).resolves.toBeDefined();
    expect(reactionRepo.rows).toHaveLength(1);
  });

  it('does not remove or re-add a reaction hidden by moderation', async () => {
    await toggleStory();
    reactionRepo.rows[0].hidden = true;

    const summary = await toggleStory();
    expect(reactionRepo.rows).toHaveLength(1);
    expect(summary.reactionCounts[ReactionKind.GAENSEHAUT]).toBeUndefined();
  });

  it('rejects kinds that do not belong to the target type', async () => {
    await expect(toggleStory(ReactionKind.WUNDERSCHOEN)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects characters of other users', async () => {
    await expect(toggleStory(ReactionKind.GAENSEHAUT, 99)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects missing or unlisted targets', async () => {
    await expect(service.toggle({
      targetType: ReactionTargetType.STORY, targetId: 6, kind: ReactionKind.SPANNEND, characterId: 10,
    }, user)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.toggle({
      targetType: ReactionTargetType.IMAGE, targetId: 8, kind: ReactionKind.WUNDERSCHOEN, characterId: 10,
    }, user)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.toggle({
      targetType: ReactionTargetType.IMAGE, targetId: 7, kind: ReactionKind.WUNDERSCHOEN, characterId: 10,
    }, user)).resolves.toBeDefined();
  });
});
