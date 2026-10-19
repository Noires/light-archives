import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { GROUP_EVENTS_MAX_LIMIT } from './group-events.constants';

/** Query of `GET /free-companies/:id/events` and `GET /communities/:id/events`. */
export class GroupEventsFilterDto {
  /** true (default): from now on, ascending; false: the last 90 days, descending */
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : value === true || value === 'true' || value === '1'))
  @IsBoolean()
  upcoming?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(GROUP_EVENTS_MAX_LIMIT)
  limit?: number;
}
