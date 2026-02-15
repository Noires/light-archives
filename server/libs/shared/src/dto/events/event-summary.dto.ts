import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { EventIconDto } from './event-icon.dto';
import { EventLocationDto } from './event-location.dto';

export interface EventSummaryDto {
  id: number;
  title: string;
  icon?: EventIconDto | null;
  startDateTime: number;
  endDateTime: number | null;
  link: string;
  linkText?: string;
	source: EventSource;
	eventType: EventType;
  recurring: boolean;
  locations: EventLocationDto[];
  contentNotes: string[];
}
