import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { EVENT_SERIES_NTH_VALUES, EVENT_SERIES_RULES, EventSeriesRule } from '../../enums/event-series-rule.enum';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** ER2-804: one computed occurrence of a series (epoch millis). */
export interface EventOccurrenceDto {
  startDateTime: number;
  endDateTime: number | null;
}

/** ER2-804: event series, used both for reading and for create/update requests. */
export class EventSeriesDto {
  @IsInt()
  @IsOptional()
  id?: number;

  // Owner character; required for create
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  characterId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsIn(EVENT_SERIES_RULES as EventSeriesRule[])
  rule: EventSeriesRule;

  // Luxon weekday, 1 = Monday ... 7 = Sunday
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  // Only for 'monthly-nth': 1..5 or -1 (last)
  @Type(() => Number)
  @IsIn(EVENT_SERIES_NTH_VALUES as number[])
  @IsOptional()
  nth?: number | null;

  @IsString()
  @Matches(TIME_REGEX)
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX)
  @IsOptional()
  endTime?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(7)
  @IsOptional()
  endDurationDays?: number | null;

  // yyyy-MM-dd, decides the week parity for 'biweekly'. Defaults to the first occurrence.
  @IsString()
  @Matches(DATE_REGEX)
  @IsOptional()
  anchorDate?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  venueId?: number | null;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  // Read only
  @IsOptional()
  label?: string;

  @IsOptional()
  owner?: string;

  @IsOptional()
  ownerServer?: string;

  @IsOptional()
  venueName?: string | null;

  @IsOptional()
  mine?: boolean;

  @IsOptional()
  nextOccurrences?: EventOccurrenceDto[];

  constructor(properties?: Readonly<EventSeriesDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
