import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PagingDto } from '../common/paging.dto';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';

export class SupportTicketListFilterDto extends PagingDto {
  @Type(() => String)
  @IsEnum(SupportTicketStatus)
  @IsOptional()
  status?: SupportTicketStatus;
}
