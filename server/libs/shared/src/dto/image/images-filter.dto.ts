import { ImageCategory } from "@app/shared/enums/image-category.enum";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../common/paging.dto";

export class ImagesFilterDto extends PagingDto {
	@IsString()
	@IsOptional()
	searchQuery?: string;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	eventId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	venueId?: number;

	@IsEnum(ImageCategory)
	@IsOptional()
	category?: ImageCategory;

	constructor(properties?: Readonly<ImagesFilterDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
