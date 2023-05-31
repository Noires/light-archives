import { LocationDto } from "@app/shared/dto/locations/location.dto";
import { LocationEditDto } from "@app/shared/dto/locations/location-edit.dto";
import { LocationCreateResultDto } from "@app/shared/dto/locations/location-create-result.dto";
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from "@nestjs/common";
import { LocationsService } from "./locations.service";
import { Role } from '@app/shared/enums/role.enum';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';

@Controller('locations')
export class LocationsController {
	constructor(private locationsService: LocationsService) { }
    
	@Get()
	async getLocations(): Promise<LocationDto[]> {
		return this.locationsService.getLocations();
	}

	@Post()
	@RoleRequired(Role.ADMIN)
	async createLocation(
	  @Body() location: LocationEditDto,
	): Promise<LocationCreateResultDto> {
	  return this.locationsService.createLocation(location);
	}

	@Put('/:id')
	@RoleRequired(Role.ADMIN)
	async updateLocation(
	  @Body() location: LocationEditDto,
	  @Param('id', ParseIntPipe) id: number,
	): Promise<LocationEditDto> {
	  return this.locationsService.updateLocation(id, location);
	}

	@Delete('/:id')
	@RoleRequired(Role.ADMIN)
	async deleteLocation(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.locationsService.deleteLocation(id);
	}
}
