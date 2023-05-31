import { BaseLocationDto } from "./base-location.dto";

export class LocationEditDto extends BaseLocationDto {
	constructor(properties?: Readonly<LocationEditDto>) {
		super();

    if (properties) {
      Object.assign(this, properties);
    }
  }
}