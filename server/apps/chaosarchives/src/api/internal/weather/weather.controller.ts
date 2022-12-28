import { WeatherDto } from "@app/shared/dto/weather/weather.dto";
import { Controller, Get, Post, Body, ParseIntPipe, Put, Param, Delete } from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { WeatherCreateResultDto } from '@app/shared/dto/weather/weather-create-result.dto';
import { WeatherEditDto } from '@app/shared/dto/weather/weather-edit.dto';
import { Role } from '@app/shared/enums/role.enum';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';

@Controller('weather')
export class WeatherController {
	constructor(private weatherService: WeatherService) { }
    
	@Get()
	async getWeather(): Promise<WeatherDto[]> {
		return this.weatherService.getWeather();
	}

	@Post()
	@RoleRequired(Role.ADMIN)
	async createWeather(
	  @Body() weather: WeatherEditDto,
	): Promise<WeatherCreateResultDto> {
	  return this.weatherService.createWeather(weather);
	}

	@Put('/:id')
	@RoleRequired(Role.ADMIN)
	async updateWeather(
	  @Body() weather: WeatherEditDto,
	  @Param('id', ParseIntPipe) id: number,
	): Promise<WeatherEditDto> {
	  return this.weatherService.updateWeather(id, weather);
	}

	@Delete('/:id')
	@RoleRequired(Role.ADMIN)
	async deleteWeather(@Param('id', ParseIntPipe) id: number): Promise<void> {
		return this.weatherService.deleteWeather(id);
	}
}
