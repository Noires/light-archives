import { IsInt, IsNumber, IsString, IsArray, ValidateNested, IsOptional } from "class-validator";
import { LocationWeatherDto } from '../locations/location_weather.dto';
import { Type } from "class-transformer";

export class WeatherDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  imageFileName: string;

  @IsNumber()
  @IsOptional()
  tier: number;

  @IsNumber()
  @IsOptional()
  probability: number;

  @Type(() => WeatherDto)
  @ValidateNested({ each: true })
  @IsArray()
  followUps: WeatherDto[];

  @Type(() => LocationWeatherDto)
  @ValidateNested({ each: true })
  @IsArray()
  locationWeather: LocationWeatherDto[];

  constructor(properties?: Readonly<WeatherDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}  