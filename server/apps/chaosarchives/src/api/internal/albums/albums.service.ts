import { UserInfo } from '@app/auth/model/user-info';
import { Album, Image } from '@app/entity';
import { AlbumEditDto } from '@app/shared/dto/albums/album-edit.dto';
import { AlbumDto, AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, EntityManager, In, Repository } from 'typeorm';
import { getVerifiedCharacter } from '../../../common/api-checks';
import { ImagesService } from '../images/images.service';

const PUBLIC_LIST_LIMIT = 100;

@Injectable()
export class AlbumsService {
  constructor(
    private connection: Connection,
    private imagesService: ImagesService,
    @InjectRepository(Album) private albumRepo: Repository<Album>,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
  ) {}

  async getAlbums(characterId?: number): Promise<AlbumSummaryDto[]> {
    const query = this.albumRepo
      .createQueryBuilder('album')
      .innerJoinAndSelect('album.owner', 'owner')
      .innerJoinAndSelect('owner.server', 'server')
      .leftJoinAndSelect('album.cover', 'cover')
      .leftJoinAndSelect('cover.owner', 'coverOwner')
      .select([
        'album', 'owner.id', 'owner.name', 'server.name',
        'cover.id', 'cover.hash', 'cover.filename', 'coverOwner.id',
      ])
      .orderBy('album.updatedAt', 'DESC')
      .limit(PUBLIC_LIST_LIMIT);

    if (characterId) {
      query.where('owner.id = :characterId', { characterId });
    }

    const albums = await query.getMany();
    const counts = await this.countImages(albums.map((album) => album.id));
    return albums.map((album) => this.toSummary(album, counts.get(album.id) || 0));
  }

