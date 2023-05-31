import { BaseWeatherDto } from "./base-weather.dto";

export class WeatherEditDto extends BaseWeatherDto {
	constructor(properties?: Readonly<WeatherEditDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
