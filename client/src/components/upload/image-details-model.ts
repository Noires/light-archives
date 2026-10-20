import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';

export interface ImageDetailsModel {
  characterId: number | null;
  category: ImageCategory;
  title: string;
  description: string;
  credits: string;
  event: EventSearchResultDto|null;
  venue: VenueSummaryDto|null;
  /** ER2 round 2: albums of the image owner; undefined = unknown / leave unchanged */
  albumIds?: number[];
}
