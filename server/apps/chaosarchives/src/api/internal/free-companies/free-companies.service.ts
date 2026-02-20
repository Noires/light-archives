import { UserInfo } from '@app/auth/model/user-info';
import { Character, FreeCompany, FreeCompanyMemberPermission, Image } from '@app/entity';
import { CharacterIdWrapper } from '@app/shared/dto/common/character-id-wrapper.dto';
import { FreeCompanyMemberEditFlagDto } from '@app/shared/dto/fcs/free-company-member-edit-flag.dto';
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { MyFreeCompanySummaryDto } from '@app/shared/dto/fcs/my-free-company-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { BadRequestException, ConflictException, ForbiddenException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Connection, IsNull, Not, Repository } from 'typeorm';
import { checkCarrdProfile } from '../../../common/api-checks';
import { getBannerAspectRatioErrorMessage } from '../../../common/image-requirements';
import { ImagesService } from '../images/images.service';
import { LodestoneService } from '../lodestone/lodestone.service';

@Injectable()
export class FreeCompaniesService {
  constructor(
    private imagesService: ImagesService,
    private lodestoneService: LodestoneService,
    private connection: Connection,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    @InjectRepository(FreeCompany) private freeCompanyRepo: Repository<FreeCompany>,
    @InjectRepository(FreeCompanyMemberPermission)
    private freeCompanyMemberPermissionRepo: Repository<FreeCompanyMemberPermission>,
  ) {}

  async getMyFreeCompany(
    characterIdWrapper: CharacterIdWrapper,
    user: UserInfo,
  ): Promise<MyFreeCompanySummaryDto | null> {
    const character = await this.characterRepo.findOne({
      where: {
        id: characterIdWrapper.characterId,
        user: {
          id: user.id,
        },
        verifiedAt: Not(IsNull()),
      },
      relations: ['freeCompany', 'freeCompany.server', 'freeCompany.leader'],
    });

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    const fc = await character.freeCompany;
    return !fc ? null : this.toFCSummaryDto(fc, characterIdWrapper.characterId);
  }

  async setFreeCompany(
    characterIdWrapper: CharacterIdWrapper,
    user: UserInfo,
  ): Promise<MyFreeCompanySummaryDto | null> {
    const characterInfo = user.characters.find((ch) => ch.id === characterIdWrapper.characterId);

    if (!characterInfo) {
      throw new NotFoundException('Character not found');
    }

    const lodestoneCharacterInfo = await this.lodestoneService.getCharacter(characterInfo.lodestoneId);

    if (!lodestoneCharacterInfo) {
      throw new GoneException('Character not found on Lodestone');
    }

    const fcLodestoneId = lodestoneCharacterInfo.FreeCompany?.ID;
    const fcLodestoneInfo = !fcLodestoneId ? null : await this.lodestoneService.getFreeCompany(fcLodestoneId);

    return this.connection.transaction(async (em) => {
      const characterRepo = em.getRepository(Character);
      const character = await characterRepo.findOne({
        where: {
          id: characterInfo.id,
          verifiedAt: Not(IsNull()),
        },
        relations: ['server'],
      });

      if (!character) {
        throw new NotFoundException('Character not found');
      }

      if (!fcLodestoneId || !fcLodestoneInfo) {
        character.freeCompany = Promise.resolve(null);
        await characterRepo.save(character);
        return null;
      }

      const leaderLodestoneId = fcLodestoneInfo.Members[0].ID;

      let fc: FreeCompany;
      const fcRepo = em.getRepository(FreeCompany);
      const existingFC = await fcRepo.findOne({
        where: {
          lodestoneId: fcLodestoneId,
        },
        relations: ['leader', 'server'],
      });

      if (!existingFC) {
        fc = new FreeCompany();
        fc.foundedAt = DateTime.fromSeconds(fcLodestoneInfo.Timestamp).toJSDate();
      } else {
        fc = existingFC;
      }

      fc.name = fcLodestoneInfo.Name;
      fc.lodestoneId = fcLodestoneId;
      fc.tag = fcLodestoneInfo.Tag.replace(/[«»]/g, '');

      if (!fc.leader && characterInfo.lodestoneId === leaderLodestoneId) {
        if (!fc.claimedAt) {
          fc.claimedAt = new Date();
        }

        fc.leader = character;
      }

      const server = character.server;
      fc.server = server;
      fc.crest = Object.values(fcLodestoneInfo.CrestLayers).join(',');
      await fcRepo.save(fc);

      character.freeCompany = Promise.resolve(fc);
      await characterRepo.save(character);
      return this.toFCSummaryDto(fc, characterIdWrapper.characterId);
    });
  }

