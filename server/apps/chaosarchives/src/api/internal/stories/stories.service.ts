import { UserInfo } from '@app/auth/model/user-info';
import { Character, ContentNote, Story, StoryTag } from '@app/entity';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { StoryFilterDto } from '@app/shared/dto/stories/story-filter.dto';
import { StorySeriesDto } from '@app/shared/dto/stories/story-series.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import html from '@app/shared/html';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter'; // ER2 social
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, In, IsNull, Not, Repository } from 'typeorm';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { escapeForLike } from '../../../common/db';
import { buildExcerpt, countWords } from '../../../common/plain-text';
import { ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { ReactionsService } from '../reactions/reactions.service';
import { excludeTestContentSql } from '../test-content.filter';

@Injectable()
export class StoriesService {
  private readonly excerptMaxLength = 180;

  constructor(
    private connection: Connection,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    @InjectRepository(ContentNote) private contentNoteRepo: Repository<ContentNote>,
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(StoryTag) private storyTagRepo: Repository<StoryTag>,
    private reactionsService: ReactionsService,
    private eventEmitter: EventEmitter2, // ER2 social
  ) {}

  async getStory(id: number, user?: UserInfo): Promise<StoryDto> {
    const story = await this.storyRepo
      .createQueryBuilder('story')
      .innerJoinAndSelect('story.owner', 'character')
      .innerJoinAndSelect('character.user', 'user')
      .innerJoinAndSelect('character.server', 'server')
      .leftJoinAndSelect('story.contentNotes','notes')
      .where('story.id = :id', { id })
      .select(['story', 'character.id', 'character.name', 'user.id', 'server.name', 'notes.name'])
      .getOne();

    const mine = !!story && !!user && story.owner.user.id === user.id;

    // ER2-810: drafts are only visible to their owner
    if (!story || (story.published === false && !mine)) {
      throw new NotFoundException('Story not found');
    }

    story.tags = await this.storyTagRepo
      .createQueryBuilder('tag')
      .innerJoinAndSelect('tag.story', 'story')
      .where('story.id = :id', { id })
      .select('tag')
      .getMany();

    let seriesCount: number | undefined;

    if (story.seriesTitle) {
      const seriesQuery = this.storyRepo
        .createQueryBuilder('story')
        .where('story.ownerId = :ownerId', { ownerId: story.owner.id })
        .andWhere('story.seriesTitle = :seriesTitle', { seriesTitle: story.seriesTitle });

      if (!mine) {
        seriesQuery.andWhere('story.published = :published', { published: true });
      }

      seriesCount = await seriesQuery.getCount();
    }

    return new StoryDto({
      seriesTitle: story.seriesTitle,
      seriesIndex: story.seriesIndex,
      seriesCount,
      published: story.published,
      id: story.id,
      mine,
      author: story.owner.name,
      authorServer: story.owner.server.name,
      title: story.title,
      content: story.content,
      createdAt: story.createdAt!.getTime(),
      type: story.type,
      tags: story.tags.map((tag) => tag.name),
      contentNotes: story.contentNotes.map((note) => note.name)
    });
  }

  async createStory(storyDto: StoryDto & { id: undefined }, user: UserInfo): Promise<IdWrapper> {
    const storyEntity = await this.connection.transaction(async (em) => {
      let character: Character;

      if (storyDto.characterId) {
        // New approach: use character ID
        character = await getVerifiedCharacter(em, storyDto.characterId, user);
      } else if (storyDto.author && storyDto.authorServer) {
        // Legacy approach: use name + server
        const foundCharacter = await em.getRepository(Character).findOne({
          where: {
            name: storyDto.author,
            server: { name: storyDto.authorServer },
            user: { id: user.id },
            verifiedAt: Not(IsNull()),
          },
          relations: ['server'],
          select: ['id'],
        });

        if (!foundCharacter) {
          throw new BadRequestException(`Author character "${storyDto.author}" not found or not verified`);
        }

        character = foundCharacter;
      } else {
        throw new BadRequestException('Either characterId or author/authorServer must be provided');
      }

      const storyRepo = em.getRepository(Story);

      const story = storyRepo.create({
        owner: {
          id: character.id,
        },
        title: storyDto.title,
        content: html.sanitize(storyDto.content),
        type: storyDto.type,
        seriesTitle: this.normalizeSeriesTitle(storyDto.seriesTitle),
        seriesIndex: storyDto.seriesIndex ?? null,
        published: storyDto.published ?? true,
      });

      story.tags = storyDto.tags.filter(tag => tag !== '').map(
        (tag) =>
          new StoryTag({
            name: tag,
            story,
          }),
      );

      story.contentNotes = storyDto.contentNotes.filter(note => note !=='').map(
        (note) =>
          new ContentNote({
            name: note
          })
      )

      return storyRepo.save(story);
    });

    if (storyEntity.published) void this.eventEmitter.emitAsync('story.published', { storyId: storyEntity.id, actorUserId: user.id }); // ER2 social: notify followers

    return {
      id: storyEntity.id,
    };
  }

  async editStory(storyDto: StoryDto & { id: number }, user: UserInfo): Promise<void> {
    let becamePublished = false; // ER2 social
    await this.connection.transaction(async (em) => {
      const storyRepo = em.getRepository(Story);
      const story = await storyRepo
        .createQueryBuilder('story')
        .innerJoinAndSelect('story.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('story.id = :id', { id: storyDto.id })
        .andWhere('user.id = :userId', { userId: user.id })
        .select(['story'])
        .getOne();

      if (!story) {
        throw new NotFoundException('Story not found');
      }

      Object.assign(story, {
        title: storyDto.title,
        content: html.sanitize(storyDto.content),
        type: storyDto.type
      });

      if (storyDto.seriesTitle !== undefined) {
        story.seriesTitle = this.normalizeSeriesTitle(storyDto.seriesTitle);
      }

      if (storyDto.seriesIndex !== undefined) {
        story.seriesIndex = storyDto.seriesIndex ?? null;
      }

      if (storyDto.published !== undefined) {
        becamePublished = storyDto.published && !story.published; // ER2 social
        story.published = storyDto.published;
      }

      if (storyDto.tags.length > 0) {
        await em.getRepository(StoryTag).delete({
          story: {
            id: storyDto.id,
          },
          name: Not(In(storyDto.tags)),
        });
      }

      story.contentNotes = storyDto.contentNotes.filter(note => note !=='').map(
        (note) =>
          new ContentNote({
            name: note
          })
      );

      story.tags = await em
        .getRepository(StoryTag)
        .createQueryBuilder('tag')
        .innerJoinAndSelect('tag.story', 'story')
        .where('story.id = :id', { id: storyDto.id })
        .select('tag')
        .getMany();

      const existingTagNames = story.tags.map((tag) => tag.name);
      const newTagNames = storyDto.tags.filter((tagName) => tagName !== '' && !existingTagNames.includes(tagName));

      story.tags = [
        ...story.tags,
        ...newTagNames.map(
          (tag) =>
            new StoryTag({
              name: tag,
              story,
            }),
        ),
      ];

      await storyRepo.save(story);
    });
    if (becamePublished) void this.eventEmitter.emitAsync('story.published', { storyId: storyDto.id, actorUserId: user.id }); // ER2 social: draft -> published, notify followers
  }

  async deleteStory(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const storyRepo = em.getRepository(Story);
      const story = await storyRepo
        .createQueryBuilder('story')
        .innerJoinAndSelect('story.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('story.id = :id', { id })
        .andWhere('user.id = :userId', { userId: user.id })
        .select(['story.id'])
        .getOne();

      if (!story) {
        throw new NotFoundException('Story not found');
      }

      await storyRepo.softRemove(story);
    });
  }

  async getStoryList(filter: StoryFilterDto, user?: UserInfo): Promise<PagingResultDto<StorySummaryDto>> {
    const query = this.storyRepo
      .createQueryBuilder('story')
      .innerJoinAndSelect('story.owner', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .orderBy('story.createdAt', 'DESC')
      .select(['story.id', 'character.name', 'server.name', 'story.title', 'story.content', 'story.createdAt', 'story.type',
        'story.published', 'story.seriesTitle', 'story.seriesIndex'])
      .offset(filter.offset)
      .limit(filter.limit);

    // ER2-810: drafts only for their owner
    if (user) {
      query
        .innerJoin('character.user', 'ownerUser')
        .andWhere('(story.published = :published OR ownerUser.id = :userId)', { published: true, userId: user.id });
    } else {
      query.andWhere('story.published = :published', { published: true });
    }

      if (filter.searchQuery) {
        query.andWhere('(story.title LIKE :searchQuery OR character.name LIKE :searchQuery)', {
          searchQuery: `%${escapeForLike(filter.searchQuery)}%`
        });
      }

      if (filter.characterId) {
      query.andWhere('character.id = :characterId', {
        characterId: filter.characterId,
      });
    }

    if (filter.tag) {
      query.innerJoinAndSelect('story.tags', 'tag');
      query.andWhere('tag.name = :tag', {
        tag: filter.tag,
      });
    }

    if (filter.type) {
      query.andWhere('story.type = :type', {
        type: filter.type,
      });
    }

    // ER2-111 — hide test stories from the directory and main page (not from a character's own list).
    if (!filter.characterId) query.andWhere(excludeTestContentSql('story'));

    const [ total, stories ] = await Promise.all([ query.getCount(),  query.getMany() ]);
    const storyIds = stories.map((story) => story.id);
    const [ contentNotes, reactions ] = await Promise.all([
      this.getContentNoteNames(storyIds),
      this.reactionsService.getSummaries(ReactionTargetType.STORY, storyIds),
    ]);

    return {
      total,
      data: stories.map((story) => ({
        id: story.id,
        title: story.title,
        author: story.owner.name,
        authorServer: story.owner.server?.name,
        createdAt: story.createdAt!.getTime(),
        type: story.type,
        excerpt: buildExcerpt(story.content, this.excerptMaxLength),
        published: story.published,
        contentNotes: contentNotes.get(story.id) || [],
        seriesTitle: story.seriesTitle,
        seriesIndex: story.seriesIndex,
        wordCount: countWords(story.content),
        reactionCounts: reactions.get(story.id)?.reactionCounts || {},
      }))
    };
  }

  // ER2 round 2: content notes of a page of stories in one query
  private async getContentNoteNames(storyIds: number[]): Promise<Map<number, string[]>> {
    const result = new Map<number, string[]>();

    if (storyIds.length === 0) {
      return result;
    }

    const rows: { storyId: number; name: string }[] = await this.storyRepo
      .createQueryBuilder('story')
      .innerJoin('story.contentNotes', 'note')
      .select('story.id', 'storyId')
      .addSelect('note.name', 'name')
      .where('story.id IN (:...storyIds)', { storyIds })
      .getRawMany();

    for (const row of rows) {
      const storyId = Number(row.storyId);
      result.set(storyId, [...(result.get(storyId) || []), row.name]);
    }

    return result;
  }

  private normalizeSeriesTitle(seriesTitle?: string | null): string | null {
    const trimmed = (seriesTitle || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    return trimmed.length > 0 ? trimmed : null;
  }

  async getStorySeries(id: number, user?: UserInfo): Promise<StorySeriesDto> {
    const story = await this.storyRepo
      .createQueryBuilder('story')
      .innerJoinAndSelect('story.owner', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'user')
      .where('story.id = :id', { id })
      .select(['story.id', 'story.title', 'story.seriesTitle', 'story.seriesIndex', 'story.createdAt',
        'story.published', 'character.id', 'character.name', 'server.name', 'user.id'])
      .getOne();
    const mine = !!story && !!user && story.owner.user.id === user.id;

    if (!story || (story.published === false && !mine)) {
      throw new NotFoundException('Story not found');
    }

    let parts: Story[] = [story];

    if (story.seriesTitle) {
      const partsQuery = this.storyRepo
        .createQueryBuilder('story')
        .where('story.ownerId = :ownerId', { ownerId: story.owner.id })
        .andWhere('story.seriesTitle = :seriesTitle', { seriesTitle: story.seriesTitle })
        .select(['story.id', 'story.title', 'story.seriesIndex', 'story.createdAt']);

      if (!mine) {
        partsQuery.andWhere('story.published = :published', { published: true });
      }

      parts = await partsQuery.getMany();
    }

    // Parts with an index first (ascending), then by creation date
    parts.sort((a, b) => {
      if (a.seriesIndex !== b.seriesIndex) {
        if (a.seriesIndex === null) {
          return 1;
        }
        if (b.seriesIndex === null) {
          return -1;
        }
        return a.seriesIndex - b.seriesIndex;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    return {
      seriesTitle: story.seriesTitle,
      author: story.owner.name,
      authorServer: story.owner.server.name,
      parts: parts.map((part) => ({
        id: part.id,
        title: part.title,
        seriesIndex: part.seriesIndex,
        createdAt: part.createdAt.getTime(),
      })),
    };
  }

  async getTags(): Promise<string[]> {
    const tags = await this.storyTagRepo
      .createQueryBuilder('tag')
      .distinct()
      .orderBy({ 'tag.name': 'ASC' })
      .select('tag.name', 'name')
      .getRawMany();

    return tags.map(tag => tag.name);
  }
}
