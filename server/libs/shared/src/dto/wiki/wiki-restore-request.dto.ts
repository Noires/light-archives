import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

/** ER2 round 2: optional body of POST /wiki/:title/revisions/:id/restore. */
export class WikiRestoreRequestDto {
	@IsString()
	@IsOptional()
	@MaxLength(200)
	changeNote?: string;

	/** Character recorded as editor; defaults to the page owner or the user's first character. */
	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;
}
