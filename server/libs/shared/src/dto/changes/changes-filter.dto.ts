import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PagingDto } from '../common/paging.dto';

export class ChangesFilterDto extends PagingDto {
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsEnum(ChangeArea)
  @IsOptional()
  area?: ChangeArea;

  @IsEnum(ChangeType)
  @IsOptional()
  type?: ChangeType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  periodDays?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  since?: number;
}
