import { BaseLocationWeatherDto } from "./base-location_weather.dto";

export class LocationWeatherEditDto extends BaseLocationWeatherDto {
    constructor(properties?: Readonly<LocationWeatherEditDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}