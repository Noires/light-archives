import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { CharacterRefreshResultDto } from '@app/shared/dto/characters/character-refresh-result.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { ImageDescriptionDto } from '@app/shared/dto/image/image-desciption.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageUploadRequestDto } from '@app/shared/dto/image/image-upload-request.dto';
import { ImageDto } from '@app/shared/dto/image/image.dto';
import { ImagesFilterDto } from '@app/shared/dto/image/images-filter.dto';
import { MainPageContentDto } from '@app/shared/dto/main-page/main-page-content.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { NewsDto } from '@app/shared/dto/news/news.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import APITransport from './api-transport';
import UserAPI from './user-api';
import { AddCharacterRequestDto } from '@app/shared/dto/characters/add-character-request.dto';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';

export default class API {
  private readonly transport = new APITransport();

  public readonly prefix = this.transport.prefix;

  // Sub-APIs
  
  readonly user = new UserAPI(this.transport);

  // Access token management

  hasAccessToken() {
    return this.transport.hasAccessToken();
  }

  setAccessToken(accessToken: string | null) {
    this.transport.setAccessToken(accessToken);
  }

  // Regular API calls

  async getMainPageContent(): Promise<MainPageContentDto> {
    return this.transport.get<MainPageContentDto>('main-page');
  }

  async getUpdatedNews(): Promise<NewsDto[]> {
    return this.transport.get<NewsDto[]>('main-page/news');
  }

  async getEvents(): Promise<EventSummaryDto[]> {
    return this.transport.get<EventSummaryDto[]>('events');
  }

  // Character profile
  async getCharacterProfile(name: string, server: string): Promise<CharacterProfileDto> {
    return this.transport.tokenGet<CharacterProfileDto>(`characters/profile/${server}/${name}`);
  }

  async getCharacterProfiles(): Promise<CharacterSummaryDto[]> {
    return this.transport.get<CharacterSummaryDto[]>('characters');
  }

  async saveCharacter(character: CharacterProfileDto): Promise<void> {
    await this.transport.authPut<void>('characters/profile', character);
  }

  async addAccountCharacter(request: AddCharacterRequestDto): Promise<SessionCharacterDto> {
    return this.transport.authPost<SessionCharacterDto>('characters', request);
  }

  async refreshCharacter(request: IdWrapper): Promise<CharacterRefreshResultDto> {
    return this.transport.authPost<CharacterRefreshResultDto>('characters/refresh', request);
  }

  async getCharacterContent(id: number): Promise<CharacterContentDto> {
    return this.transport.get<CharacterContentDto>(`characters/${id}/content`);
  }

  // Stories
  async getStories(params: { characterId?: number }): Promise<StorySummaryDto[]> {
    return this.transport.get<StorySummaryDto[]>('stories', params);
  }

  async getStory(id: number): Promise<StoryDto> {
    return this.transport.tokenGet<StoryDto>(`stories/${id}`);
  }

  async createStory(story: StoryDto): Promise<IdWrapper> {
    return this.transport.authPost<IdWrapper>('stories', story);
  }

  async editStory(story: StoryDto): Promise<void> {
    return this.transport.authPut<void>(`stories/${story.id || -1}`, story);
  }

  // Images
  async getImage(id: number): Promise<ImageDto> {
    return this.transport.tokenGet<ImageDto>(`images/${id}`);
  }

  async getImages(filter: ImagesFilterDto): Promise<ImageSummaryDto[]> {
    return this.transport.tokenGet<ImageSummaryDto[]>('images', filter as { [ k: string ] : string|number });
  }

  async getMyImages(characterId: number): Promise<ImageDto[]> {
    return this.transport.authGet<ImageDto[]>(`characters/${characterId}/my-images`);
  }

  async uploadImage(request: ImageUploadRequestDto, file: Blob, filename: string): Promise<ImageSummaryDto> {
    const formData = new FormData();
    formData.append('file', file, filename);

    const requestMap = request as unknown as {[k: string] : string|number};
    Object.keys(requestMap).forEach(key => formData.append(key, `${requestMap[key]}`));
    
    return this.transport.authPost<ImageSummaryDto>('images', formData);
  }

  async deleteImage(id: number): Promise<void> {
    await this.transport.authDelete<void>(`images/${id}`);
  }

  async saveImage(id: number, details: ImageDescriptionDto): Promise<void> {
    await this.transport.authPut<void>(`images/${id}`, details);
  }
}
