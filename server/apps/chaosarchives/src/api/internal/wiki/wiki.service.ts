import { UserInfo } from '@app/auth/model/user-info';
import { Character, Event, NoticeboardItem, Story, WikiPage } from '@app/entity';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import { EditPermission } from '@app/shared/enums/edit-permission.enum';
import html from '@app/shared/html';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Connection, IsNull, Not, Repository } from 'typeorm';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { excludeTestContentSql } from '../test-content.filter';
import {
  buildWikiMentionLikePatterns,
  contentMentionsWikiTitle,
  WikiMentionItemDto,
  WikiMentionsDto,
} from './wiki-mentions';

/** ER2-609: entry of GET /wiki */
export interface WikiPageListItemDto {
  title: string;
  updatedAt: number;
}

const MENTIONS_PER_TYPE = 10;
// Candidates fetched per type before the exact match; keeps the query bounded.
const MENTION_CANDIDATES = 200;
const MENTIONS_CACHE_TTL_MS = 5 * 60 * 1000;
const MENTIONS_CACHE_MAX = 500;

@Injectable()
export class WikiService {
  constructor(
    private connection: Connection,
    @InjectRepository(WikiPage) private wikiPageRepo: Repository<WikiPage>,
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(NoticeboardItem) private noticeboardItemRepo: Repository<NoticeboardItem>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
  ) {}

  private readonly mentionsCache = new Map<string, { expiresAt: number; value: WikiMentionsDto }>();

  /** ER2-609: published wiki pages, most recently edited first. */
  async getWikiPageList(limit = 100): Promise<WikiPageListItemDto[]> {
    const take = Math.min(Math.max(Math.floor(limit) || 100, 1), 500);
    const wikiPages = await this.wikiPageRepo
      .createQueryBuilder('wp')
      .where('wp.published = :published', { published: true })
      .andWhere(excludeTestContentSql('wp'))
      .orderBy('wp.updatedAt', 'DESC')
      .select(['wp.id', 'wp.title', 'wp.updatedAt'])
      .limit(take)
      .getMany();

    return wikiPages.map((wikiPage) => ({
      title: wikiPage.title,
      updatedAt: wikiPage.updatedAt.getTime(),
    }));
  }

