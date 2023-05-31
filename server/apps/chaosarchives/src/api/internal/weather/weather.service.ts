import { Weather } from "@app/entity";
import { WeatherDto } from "@app/shared/dto/weather/weather.dto";
import { WeatherEditDto } from "@app/shared/dto/weather/weather-edit.dto";
import { WeatherCreateResultDto } from "@app/shared/dto/weather/weather-create-result.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";

@Injectable()
export class WeatherService {
	constructor(
		private readonly connection: Connection,
		@InjectRepository(Weather) private weatherDtoRepo: Repository<WeatherDto>,
		@InjectRepository(Weather) private weatherRepo: Repository<Weather>
	) {}

	async getWeather(): Promise<WeatherDto[]> {
		const weather = await this.weatherDtoRepo.find({
			order: {
				id: 'ASC'
			},
			relations: ['followUps']
		});
        
		return weather;
	}

	async createWeather(weatherEditDto: WeatherEditDto): Promise<WeatherCreateResultDto> {
		const weather = new Weather();
		let result = await this.saveWeather(weatherEditDto, weather);
		
		return result as WeatherCreateResultDto;
	}

	async updateWeather(weatherId: number, weatherEditDto: WeatherEditDto): Promise<WeatherEditDto> {
		const weatherToUpdate = await this.weatherRepo.findOne({
			where: {
				id: weatherId
			},
			relations: ['followUps']
		});

		if (weatherToUpdate) {
			let result = await this.saveWeather(weatherEditDto, weatherToUpdate);
			return result as WeatherEditDto;
		}
		else {
			throw new NotFoundException('Wetter wurde nicht gefunden');
		}
	}

	async deleteWeather(weatherId: number): Promise<void> {
		const weatherEntity = await this.connection.transaction(async (em) => {
			const weatherToDelete = await this.weatherRepo.findOne({
				where: {
					id: weatherId
				},
				relations: ['followUps']
			});
		
			if (!weatherToDelete) {
				throw new NotFoundException('Wetter wurde nicht gefunden');
			}
			
			// remove followUp entries
			weatherToDelete.followUps = [];
			await em.getRepository(Weather).save(weatherToDelete); 
			
			// remove weatherToDelete from other Weather's followUps
			let otherConnectedWeather = await this.weatherRepo.createQueryBuilder('otherWeather')
				.select(['otherWeather.id', 'otherWeatherFollowUps'])
				.leftJoin('otherWeather.followUps', 'otherWeatherFollowUps')
				.where('otherWeatherFollowUps.id = :id', { id: weatherToDelete.id })
				.getMany();
				
			if (otherConnectedWeather.length > 0) {
				await this.weatherRepo.createQueryBuilder()
				.relation(Weather, 'followUps')
				.of(otherConnectedWeather)
				.remove({id: weatherToDelete.id});
			}
			
			
			// delete weather
			await em.getRepository(Weather).remove(weatherToDelete);

			return weatherToDelete;
		});
	}

	async saveWeather(weatherEditDto: WeatherEditDto, weather: Weather) {
		const weatherArray = await this.weatherRepo.find();
		const weatherEntity = await this.connection.transaction(async (em) => {
			weather.name = weatherEditDto.name;
			weather.slug = weatherEditDto.slug.toLowerCase().trim().replace(/[^a-zA-Z0-9-_]/g, '');
			weather.followUps = [];
			weather.imageFileName = weatherEditDto.imageFileName || '';

			if (weatherEditDto.followUps) {
				let followUps:Weather[] = [];
				weatherEditDto.followUps.forEach(followUpId => {
					let followUp = weatherArray.find(weatherItem => weatherItem.id == followUpId);
					if (followUp) {
						followUps.push(followUp);
					}
				})
				weather.followUps = followUps;
			}

			await em.getRepository(Weather).save(weather);

			return weather;
		});
  
		let result = this.convertToDto(weatherEntity, weatherEditDto.followUps);

		return result;
	}

	convertToDto(weatherEntity:Weather, followUps: number[] = []) {
		let result = {name: '', slug: '', imageFileName: '', tier: 0, id: 0, probability: 0, followUps};
		result.name = weatherEntity.name;
		result.slug = weatherEntity.slug;
		result.imageFileName = weatherEntity.imageFileName;
		result.tier = 0;
		result.id = weatherEntity.id;
		result.probability = 0;

		return result;
	}
}
