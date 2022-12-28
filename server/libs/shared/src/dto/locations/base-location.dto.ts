import { Type } from "class-transformer";
import { IsArray, IsString, ValidateNested, IsOptional } from "class-validator";
import { LocationWeatherEditDto } from "./location_weather-edit.dto";

export abstract class BaseLocationDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    imageFileName: string;

    @Type(() => LocationWeatherEditDto)
    @ValidateNested({each: true})
    @IsOptional()
    @IsArray()
    locationWeather: LocationWeatherEditDto[]|null;
}