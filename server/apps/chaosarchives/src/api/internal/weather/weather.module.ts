import { Weather } from "@app/entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WeatherController } from "./weather.controller";
import { WeatherService } from "./weather.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Weather
		]),
	],
	controllers: [ WeatherController ],
	providers: [ WeatherService ],
})
export class WeatherModule { }
