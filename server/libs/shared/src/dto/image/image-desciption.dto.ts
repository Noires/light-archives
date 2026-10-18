import { ImageCategory } from "@app/shared/enums/image-category.enum";
import { Transform, Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString } from "class-validator";

/** Multipart sends "1,2" or repeated fields; JSON sends an array. */
export function toIdArray({ value }: { value: unknown }): number[] | undefined {
	if (value === undefined || value === null || value === '') {
		return value === '' ? [] : undefined;
	}

	const parts = Array.isArray(value) ? value : String(value).split(',');
	return parts.map((part) => Number(String(part).trim())).filter((n) => !Number.isNaN(n));
}


export class ImageDescriptionDto {
	@IsString()
	readonly title: string;
	
	@IsString()
  readonly description: string;

	@IsString()
  readonly credits: string;

	@IsEnum(ImageCategory)
  readonly category: ImageCategory;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	readonly eventId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	readonly venueId?: number;

	// ER2 round 2: albums (of the image owner) containing the image. Omit to keep, [] to remove from all.
	@Transform(toIdArray)
	@IsArray()
	@ArrayMaxSize(50)
	@IsInt({ each: true })
	@IsOptional()
	readonly albumIds?: number[];

	constructor(properties?: Readonly<ImageDescriptionDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