  /**
   * ER2-608: published stories, noticeboard items and visible events whose
   * content links to the wiki page `title` (wikilink or /link/ URL). Cached
   * in memory for a few minutes.
   */
  async getWikiPageMentions(title: string): Promise<WikiMentionsDto> {
    const key = (title || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const now = Date.now();
    const cached = this.mentionsCache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = await this.findMentions((title || '').replace(/_/g, ' '));

    if (this.mentionsCache.size >= MENTIONS_CACHE_MAX) {
      this.mentionsCache.clear();
    }

    this.mentionsCache.set(key, { expiresAt: now + MENTIONS_CACHE_TTL_MS, value });
    return value;
  }

  private async findMentions(title: string): Promise<WikiMentionsDto> {
    const patterns = buildWikiMentionLikePatterns(title);

    if (patterns.length === 0) {
      return { stories: [], noticeboardItems: [], events: [] };
    }

    const likeClause = (columns: string[]) => {
      const parts: string[] = [];
      const params: { [k: string]: string } = {};

      columns.forEach((column, columnIndex) => {
        patterns.forEach((pattern, patternIndex) => {
          const name = `p${columnIndex}_${patternIndex}`;
          parts.push(`${column} LIKE :${name}`);
          params[name] = pattern;
        });
      });

      return { sql: `(${parts.join(' OR ')})`, params };
    };

    const storyLike = likeClause(['story.content']);
    const noticeLike = likeClause(['item.content']);
    const eventLike = likeClause(['event.details', 'event.oocDetails']);

    const [ stories, noticeboardItems, events ] = await Promise.all([
      this.storyRepo
        .createQueryBuilder('story')
        .where('story.published = :published', { published: true })
        .andWhere(storyLike.sql, storyLike.params)
        .orderBy('story.createdAt', 'DESC')
        .select(['story.id', 'story.title', 'story.content'])
        .limit(MENTION_CANDIDATES)
        .getMany(),
      this.noticeboardItemRepo
        .createQueryBuilder('item')
        .where(noticeLike.sql, noticeLike.params)
        .orderBy('item.createdAt', 'DESC')
        .select(['item.id', 'item.title', 'item.content'])
        .limit(MENTION_CANDIDATES)
        .getMany(),
      this.eventRepo
        .createQueryBuilder('event')
        .where('event.hidden = :hidden', { hidden: false })
        .andWhere(eventLike.sql, eventLike.params)
        .orderBy('event.startDateTime', 'DESC')
        .select(['event.id', 'event.title', 'event.details', 'event.oocDetails'])
        .limit(MENTION_CANDIDATES)
        .getMany(),
    ]);

    const pick = <T extends { id: number; title: string }>(
      items: T[],
      matches: (item: T) => boolean,
      link: (item: T) => string,
    ): WikiMentionItemDto[] => items
      .filter(matches)
      .slice(0, MENTIONS_PER_TYPE)
      .map((item) => ({ id: item.id, title: item.title, link: link(item) }));

    return {
      stories: pick(stories, (story) => contentMentionsWikiTitle(story.content, title), (story) => `/story/${story.id}`),
      noticeboardItems: pick(
        noticeboardItems,
        (item) => contentMentionsWikiTitle(item.content, title),
        (item) => `/noticeboard/${item.id}`,
      ),
      events: pick(
        events,
        (event) => contentMentionsWikiTitle(event.details, title) || contentMentionsWikiTitle(event.oocDetails, title),
        (event) => `/event/${event.id}`,
      ),
    };
  }

  async getWikiPageById(id: number, user?: UserInfo): Promise<WikiPageDto> {
    return this.getWikiPageInternal('wp.id = :id', { id }, user);
  }

  async getWikiPageByTitle(title: string, user?: UserInfo): Promise<WikiPageDto> {
    return this.getWikiPageInternal('wp.title = :title', { title }, user);
  }

  private async getWikiPageInternal(
    where: string,
    params: { [k: string]: string | number },
    user?: UserInfo,
  ): Promise<WikiPageDto> {
    const wikiPage = await this.wikiPageRepo
      .createQueryBuilder('wp')
      .innerJoinAndSelect('wp.owner', 'character')
      .innerJoinAndSelect('character.user', 'user')
      .innerJoinAndSelect('character.server', 'server')
      .where(where, params)
      .select(['wp', 'character.id', 'character.name', 'user.id', 'server.name'])
      .getOne();

    // ER2-810: drafts are only visible to their owner
    if (!wikiPage || (wikiPage.published === false && !(user && wikiPage.owner.user.id === user.id))) {
      throw new NotFoundException('Wiki page not found');
    }

    return this.toWikiPageDto(wikiPage, user);
  }

  private toWikiPageDto(wikiPage: WikiPage, user?: UserInfo): WikiPageDto {
    // ER2-607: `updatedAt` (read only) feeds "Zuletzt bearbeitet" in the wiki
    // rail; it is not part of WikiPageDto in libs/shared yet, so it is added
    // to the response object here.
    const dto = new WikiPageDto({
      id: wikiPage.id,
      mine: user ? wikiPage.owner.user.id === user.id : false,
      author: wikiPage.owner.name,
      authorServer: wikiPage.owner.server.name,
      title: wikiPage.title,
      content: wikiPage.content,
      createdAt: wikiPage.createdAt!.getTime(),
      editPermission: wikiPage.editPermission,
      published: wikiPage.published,
    });

    return Object.assign(dto, { updatedAt: wikiPage.updatedAt ? wikiPage.updatedAt.getTime() : undefined });
  }

  async createWikiPage(wikiPageDto: WikiPageDto & { id: undefined }, user: UserInfo): Promise<IdWrapper> {
    const storyEntity = await this.connection.transaction(async (em) => {
      let character: Character;

      if (wikiPageDto.characterId) {
        // New approach: use character ID
        character = await getVerifiedCharacter(em, wikiPageDto.characterId, user);
      } else if (wikiPageDto.author && wikiPageDto.authorServer) {
        // Legacy approach: use name + server
        const foundCharacter = await em.getRepository(Character).findOne({
          where: {
            name: wikiPageDto.author,
            server: {
              name: wikiPageDto.authorServer,
            },
            user: {
              id: user.id,
            },
            verifiedAt: Not(IsNull()),
          },
          relations: ['server'],
          select: ['id'],
        });

        if (!foundCharacter) {
          throw new BadRequestException(`Author character "${wikiPageDto.author}" not found or not verified`);
        }

        character = foundCharacter;
      } else {
        throw new BadRequestException('Either characterId or author/authorServer must be provided');
      }

      const wikiPageRepo = em.getRepository(WikiPage);

      const wikiPage = wikiPageRepo.create({
        owner: {
          id: character.id,
        },
        title: wikiPageDto.title,
        content: html.sanitize(wikiPageDto.content),
        editPermission: EditPermission.ME,
        published: wikiPageDto.published ?? true,
      });

      return wikiPageRepo.save(wikiPage);
    });

    return {
      id: storyEntity.id,
    };
  }

  async editWikiPage(wikiPageDto: WikiPageDto & { id: number }, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const wikiPageRepo = em.getRepository(WikiPage);
      const wikiPage = await wikiPageRepo
        .createQueryBuilder('wp')
        .innerJoinAndSelect('wp.owner', 'character')
        .where('wp.id = :id', { id: wikiPageDto.id })
        .select(['wp', 'character.id'])
        .getOne();

      if (!wikiPage) {
        throw new NotFoundException('Wiki page not found');
      }

      if (wikiPage.editPermission === EditPermission.ME && !user.characters.some((ch) => ch.id === wikiPage.owner.id)) {
        throw new ForbiddenException('You cannot edit this wiki page');
      }

      Object.assign(wikiPage, {
        title: wikiPageDto.title,
        content: html.sanitize(wikiPageDto.content),
      });

      if (wikiPageDto.published !== undefined) {
        wikiPage.published = wikiPageDto.published;
      }

      await wikiPageRepo.save(wikiPage);
    });
  }

  async deleteWikiPage(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const wikiPageRepo = em.getRepository(WikiPage);
      const wikiPage = await wikiPageRepo
        .createQueryBuilder('wp')
        .innerJoinAndSelect('wp.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('wp.id = :id', { id })
        .andWhere('user.id = :userId', { userId: user.id })
        .select(['wp'])
        .getOne();

      if (!wikiPage) {
        throw new NotFoundException('Wiki page not found');
      }

      // Free the name for new wiki pages, but keep the record with a deleted flag
			wikiPage.title = `${crypto.randomUUID()} ${wikiPage.title}`;
      await wikiPageRepo.save(wikiPage);
      await wikiPageRepo.softRemove(wikiPage);
    });
  }
}
