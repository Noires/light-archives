import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class AlbumsFilterDto {
	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;
}
