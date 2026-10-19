import { Location, Weather, LocationWeather } from "@app/entity";
import { LocationDto } from "@app/shared/dto/locations/location.dto";
import { LocationWeatherEditDto } from "@app/shared/dto/locations/location_weather-edit.dto";
import { LocationEditDto } from "@app/shared/dto/locations/location-edit.dto";
import { LocationCreateResultDto } from "@app/shared/dto/locations/location-create-result.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository, EntityManager } from "typeorm";
import { looseIdEquals } from "../../../common/loose-id";

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
		const result = await this.saveLocation(locationEditDto, location);
		
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
			const result = await this.saveLocation(locationEditDto, locationToUpdate);
			return result as LocationEditDto;
		}

		throw new NotFoundException('Ort wurde nicht gefunden');
	}

	async deleteLocation(locationId: number): Promise<void> {
		await this.connection.transaction(async (em) => {
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
		
		const locationWeather = await this.saveLocationWeather(locationEditDto, locationEntity);
		const result = this.convertToDto(locationEntity, locationWeather);
		
		return result;
	}

	convertToDto(locationEntity:Location, locationWeather: LocationWeather[] = []) {
		const locationWeatherEditDto: LocationWeatherEditDto[] = locationWeather.map(item => ({
				id: item.id,
				tier: item.tier,
				probability: item.probability,
				weather: item.weather.id,
				location: item.location.id
			}))
		
		const result = {name: '', slug: '', imageFileName: '', id: 0, locationWeather: locationWeatherEditDto};
		result.name = locationEntity.name;
		result.slug = locationEntity.slug;
		result.imageFileName = locationEntity.imageFileName;
		result.id = locationEntity.id;
		result.locationWeather = locationWeatherEditDto;

		return result;
	}

	async saveLocationWeather(locationEditDto: LocationEditDto, location: Location) {
		const result: LocationWeather[] = [];
		await this.connection.transaction(async (em) => {
			// update weatherLocations if they exist, and add new one if not
			if (locationEditDto.locationWeather && locationEditDto.locationWeather.length > 0) {
				const weatherArray = await em.getRepository(Weather).find({relations: ['locationWeather']});
				const locationWeather = await em.getRepository(LocationWeather).createQueryBuilder('locationWeather')
					.select()
					.leftJoin('locationWeather.location', 'location')
					.where('location.id = :id', { id: location.id })
					.getMany();
				
				// update or delete locationWeather
				// Sequential on purpose: each step reads the locationEditDto.locationWeather left by the previous one.
				for (let i = 0; i < locationWeather.length; i++) {
					const item = locationWeather[i];
					const updatedValues: LocationWeatherEditDto|undefined = locationEditDto.locationWeather.find(lwItem => looseIdEquals(lwItem.id, item.id));
					if (updatedValues) { // update
						const weather = weatherArray.find(weatherItem => looseIdEquals(weatherItem.id, updatedValues?.weather));

						if (!weather) {
							throw new NotFoundException('Ein zugehöriges Wetter wurde nicht gefunden');
						}

						item.tier = updatedValues.tier;
						item.probability = updatedValues.probability;
						item.weather = weather;
						item.location = location;

						// eslint-disable-next-line no-await-in-loop -- sequential writes on the single transaction connection
						const updatedLocationWeather = await em.getRepository(LocationWeather).save(item);
						result.push(updatedLocationWeather);
						// remove all updated locationWeathers from array. Only new locationWeathers should stay in there
						locationEditDto.locationWeather = locationEditDto.locationWeather.filter(lwItem => !looseIdEquals(lwItem.id, updatedValues?.id));
					}
					else { // delete
						// eslint-disable-next-line no-await-in-loop -- sequential writes on the single transaction connection
						await em.getRepository(LocationWeather).remove(item);
					}
				}
				
				// create new locationWeather
				for (let i = 0; i < locationEditDto.locationWeather.length; i++) {
					const item = locationEditDto.locationWeather[i];
					const weather = weatherArray.find(weatherItem => looseIdEquals(weatherItem.id, item.weather));
	
					if (!weather) {
						throw new NotFoundException('Ein zugehöriges Wetter wurde nicht gefunden');
					}

					const locationWeatherToAdd = new LocationWeather();
					locationWeatherToAdd.weather = weather;
					locationWeatherToAdd.location = location;
					locationWeatherToAdd.tier = item.tier;
					locationWeatherToAdd.probability = item.probability;
					
					// eslint-disable-next-line no-await-in-loop -- sequential writes on the single transaction connection
					const savedLocationWeather = await em.getRepository(LocationWeather).save(locationWeatherToAdd);
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
