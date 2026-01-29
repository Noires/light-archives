import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { BannerDto } from "../characters/banner.dto";
import { EventType } from "../../enums/event-type.enum";
import { EventIconDto } from "./event-icon.dto";
import { EventLocationDto } from "./event-location.dto";

export abstract class BaseEventDto {
	@IsString()
	@MinLength(1)
	title: string;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@IsBoolean()
	@IsOptional()
	recurring: boolean;

	@IsString()
	details: string;

	@IsString()
	oocDetails: string;

	@IsNumber()
	startDateTime: number;

	@IsNumber()
	@IsOptional()
	endDateTime: number|null;

	@IsString()
	@IsOptional()
	link: string;

	@IsString()
	contact: string;

	@IsEnum(EventType)
	@IsOptional()
	eventType: EventType;

	@IsString({ each: true })
	@IsOptional()
	contentNotes: string[];

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  banner: BannerDto|null;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  discordBanner: BannerDto|null;

  @Type(() => EventIconDto)
  @ValidateNested()
  @IsOptional()
  icon: EventIconDto|null;

	@Type(() => EventLocationDto)
	@ValidateNested({ each: true })
	@IsArray()
	locations: EventLocationDto[];
}
