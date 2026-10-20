import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** ER2-803: one entry of an optional event programme ("Programm"). Plain text only. */
export class EventProgrammeItemDto {
  // Free-form time label, usually 'HH:mm' (e.g. '20:30'), but 'ab 22 Uhr' is allowed too
  @IsString()
  @MaxLength(20)
  time: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  note?: string;

  constructor(properties?: Readonly<EventProgrammeItemDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}

export const MAX_EVENT_PROGRAMME_ITEMS = 30;
