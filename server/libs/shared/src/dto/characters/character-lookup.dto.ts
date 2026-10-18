import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CharacterLookupNameDto {
	@IsString()
	@MaxLength(200)
	name: string;

	@IsString()
	@MaxLength(50)
	@IsOptional()
	server?: string;
}

/** ER2 round 2: body of POST /characters/lookup (max. 50 names). */
export class CharacterLookupRequestDto {
	@IsArray()
	@ArrayMaxSize(50)
	@ValidateNested({ each: true })
	@Type(() => CharacterLookupNameDto)
	names: CharacterLookupNameDto[];
}

/** ER2 round 2: one found character. Names without a match are left out. */
export interface CharacterLookupResultDto {
	/** the requested name as sent, to map results back */
	query: string;
	name: string;
	server: string;
	avatar: string;
	/** profile route, e.g. "/Alpha/Hans_Wurst" */
	link: string;
}
