import { BookmarkDto, BookmarkStatusDto, BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import APITransport from './api-transport';

/** ER2 social: bookmarks ("Merkliste") of venues, characters, events and stories. Not yet available on older API versions. */
export default class BookmarksAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('bookmarks');
  }

  async addBookmark(targetType: BookmarkTargetType, targetId: number): Promise<BookmarkStatusDto> {
    return this.transport.authPut<BookmarkStatusDto>('', { targetType, targetId });
  }

  async removeBookmark(targetType: BookmarkTargetType, targetId: number): Promise<void> {
    return this.transport.authDelete<void>(`${targetType}/${targetId}`);
  }

  /** Newest first, each with title, subtitle, link and image (null when no longer available). */
  async getMyBookmarks(): Promise<BookmarkDto[]> {
    return this.transport.authGet<BookmarkDto[]>('');
  }

  async getBookmarkStatus(targetType: BookmarkTargetType, targetId: number): Promise<BookmarkStatusDto> {
    return this.transport.authGet<BookmarkStatusDto>('status', { targetType, targetId });
  }
}
