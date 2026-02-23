import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { Character, NoticeboardItem, Venue } from '@app/entity';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import html from '@app/shared/html';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { VenuesService } from '../venues/venues.service';

@Injectable()
export class NoticeboardService {
	private readonly logger = new Logger(NoticeboardService.name);

  constructor(
    private connection: Connection,
    @InjectRepository(NoticeboardItem) private noticeboardItemRepo: Repository<NoticeboardItem>,
		private readonly httpService: HttpService,
    private readonly venuesService: VenuesService,
  ) {}

  async getNoticeboardItem(id: number, user?: UserInfo): Promise<NoticeboardItemDto> {
    const noticeboardItem = await this.noticeboardItemRepo
      .createQueryBuilder('noticeboardItem')
      .innerJoinAndSelect('noticeboardItem.owner', 'character')
      .innerJoinAndSelect('character.user', 'user')
      .innerJoinAndSelect('character.server', 'server')
      .leftJoinAndSelect('noticeboardItem.venue', 'venue')
      .leftJoinAndSelect('venue.server', 'venueServer')
      .where('noticeboardItem.id = :id', { id })
      .select(['noticeboardItem', 'character.id', 'character.name', 'user.id', 'server.name', 'venue.id', 'venue.name', 'venueServer.name'])
      .getOne();

    if (!noticeboardItem) {
      throw new NotFoundException('Noticeboard item not found');
    }

    return new NoticeboardItemDto({
      id: noticeboardItem.id,
      mine: user ? noticeboardItem.owner.user.id === user.id : false,
      author: noticeboardItem.owner.name,
      authorServer: noticeboardItem.owner.server.name,
      title: noticeboardItem.title,
      content: noticeboardItem.content,
      createdAt: noticeboardItem.createdAt!.getTime(),
      location: noticeboardItem.location,
      type: noticeboardItem.type,
      venueId: noticeboardItem.venue ? noticeboardItem.venue.id : undefined,
      venueName: noticeboardItem.venue ? noticeboardItem.venue.name : undefined,
      venueServer: noticeboardItem.venue ? noticeboardItem.venue.server.name : undefined,
    });
  }

  async createNoticeboardItem(noticeboardItemDto: NoticeboardItemDto & { id: undefined }, postOnDiscord: boolean, user: UserInfo): Promise<IdWrapper> {
    const noticeboardItemEntity = await this.connection.transaction(async (em) => {
      let character: Character;

      if (noticeboardItemDto.characterId) {
        // New approach: use character ID
        character = await getVerifiedCharacter(em, noticeboardItemDto.characterId, user);
      } else if (noticeboardItemDto.author && noticeboardItemDto.authorServer) {
        // Legacy approach: use name + server
        const foundCharacter = await em.getRepository(Character).findOne({
          where: {
            name: noticeboardItemDto.author,
            server: { name: noticeboardItemDto.authorServer },
            user: { id: user.id },
            verifiedAt: Not(IsNull()),
          },
          relations: ['server'],
          select: ['id'],
        });

        if (!foundCharacter) {
          throw new BadRequestException(`Author character "${noticeboardItemDto.author}" not found or not verified`);
        }

        character = foundCharacter;
      } else {
        throw new BadRequestException('Either characterId or author/authorServer must be provided');
      }

      const noticeboardItemRepo = em.getRepository(NoticeboardItem);

      const noticeboardItem = noticeboardItemRepo.create({
        owner: {
          id: character.id,
        },
        venue: await this.resolveVenue(noticeboardItemDto.venueId, user, em),
        title: noticeboardItemDto.title,
        content: html.sanitize(noticeboardItemDto.content),
        location: noticeboardItemDto.location,
        type: noticeboardItemDto.type || NoticeboardType.AUSHANG,
      });

      return noticeboardItemRepo.save(noticeboardItem);
    });

    if (postOnDiscord) {
      void this.notifySteward(noticeboardItemEntity); // no await
    }

    return {
      id: noticeboardItemEntity.id,
    };
  }

