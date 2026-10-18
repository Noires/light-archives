import { Race } from '@app/shared/enums/race.enum';
import { Tribe } from '@app/shared/enums/tribe.enum';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { ACCENT_COLOR_REGEX, PLAY_STYLE_TAG_MAX_LENGTH, PLAY_STYLE_TAGS_MAX } from '../../validation/profile-fields';
import { BannerDto } from './banner.dto';
import { BaseCharacterProfileDto } from './base-character-profile.dto';
import { CharacterFreeCompanyDto } from './character-free-company.dto';
import { RpStatus } from '../../enums/rp-status.enum';

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

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  appearanceImage: BannerDto|null;

  @IsBoolean()
  showAvatar: boolean;

  @IsBoolean()
  showInfoboxes: boolean;

  @IsBoolean()
  showAppearance: boolean;

  @IsBoolean()
  showPersonality: boolean;

  @IsBoolean()
  showContacts: boolean;

  @IsBoolean()
  showRumors: boolean;

  @IsBoolean()
  showDiary: boolean;

  @IsBoolean()
  showGallery: boolean;

  @IsBoolean()
  showInventory: boolean;

  @IsBoolean()
  combinedDescription: boolean;

  freeCompany: CharacterFreeCompanyDto|null;

  // ER2-806 (read only, optional; null when no active status). Set via PUT /characters/:id/rp-status.
  @IsOptional()
  rpStatus?: RpStatus | null;

  @IsOptional()
  rpLocation?: string | null;

  @IsOptional()
  rpStatusExpiresAt?: number | null;

  // ER2 round 2 (optional): accent colour "#RRGGBB" (null or "" clears) and play-style tags. Omit to keep.
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @Matches(ACCENT_COLOR_REGEX, { message: 'accentColor must be #RRGGBB' })
  accentColor?: string | null;

  @IsArray()
  @ArrayMaxSize(PLAY_STYLE_TAGS_MAX)
  @IsString({ each: true })
  @MaxLength(PLAY_STYLE_TAG_MAX_LENGTH, { each: true })
  @IsOptional()
  playStyleTags?: string[] | null;
	
	constructor(properties?: Readonly<CharacterProfileDto>) {
    super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
