import { IsOptional, IsString } from 'class-validator';

export class EventLinkDto {
  @IsString()
  url: string;

  @IsString()
  @IsOptional()
  label?: string;

  constructor(properties?: Readonly<EventLinkDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
