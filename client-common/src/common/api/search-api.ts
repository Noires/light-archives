import { SearchResultsDto } from '@app/shared/dto/search/search-results.dto';
import { SearchSuggestionsDto } from '@app/shared/dto/search/search-suggestion.dto';
import APITransport from './api-transport';

export default class SearchAPI {
	private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('search');
  }

	async search(query: string): Promise<SearchResultsDto[]> {
		return this.transport.get('', { q: query });
	}

  /** ER2-809: autocomplete (titles/names, prefix match, >= 2 chars, max. 5 per type). */
  async suggest(query: string): Promise<SearchSuggestionsDto[]> {
    return this.transport.get<SearchSuggestionsDto[]>('suggest', { q: query });
  }
}
