import { UserInfo } from '@app/auth/model/user-info';
import { Character, User } from '@app/entity';
import { SessionDto } from '@app/shared/dto/user/session.dto';
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { VerifyCharacterDto } from '@app/shared/dto/user/verify-character.dto';
import { Role } from '@app/shared/enums/role.enum';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import errors from '@app/shared/errors';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, GoneException, HttpStatus, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import parse from 'node-html-parser';
import { firstValueFrom } from 'rxjs';
import { Connection, EntityManager, Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly TELEMETRY_CONSENT_VERSION = 1;

  constructor(
    private connection: Connection,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    private httpService: HttpService,
  ) {}

  toSession(userInfo: UserInfo): SessionDto {
    return userInfo;
  }

  async getVerificationStatus(user: UserInfo, characterId: number): Promise<VerificationStatusDto> {
    const userData = await this.userRepo.findOneBy({
      id: user.id,
    });

    if (!userData) {
      throw new BadRequestException(`User ${user.id} not found`);
    }

    const characterData = await this.characterRepo.findOne({
      where: {
        id: characterId,
      },
      select: [ 'verificationCode', 'verifiedAt' ],
    });

    if (!characterData) {
      throw new BadRequestException(`Character ${characterId} not found`);
    }

    return {
      characterVerified: characterData.verifiedAt !== null,
      characterVerificationCode: characterData.verificationCode
    };
  }

  async verifyCharacter(
    user: UserInfo,
    verifyData: VerifyCharacterDto,
  ): Promise<void> {
    await this.connection.transaction(async (em) => {
      const characterRepo = em.getRepository(Character);
      const character = await characterRepo.findOneBy({
        id: verifyData.id,
        user: {
          id: user.id,
        },
      });

      if (!character) {
        throw new BadRequestException('No such character belongs to you');
      }

      if (!character.verificationCode) {
        throw new BadRequestException('Already verified');
      }

      const characterData = await this.parseLodestoneProfile(
        character.lodestoneId,
      );

      if (!characterData) {
        throw new GoneException('Character deleted');
      }

      if (!characterData.includes(character.verificationCode)) {
        throw new NotFoundException('Verification string not found in character profile');
      }

      // Passed all checks - character verified!
      character.verificationCode = null;
      character.verifiedAt = new Date();
      await characterRepo.save(character);

      const userRepo = em.getRepository(User);
      const userEntity = await userRepo.findOneBy({id: user.id});

      if (!userEntity) {
        throw new GoneException();
      }

      await this.updatePostVerifyRole(em, userEntity);
    });
  }

  private async parseLodestoneProfile(lodestoneId: number): Promise<string> {
    try {
      // We're parsing Lodestone directly in this case because XIVAPI caches the result.
      const url = `https://eu.finalfantasyxiv.com/lodestone/character/${lodestoneId}/`;
      const page = (await firstValueFrom(this.httpService.get<string>(url))).data;
      const doc = parse(page);
      const profileField = doc.querySelector('.character__selfintroduction');

      if (!profileField) {
        throw new ServiceUnavailableException('Lodestone page structure seems to have changed');
      }

      return profileField.textContent;
    } catch (e) {
      if (errors.getStatusCode(e) === HttpStatus.NOT_FOUND) {
        throw new GoneException('Character not found on Lodestone');
      }

      throw new ServiceUnavailableException('Unable to check character on Lodestone');
    }
  }

  private async updatePostVerifyRole(em: EntityManager, user: User) {
    if (user.role !== Role.UNVERIFIED || user.verifiedAt === null) {
      return;
    }

    // Assumes one character per user. This is safe because unverified users always have exactly one character.
    const character = await em.getRepository(Character).findOne({
      where: {
        user: {
          id: user.id
        }
      },
      select: [ 'id', 'verifiedAt' ]
    });

    if (!character || character.verifiedAt === null) {
      return;
    }

    const savedUser = user;
    savedUser.role = Role.USER;
    await em.getRepository(User).save(savedUser);
  }

  async acceptTerms(user: UserInfo): Promise<void> {
    const userEntity = await this.userRepo.findOne({
      where: {
        id: user.id,
      },
      select: [ 'id', 'termsAcceptedAt' ]
    });

    if (!userEntity) {
      throw new GoneException();
    }

    if (userEntity.termsAcceptedAt) {
      return;
    }

    userEntity.termsAcceptedAt = new Date();
    await this.userRepo.save(userEntity);
  }

  async setTelemetryConsent(
    user: UserInfo,
    status: TelemetryConsentStatus,
  ): Promise<void> {
    const userEntity = await this.userRepo.findOne({
      where: {
        id: user.id,
      },
      select: [ 'id', 'telemetryConsentStatus', 'telemetryConsentVersion', 'telemetryConsentUpdatedAt' ]
    });

    if (!userEntity) {
      throw new GoneException();
    }

    userEntity.telemetryConsentStatus = status;
    userEntity.telemetryConsentVersion = this.TELEMETRY_CONSENT_VERSION;
    userEntity.telemetryConsentUpdatedAt = new Date();
    await this.userRepo.save(userEntity);
  }
}
