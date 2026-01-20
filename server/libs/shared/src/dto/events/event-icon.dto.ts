import { IsNumber, IsOptional, IsString } from "class-validator";

export class EventIconDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  thumbUrl: string;

  @IsNumber()
  @IsOptional()
  width: number;

  @IsNumber()
  @IsOptional()
  height: number;

  constructor(properties?: Readonly<EventIconDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
