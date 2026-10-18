import 'reflect-metadata';
import { Character, Community, Event, FreeCompany, Image, NoticeboardItem, Story, Venue, WikiPage } from '@app/entity';
import { SearchResultsDto } from '@app/shared/dto/search/search-results.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { ObjectLiteral, Repository } from 'typeorm';
import { ImagesService } from '../images/images.service';
import { SearchService } from './search.service';

// ImagesService pulls in S3 and configuration; the search service only needs it for images.
jest.mock('../images/images.service', () => ({ ImagesService: class {} }));

type Row = Record<string, unknown>;

interface WhereCall {
  condition: string;
  params?: Record<string, unknown>;
}

interface QueryBuilderMock {
  whereCalls: WhereCall[];
  andWhere: jest.Mock<QueryBuilderMock, [string, Record<string, unknown>?]>;
  select: jest.Mock<QueryBuilderMock, []>;
  innerJoinAndSelect: jest.Mock<QueryBuilderMock, []>;
  orderBy: jest.Mock<QueryBuilderMock, []>;
  limit: jest.Mock<QueryBuilderMock, []>;
  getMany: jest.Mock<Promise<Row[]>, []>;
}

/**
 * Minimal chainable SelectQueryBuilder stand-in. It records every andWhere call
 * and honours `<alias>.hidden = :hidden` so filtering can be asserted on results.
 */
function createQueryBuilderMock(rows: Row[]): QueryBuilderMock {
  const whereCalls: WhereCall[] = [];
  const qb: QueryBuilderMock = {
    whereCalls,
    andWhere: jest.fn((condition: string, params?: Record<string, unknown>) => {
      whereCalls.push({ condition, params });
      return qb;
    }),
    select: jest.fn(() => qb),
    innerJoinAndSelect: jest.fn(() => qb),
    orderBy: jest.fn(() => qb),
    limit: jest.fn(() => qb),
    getMany: jest.fn(async () => {
      const hiddenFilter = whereCalls.find((call) => /\.hidden = :hidden$/.test(call.condition));
      return hiddenFilter ? rows.filter((row) => row.hidden === hiddenFilter.params?.hidden) : rows;
    }),
  };
  return qb;
}

function createRepoMock(rows: Row[] = []) {
  const qb = createQueryBuilderMock(rows);
  const repo = { qb, createQueryBuilder: jest.fn(() => qb) };
  return repo;
}

type RepoMock = ReturnType<typeof createRepoMock>;

function asRepo<T extends ObjectLiteral>(mock: RepoMock): Repository<T> {
  return mock as unknown as Repository<T>;
}

const updatedAt = new Date('2026-10-01T20:00:00Z');

describe('SearchService', () => {
  let repos: {
    character: RepoMock;
    freeCompany: RepoMock;
    community: RepoMock;
    venue: RepoMock;
    event: RepoMock;
    story: RepoMock;
    noticeboardItem: RepoMock;
    wikiPage: RepoMock;
    image: RepoMock;
  };
  let service: SearchService;

  beforeEach(() => {
    repos = {
      character: createRepoMock(),
      freeCompany: createRepoMock(),
      community: createRepoMock(),
      venue: createRepoMock(),
      event: createRepoMock([
        { id: 1, title: 'Drachenfest', details: 'Ein Fest der Drachen', oocDetails: '', contact: '', hidden: false, updatedAt },
        { id: 2, title: 'Geheimer Drachentest', details: 'Drachen intern', oocDetails: '', contact: '', hidden: true, updatedAt },
      ]),
      story: createRepoMock(),
      noticeboardItem: createRepoMock([
        { id: 7, title: 'Aushang Drachen', content: 'Drachen gesucht', updatedAt },
      ]),
      wikiPage: createRepoMock([
        { id: 42, title: 'Drachen von Elpis', content: 'Alles über Drachen', updatedAt },
      ]),
      image: createRepoMock(),
    };

    service = new SearchService(
      asRepo<Character>(repos.character),
      asRepo<FreeCompany>(repos.freeCompany),
      asRepo<Community>(repos.community),
      asRepo<Venue>(repos.venue),
      asRepo<Event>(repos.event),
      asRepo<Story>(repos.story),
      asRepo<NoticeboardItem>(repos.noticeboardItem),
      asRepo<WikiPage>(repos.wikiPage),
      asRepo<Image>(repos.image),
      {} as ImagesService,
    );
  });

  function resultsOf(results: SearchResultsDto[], type: PageType) {
    return results.find((group) => group.type === type)?.results || [];
  }

  it('searches wiki pages through the wiki page repository', async () => {
    const results = await service.search('drachen');

    expect(repos.wikiPage.createQueryBuilder).toHaveBeenCalledWith('wp');
    expect(repos.noticeboardItem.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(repos.noticeboardItem.createQueryBuilder).toHaveBeenCalledWith('nb');

    const wikiResults = resultsOf(results, PageType.WIKI_PAGE);
    expect(wikiResults.map((result) => result.id)).toEqual([42]);
    expect(wikiResults[0].name).toBe('Drachen von Elpis');

    const noticeboardResults = resultsOf(results, PageType.NOTICEBOARD_ITEM);
    expect(noticeboardResults.map((result) => result.id)).toEqual([7]);
  });

  it('excludes hidden events from the results', async () => {
    const results = await service.search('drachen');

    expect(repos.event.qb.andWhere).toHaveBeenCalledWith('e.hidden = :hidden', { hidden: false });

    const eventResults = resultsOf(results, PageType.EVENT);
    expect(eventResults.map((result) => result.id)).toEqual([1]);
  });

  it('does not query anything for queries without usable keywords', async () => {
    const results = await service.search('a b');

    expect(results).toEqual([]);
    for (const repo of Object.values(repos) as RepoMock[]) {
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    }
  });
});
