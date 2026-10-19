import { DatacenterDto } from "@app/shared/dto/servers/datacenter-dto";
import { Controller, Get } from "@nestjs/common";
import { ServerDto } from "@app/shared/dto/servers/server-dto";
import { ServersService } from "./servers.service";

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
