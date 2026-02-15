import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PagingDto } from '../common/paging.dto';

export class SupportQueueFilterDto extends PagingDto {
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @Type(() => String)
  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;

  @Type(() => String)
  @IsEnum(SupportTicketCategory)
  @IsOptional()
  category?: SupportTicketCategory;

  @Type(() => String)
  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;

  @Type(() => String)
  @IsEnum(SupportLevel)
  @IsOptional()
  supportLevel?: SupportLevel;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  assignedToUserId?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  updatedWithinHours?: number;

  @Transform((val) => val.value === 'true' || val.value === true)
  @IsBoolean()
  @IsOptional()
  overdueOnly?: boolean;
}