  async getAlbum(id: number, user?: UserInfo): Promise<AlbumDto> {
    const album = await this.albumRepo
      .createQueryBuilder('album')
      .innerJoinAndSelect('album.owner', 'owner')
      .innerJoinAndSelect('owner.server', 'server')
      .leftJoinAndSelect('album.cover', 'cover')
      .leftJoinAndSelect('cover.owner', 'coverOwner')
      .where('album.id = :id', { id })
      .select([
        'album', 'owner.id', 'owner.name', 'server.name',
        'cover.id', 'cover.hash', 'cover.filename', 'coverOwner.id',
      ])
      .getOne();

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const mine = !!user && user.characters.some((ch) => ch.id === album.owner.id);
    const imageQuery = this.imageRepo
      .createQueryBuilder('image')
      .innerJoin('album_images', 'ai', 'ai.imageId = image.id AND ai.albumId = :albumId', { albumId: album.id })
      .innerJoinAndSelect('image.owner', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .select(['image', 'character.id', 'character.name', 'server.name'])
      .orderBy('image.createdAt', 'DESC');

    if (!mine) {
      // Unlisted images stay private even when they sit in an album
      imageQuery.andWhere('image.category <> :unlisted', { unlisted: ImageCategory.UNLISTED });
    }

    const images = await imageQuery.getMany();

    return {
      ...this.toSummary(album, images.length),
      mine,
      images: images.map((image) => this.imagesService.toImageSummaryDto(image)),
    };
  }

  async createAlbum(request: AlbumEditDto, user: UserInfo): Promise<IdWrapper> {
    if (!request.characterId) {
      throw new BadRequestException('characterId is required');
    }

    const characterId = request.characterId;

    return this.connection.transaction(async (em) => {
      const character = await getVerifiedCharacter(em, characterId, user);
      const repo = em.getRepository(Album);
      const album = repo.create({
        owner: { id: character.id },
        title: request.title.trim(),
        description: this.normalizeDescription(request.description),
        cover: request.coverImageId ? await this.getOwnedImage(em, character.id, request.coverImageId) : null,
      });

      if (request.imageIds) {
        album.images = await this.getOwnedImages(em, character.id, request.imageIds);
      }

      const saved = await repo.save(album);
      return { id: saved.id };
    });
  }

  async editAlbum(id: number, request: AlbumEditDto, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const album = await this.getOwnAlbum(em, id, user);
      album.title = request.title.trim();

      if (request.description !== undefined) {
        album.description = this.normalizeDescription(request.description);
      }

      if (request.coverImageId !== undefined) {
        album.cover = request.coverImageId ? await this.getOwnedImage(em, album.owner.id, request.coverImageId) : null;
      }

      await em.getRepository(Album).save(album);

      if (request.imageIds) {
        await this.replaceImages(em, album, request.imageIds);
      }
    });
  }

  async setAlbumImages(id: number, imageIds: number[], user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const album = await this.getOwnAlbum(em, id, user);
      await this.replaceImages(em, album, imageIds);
      // Touch updatedAt so the album moves up in lists
      await em.getRepository(Album).update(album.id, { updatedAt: new Date() });
    });
  }

  async deleteAlbum(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const album = await this.getOwnAlbum(em, id, user);
      // Soft delete keeps the row, so drop the join rows explicitly
      await em.query('DELETE FROM `album_images` WHERE `albumId` = ?', [album.id]);
      await em.getRepository(Album).softRemove(album);
    });
  }

  private async replaceImages(em: EntityManager, album: Album, imageIds: number[]): Promise<void> {
    const images = await this.getOwnedImages(em, album.owner.id, imageIds);
    const relation = em.createQueryBuilder().relation(Album, 'images').of(album.id);
    const current = (await relation.loadMany<Image>()).map((image) => image.id);
    const wanted = images.map((image) => image.id);
    await relation.addAndRemove(
      wanted.filter((imageId) => !current.includes(imageId)),
      current.filter((imageId) => !wanted.includes(imageId)),
    );
  }

  private async getOwnAlbum(em: EntityManager, id: number, user: UserInfo): Promise<Album> {
    const album = await em.getRepository(Album).findOne({
      where: { id },
      relations: ['owner', 'cover'],
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (!user.characters.some((ch) => ch.id === album.owner.id)) {
      throw new ForbiddenException('This is not your album');
    }

    return album;
  }

  private async getOwnedImage(em: EntityManager, ownerId: number, imageId: number): Promise<Image> {
    const [image] = await this.getOwnedImages(em, ownerId, [imageId]);
    return image;
  }

  /** The images with the given ids; all must belong to `ownerId`. */
  private async getOwnedImages(em: EntityManager, ownerId: number, imageIds: number[]): Promise<Image[]> {
    const ids = Array.from(new Set(imageIds));

    if (ids.length === 0) {
      return [];
    }

    const images = await em.getRepository(Image).find({
      where: { id: In(ids), owner: { id: ownerId } },
      select: ['id'],
    });

    if (images.length !== ids.length) {
      throw new BadRequestException('Albums can only contain images of the album owner');
    }

    return images;
  }

  private normalizeDescription(description?: string | null): string | null {
    const trimmed = (description || '').trim();
    return trimmed || null;
  }

  private async countImages(albumIds: number[]): Promise<Map<number, number>> {
    const result = new Map<number, number>();

    if (albumIds.length === 0) {
      return result;
    }

    const rows: { albumId: number | string; count: number | string }[] = await this.connection
      .createQueryBuilder()
      .select('ai.albumId', 'albumId')
      .addSelect('COUNT(*)', 'count')
      .from('album_images', 'ai')
      .innerJoin(Image, 'image', 'image.id = ai.imageId AND image.category <> :unlisted', { unlisted: ImageCategory.UNLISTED })
      .where('ai.albumId IN (:...albumIds)', { albumIds })
      .groupBy('ai.albumId')
      .getRawMany();

    rows.forEach((row) => result.set(Number(row.albumId), Number(row.count)));
    return result;
  }

  private toSummary(album: Album, imageCount: number): AlbumSummaryDto {
    const cover = album.cover && album.cover.owner ? album.cover : null;
    return {
      id: album.id,
      title: album.title,
      description: album.description,
      ownerId: album.owner.id,
      owner: album.owner.name,
      ownerServer: album.owner.server.name,
      coverImageId: cover ? cover.id : null,
      coverUrl: cover ? this.imagesService.getUrl(cover) : null,
      coverThumbUrl: cover ? this.imagesService.getThumbUrl(cover) : null,
      imageCount,
      createdAt: album.createdAt.getTime(),
      updatedAt: album.updatedAt.getTime(),
    };
  }
}
