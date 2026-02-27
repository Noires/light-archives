import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { BannerDto } from "../characters/banner.dto";
import { EventType } from "../../enums/event-type.enum";
import { EventIconDto } from "./event-icon.dto";
import { EventLinkDto } from "./event-link.dto";
import { EventLocationDto } from "./event-location.dto";

export abstract class BaseEventDto {
	@IsString()
	@MinLength(1)
	title: string;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

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
	@IsOptional()
	linkText?: string;

	@Type(() => EventLinkDto)
	@ValidateNested({ each: true })
	@IsArray()
	@IsOptional()
	links?: EventLinkDto[];

	@IsString()
	contact: string;

	@IsEnum(EventType)
	@IsOptional()
	eventType: EventType;

	@IsBoolean()
	@IsOptional()
	adultOnly?: boolean;

	@IsBoolean()
	@IsOptional()
	closedEvent?: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	registrationDeadlineDays?: number|null;

	@IsString({ each: true })
	@IsOptional()
	contentNotes: string[];

	@IsString()
	@IsOptional()
	extraInfo?: string;

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
