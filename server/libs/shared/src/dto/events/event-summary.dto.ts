import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { EventIconDto } from './event-icon.dto';
import { EventLinkDto } from './event-link.dto';
import { EventLocationDto } from './event-location.dto';

export interface EventSummaryDto {
  id: number;
  title: string;
  icon?: EventIconDto | null;
  startDateTime: number;
  endDateTime: number | null;
  link: string;
  linkText?: string;
  links?: EventLinkDto[];
	source: EventSource;
	eventType: EventType;
  adultOnly?: boolean;
  closedEvent?: boolean;
  registrationDeadlineDays?: number | null;
  registrationDeadlineTime?: string | null;
  locations: EventLocationDto[];
  contentNotes: string[];
  // ER2-801 (optional; absent on older API versions)
  goingCount?: number;
  interestedCount?: number;
  // ER2-804 (optional)
  seriesId?: number | null;
  seriesLabel?: string | null;
}
