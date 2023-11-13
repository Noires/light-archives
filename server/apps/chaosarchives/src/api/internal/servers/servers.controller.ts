import { DatacenterDto } from "@app/shared/dto/servers/datacenter-dto";
import { Controller, Get } from "@nestjs/common";
import { ServersService } from "./servers.service";
import { ServerDto } from "@app/shared/dto/servers/server-dto";

@Controller('servers')
export class ServersController {
	constructor(private serversService: ServersService) { }

	@Get()
	async getServers(): Promise<ServerDto[]> {
		return this.serversService.getServers();
	}

	@Get('datacenters')
	async getDatacenters(): Promise<DatacenterDto[]> {
		return this.serversService.getDatacenters();
	}
}
