import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** ER2-805: one weekly opening slot. Weekday follows Luxon (1 = Monday ... 7 = Sunday). */
export class VenueOpeningHoursSlotDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  @IsString()
  @Matches(TIME_REGEX)
  openTime: string;

  @IsString()
  @Matches(TIME_REGEX)
  closeTime: string;

  @IsBoolean()
  @IsOptional()
  overnight?: boolean;

  constructor(properties?: Readonly<VenueOpeningHoursSlotDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}

/** ER2-805: date-specific deviation, e.g. closed on a holiday. */
export class VenueOpeningExceptionDto {
  // yyyy-MM-dd in server time
  @IsString()
  @Matches(DATE_REGEX)
  date: string;

  @IsBoolean()
  closed: boolean;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  note?: string;

  constructor(properties?: Readonly<VenueOpeningExceptionDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}

/** ER2-805: raw opening hours as stored (GET/PUT /venues/:id/opening-hours). */
export class VenueOpeningHoursDto {
  @Type(() => VenueOpeningHoursSlotDto)
  @ValidateNested({ each: true })
  @ArrayMaxSize(50)
  @IsArray()
  hours: VenueOpeningHoursSlotDto[];

  // On GET only today and future exceptions are returned; PUT replaces all exceptions
  @Type(() => VenueOpeningExceptionDto)
  @ValidateNested({ each: true })
  @ArrayMaxSize(100)
  @IsArray()
  exceptions: VenueOpeningExceptionDto[];

  constructor(properties?: Readonly<VenueOpeningHoursDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}

/** ER2-805: computed opening status, embedded (optionally) in venue DTOs. */
export interface VenueOpeningStatusDto {
  openNow?: boolean;
  /** ISO timestamp of the next opening when closed */
  opensAt?: string;
  /** ISO timestamp of the closing when open */
  closesAt?: string;
  openingHours?: VenueOpeningHoursSlotDto[];
  /** true when openingHours were derived from the weekly event template (no explicit hours stored) */
  openingHoursDerived?: boolean;
}
