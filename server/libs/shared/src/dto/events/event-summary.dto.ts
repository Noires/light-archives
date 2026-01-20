import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventIconDto } from './event-icon.dto';
import { EventLocationDto } from './event-location.dto';

export interface EventSummaryDto {
  id: number;
  title: string;
  icon?: EventIconDto | null;
  startDateTime: number;
  endDateTime: number | null;
  link: string;
	source: EventSource;
  recurring: boolean;
  locations: EventLocationDto[];
}
