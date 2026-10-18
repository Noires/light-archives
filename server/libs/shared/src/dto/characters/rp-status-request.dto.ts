import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { RP_STATUSES, RpStatus } from '../../enums/rp-status.enum';
import { RP_LOCATION_MAX_LENGTH, RP_STATUS_MAX_MINUTES } from '../../presence';

/** ER2-806: body of PUT /characters/:id/rp-status */
export class RpStatusRequestDto {
  @IsIn(RP_STATUSES as RpStatus[])
  rpStatus: RpStatus;

  @IsString()
  @MaxLength(RP_LOCATION_MAX_LENGTH)
  @IsOptional()
  rpLocation?: string | null;

  // Default 180 (3 h), max 360 (6 h)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(RP_STATUS_MAX_MINUTES)
  @IsOptional()
  durationMinutes?: number;
}
