import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const ALBUM_TITLE_MAX_LENGTH = 80;
export const ALBUM_DESCRIPTION_MAX_LENGTH = 2000;
export const ALBUM_MAX_IMAGES = 500;

/** ER2 round 2: body of POST /albums and PUT /albums/:id. */
export class AlbumEditDto {
	/** Owner character; required on create, ignored on update. */
	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@IsString()
	@MinLength(1)
	@MaxLength(ALBUM_TITLE_MAX_LENGTH)
	title: string;

	@IsString()
	@IsOptional()
	@MaxLength(ALBUM_DESCRIPTION_MAX_LENGTH)
	description?: string | null;

	/** null clears the cover; must be one of the owner's images. */
	@Type(() => Number)
	@IsInt()
	@IsOptional()
	coverImageId?: number | null;

	/** Optional on create; on update use PUT /albums/:id/images. */
	@IsArray()
	@ArrayMaxSize(ALBUM_MAX_IMAGES)
	@Type(() => Number)
	@IsInt({ each: true })
	@IsOptional()
	imageIds?: number[];
}

/** ER2 round 2: body of PUT /albums/:id/images. Replaces the album contents. */
export class AlbumImagesDto {
	@IsArray()
	@ArrayMaxSize(ALBUM_MAX_IMAGES)
	@Type(() => Number)
	@IsInt({ each: true })
	imageIds: number[];
}
