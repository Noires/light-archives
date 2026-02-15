import SharedConstants from '@app/shared/SharedConstants';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(SharedConstants.MIN_SUPPORT_TICKET_SUBJECT_LENGTH)
  @MaxLength(SharedConstants.MAX_SUPPORT_TICKET_SUBJECT_LENGTH)
  subject: string;

  @IsEnum(SupportTicketCategory)
  category: SupportTicketCategory;

  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;

  @IsString()
  @MinLength(SharedConstants.MIN_SUPPORT_TICKET_MESSAGE_LENGTH)
  @MaxLength(SharedConstants.MAX_SUPPORT_TICKET_MESSAGE_LENGTH)
  message: string;
}
