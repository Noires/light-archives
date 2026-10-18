import { IsNumber, IsOptional, IsString } from 'class-validator';
import { EventRegistrationKind } from '../../enums/event-registration-kind.enum';

export class EventParticipantDto {
  @IsNumber()
  characterId: number;

  @IsString()
  name: string;

  @IsString()
  server: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNumber()
  registeredAt: number;

  // ER2-801: absent on older API versions; treat as 'going'
  @IsOptional()
  kind?: EventRegistrationKind;

  constructor(properties?: Readonly<EventParticipantDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
