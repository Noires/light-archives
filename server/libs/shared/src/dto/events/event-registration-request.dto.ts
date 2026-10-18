import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { EVENT_REGISTRATION_KINDS, EventRegistrationKind } from '../../enums/event-registration-kind.enum';

export class EventRegistrationRequestDto {
  @Type(() => Number)
  @IsNumber()
  characterId: number;

  // Defaults to 'going' when omitted (backwards compatible with the old body shape)
  @IsIn(EVENT_REGISTRATION_KINDS as EventRegistrationKind[])
  @IsOptional()
  kind?: EventRegistrationKind;
}
