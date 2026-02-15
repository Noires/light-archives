import SharedConstants from '@app/shared/SharedConstants';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketMessageDto {
  @IsString()
  @MinLength(SharedConstants.MIN_SUPPORT_TICKET_MESSAGE_LENGTH)
  @MaxLength(SharedConstants.MAX_SUPPORT_TICKET_MESSAGE_LENGTH)
  message: string;
}
