import { LocationDto } from '@app/shared/dto/locations/location.dto';
import { LocationEditDto } from '@app/shared/dto/locations/location-edit.dto';
import { LocationCreateResultDto } from '@app/shared/dto/locations/location-create-result.dto';
import APITransport from './api-transport';

export default class LocationsAPI {
    private readonly transport: APITransport;

    constructor(transport: APITransport) {
        this.transport = transport.atPath('locations');
    }

    async getLocations(): Promise<LocationDto[]> {
        return this.transport.get<LocationDto[]>('');
    }

    async createLocation(location: LocationEditDto): Promise<LocationCreateResultDto> {
        return this.transport.authPost<LocationCreateResultDto>('', location);
    }

    async updateLocation(id: number, location: LocationEditDto): Promise<LocationEditDto> {
        return this.transport.authPut<LocationEditDto>(`${id}`, location);
    }

    async deleteLocation(id: number): Promise<void> {
        return this.transport.authDelete<void>(`${id}`);
    }
}
