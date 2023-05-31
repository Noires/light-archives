import { IsNumber } from "class-validator";
import { WeatherEditDto } from "./weather-edit.dto";

export class WeatherCreateResultDto extends WeatherEditDto {
	@IsNumber()
	id: number;

	constructor(properties?: Readonly<WeatherCreateResultDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