  async editNoticeboardItem(noticeboardItemDto: NoticeboardItemDto & { id: number }, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const noticeboardItemRepo = em.getRepository(NoticeboardItem);
      const noticeboardItem = await noticeboardItemRepo
        .createQueryBuilder('noticeboardItem')
        .innerJoinAndSelect('noticeboardItem.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('noticeboardItem.id = :id', { id: noticeboardItemDto.id })
        .andWhere('user.id = :userId', { userId: user.id })
        .select(['noticeboardItem'])
        .getOne();

      if (!noticeboardItem) {
        throw new NotFoundException('Noticeboard item not found');
      }

      Object.assign(noticeboardItem, {
        venue: await this.resolveVenue(noticeboardItemDto.venueId, user, em),
        title: noticeboardItemDto.title,
        content: html.sanitize(noticeboardItemDto.content),
        location: noticeboardItemDto.location,
        type: noticeboardItemDto.type || NoticeboardType.AUSHANG,
      });

      await noticeboardItemRepo.save(noticeboardItem);
    });
  }

  async deleteNoticeboardItem(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const noticeboardItemRepo = em.getRepository(NoticeboardItem);
      const noticeboardItem = await noticeboardItemRepo
        .createQueryBuilder('noticeboardItem')
        .innerJoinAndSelect('noticeboardItem.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('noticeboardItem.id = :id', { id })
        .andWhere('user.id = :userId', { userId: user.id })
        .select(['noticeboardItem.id'])
        .getOne();

      if (!noticeboardItem) {
        throw new NotFoundException('Noticeboard item not found');
      }

      await noticeboardItemRepo.softRemove(noticeboardItem);
    });
  }

  async getNoticeboardItemList(params: { characterId?: number; venueId?: number; limit?: number }): Promise<NoticeboardItemSummaryDto[]> {
    const query = this.noticeboardItemRepo
      .createQueryBuilder('noticeboardItem')
      .innerJoinAndSelect('noticeboardItem.owner', 'character')
      .leftJoinAndSelect('noticeboardItem.venue', 'venue')
      .leftJoinAndSelect('venue.server', 'venueServer')
      .orderBy('noticeboardItem.createdAt', 'DESC')
      .select([
        'noticeboardItem.id',
        'character.name',
        'noticeboardItem.title',
        'noticeboardItem.createdAt',
        'noticeboardItem.location',
        'noticeboardItem.type',
        'venue.id',
        'venue.name',
        'venueServer.name',
      ])
      .limit(params.limit);

    if (params.characterId) {
      query.where('character.id = :characterId', {
        characterId: params.characterId,
      });
    }

    if (params.venueId) {
      if (params.characterId) {
        query.andWhere('venue.id = :venueId', { venueId: params.venueId });
      } else {
        query.where('venue.id = :venueId', { venueId: params.venueId });
      }
    }

    const noticeboardItems = await query.getMany();

    return noticeboardItems.map((noticeboardItem) => ({
      id: noticeboardItem.id,
      title: noticeboardItem.title,
      author: noticeboardItem.owner.name,
      createdAt: noticeboardItem.createdAt!.getTime(),
      location: noticeboardItem.location,
      type: noticeboardItem.type,
      venueId: noticeboardItem.venue ? noticeboardItem.venue.id : undefined,
      venueName: noticeboardItem.venue ? noticeboardItem.venue.name : undefined,
      venueServer: noticeboardItem.venue ? noticeboardItem.venue.server.name : undefined,
    }));
  }

  private async resolveVenue(
    venueId: number | undefined,
    user: UserInfo,
    em: EntityManager,
  ): Promise<Venue | null> {
    if (!venueId) {
      return null;
    }

    await this.venuesService.assertCanEditVenue(venueId, user);
    const venue = await em.getRepository(Venue).findOne({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

	private async notifySteward(noticeboardItem: NoticeboardItem): Promise<void> {
		try {
			this.logger.debug(`Notifying Steward about noticeboard ${noticeboardItem.id} creation`);
			await firstValueFrom(this.httpService.post(`${serverConfiguration.stewardWebhookUrl}/noticeboard`, { noticeboardItemId: noticeboardItem.id }));
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}
		}
	}
}
