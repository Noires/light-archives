import {IsOptional, IsNumber } from "class-validator";

export abstract class BaseLocationWeatherDto {
    @IsNumber()
    @IsOptional()
    id?: number;

    @IsNumber()
    probability: number;

    @IsNumber()
    tier: number;

    @IsNumber()
    weather: number;

    @IsNumber()
    @IsOptional()
    location: number;
}