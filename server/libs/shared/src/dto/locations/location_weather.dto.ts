import { WeatherDto } from '../weather/weather.dto';
import { LocationDto } from './location.dto';
import { Type } from "class-transformer";
import { IsNumber, ValidateNested, IsOptional } from "class-validator";

export abstract class LocationWeatherDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  probability: number;

  @IsNumber()
  tier: number;

  @Type(() => WeatherDto)
	@ValidateNested()
	weather: WeatherDto;

  @Type(() => LocationDto)
	@ValidateNested()
	location: LocationDto;
}