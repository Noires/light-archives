import { WeatherDto } from '@app/shared/dto/weather/weather.dto';
import { WeatherEditDto } from '@app/shared/dto/weather/weather-edit.dto';
import { WeatherCreateResultDto } from '@app/shared/dto/weather/weather-create-result.dto';
import APITransport from './api-transport';

export default class WeatherAPI {
    private readonly transport: APITransport;

    constructor(transport: APITransport) {
        this.transport = transport.atPath('weather');
    }

    async getWeather(): Promise<WeatherDto[]> {
        return this.transport.get<WeatherDto[]>('');
    }

    async createWeather(weather: WeatherEditDto): Promise<WeatherCreateResultDto> {
        return this.transport.authPost<WeatherCreateResultDto>('', weather);
    }

    async updateWeather(id: number, weather: WeatherEditDto): Promise<WeatherEditDto> {
        return this.transport.authPut<WeatherEditDto>(`${id}`, weather);
    }

    async deleteWeather(id: number): Promise<void> {
        return this.transport.authDelete<void>(`${id}`);
    }
}
