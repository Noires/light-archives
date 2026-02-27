import { IsNumber, IsOptional, IsString } from 'class-validator';

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

  constructor(properties?: Readonly<EventParticipantDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
