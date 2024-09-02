import {
    type CharacterInfo,
    type CharacterSearchEntry,
    type FreeCompanyInfo,
    type FreeCompanyMemberInfo,
    type PagedResult,
  } from '@app/shared/dto/lodestone';
  import { HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
  import { Character, FCMembers, FreeCompany } from '@xivapi/nodestone';
  import { PatchedCharacterSearch } from './patched-character-search';
  
  @Injectable()
  export class LodestoneService {
    private readonly logger = new Logger('LodestoneService');
  
    async searchCharacters(name: string, datacenter: string): Promise<PagedResult<CharacterSearchEntry>> {
      try {
        const parser = new PatchedCharacterSearch();
        const query = {
          name: `"${name}"`,
          dc: datacenter,
        };
  
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return (await parser.parse({ query } as any)) as PagedResult<CharacterSearchEntry>;
      } catch (e) {
        if (e instanceof Error) {
          this.logger.error(e.message, e.stack);
        } else {
          this.logger.error(e);
        }
  
        throw new ServiceUnavailableException('Unable to check character on Lodestone');
      }
    }
  
    async getCharacter(lodestoneId: number): Promise<CharacterInfo | null> {
      try {
        const parser = new Character();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const char = await parser.parse({ params: { characterId: lodestoneId.toString() } } as any) as CharacterInfo;
        return char;
      } catch (e) {
        // eslint-disable-next-line prefer-destructuring
        const statusCode: number | undefined = (e as any).statusCode;
  
        if (statusCode === HttpStatus.NOT_FOUND) {
          // Character not found on Lodestone
          return null;
        }
  
        if (e instanceof Error) {
          this.logger.error(e.message, e.stack);
        } else {
          this.logger.error(e);
        }
  
        throw new ServiceUnavailableException('Unable to check character on Lodestone');
      }
    }
  
    async getFreeCompany(lodestoneId: string): Promise<FreeCompanyInfo | null> {
      try {
        const fcParser = new FreeCompany();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const fcResult = (await fcParser.parse({ params: { fcId: lodestoneId } } as any)) as FreeCompanyInfo;
  
        if (fcResult) {
          const membersParser = new FCMembers();
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const fcMembers = (await membersParser.parse({ params: { fcId: lodestoneId } } as any)) as {
            List: FreeCompanyMemberInfo[];
          };
          fcResult.Members = fcMembers.List;
        }
  
        return fcResult;
      } catch (e) {
        // eslint-disable-next-line prefer-destructuring
        const statusCode: number | undefined = (e as any).statusCode;
  
        if (statusCode === HttpStatus.NOT_FOUND) {
          // Free Company not found on Lodestone
          return null;
        }
  
        if (e instanceof Error) {
          this.logger.error(e.message, e.stack);
        } else {
          this.logger.error(e);
        }
  
        throw new ServiceUnavailableException('Unable to check Free Company on Lodestone');
      }
    }
  }