import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { OptionalJwtAuthGuard } from '@app/auth/guards/optional-jwt-auth.guard';
import { UserInfo } from '@app/auth/model/user-info';
import { CharacterIdWrapper } from '@app/shared/dto/common/character-id-wrapper.dto';
import { FreeCompanyMemberEditFlagDto } from '@app/shared/dto/fcs/free-company-member-edit-flag.dto';
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { MyFreeCompanySummaryDto } from '@app/shared/dto/fcs/my-free-company-summary.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { FreeCompaniesService } from './free-companies.service';

class OptionalCharacterId {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  characterId?: number;
}

@Controller('free-companies')
export class FreeCompaniesController {
	constructor(
		private freeCompaniesService: FreeCompaniesService,
	) {}

	@Get('my-free-company')
	@RoleRequired(Role.USER)
	async getMyFreeCompany(@Query() characterIdWrapper: CharacterIdWrapper, @CurrentUser() user: UserInfo): Promise<MyFreeCompanySummaryDto|null> {
		return this.freeCompaniesService.getMyFreeCompany(characterIdWrapper, user);
	}

	@Post('my-free-company')
	@RoleRequired(Role.USER)
	async setFreeCompany(@Body() characterIdWrapper: CharacterIdWrapper, @CurrentUser() user: UserInfo): Promise<MyFreeCompanySummaryDto|null> {
		return this.freeCompaniesService.setFreeCompany(characterIdWrapper, user);
	}

	@Post('my-free-company/unset')
	@RoleRequired(Role.USER)
	async unsetFreeCompany(@Body() characterIdWrapper: CharacterIdWrapper, @CurrentUser() user: UserInfo): Promise<void> {
		await this.freeCompaniesService.unsetFreeCompany(characterIdWrapper, user);
	}

	@Get()
	async getFreeCompanies(): Promise<FreeCompanySummaryDto[]> {
		return this.freeCompaniesService.getFreeCompanies();
	}

	@Get('profile/:server/:name')
	@UseGuards(OptionalJwtAuthGuard)
	async getFreeCompany(
    @Param('name') name: string,
    @Param('server') server: string,
    @Query() characterId: OptionalCharacterId,
    @CurrentUser() user?: UserInfo
  ): Promise<FreeCompanyDto> {
		return this.freeCompaniesService.getFreeCompany(name, server, characterId.characterId, user);
	}

	@Get(':id')
	@UseGuards(OptionalJwtAuthGuard)
	async getFreeCompanyById(
    @Param('id', ParseIntPipe) id: number,
    @Query() characterId: OptionalCharacterId,
    @CurrentUser() user?: UserInfo
  ): Promise<FreeCompanyDto> {
		return this.freeCompaniesService.getFreeCompanyById(id, characterId.characterId, user);
	}

	@Get(':id/member-permissions')
	@RoleRequired(Role.USER)
	async getMemberPermissions(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<FreeCompanyMemberPermissionDto[]> {
		return this.freeCompaniesService.getMemberPermissions(id, user);
	}

	@Put(':id/members/:characterId/edit-permission')
	@RoleRequired(Role.USER)
	async setMemberEditPermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('characterId', ParseIntPipe) characterId: number,
    @Body() editFlag: FreeCompanyMemberEditFlagDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
		await this.freeCompaniesService.setMemberEditPermission(id, characterId, editFlag, user);
	}

	@Put(':id')
	@RoleRequired(Role.USER)
	async editFreeCompany(@Param('id', ParseIntPipe) id: number, @Body() fc: FreeCompanyDto, @CurrentUser() user: UserInfo): Promise<void> {
		const fcDto = { ...fc, id };
		await this.freeCompaniesService.editFreeCompany(fcDto, user);
	}	
}
