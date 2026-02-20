import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { BannerDto } from '../characters/banner.dto';

export class VenueDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsBoolean()
  mine: boolean;

  @IsEnum(MembershipStatus)
  @IsOptional()
  membershipStatus?: MembershipStatus|null;

  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @IsBoolean()
  @IsOptional()
  canManageMembers?: boolean;

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
  server: string;
	
  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  eventDescription: string;

  @IsString()
  @IsOptional()
  eventOocDetails: string;

  @IsString()
  @IsOptional()
  eventContact: string;

  @IsString()
  @IsOptional()
  eventLink: string;

  @IsString()
  website: string;

  @IsString()
  purpose: string;

  @IsString()
  status: string;

  @IsEnum(VenueLocation)
  location: VenueLocation;

  @IsString()
  @ValidateIf((object: VenueDto) => object.location === VenueLocation.OPEN_WORLD)
  address: string;

  @IsEnum(HousingArea)
  @ValidateIf((object: VenueDto) => object.location !== VenueLocation.OPEN_WORLD)
  housingArea: HousingArea|null;

  @IsNumber()
  @Min(SharedConstants.housing.MIN_WARD_NUMBER)
  @Max(SharedConstants.housing.MAX_WARD_NUMBER)
  @ValidateIf((object: VenueDto) => object.location !== VenueLocation.OPEN_WORLD)
  ward: number|null;

  @IsNumber()
  @Min(SharedConstants.housing.MIN_MAIN_WARD_PLOT)
  @ValidateIf((object: VenueDto) => object.location === VenueLocation.HOUSE)
  plot: number|null;

  @IsString()
  @ValidateIf((object: VenueDto) => object.location === VenueLocation.APARTMENT)
  room: string|null;

  @ValidateIf((object: VenueDto) => object.location !== VenueLocation.OPEN_WORLD)
  subdivision: boolean|null;

  @IsString()
  carrdProfile: string;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  banner: BannerDto|null;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventContentNotes: string[];
	
	constructor(properties?: Readonly<VenueDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
