import SharedConstants from '@app/shared/SharedConstants';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(SharedConstants.MAX_SUPPORT_NOTE_LENGTH)
  message: string;
}
