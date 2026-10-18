import { ImageCategory } from "@app/shared/enums/image-category.enum";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { toIdArray } from "./image-desciption.dto";

export class ImageUploadRequestDto {
	@Type(() => Number)
	@IsNumber()
	readonly characterId: number;

	@IsString()
	readonly title: string;

	@IsString()
	readonly description: string;

	@IsEnum(ImageCategory)
	readonly category: ImageCategory;

	@IsString()
	@MinLength(1)
	readonly credits: string;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	readonly eventId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	readonly venueId?: number;

	@Type(() => Number)
	@IsNumber()
	readonly thumbLeft: number;

	@Type(() => Number)
	@IsNumber()
	readonly thumbTop: number;

	@Type(() => Number)
	@IsNumber()
	readonly thumbWidth: number;

	// ER2 round 2: albums (of the uploading character) to add the image to; "1,2" in multipart
	@Transform(toIdArray)
	@IsArray()
	@ArrayMaxSize(50)
	@IsInt({ each: true })
	@IsOptional()
	readonly albumIds?: number[];

	constructor(properties?: Readonly<ImageUploadRequestDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
