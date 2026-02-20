import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { CharacterIdWrapper } from '@app/shared/dto/common/character-id-wrapper.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueMemberFlagsDto } from '@app/shared/dto/venues/venue-member-flags.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { VenuesService } from './venues.service';

class OptionalCharacterId {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  characterId?: number;
}

@Controller('venues')
export class VenuesController {
	constructor(private venuesService: VenuesService) {}

	@Get()
	async getVenues(@Query() filter: { characterId?: number }): Promise<VenueSummaryDto[]> {
		return this.venuesService.getVenues(filter);
	}

	@Get('search')
	async searchVenues(@Query('query') query: string, @Query('server') server?: string): Promise<VenueSummaryDto[]> {
		return this.venuesService.searchVenues(query, server);
	}

  @Get(':id/members')
  @RoleRequired(Role.USER)
  async getVenueMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<VenueMemberDto[]> {
    return this.venuesService.getVenueMembers(id, user);
  }

  @Post(':id/members/apply')
  @RoleRequired(Role.USER)
  async applyForMembership(
    @Param('id', ParseIntPipe) id: number,
    @Body() characterId: CharacterIdWrapper,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.venuesService.applyForMembership(id, characterId, user);
  }

  @Post(':id/members/approve')
  @RoleRequired(Role.USER)
  async approveMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() characterId: CharacterIdWrapper,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.venuesService.approveMember(id, characterId, user);
  }

  @Post(':id/members/reject')
  @RoleRequired(Role.USER)
  async rejectMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() characterId: CharacterIdWrapper,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.venuesService.rejectMember(id, characterId, user);
  }

  @Put(':id/members/:characterId/flags')
  @RoleRequired(Role.USER)
  async setMemberFlags(
    @Param('id', ParseIntPipe) id: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @Body() flags: VenueMemberFlagsDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    return this.venuesService.setMemberFlags(id, characterId, flags, user);
  }

	@Get(':server/:name')
	@UseGuards(OptionalJwtAuthGuard)
	async getVenueByName(
    @Param('name') name: string,
    @Param('server') server: string,
    @Query() characterId: OptionalCharacterId,
    @CurrentUser() user?: UserInfo
  ): Promise<VenueDto> {
		return this.venuesService.getVenueByName(name, server, characterId.characterId, user);
	}

	@Get(':id')
	@UseGuards(OptionalJwtAuthGuard)
	async getVenue(
    @Param('id', ParseIntPipe) id: number,
    @Query() characterId: OptionalCharacterId,
    @CurrentUser() user?: UserInfo
  ): Promise<VenueDto> {
		return this.venuesService.getVenue(id, characterId.characterId, user);
	}

	@Post()
	@RoleRequired(Role.USER)
	async createVenue(@Body() venue: VenueDto, @CurrentUser() user: UserInfo): Promise<IdWrapper> {
		return this.venuesService.createVenue(venue, user);
	}

	@Put(':id')
	@RoleRequired(Role.USER)
	async editVenue(@Param('id', ParseIntPipe) id: number, @Body() venue: VenueDto, @CurrentUser() user: UserInfo): Promise<void> {
		// eslint-disable-next-line no-param-reassign
		venue.id = id;
		await this.venuesService.editVenue(venue, user);
	}

	@Delete(':id')
	@RoleRequired(Role.USER)
	async deleteVenue(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserInfo): Promise<void> {
		await this.venuesService.deleteVenue(id, user);
	}
}
