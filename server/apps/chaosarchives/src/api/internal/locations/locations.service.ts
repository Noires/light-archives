import { Location } from "@app/entity";
import { Weather } from "@app/entity";
import { LocationWeather } from "@app/entity";
import { LocationDto } from "@app/shared/dto/locations/location.dto";
import { LocationWeatherDto } from "@app/shared/dto/locations/location_weather.dto";
import { LocationWeatherEditDto } from "@app/shared/dto/locations/location_weather-edit.dto";
import { LocationEditDto } from "@app/shared/dto/locations/location-edit.dto";
import { LocationCreateResultDto } from "@app/shared/dto/locations/location-create-result.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, EntityManager } from "typeorm";

@Injectable()
export class LocationsService {
	constructor(
		private readonly connection: Connection,
		@InjectRepository(Location) private locationDtoRepo: Repository<LocationDto>,
		@InjectRepository(Location) private locationRepo: Repository<Location>,
	) {}

	async getLocations(): Promise<LocationDto[]> {
		const locations = await this.locationDtoRepo.find({
			order: {
				name: 'ASC'
			},
			relations: ['locationWeather', 'locationWeather.weather', 'locationWeather.weather.followUps']
		});
        
		return locations;
	}

	async createLocation(locationEditDto: LocationEditDto): Promise<LocationCreateResultDto> {
		const location = new Location();
		let result = await this.saveLocation(locationEditDto, location);
		
		return result as LocationCreateResultDto;
	}

	async updateLocation(locationId: number, locationEditDto: LocationEditDto): Promise<LocationEditDto> {
		const locationToUpdate = await this.locationRepo.findOne({
			where: {
				id: locationId
			},
			relations: ['locationWeather']
		});

		if (locationToUpdate) {
			let result = await this.saveLocation(locationEditDto, locationToUpdate);
			return result as LocationEditDto;
		}
		else {
			throw new NotFoundException('Ort wurde nicht gefunden');
		}
	}

	async deleteLocation(locationId: number): Promise<void> {
		const locationEntity = await this.connection.transaction(async (em) => {
			const locationToDelete = await this.locationRepo.findOne({
				where: {
					id: locationId
				},
				relations: ['locationWeather']
			});
		
			if (!locationToDelete) {
				throw new NotFoundException('Ort wurde nicht gefunden');
			}
			
			await this.deleteRelatedLocationWeather(locationToDelete, em); 
			await em.getRepository(Location).remove(locationToDelete);

			return locationToDelete;
		});
	}

	async saveLocation(locationEditDto: LocationEditDto, location: Location) {
		const locationEntity = await this.connection.transaction(async (em) => {
			location.name = locationEditDto.name;
			location.slug = locationEditDto.slug.toLowerCase().trim().replace(/[^a-zA-Z0-9-_]/g, '');
			location.imageFileName = locationEditDto.imageFileName || '';

			await em.getRepository(Location).save(location);
			
			return location;
		});
		
		let locationWeather = await this.saveLocationWeather(locationEditDto, locationEntity);
		let result = this.convertToDto(locationEntity, locationWeather);
		
		return result;
	}

	convertToDto(locationEntity:Location, locationWeather: LocationWeather[] = []) {
		let locationWeatherEditDto: LocationWeatherEditDto[] = locationWeather.map(item => {
			return {
				id: item.id,
				tier: item.tier,
				probability: item.probability,
				weather: item.weather.id,
				location: item.location.id
			};
		})
		
		let result = {name: '', slug: '', imageFileName: '', id: 0, locationWeather: locationWeatherEditDto};
		result.name = locationEntity.name;
		result.slug = locationEntity.slug;
		result.imageFileName = locationEntity.imageFileName;
		result.id = locationEntity.id;
		result.locationWeather = locationWeatherEditDto;

		return result;
	}

	async saveLocationWeather(locationEditDto: LocationEditDto, location: Location) {
		let result: LocationWeather[] = [];
		const locationEntity = await this.connection.transaction(async (em) => {
			// update weatherLocations if they exist, and add new one if not
			if (locationEditDto.locationWeather && locationEditDto.locationWeather.length > 0) {
				const weatherArray = await em.getRepository(Weather).find({relations: ['locationWeather']});
				let locationWeather = await em.getRepository(LocationWeather).createQueryBuilder('locationWeather')
					.select()
					.leftJoin('locationWeather.location', 'location')
					.where('location.id = :id', { id: location.id })
					.getMany();
				
				// update or delete locationWeather
				for (let i = 0; i < locationWeather.length; i++) {
					let item = locationWeather[i];
					let updatedValues: LocationWeatherEditDto|undefined = locationEditDto.locationWeather.find(lwItem => lwItem.id == item.id);
					if (updatedValues) { // update
						let weather = weatherArray.find(weather => weather.id == updatedValues?.weather);

						if (!weather) {
							throw new NotFoundException('Ein zugehöriges Wetter wurde nicht gefunden');
						}

						item.tier = updatedValues.tier;
						item.probability = updatedValues.probability;
						item.weather = weather;
						item.location = location;

						let updatedLocationWeather = await em.getRepository(LocationWeather).save(item);
						result.push(updatedLocationWeather);
						// remove all updated locationWeathers from array. Only new locationWeathers should stay in there
						locationEditDto.locationWeather = locationEditDto.locationWeather.filter(item => item.id != updatedValues?.id);
					}
					else { // delete
						await em.getRepository(LocationWeather).remove(item);
					}
				}
				
				// create new locationWeather
				for (let i = 0; i < locationEditDto.locationWeather.length; i++) {
					let item = locationEditDto.locationWeather[i];
					let weather = weatherArray.find(weather => weather.id == item.weather);
	
					if (!weather) {
						throw new NotFoundException('Ein zugehöriges Wetter wurde nicht gefunden');
					}

					let locationWeatherToAdd = new LocationWeather();
					locationWeatherToAdd.weather = weather;
					locationWeatherToAdd.location = location;
					locationWeatherToAdd.tier = item.tier;
					locationWeatherToAdd.probability = item.probability;
					
					let savedLocationWeather = await em.getRepository(LocationWeather).save(locationWeatherToAdd);
					result.push(savedLocationWeather);
				}
			}
			else {
				// remove all locationWeathers if none were submitted
				await this.deleteRelatedLocationWeather(location, em);
			}
		});

		return result;
	}

	async deleteRelatedLocationWeather(location: Location, em: EntityManager) {
		await em.getRepository(LocationWeather).createQueryBuilder('locationWeather')
			.leftJoin('locationWeather.location', 'location')
			.where('location.id = :id', {id: location.id})
			.getMany()
			.then(result => em.getRepository(LocationWeather).remove(result));
	}
}
