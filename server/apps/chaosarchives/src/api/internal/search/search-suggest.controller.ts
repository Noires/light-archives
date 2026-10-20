import { SearchSuggestionsDto } from '@app/shared/dto/search/search-suggestion.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { SearchSuggestService } from './search-suggest.service';

@Controller('search')
export class SearchSuggestController {
  constructor(private readonly suggestService: SearchSuggestService) {}

  // ER2-809: autocomplete, titles/names only, prefix match from 2 characters, max. 5 per type
  @Get('suggest')
  async suggest(@Query('q') query: string): Promise<SearchSuggestionsDto[]> {
    return this.suggestService.suggest(query || '');
  }
}
