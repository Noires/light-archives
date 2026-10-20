import { UserInfo } from '@app/auth/model/user-info';
import { Character, Image, ImageCharacterTag } from '@app/entity';
import {
  IMAGE_TAG_REQUESTED_EVENT,
  ImageTagDto,
  ImageTagRequestedEvent,
  PendingImageTagDto,
  TaggedCharacterDto,
} from '@app/shared/dto/image/image-tag.dto';
import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, IsNull, Not, Repository } from 'typeorm';
import { canRemoveTag, canSeeTag, decideTag, tagCreateOutcome } from './image-tags';
import { StorageService } from './storage.service';

/** ER2 round 2: character tags on images, public only after the tagged owner's consent. */
@Injectable()
export class ImageTagsService {
  constructor(
    private connection: Connection,
    private storageService: StorageService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(ImageCharacterTag) private tagRepo: Repository<ImageCharacterTag>,
  ) {}

  /** Tags of one image as seen by `user`: approved ones for everyone, plus own pending/declined ones. */
  async getTagsForImage(
    imageId: number,
    user?: UserInfo,
  ): Promise<{ taggedCharacters: TaggedCharacterDto[]; tags?: ImageTagDto[] }> {
    const tags = await this.tagRepo
      .createQueryBuilder('tag')
      .innerJoinAndSelect('tag.image', 'image')
      .innerJoinAndSelect('image.owner', 'imageOwner')
      .innerJoinAndSelect('imageOwner.user', 'imageOwnerUser')
      .innerJoinAndSelect('tag.character', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'characterUser')
      .where('image.id = :imageId', { imageId })
      .orderBy('tag.createdAt', 'ASC')
      .select([
        'tag.id', 'tag.status', 'tag.createdAt', 'tag.decidedAt',
        'image.id', 'imageOwner.id', 'imageOwnerUser.id',
        'character.id', 'character.name', 'character.avatar', 'server.name', 'characterUser.id',
      ])
      .getMany();

    const publicTags = tags.filter((tag) => canSeeTag(tag.status, this.parties(tag), null));
    // With consent state: the image owner sees all tags, a tagged owner their own ones
    const partyTags = user ? tags.filter((tag) => canRemoveTag(this.parties(tag), user.id)) : [];

    return {
      taggedCharacters: publicTags.map((tag) => this.toTaggedCharacter(tag.character)),
      tags: partyTags.length > 0 ? partyTags.map((tag) => this.toImageTagDto(tag)) : undefined,
    };
  }

  async createTag(imageId: number, characterId: number, user: UserInfo): Promise<ImageTagDto> {
    const result = await this.connection.transaction(async (em) => {
      const image = await em.getRepository(Image).findOne({
        where: { id: imageId },
        relations: ['owner', 'owner.user', 'owner.server'],
      });

      if (!image) {
        throw new NotFoundException('Image not found');
      }

      if (image.owner.user.id !== user.id) {
        throw new ForbiddenException('Only the image owner can tag characters');
      }

      const character = await em.getRepository(Character).findOne({
        where: { id: characterId, verifiedAt: Not(IsNull()) },
        relations: ['server', 'user'],
      });

      if (!character) {
        throw new BadRequestException('Character not found');
      }

      const repo = em.getRepository(ImageCharacterTag);
      const [existing, tagCount] = await Promise.all([
        repo.findOne({ where: { image: { id: image.id }, character: { id: character.id } } }),
        repo.count({ where: { image: { id: image.id } } }),
      ]);

      const outcome = tagCreateOutcome(existing ? existing.status : null, character.user.id === user.id, tagCount);

      if (outcome.action === 'refuse') {
        throw new ConflictException(outcome.reason);
      }

      if (outcome.action === 'keep') {
        return { tag: existing!, character, image, created: false };
      }

      const tag = await repo.save(repo.create({
        image: { id: image.id },
        character: { id: character.id },
        taggedBy: { id: image.owner.id },
        status: outcome.status,
        decidedAt: outcome.status === ImageTagStatus.APPROVED ? new Date() : null,
      }));

      return { tag, character, image, created: true };
    });

    if (result.created && result.tag.status === ImageTagStatus.PENDING) {
      const payload: ImageTagRequestedEvent = {
        taggedCharacterId: result.character.id,
        imageId: result.image.id,
        byCharacterName: result.image.owner.name,
      };
      void this.eventEmitter.emitAsync(IMAGE_TAG_REQUESTED_EVENT, payload);
    }

    return this.toImageTagDto({ ...result.tag, character: result.character } as ImageCharacterTag);
  }

