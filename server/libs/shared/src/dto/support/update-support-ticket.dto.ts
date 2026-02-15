import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateSupportTicketDto {
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
  assigneeUserId?: number | null;
}