  private toFCSummaryDto(fc: FreeCompany, characterId: number): MyFreeCompanySummaryDto {
    return {
      id: fc.id,
      name: fc.name,
      goal: fc.goal,
      tag: fc.tag,
      crest: fc.getCrest(),
      server: fc.server.name,
      isLeader: !!fc.leader && fc.leader.id === characterId,
    };
  }

  async unsetFreeCompany(characterIdWrapper: CharacterIdWrapper, user: UserInfo): Promise<void> {
    const characterInfo = user.characters.find((ch) => ch.id === characterIdWrapper.characterId);

    if (!characterInfo) {
      throw new NotFoundException('Character not found');
    }

    return this.connection.transaction(async (em) => {
      const characterRepo = em.getRepository(Character);
      const character = await characterRepo.findOne({
        where: {
          id: characterInfo.id,
          verifiedAt: Not(IsNull()),
        },
      });

      if (!character) {
        throw new NotFoundException('Character not found');
      }

      character.freeCompany = Promise.resolve(null);
      await characterRepo.save(character);

      // If we're the leader, forget it
      await em.getRepository(FreeCompany).update(
        {
          leader: {
            id: character.id,
          },
        },
        {
          leader: null,
          claimedAt: null as unknown as Date,
        },
      );
    });
  }

  async getFreeCompanies(): Promise<FreeCompanySummaryDto[]> {
    const query = this.freeCompanyRepo
      .createQueryBuilder('fc')
      .where('fc.claimedAt IS NOT NULL')
      .orderBy('fc.name', 'ASC')
      .innerJoinAndSelect('fc.server', 'server')
      .select(['fc.id', 'fc.name', 'fc.crest', 'fc.goal', 'server.name']);

    const fcs = await query.getMany();

    return fcs.map((fc) => ({
      name: fc.name,
      crest: fc.getCrest(),
      goal: fc.goal,
      server: fc.server.name,
    }));
  }

  async getFreeCompany(name: string, server: string, characterId?: number, user?: UserInfo): Promise<FreeCompanyDto> {
    const fc = await this.freeCompanyRepo.findOne({
      where: {
        name,
        server: {
          name: server,
        },
      },
      relations: ['server', 'leader', 'banner', 'banner.owner'],
    });

    if (!fc) {
      throw new NotFoundException('Free Company not found');
    }

    return this.toFreeCompanyDto(fc, characterId, user);
  }

  async getFreeCompanyById(id: number, characterId?: number, user?: UserInfo): Promise<FreeCompanyDto> {
	const fc = await this.freeCompanyRepo.findOne({
		where: {
			id: id
		},
		relations: [ 'server', 'leader', 'banner', 'banner.owner' ]
	});

	if (!fc) {
		throw new NotFoundException('Free Company not found');
	}

	return this.toFreeCompanyDto(fc, characterId, user);
}