  async removeTag(imageId: number, characterId: number, user: UserInfo): Promise<void> {
    const tag = await this.loadTag({ imageId, characterId });

    if (!tag || !canRemoveTag(this.parties(tag), user.id)) {
      // Do not reveal pending tags to others
      throw new NotFoundException('Tag not found');
    }

    await this.tagRepo.delete(tag.id);
  }

  async decide(tagId: number, status: ImageTagStatus, user: UserInfo): Promise<ImageTagDto> {
    const tag = await this.loadTag({ tagId });

    if (!tag || tag.character.user.id !== user.id) {
      throw new NotFoundException('Tag not found');
    }

    const next = decideTag(tag.status, status);

    if (next !== null) {
      tag.status = next;
      tag.decidedAt = new Date();
      await this.tagRepo.update(tag.id, { status: next, decidedAt: tag.decidedAt });
    }

    return this.toImageTagDto(tag);
  }

  /** Pending tags on any of my characters, newest first. */
  async getPendingForUser(user: UserInfo): Promise<PendingImageTagDto[]> {
    const tags = await this.tagRepo
      .createQueryBuilder('tag')
      .innerJoinAndSelect('tag.image', 'image')
      .innerJoinAndSelect('image.owner', 'imageOwner')
      .innerJoinAndSelect('tag.character', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'characterUser')
      .innerJoinAndSelect('tag.taggedBy', 'taggedBy')
      .innerJoinAndSelect('taggedBy.server', 'taggedByServer')
      .where('characterUser.id = :userId', { userId: user.id })
      .andWhere('tag.status = :status', { status: ImageTagStatus.PENDING })
      .orderBy('tag.createdAt', 'DESC')
      .select([
        'tag.id', 'tag.createdAt',
        'image.id', 'image.title', 'image.hash', 'image.filename', 'imageOwner.id',
        'character.id', 'character.name', 'character.avatar', 'server.name', 'characterUser.id',
        'taggedBy.id', 'taggedBy.name', 'taggedByServer.name',
      ])
      .limit(200)
      .getMany();

    return tags.map((tag) => ({
      id: tag.id,
      createdAt: tag.createdAt.getTime(),
      image: {
        id: tag.image.id,
        title: tag.image.title,
        thumbUrl: this.storageService.getUrl(`${tag.image.owner.id}/${tag.image.hash}/thumb_${tag.image.filename}`),
      },
      character: this.toTaggedCharacter(tag.character),
      taggedBy: {
        id: tag.taggedBy.id,
        name: tag.taggedBy.name,
        server: tag.taggedBy.server.name,
      },
    }));
  }

  private async loadTag(where: { tagId?: number; imageId?: number; characterId?: number }): Promise<ImageCharacterTag | null> {
    const query = this.tagRepo
      .createQueryBuilder('tag')
      .innerJoinAndSelect('tag.image', 'image')
      .innerJoinAndSelect('image.owner', 'imageOwner')
      .innerJoinAndSelect('imageOwner.user', 'imageOwnerUser')
      .innerJoinAndSelect('tag.character', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .innerJoinAndSelect('character.user', 'characterUser')
      .select([
        'tag.id', 'tag.status', 'tag.createdAt', 'tag.decidedAt',
        'image.id', 'imageOwner.id', 'imageOwnerUser.id',
        'character.id', 'character.name', 'character.avatar', 'server.name', 'characterUser.id',
      ]);

    if (where.tagId !== undefined) {
      query.where('tag.id = :tagId', { tagId: where.tagId });
    } else {
      query
        .where('image.id = :imageId', { imageId: where.imageId })
        .andWhere('character.id = :characterId', { characterId: where.characterId });
    }

    return query.getOne();
  }

  private parties(tag: ImageCharacterTag): { taggerUserId: number; taggedOwnerUserId: number } {
    return {
      taggerUserId: tag.image.owner.user.id,
      taggedOwnerUserId: tag.character.user.id,
    };
  }

  private toTaggedCharacter(character: Character): TaggedCharacterDto {
    return {
      id: character.id,
      name: character.name,
      server: character.server.name,
      avatar: character.avatar,
    };
  }

  private toImageTagDto(tag: ImageCharacterTag): ImageTagDto {
    return {
      id: tag.id,
      characterId: tag.character.id,
      name: tag.character.name,
      server: tag.character.server.name,
      avatar: tag.character.avatar,
      status: tag.status,
      createdAt: tag.createdAt ? tag.createdAt.getTime() : Date.now(),
      decidedAt: tag.decidedAt ? tag.decidedAt.getTime() : null,
    };
  }
}
