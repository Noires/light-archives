import { Race } from '@app/shared/enums/race.enum';
import { Tribe } from '@app/shared/enums/tribe.enum';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BannerDto } from './banner.dto';
import { BaseCharacterProfileDto } from './base-character-profile.dto';
import { CharacterFreeCompanyDto } from './character-free-company.dto';

export class CharacterProfileDto extends BaseCharacterProfileDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  mine: boolean;

  @IsString()
  name: string;

  @IsEnum(Race)
  race: Race;

  @IsEnum(Tribe)
  tribe: Tribe;

  @IsString()
  server: string;

  @IsString()
  avatar: string;

  @IsNumber()
  lodestoneId: number;

  @IsBoolean()
  @IsOptional()
  active: boolean;

  @IsString()
  carrdProfile: string;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  banner: BannerDto|null;

  @IsBoolean()
  showAvatar: boolean;

  @IsBoolean()
  showInfoboxes: boolean;

  @IsBoolean()
  combinedDescription: boolean;

  freeCompany: CharacterFreeCompanyDto|null;
	
	constructor(properties?: Readonly<CharacterProfileDto>) {
    super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
