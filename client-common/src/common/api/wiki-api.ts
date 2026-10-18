import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { WikiPageDto } from '@app/shared/dto/wiki/wiki-page.dto';
import APITransport from './api-transport';

/** ER2-608: one entry of GET /wiki/:title/mentions (shape mirrors server wiki-mentions.ts) */
export interface WikiMentionItem {
  id: number;
  title: string;
  link: string;
}

export interface WikiMentions {
  stories: WikiMentionItem[];
  noticeboardItems: WikiMentionItem[];
  events: WikiMentionItem[];
}

export default class WikiAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('wiki');
  }

  async getWikiPageById(id: number): Promise<WikiPageDto> {
    return this.transport.tokenGet<WikiPageDto>(`${id}`);
  }

  async getWikiPageByTitle(title: string): Promise<WikiPageDto> {
    return this.transport.tokenGet<WikiPageDto>(`by-title/${encodeURIComponent(title)}`);
  }

  /** ER2-608: published stories, noticeboard items and events linking to the page (max. 10 each). */
  async getMentions(title: string): Promise<WikiMentions> {
    return this.transport.get<WikiMentions>(`${encodeURIComponent(title)}/mentions`);
  }

  async createWikiPage(wikiPage: WikiPageDto): Promise<IdWrapper> {
    return this.transport.authPost<IdWrapper>('', wikiPage);
  }

  async editWikiPage(wikiPage: WikiPageDto): Promise<void> {
    return this.transport.authPut<void>(`${wikiPage.id || -1}`, wikiPage);
  }

  async deleteWikiPage(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }
}
