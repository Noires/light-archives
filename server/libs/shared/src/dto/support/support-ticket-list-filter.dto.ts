import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { PagingDto } from '../common/paging.dto';

export class SupportTicketListFilterDto extends PagingDto {
  @Type(() => String)
  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;
}
