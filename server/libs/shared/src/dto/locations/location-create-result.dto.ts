import { IsNumber } from "class-validator";
import { LocationEditDto } from "./location-edit.dto";

export class LocationCreateResultDto extends LocationEditDto {
	@IsNumber()
	id: number;

	constructor(properties?: Readonly<LocationCreateResultDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}
