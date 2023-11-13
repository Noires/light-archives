import { DatacenterDto } from '@app/shared/dto/servers/datacenter-dto';
import APITransport from './api-transport';
import { ServerDto } from '@app/shared/dto/servers/server-dto';

export default class ServersAPI {
	private readonly transport: APITransport;

	constructor(transport: APITransport) {
		this.transport = transport.atPath('servers');
	}

	async getServers(): Promise<ServerDto[]> {
			return this.transport.get('');
	}
  
	async getDatacenters(): Promise<DatacenterDto[]> {
		return this.transport.get('datacenters');
	}
}
