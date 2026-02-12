import { NoticeboardLocation } from "@app/shared/enums/noticeboard-location.enum";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class NoticeboardItemDto {
	@IsNumber()
	@IsOptional()
	id?: number;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@IsString()
	@IsOptional()
	author?: string;

	@IsString()
	@IsOptional()
	authorServer?: string;

	@IsNumber()
	@IsOptional()
	createdAt: number;

	@IsString()
	title: string;

	@IsString()
	content: string;

	@IsEnum(NoticeboardLocation)
	location: NoticeboardLocation;

	constructor(properties?: Readonly<NoticeboardItemDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
