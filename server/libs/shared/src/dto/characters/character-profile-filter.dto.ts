import { Race } from "@app/shared/enums/race.enum";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { PagingDto } from "../common/paging.dto";
import { Tribe } from "@app/shared/enums/tribe.enum";

export class CharacterProfileFilterDto extends PagingDto {
	@IsString()
	@IsOptional()
	searchQuery?: string;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	server?: number;

	@IsEnum(Race)
	@IsOptional()
	race?: Race;

	@IsEnum(Tribe)
	@IsOptional()
	tribe?: Tribe;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	freeCompanyId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	communityId?: number;

	@IsString()
	@IsOptional()
	@Matches(/^[A-Z]$/)
	letter?: string;
}
