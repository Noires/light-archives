import { Type } from "class-transformer";
import { IsNumber, ValidateNested, IsString} from "class-validator";
import { LocationWeatherDto } from './location_weather.dto';

export abstract class LocationDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  imageFileName: string;

  @Type(() => LocationWeatherDto)
	@ValidateNested()
	locationWeather: LocationWeatherDto[];
}