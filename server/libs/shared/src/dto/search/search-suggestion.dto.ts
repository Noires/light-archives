import { PageType } from '@app/shared/enums/page-type.enum';

/** ER2-809: one autocomplete hit. `link` is a client route path. */
export interface SearchSuggestionDto {
  id: number;
  title: string;
  subtitle?: string;
  link: string;
  avatar?: string;
}

/** ER2-809: GET /search/suggest?q= returns one group per type (max. 5 results each). */
export interface SearchSuggestionsDto {
  type: PageType;
  results: SearchSuggestionDto[];
}
