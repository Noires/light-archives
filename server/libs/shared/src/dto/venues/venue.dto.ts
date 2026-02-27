import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { BannerDto } from '../characters/banner.dto';
import { EventIconDto } from '../events/event-icon.dto';
import { EventLinkDto } from '../events/event-link.dto';
import { EventType } from '../../enums/event-type.enum';
import { VenueOfferingsDto } from './venue-offering.dto';
import { VenueStaffMemberDto } from './venue-staff-member.dto';

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

  @IsArray()
  @IsOptional()
  staff?: VenueStaffMemberDto[];

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

  @Type(() => EventLinkDto)
  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  eventLinks?: EventLinkDto[];

  @IsString()
  @IsOptional()
  eventTitle?: string;

  @IsEnum(EventType)
  @IsOptional()
  eventType?: EventType;

  @IsBoolean()
  @IsOptional()
  eventAdultOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  eventClosed?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventRegistrationDeadlineDays?: number | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventStartDateTime?: number | null;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventEndDateTime?: number | null;

  @IsString()
  @IsOptional()
  eventExtraInfo?: string;

  @Type(() => EventIconDto)
  @ValidateNested()
  @IsOptional()
  eventIcon?: EventIconDto | null;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  eventBanner?: BannerDto | null;

  @Type(() => BannerDto)
  @ValidateNested()
  @IsOptional()
  eventDiscordBanner?: BannerDto | null;

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

  @IsBoolean()
  @IsOptional()
  showRules?: boolean;

  @IsString()
  @IsOptional()
  rules?: string;

  @IsBoolean()
  @IsOptional()
  showPremises?: boolean;

  @IsString()
  @IsOptional()
  premises?: string;

  @IsBoolean()
  @IsOptional()
  showMenu?: boolean;

  @IsString()
  @IsOptional()
  menu?: string;

  @IsBoolean()
  @IsOptional()
  showStaff?: boolean;

  @IsBoolean()
  @IsOptional()
  showJobs?: boolean;

  @IsBoolean()
  @IsOptional()
  showOoc?: boolean;

  @IsString()
  @IsOptional()
  ooc?: string;

  @IsBoolean()
  @IsOptional()
  showMedia?: boolean;

  @IsBoolean()
  @IsOptional()
  showEvents?: boolean;

  @IsBoolean()
  @IsOptional()
  showNetwork?: boolean;

  @IsString()
  @IsOptional()
  network?: string;

  @IsOptional()
  offerings?: VenueOfferingsDto;

	constructor(properties?: Readonly<VenueDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
