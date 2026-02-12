import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';

export interface ImageDetailsModel {
  characterId: number | null;
  category: ImageCategory;
  title: string;
  description: string;
  credits: string;
  event: EventSearchResultDto|null;
}