  async editFreeCompany(fcDto: FreeCompanyDto, user: UserInfo): Promise<void> {
    await this.assertEditRights(fcDto.id, user);

    await this.connection.transaction(async (em) => {
      const fcRepo = em.getRepository(FreeCompany);
      const fc = await fcRepo.findOne({
        where: {
          id: fcDto.id,
        },
        relations: ['server', 'leader', 'banner', 'banner.owner'],
      });

      if (!fc) {
        throw new NotFoundException('Free Company not found');
      }

      if (!fc.leader) {
        throw new ForbiddenException('Operation not permitted');
      }

      fc.description = fcDto.description;
      fc.goal = fcDto.goal;
      fc.website = fcDto.website;
      fc.status = fcDto.status;
      fc.areaOfOperations = fcDto.areaOfOperations;
      fc.recruitingOfficers = fcDto.recruitingOfficers;
      fc.carrdProfile = checkCarrdProfile(fcDto.carrdProfile, user);

      // Set banner
      if (fcDto.banner && fcDto.banner.id) {
        const banner = await em.getRepository(Image).findOne({
          where: {
            id: fcDto.banner.id,
            owner: {
              id: fc.leader.id,
            },
          },
        });

        if (!banner) {
          throw new BadRequestException('Banner not found');
        }

        if (banner.width / banner.height < SharedConstants.MIN_BANNER_ASPECT_RATIO) {
          throw new BadRequestException(
            getBannerAspectRatioErrorMessage(
              'Banner',
              banner.width,
              banner.height,
              SharedConstants.MIN_BANNER_ASPECT_RATIO,
            ),
          );
        }

        fc.banner = Promise.resolve(banner);
      } else {
        fc.banner = Promise.resolve(null);
      }

      await fcRepo.save(fc);
    });
  }

  async getMemberPermissions(freeCompanyId: number, user: UserInfo): Promise<FreeCompanyMemberPermissionDto[]> {
    const fc = await this.assertLeaderRights(freeCompanyId, user);
    const leaderId = fc.leader!.id;

    const [members, grantedPermissions] = await Promise.all([
      this.characterRepo.find({
        where: {
          freeCompany: {
            id: freeCompanyId,
          },
        },
        relations: ['server'],
        order: {
          name: 'ASC',
        },
      }),
      this.freeCompanyMemberPermissionRepo.find({
        where: {
          freeCompany: {
            id: freeCompanyId,
          },
          canEdit: true,
        },
        relations: ['character'],
      }),
    ]);

    const grantedMemberIds = new Set(grantedPermissions.map((permission) => permission.character.id));

    return members.map((member) => {
      const isLeader = member.id === leaderId;

      return {
        characterId: member.id,
        name: member.name,
        server: member.server.name,
        avatar: member.avatar,
        canEdit: isLeader || grantedMemberIds.has(member.id),
        isLeader,
      };
    });
  }

