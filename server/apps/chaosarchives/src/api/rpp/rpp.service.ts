import { UserInfo } from '@app/auth/model/user-info';
import { Character } from '@app/entity';
import { RppCharacterProfileDto } from '@app/shared/dto/rpp/rpp-character-profile.dto';
import { races } from '@app/shared/enums/race.enum';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import utils from '../../common/utils';

@Injectable()
export class RppService {
  constructor(
    @InjectRepository(Character) private characterRepo: Repository<Character>,
    private connection: Connection,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCharacterProfile(name: string, server: string, sessionToken: string): Promise<RppCharacterProfileDto> {
    if (sessionToken) {
      void this.eventEmitter.emitAsync('rpp.subscribed', {
        name,
        server,
        sessionToken
      });
    }

    const character = await this.characterRepo
      .createQueryBuilder('character')
      .innerJoinAndSelect('character.server', 'server')
      .where('character.verifiedAt IS NOT NULL')
      .andWhere('character.name = :name', { name })
      .andWhere('server.name = :server', { server })
      .select(['character'])
      .getOne();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return {
      appearance: utils.htmlToText(character.appearance),
      rarerumors: utils.htmlToText(character.rarerumors),
      commonrumors: utils.htmlToText(character.commonrumors),
      profession: character.profession,
      race: races[character.race],
      age: character.age,
      birthplace: character.birthplace,
      residence: character.residence,
      title: character.title,
      nickname: character.nickname,
      slogan: character.slogan,
      haircolor: character.haircolor,
      eyecolor: character.eyecolor,
      skintone: character.skintone,
      build: character.build,
      height: character.height,
      weight: character.weight,
      apparentage: character.apparentage,
      voice: character.voice,
      aether: character.aether,
      birthday: character.birthday,
      children: character.children,
      deity: character.deity,
      family: character.family,
      fears: character.fears,
      openinformation: character.openinformation,
      parents: character.parents,
      personality: character.personality,
      possession: character.possession,
      relationsshipstatus: character.relationsshipstatus,
      specialitems: character.specialitems,
      wishes: character.wishes,
      specialfeatures: character.specialfeatures,
      strengths: character.strengths,
      weaknesses: character.weaknesses,
      ticks: character.ticks,
      friends: character.friends,
      relatives: character.relatives,
      enemies: character.enemies,
      acquaintances: character.acquaintances,
      freecompanies: character.freecompanies,
      past: character.past,
      meetingplaces:  character.meetingplaces,
      communities: character.communities,
      mentioned: character.mentioned,
      loves: character.loves,
      hates: character.hates,
      motivation: character.motivation,
      currently: character.currently,
      oocInfo: character.oocInfo,
      pronouns: character.pronouns,
      background: character.background,
      partners: character.partners,
    };
  }

  async updateCharacterProfile(
    name: string,
    server: string,
    profile: RppCharacterProfileDto,
    user: UserInfo,
  ): Promise<void> {
		const characterEntity = await this.connection.transaction(async em => {
			const characterRepo = em.getRepository(Character);
			const character = await characterRepo
				.createQueryBuilder('character')
				.innerJoinAndSelect('character.server', 'server')
				.where('character.verifiedAt IS NOT NULL')
				.andWhere('character.name = :name', { name })
				.andWhere('server.name = :server', { server })
				.select(['character', 'server.name'])
				.getOne();

			if (!character) {
				throw new NotFoundException('Character not found');
			}

			if (!user.characters.some(ch => ch.id === character.id)) {
				throw new ForbiddenException('This is not your character');
			}

			Object.assign(character, {
				profession: profile.profession,
				age: profile.age,
				birthplace: profile.birthplace,
				residence: profile.residence,
				title: profile.title,
				nickname: profile.nickname,
        friends: profile.friends,
        relatives: profile.relatives,
        enemies: profile.enemies,
				loves: profile.loves,
				hates: profile.hates,
				slogan: profile.slogan,
				motivation: profile.motivation,
				currently: profile.currently,
				oocInfo: profile.oocInfo,
				pronouns: profile.pronouns,
			});

			return characterRepo.save(character);
		});

    void this.eventEmitter.emitAsync('character.updated', characterEntity);
	}
}
