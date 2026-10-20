import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { FOCUS_ITEMS_MAX, FocusItemDto } from '../../validation/profile-fields';
import { BannerDto } from '../characters/banner.dto';

export class CommunityDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsBoolean()
  @IsOptional()
  mine: boolean;

  @IsEnum(MembershipStatus)
  @IsOptional()
  membershipStatus: MembershipStatus|null;

  @IsBoolean()
  @IsOptional()
  canEdit: boolean;

  @IsBoolean()
  @IsOptional()
  canManageMembers: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@IsString()
	@IsOptional()
	owner?: string;

	@IsString()
	@IsOptional()
	ownerServer?: string;

  @IsString()
  @IsOptional()
  foundedAt: string|null;

  @IsString()
  name: string;
	
  @IsString()
  description: string;

  @IsString()
  website: string;

  @IsString()
  discord: string;

  @IsString()
  goal: string;

  @IsString()
  status: string;

  @IsString()
	recruitingOfficers: string;

  // ER2-810: null = not specified. Omit to keep.
  @IsBoolean()
  @IsOptional()
  recruiting?: boolean | null;

  @IsString()
  carrdProfile: string;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  banner: BannerDto|null;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
	
  // ER2 round 2 (optional): "Was wir spielen" cards. Omit to keep, [] or null clears.
  @IsArray()
  @ArrayMaxSize(FOCUS_ITEMS_MAX)
  @ValidateNested({ each: true })
  @Type(() => FocusItemDto)
  @IsOptional()
  focusItems?: FocusItemDto[] | null;

	constructor(properties?: Readonly<CommunityDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
