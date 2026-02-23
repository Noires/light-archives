import { UserInfo } from '@app/auth/model/user-info';
import { serverConfiguration } from '@app/configuration';
import { Character, Event, Image, Venue, VenueMembership } from '@app/entity';
import { hashFile } from '@app/security';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ImageDescriptionDto } from '@app/shared/dto/image/image-desciption.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageUploadRequestDto } from '@app/shared/dto/image/image-upload-request.dto';
import { ImageDto } from '@app/shared/dto/image/image.dto';
import { ImagesFilterDto } from '@app/shared/dto/image/images-filter.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { ImageFormat } from '@app/shared/enums/image-format.enum';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import html from '@app/shared/html';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { escapeForLike } from 'apps/chaosarchives/src/common/db';
import utils from 'apps/chaosarchives/src/common/utils';
import { Connection, EntityManager, IsNull, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import sharp from 'sharp';
import {
  ImageSanitizeError,
  ImageSanitizeResult,
  sanitizeImage
} from '../../../common/image-lib';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { StorageService } from './storage.service';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private storageService: StorageService,
    private connection: Connection,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
    @InjectRepository(Character) private characterRepo: Repository<Character>,
  ) {}


  private toImageDto(image: Image, user?: UserInfo): ImageDto {
    return {
      id: image.id,
      mine: !!user && user.characters.some(character => character.id === image.owner.id),
      url: this.storageService.getUrl(`${image.owner.id}/${image.hash}/${image.filename}`),
      thumbUrl: this.storageService.getUrl(`${image.owner.id}/${image.hash}/thumb_${image.filename}`),
      filename: image.filename,
      width: image.width,
      height: image.height,
      title: image.title,
      description: image.description,
      category: image.category,
      createdAt: image.createdAt!.getTime(),
      author: image.owner.name,
      authorServer: image.owner.server.name,
      credits: image.credits,
      eventId: image.event ? image.event.id : null,
      eventTitle: image.event ? image.event.title : null,
      venueId: image.venue ? image.venue.id : null,
      venueName: image.venue ? image.venue.name : null,
      venueServer: image.venue ? image.venue.server.name : null,
    };
  }

  async getImage(id: number, user?: UserInfo): Promise<ImageDto> {
    const image = await this.imageRepo.createQueryBuilder('image')
      .leftJoinAndSelect('image.owner', 'character')
      .leftJoinAndSelect('image.event', 'event')
      .leftJoinAndSelect('image.venue', 'venue')
      .leftJoinAndSelect('venue.server', 'venueServer')
      .leftJoinAndSelect('character.server', 'server')
      .where('image.id = :id', { id })
      .select([
        'image',
        'character.id',
        'character.name',
        'server.name',
        'event.id',
        'event.title',
        'venue.id',
        'venue.name',
        'venueServer.name',
      ])
      .getOne();

    if (!image || image.category === ImageCategory.UNLISTED) {
      throw new NotFoundException('Image not found');
    }

    return this.toImageDto(image, user);
  }

  async getImages(filter: ImagesFilterDto): Promise<PagingResultDto<ImageSummaryDto>> {
    const { searchQuery, characterId, eventId, venueId, offset, limit, category } = filter;
    const query = this.imageRepo.createQueryBuilder('image')
      .leftJoinAndSelect('image.owner', 'character')
      .leftJoinAndSelect('character.server', 'server')
      .leftJoinAndSelect('image.event', 'event')
      .leftJoinAndSelect('image.venue', 'venue');

    if (searchQuery) {
      query.andWhere('(image.title LIKE :searchQuery OR character.name LIKE :searchQuery)', {
        searchQuery: `%${escapeForLike(searchQuery)}%`
      });
    }

    if (characterId) {
      query.andWhere('character.id = :characterId', { characterId });
    }

    if (eventId) {
      query.andWhere('event.id = :eventId', { eventId });
    }

    if (venueId) {
      query.andWhere('venue.id = :venueId', { venueId });
    }

    if (category) {
      query.andWhere('image.category = :category', { category });
    } else {
      query.andWhere('image.category <> :category', { category: ImageCategory.UNLISTED });
    }

    if (offset !== undefined) {
      query.offset(offset);
    }

    if (limit !== undefined) {
      query.limit(limit);
    }
    
    query.orderBy('image.createdAt', 'DESC')
      .select(['image', 'character.id', 'character.name', 'server.name']);
    
    const [ total, images ] = await Promise.all([ query.getCount(), query.getMany() ]);

    return {
      total,
      data: images.map(image => this.toImageSummaryDto(image))
    };
  }

  toImageSummaryDto(image: Image): ImageSummaryDto {
    return {
      id: image.id,
      url: this.storageService.getUrl(`${image.owner.id}/${image.hash}/${image.filename}`),
      thumbUrl: this.storageService.getUrl(`${image.owner.id}/${image.hash}/thumb_${image.filename}`),
      filename: image.filename,
      owner: image.owner ? image.owner.name : null,
      ownerServer: image.owner?.server ? image.owner.server.name : null,
      description: image.description ? utils.htmlToText(this.stripWikilinks(image.description)) : null,
      width: image.width,
      height: image.height,
      title: image.title,
      createdAt: image.createdAt!.getTime(),
    };
  }

	private stripWikilinks(text: string): string {
		return text.replace(/\[\[(.+?\|)?(.+?)\]\]/g, '$2');
	}

  async getMyImages(characterId: number, user: UserInfo): Promise<ImageDto[]> {
    const isMyCharacter = (await this.characterRepo.count({
      where: {
        id: characterId,
        user: {
          id: user.id
        }
      }
    }) > 0);

    if (!isMyCharacter) {
      throw new NotFoundException('Character not found or is not your character');
    }

    const images = await this.imageRepo.createQueryBuilder('image')
      .leftJoinAndSelect('image.owner', 'character')
      .leftJoinAndSelect('image.event', 'event')
      .leftJoinAndSelect('image.venue', 'venue')
      .leftJoinAndSelect('venue.server', 'venueServer')
      .leftJoinAndSelect('character.server', 'server')
      .where('character.id = :characterId', { characterId })
      .orderBy('image.createdAt', 'DESC')
      .select([
        'image',
        'character.id',
        'character.name',
        'server.name',
        'event.id',
        'event.title',
        'venue.id',
        'venue.name',
        'venueServer.name',
      ])
      .getMany();

    return images.map(image => this.toImageDto(image, user));
  }

  async uploadImage(
    user: UserInfo,
    request: ImageUploadRequestDto,
    origBuffer: Buffer,
    origFilename: string,
    origMimetype: string,
  ): Promise<ImageSummaryDto> {
    // Validate category and title
    if (request.category !== ImageCategory.UNLISTED && !request.title.trim()) {
      throw new BadRequestException(
        'Title is required for artwork and screenshots',
      );
    }

    // Validate MIME type before doing anything else
    if (origMimetype !== 'image/jpeg' && origMimetype !== 'image/png') {
      throw new BadRequestException('Only JPEG and PNG formats are allowed');
    }

    // Remember uploaded paths in case upload succeeds but then the transaction fails
    const uploadedPaths: string[] = [];

    try {
      return await this.connection.transaction(async (em) => {
        // Validate character ID
        const character = await getVerifiedCharacter(em, request.characterId, user);

        // Replace characters forbidden in Windows and Unix filenames and URLs
        const filename = origFilename.replace(/[<>:"/\\|?*#]/g, '_');

        // Prepare and upload image
        let sanitizeResult: ImageSanitizeResult;

        try {
          sanitizeResult = await sanitizeImage(origBuffer, {
            left: request.thumbLeft,
            top: request.thumbTop,
            width: request.thumbWidth,
          });
        } catch (e) {
          if (e instanceof ImageSanitizeError) {
            throw new BadRequestException(e.message);
          }

          throw e;
        }

        const { buffer, thumb, iconThumb, format, width, height } = sanitizeResult;
        const size = buffer.length;
        const hash = await hashFile(buffer);
        const mimetype =
          format === ImageFormat.PNG ? 'image/png' : 'image/jpeg';

        // Check that this is not a duplicate upload
        const existingImage = await em.getRepository(Image).findOne({
          where: {
            hash,
            owner: character,
          },
          select: ['id', 'filename'],
        });

        if (existingImage && existingImage.id) {
          throw new ConflictException(
            `You already have an image with the same contents: ${existingImage.filename}`,
          );
        }

        // Check the user still has upload space left
        const maxUploadSpaceMiB = serverConfiguration.maxUploadSpacePerUserMiB;
        const maxUploadSpaceBytes = maxUploadSpaceMiB * 1024 * 1024;
        const currentUploadSpace = await em
          .getRepository(Image)
          .createQueryBuilder('image')
          .innerJoinAndSelect('image.owner', 'character')
          .innerJoinAndSelect('character.user', 'user')
          .where('user.id = :userId', { userId: user.id })
          .select('COALESCE(SUM(image.size), 0)', 'total')
          .getRawOne<{ total: string | number }>();
        const currentUploadSpaceBytes = Number(currentUploadSpace?.total || 0);

        if (currentUploadSpaceBytes + size > maxUploadSpaceBytes) {
          throw new BadRequestException(
            `You have too much image content stored (maximum is ${maxUploadSpaceMiB})`,
          );
        }

        const path = `${character.id}/${hash}/${filename}`;
        const thumbPath = `${character.id}/${hash}/thumb_${filename}`;
        const iconThumbPath = `${character.id}/${hash}/icon_${filename}`;

        try {
          await this.storageService.uploadFile(path, buffer, mimetype);
          uploadedPaths.push(path);
          await this.storageService.uploadFile(thumbPath, thumb, mimetype);
          uploadedPaths.push(thumbPath);
          await this.storageService.uploadFile(iconThumbPath, iconThumb, mimetype);
          uploadedPaths.push(iconThumbPath);
        } catch (e) {
          throw new ServiceUnavailableException(
            'Cannot upload file to storage service',
          );
        }

        // Save image in database
        const image = new Image();
        Object.assign(image, {
          owner: character,
          width,
          height,
          size,
          hash,
          filename,
          category: request.category,
          title: request.title,
          description: html.sanitize(request.description),
          credits: request.credits,
          format,
        });
        
        await this.assignImageEvent(em, image, request);
        await this.assignImageVenue(em, image, request, user);
        await em.getRepository(Image).save(image);

        return {
          id: image.id,
          url: this.storageService.getUrl(path),
          thumbUrl: this.storageService.getUrl(thumbPath),
          filename,
          description: utils.htmlToText(this.stripWikilinks(image.description)),
          owner: character.name,
          ownerServer: character.server.name,
          width,
          height,
          title: request.title,
          createdAt: image.createdAt!.getTime(),
        };
      });
    } catch (e) {
      if (uploadedPaths.length > 0) {
        // We uploaded the file before the transaction failed. Delete it.
        try {
          await Promise.all(
            uploadedPaths.map((path) => this.storageService.deleteFile(path)),
          );
        } catch (ex) {
          // Well, what can we do?
        }
      }

      throw e;
    }
  }

  async editImage(id: number, request: ImageDescriptionDto, user: UserInfo): Promise<void> {
    await this.connection.transaction(async em => {
      const imageRepo = em.getRepository(Image);
      const image = await em.getRepository(Image)
        .createQueryBuilder('image')
        .innerJoinAndSelect('image.owner', 'character')
        .leftJoinAndSelect('image.event', 'event')
        .leftJoinAndSelect('image.venue', 'venue')
        .innerJoinAndSelect('character.user', 'user')
        .where('image.id = :id', { id } )
        .andWhere('user.id = :userId', { userId: user.id })
        .select([ 'image', 'event', 'venue' ])
        .getOne();

      if (!image) {
        throw new NotFoundException('Image not found');
      }

      if (request.category !== ImageCategory.UNLISTED && !request.title.trim()) {
        throw new BadRequestException(
          'Title is required for artwork and screenshots',
        );
      }  
  
      image.title = request.title;
      image.category = request.category;
      image.description = html.sanitize(request.description);
      image.credits = request.credits;

      await this.assignImageEvent(em, image, request);
      await this.assignImageVenue(em, image, request, user);
      await imageRepo.save(image);
    });
  }

  private async assignImageEvent(em: EntityManager, image: Image, request: ImageDescriptionDto) {
    if (!request.eventId) {
      // eslint-disable-next-line no-param-reassign
      image.event = null;
    } else if (!image.event || request.eventId !== image.event.id) {
      const event = await em.getRepository(Event).findOneBy({id: request.eventId});

      if (!event) {
        throw new BadRequestException('Event not found');
      }

      // eslint-disable-next-line no-param-reassign
      image.event = event;
    }
  }

  private async assignImageVenue(
    em: EntityManager,
    image: Image,
    request: ImageDescriptionDto,
    user: UserInfo,
  ) {
    if (!request.venueId) {
      // eslint-disable-next-line no-param-reassign
      image.venue = null;
      return;
    }

    if (!image.venue || request.venueId !== image.venue.id) {
      const venue = await em.getRepository(Venue).findOne({
        where: { id: request.venueId },
      });

      if (!venue) {
        throw new BadRequestException('Venue not found');
      }

      const characterIds = user.characters.map((character) => character.id);
      if (characterIds.length === 0) {
        throw new ForbiddenException('You cannot link this venue');
      }

      const canEditVenue = await em
        .getRepository(Venue)
        .createQueryBuilder('venue')
        .innerJoinAndSelect('venue.owner', 'owner')
        .leftJoin(
          VenueMembership,
          'membership',
          'membership.venueId = venue.id AND membership.status = :membershipStatus AND membership.canEdit = :canEdit',
          {
            membershipStatus: MembershipStatus.CONFIRMED,
            canEdit: true,
          },
        )
        .where('venue.id = :venueId', { venueId: request.venueId })
        .andWhere('(owner.id IN (:...characterIds) OR membership.characterId IN (:...characterIds))', { characterIds })
        .getCount();

      if (!canEditVenue) {
        throw new ForbiddenException('You cannot link this venue');
      }

      // eslint-disable-next-line no-param-reassign
      image.venue = venue;
    }
  }

  async deleteImage(id: number, force: boolean, user: UserInfo): Promise<void> {
		const imageEntity = await this.connection.transaction(async em => {
      const imageRepo = em.getRepository(Image);
      const image = await imageRepo
        .createQueryBuilder('image')
        .innerJoinAndSelect('image.owner', 'character')
        .innerJoinAndSelect('character.user', 'user')
        .where('image.id = :id', { id } )
        .andWhere('user.id = :userId', { userId: user.id })
        .select([ 'image.id', 'image.hash', 'image.filename', 'character.id' ])
        .getOne();

      if (!image) {
        throw new NotFoundException('Image not found');
      }

      if (!force) {
        // Check if the image is used and, if yes, refuse to delete

        if (await em.getRepository(Character).countBy({
          banner: {
            id: image.id
          },
        }) > 0) {
          throw new ConflictException('This image is in use as a character banner');
        }

        if (await em.getRepository(Event).countBy({
          banner: {
            id: image.id
          },
        }) > 0) {
          throw new ConflictException('This image is in use as an event banner');
        }

        if (await em.getRepository(Event).countBy({
          icon: {
            id: image.id
          },
        }) > 0) {
          throw new ConflictException('This image is in use as an event icon');
        }

        if (await em.getRepository(Event).countBy({
          discordBanner: {
            id: image.id
          },
        }) > 0) {
          throw new ConflictException('This image is in use as an event discord banner');
        }

        if (await em.getRepository(Venue).countBy({
          banner: {
            id: image.id,
          },
        }) > 0) {
          throw new ConflictException('This image is in use as a venue banner');
        }

        // Clean up stale references left on soft-deleted events.
        await Promise.all([
          em.query('UPDATE `event` SET `bannerId` = NULL WHERE `bannerId` = ? AND `deletedAt` IS NOT NULL', [image.id]),
          em.query('UPDATE `event` SET `discordBannerId` = NULL WHERE `discordBannerId` = ? AND `deletedAt` IS NOT NULL', [image.id]),
          em.query('UPDATE `event` SET `iconId` = NULL WHERE `iconId` = ? AND `deletedAt` IS NOT NULL', [image.id]),
          em.query('UPDATE `venue` SET `bannerId` = NULL WHERE `bannerId` = ? AND `deletedAt` IS NOT NULL', [image.id]),
        ]);
      } else {
        // Unlink from all referencing pages

        await em.getRepository(Character).update({
          banner: {
            id: image.id,
          },
        }, {
          banner: null
        } as unknown as QueryDeepPartialEntity<Character>);

        await Promise.all([
          em.query('UPDATE `event` SET `bannerId` = NULL WHERE `bannerId` = ?', [image.id]),
          em.query('UPDATE `event` SET `discordBannerId` = NULL WHERE `discordBannerId` = ?', [image.id]),
          em.query('UPDATE `event` SET `iconId` = NULL WHERE `iconId` = ?', [image.id]),
          em.query('UPDATE `venue` SET `bannerId` = NULL WHERE `bannerId` = ?', [image.id]),
        ]);
      }

      // Delete from the database
      await imageRepo.remove(image);
      return image;
    });

    // Delete from storage only if transaction succeeds
    await Promise.all([
      this.storageService.deleteFile(`${imageEntity.owner.id}/${imageEntity.hash}/${imageEntity.filename}`),
      this.storageService.deleteFile(`${imageEntity.owner.id}/${imageEntity.hash}/thumb_${imageEntity.filename}`),
      this.storageService.deleteFile(`${imageEntity.owner.id}/${imageEntity.hash}/icon_${imageEntity.filename}`),
    ]);
  }

  getUrl(image: Image): string {
    return this.storageService.getUrl(`${image.owner.id}/${image.hash}/${image.filename}`);
  }

  getThumbUrl(image: Image): string {
    return this.storageService.getUrl(`${image.owner.id}/${image.hash}/thumb_${image.filename}`);
  }

  getIconUrl(image: Image): string {
    return this.storageService.getUrl(`${image.owner.id}/${image.hash}/icon_${image.filename}`);
  }

  async ensureIconThumb(image: Image): Promise<void> {
    const iconPath = `${image.owner.id}/${image.hash}/icon_${image.filename}`;

    try {
      if (await this.storageService.fileExists(iconPath)) {
        return;
      }

      const thumbPath = `${image.owner.id}/${image.hash}/thumb_${image.filename}`;
      const thumbBuffer = await this.storageService.downloadFile(thumbPath);
      const format = image.format === ImageFormat.PNG ? 'png' : 'jpeg';
      const mimetype = image.format === ImageFormat.PNG ? 'image/png' : 'image/jpeg';

      const iconOperation = sharp(thumbBuffer)
        .resize(32)
        .toFormat(format);

      if (format === 'jpeg') {
        iconOperation.jpeg({ quality: 90 });
      }

      const iconBuffer = await iconOperation.toBuffer();

      await this.storageService.uploadFile(iconPath, iconBuffer, mimetype);
    } catch (e) {
      if (e instanceof Error) {
        this.logger.warn(`Failed to generate icon thumbnail for image ${image.id}: ${e.message}`);
      } else {
        this.logger.warn(`Failed to generate icon thumbnail for image ${image.id}`);
      }
    }
  }
}
