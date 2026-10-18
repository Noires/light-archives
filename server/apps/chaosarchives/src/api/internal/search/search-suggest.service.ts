import { Character, Community, Event, FreeCompany, Story, Venue, WikiPage } from '@app/entity';
import { SearchSuggestionDto, SearchSuggestionsDto } from '@app/shared/dto/search/search-suggestion.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export const SUGGEST_MIN_QUERY_LENGTH = 2;
export const SUGGEST_MAX_RESULTS_PER_TYPE = 5;
const SUGGEST_MAX_QUERY_LENGTH = 50;

/** Escapes LIKE wildcards (all occurrences). */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * ER2-809: title/name-only prefix matching for the search autocomplete.
 * Uses `LIKE 'q%'` (index-friendly on name/title columns) plus a word-start match `'% q%'`;
 * prefix hits are ranked first. FULLTEXT indexes are not used because they span content columns.
 */
@Injectable()
export class SearchSuggestService {
  constructor(
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Venue) private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    @InjectRepository(WikiPage) private readonly wikiPageRepo: Repository<WikiPage>,
    @InjectRepository(FreeCompany) private readonly freeCompanyRepo: Repository<FreeCompany>,
    @InjectRepository(Community) private readonly communityRepo: Repository<Community>,
  ) {}

  async suggest(rawQuery: string): Promise<SearchSuggestionsDto[]> {
    const query = (rawQuery || '').replace(/\s+/g, ' ').trim().slice(0, SUGGEST_MAX_QUERY_LENGTH);

    if (query.length < SUGGEST_MIN_QUERY_LENGTH) {
      return [];
    }

    const escaped = escapeLikePattern(query);
    const params = { prefix: `${escaped}%`, wordPrefix: `% ${escaped}%` };

    const [profiles, venues, events, stories, wikiPages, freeCompanies, communities] = await Promise.all([
      this.suggestProfiles(params),
      this.suggestVenues(params),
      this.suggestEvents(params),
      this.suggestStories(params),
      this.suggestWikiPages(params),
      this.suggestFreeCompanies(params),
      this.suggestCommunities(params),
    ]);

    return [
      { type: PageType.PROFILE, results: profiles },
      { type: PageType.VENUE, results: venues },
      { type: PageType.EVENT, results: events },
      { type: PageType.STORY, results: stories },
      { type: PageType.WIKI_PAGE, results: wikiPages },
      { type: PageType.FREE_COMPANY, results: freeCompanies },
      { type: PageType.COMMUNITY, results: communities },
    ];
  }

  private matchName<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    column: string,
    params: { prefix: string; wordPrefix: string },
  ): SelectQueryBuilder<T> {
    return qb
      .andWhere(`(${column} LIKE :prefix OR ${column} LIKE :wordPrefix)`, params)
      .orderBy(`CASE WHEN ${column} LIKE :prefix THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy(column, 'ASC')
      .limit(SUGGEST_MAX_RESULTS_PER_TYPE);
  }

  private async suggestProfiles(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.characterRepo
        .createQueryBuilder('c')
        .innerJoin('c.server', 'server')
        .select('c.id', 'id').addSelect('c.name', 'name').addSelect('c.avatar', 'avatar').addSelect('server.name', 'server')
        .where('c.verifiedAt IS NOT NULL'),
      'c.name',
      params,
    ).getRawMany<{ id: number; name: string; avatar: string; server: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.name,
      subtitle: row.server,
      link: `/${encodeURIComponent(row.server)}/${encodeURIComponent(row.name)}`,
      avatar: row.avatar || undefined,
    }));
  }

  private async suggestVenues(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.venueRepo
        .createQueryBuilder('v')
        .innerJoin('v.server', 'server')
        .select('v.id', 'id').addSelect('v.name', 'name').addSelect('server.name', 'server'),
      'v.name',
      params,
    ).getRawMany<{ id: number; name: string; server: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.name,
      subtitle: row.server,
      link: `/venue/${row.id}`,
    }));
  }

  private async suggestEvents(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.eventRepo
        .createQueryBuilder('e')
        .select('e.id', 'id').addSelect('e.title', 'title').addSelect('e.startDateTime', 'startDateTime')
        .where('e.hidden = :hidden', { hidden: false }),
      'e.title',
      params,
    ).getRawMany<{ id: number; title: string; startDateTime: Date | string }>();

    return rows.map((row) => {
      const start = row.startDateTime ? new Date(row.startDateTime) : null;

      return {
        id: Number(row.id),
        title: row.title,
        subtitle: start && !Number.isNaN(start.getTime())
          ? DateTime.fromJSDate(start, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }).toFormat('dd.MM.yyyy')
          : undefined,
        link: `/event/${row.id}`,
      };
    });
  }

  private async suggestStories(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.storyRepo
        .createQueryBuilder('s')
        .innerJoin('s.owner', 'owner')
        .select('s.id', 'id').addSelect('s.title', 'title').addSelect('owner.name', 'author')
        .where('s.published = :published', { published: true }),
      's.title',
      params,
    ).getRawMany<{ id: number; title: string; author: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      subtitle: row.author,
      link: `/story/${row.id}`,
    }));
  }

  private async suggestWikiPages(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.wikiPageRepo
        .createQueryBuilder('w')
        .select('w.id', 'id').addSelect('w.title', 'title')
        .where('w.published = :published', { published: true }),
      'w.title',
      params,
    ).getRawMany<{ id: number; title: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      link: `/wiki/${encodeURIComponent(row.title)}`,
    }));
  }

  private async suggestFreeCompanies(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.freeCompanyRepo
        .createQueryBuilder('fc')
        .innerJoin('fc.server', 'server')
        .select('fc.id', 'id').addSelect('fc.name', 'name').addSelect('fc.tag', 'tag').addSelect('server.name', 'server'),
      'fc.name',
      params,
    ).getRawMany<{ id: number; name: string; tag: string; server: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.name,
      subtitle: row.tag ? `«${row.tag}» · ${row.server}` : row.server,
      link: `/fc/${encodeURIComponent(row.server)}/${encodeURIComponent(row.name)}`,
    }));
  }

  private async suggestCommunities(params: { prefix: string; wordPrefix: string }): Promise<SearchSuggestionDto[]> {
    const rows = await this.matchName(
      this.communityRepo
        .createQueryBuilder('cm')
        .select('cm.id', 'id').addSelect('cm.name', 'name'),
      'cm.name',
      params,
    ).getRawMany<{ id: number; name: string }>();

    return rows.map((row) => ({
      id: Number(row.id),
      title: row.name,
      link: `/community/${encodeURIComponent(row.name)}`,
    }));
  }
}