  async setMemberEditPermission(
    freeCompanyId: number,
    characterId: number,
    editFlag: FreeCompanyMemberEditFlagDto,
    user: UserInfo,
  ): Promise<void> {
    const fc = await this.assertLeaderRights(freeCompanyId, user);
    const leaderId = fc.leader!.id;

    if (characterId === leaderId) {
      throw new ConflictException('Free Company leader permission cannot be changed');
    }

    const member = await this.characterRepo.findOne({
      where: {
        id: characterId,
        freeCompany: {
          id: freeCompanyId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Free Company member not found');
    }

    const existingPermission = await this.freeCompanyMemberPermissionRepo.findOne({
      where: {
        freeCompany: {
          id: freeCompanyId,
        },
        character: {
          id: characterId,
        },
      },
    });

    if (!editFlag.canEdit) {
      if (existingPermission) {
        await this.freeCompanyMemberPermissionRepo.remove(existingPermission);
      }

      return;
    }

    if (existingPermission) {
      if (!existingPermission.canEdit) {
        existingPermission.canEdit = true;
        await this.freeCompanyMemberPermissionRepo.save(existingPermission);
      }

      return;
    }

    const newPermission = this.freeCompanyMemberPermissionRepo.create({
      freeCompany: fc,
      character: member,
      canEdit: true,
    });
    await this.freeCompanyMemberPermissionRepo.save(newPermission);
  }

  private async assertLeaderRights(freeCompanyId: number, user: UserInfo): Promise<FreeCompany> {
    const fc = await this.freeCompanyRepo.findOne({
      where: {
        id: freeCompanyId,
      },
      relations: ['leader'],
    });

    if (!fc) {
      throw new NotFoundException('Free Company not found');
    }

    const leaderId = fc.leader?.id;

    if (!leaderId || !user.characters.some((character) => character.id === leaderId)) {
      throw new ForbiddenException('Operation not permitted');
    }

    return fc;
  }

  private async assertEditRights(freeCompanyId: number, user: UserInfo): Promise<void> {
    if (!(await this.checkEditRights(freeCompanyId, user))) {
      throw new ForbiddenException('Operation not permitted');
    }
  }

  private async checkEditRights(freeCompanyId: number, user: UserInfo): Promise<boolean> {
    const userCharacterIds = user.characters.map((character) => character.id);

    if (userCharacterIds.length === 0) {
      return false;
    }

    const leaderCount = await this.freeCompanyRepo
      .createQueryBuilder('freeCompany')
      .innerJoin('freeCompany.leader', 'leader')
      .where('freeCompany.id = :freeCompanyId', { freeCompanyId })
      .andWhere('leader.id IN (:...userCharacterIds)', { userCharacterIds })
      .getCount();

    if (leaderCount > 0) {
      return true;
    }

    const permissionCount = await this.freeCompanyMemberPermissionRepo
      .createQueryBuilder('permission')
      .innerJoin('permission.freeCompany', 'freeCompany')
      .innerJoin('freeCompany.leader', 'leader')
      .innerJoin('permission.character', 'character')
      .innerJoin('character.freeCompany', 'characterFreeCompany')
      .where('freeCompany.id = :freeCompanyId', { freeCompanyId })
      .andWhere('character.id IN (:...userCharacterIds)', { userCharacterIds })
      .andWhere('characterFreeCompany.id = :freeCompanyId', { freeCompanyId })
      .andWhere('permission.canEdit = :canEdit', { canEdit: true })
      .getCount();

    return permissionCount > 0;
  }

  private async hasMemberEditPermission(freeCompanyId: number, characterId: number): Promise<boolean> {
    const permissionCount = await this.freeCompanyMemberPermissionRepo
      .createQueryBuilder('permission')
      .innerJoin('permission.freeCompany', 'freeCompany')
      .innerJoin('freeCompany.leader', 'leader')
      .innerJoin('permission.character', 'character')
      .innerJoin('character.freeCompany', 'characterFreeCompany')
      .where('freeCompany.id = :freeCompanyId', { freeCompanyId })
      .andWhere('character.id = :characterId', { characterId })
      .andWhere('characterFreeCompany.id = :freeCompanyId', { freeCompanyId })
      .andWhere('permission.canEdit = :canEdit', { canEdit: true })
      .getCount();

    return permissionCount > 0;
  }

  async toFreeCompanyDto(fc: FreeCompany, characterId?: number, user?: UserInfo): Promise<FreeCompanyDto> {
    const banner = await fc.banner;
    const userCharacterIds = user?.characters?.map((ch) => ch.id) || [];

    if (user && characterId && !userCharacterIds.includes(characterId)) {
      throw new ForbiddenException('Invalid character ID');
    }

    const canEdit = !!characterId
      && (
        (!!fc.leader && fc.leader.id === characterId)
        || (await this.hasMemberEditPermission(fc.id, characterId))
      );

    return {
      id: fc.id,
      mine: !!fc.leader && !!user && userCharacterIds.includes(fc.leader.id),
      canEdit,
      claimed: !!fc.claimedAt,
      foundedAt: fc.foundedAt.getTime(),
      name: fc.name,
      server: fc.server.name,
      tag: fc.tag,
      description: fc.description,
      goal: fc.goal,
      website: fc.website,
      crest: fc.getCrest(),
      lodestoneId: fc.lodestoneId,
      status: fc.status,
      areaOfOperations: fc.areaOfOperations,
      recruitingOfficers: fc.recruitingOfficers,
      carrdProfile: fc.carrdProfile,
      banner: !banner
        ? null
        : {
            id: banner.id,
            url: this.imagesService.getUrl(banner),
            width: banner.width,
            height: banner.height,
          },
    };
  }
}
