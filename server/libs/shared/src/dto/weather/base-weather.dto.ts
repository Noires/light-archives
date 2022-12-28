import { IsArray, IsNumber, IsString, ValidateNested, IsOptional } from "class-validator";


export abstract class BaseWeatherDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    imageFileName: string;

    @IsNumber()
    @IsOptional()
    tier: number;

    @IsNumber()
    @IsOptional()
    probability: number;

    @IsOptional()
    @IsArray()
    followUps: number[];
}
