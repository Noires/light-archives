import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { LodestoneService } from './lodestone.service';
import { type PagedResult, type CharacterInfo, type CharacterSearchEntry } from '@app/shared/dto/lodestone';

@Controller('lodestone')
export class LodestoneController {
  constructor(private readonly service: LodestoneService) { }

  @Get('search/characters')
  async searchCharacters(
    @Query('name') name: string,
    @Query('datacenter') datacenter: string,
  ): Promise<PagedResult<CharacterSearchEntry>> {
    return await this.service.searchCharacters(name, datacenter);
  }

  @Get('character')
  async getCharacter(
    @Query('lodestoneId', ParseIntPipe) lodestoneId: number,
  ): Promise<CharacterInfo | null> {
    return await this.service.getCharacter(lodestoneId);
  }
}