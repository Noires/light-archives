import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ImageDescriptionDto } from '@app/shared/dto/image/image-desciption.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageUploadRequestDto } from '@app/shared/dto/image/image-upload-request.dto';
import { ImageDto } from '@app/shared/dto/image/image.dto';
import type { ImageTagDto, PendingImageTagDto } from '@app/shared/dto/image/image-tag.dto';
import type { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import { ImagesFilterDto } from '@app/shared/dto/image/images-filter.dto';
import APITransport from './api-transport';

export default class ImagesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('images');
  }

  async getImage(id: number): Promise<ImageDto> {
    return this.transport.tokenGet<ImageDto>(`${id}`);
  }

  async getImages(filter: ImagesFilterDto): Promise<PagingResultDto<ImageSummaryDto>> {
    return this.transport.tokenGet('', filter as { [k: string]: string | number });
  }

  async uploadImage(request: ImageUploadRequestDto, file: Blob, filename: string): Promise<ImageSummaryDto> {
    const formData = new FormData();
    formData.append('file', file, filename);

    const requestMap = request as unknown as { [k: string]: string | number };
    Object.keys(requestMap).forEach((key) => {
      const value = requestMap[key];
      if (value !== undefined && value !== null) {
        formData.append(key, `${value}`);
      }
    });

    return this.transport.authPost<ImageSummaryDto>('', formData);
  }

  async deleteImage(id: number, force: boolean): Promise<void> {
    await this.transport.authDelete<void>(`${id}`, { force });
  }

  async saveImage(id: number, details: ImageDescriptionDto): Promise<void> {
    await this.transport.authPut<void>(`${id}`, details);
  }

  // ER2 round 2: character tags with consent. Approved tags arrive on ImageDto.taggedCharacters;
  // ImageDto.tags (with status) is only filled for the image owner and tagged owners.

  /** Image owner only. Own characters are approved at once, others stay pending until their owner decides. */
  async tagCharacter(imageId: number, characterId: number): Promise<ImageTagDto> {
    return this.transport.authPost<ImageTagDto>(`${imageId}/tags`, { characterId });
  }

  /** Image owner or the tagged character's owner, whatever the tag status. */
  async removeTag(imageId: number, characterId: number): Promise<void> {
    await this.transport.authDelete<void>(`${imageId}/tags/${characterId}`);
  }

  /** Tags on any of my characters awaiting my decision. */
  async getPendingTags(): Promise<PendingImageTagDto[]> {
    return this.transport.authGet<PendingImageTagDto[]>('tags/pending');
  }

  /** Tagged character's owner only. */
  async decideTag(tagId: number, status: ImageTagStatus.APPROVED | ImageTagStatus.DECLINED): Promise<ImageTagDto> {
    return this.transport.authPut<ImageTagDto>(`tags/${tagId}`, { status });
  }
}
