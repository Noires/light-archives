import { Location } from "@app/entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LocationsController } from "./locations.controller";
import { LocationsService } from "./locations.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Location
		]),
	],
	controllers: [ LocationsController ],
	providers: [ LocationsService ],
})
export class LocationsModule { }
