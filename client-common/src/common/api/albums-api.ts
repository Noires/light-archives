import type { AlbumEditDto } from '@app/shared/dto/albums/album-edit.dto';
import type { AlbumDto, AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import APITransport from './api-transport';

/** ER2 round 2: gallery albums. */
export default class AlbumsAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('albums');
  }

  /** Albums of one character (or the latest albums when omitted), most recently updated first. */
  async getAlbums(characterId?: number): Promise<AlbumSummaryDto[]> {
    return this.transport.get<AlbumSummaryDto[]>('', characterId ? { characterId } : undefined);
  }

  async getAlbum(id: number): Promise<AlbumDto> {
    return this.transport.tokenGet<AlbumDto>(`${id}`);
  }

  /** `characterId` and `title` are required. */
  async createAlbum(album: AlbumEditDto): Promise<IdWrapper> {
    return this.transport.authPost<IdWrapper>('', album);
  }

  async editAlbum(id: number, album: AlbumEditDto): Promise<void> {
    return this.transport.authPut<void>(`${id}`, album);
  }

  /** Replaces the album contents; all images must belong to the album owner. */
  async setAlbumImages(id: number, imageIds: number[]): Promise<void> {
    return this.transport.authPut<void>(`${id}/images`, { imageIds });
  }

  async deleteAlbum(id: number): Promise<void> {
    return this.transport.authDelete<void>(`${id}`);
  }
}
