import { UserInfo } from '@app/auth/model/user-info';
import { Bookmark, Character, Event, Story, Venue } from '@app/entity';
import { BookmarkDto, BookmarkStatusDto, BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { isQueryFailedError } from '../../../common/db';
import { StorageService } from '../images/storage.service';
import {
  BookmarkTargetInfo,
  characterInfo,
  CharacterRow,
  eventInfo,
  EventRow,
  groupTargetIds,
  infoKey,
  storyInfo,
  StoryRow,
  toBookmarkDto,
  venueInfo,
  VenueRow,
} from './bookmark-mapping';

const MAX_BOOKMARKS = 500;

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark) private readonly bookmarkRepo: Repository<Bookmark>,
    @InjectRepository(Venue) private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Character) private readonly characterRepo: Repository<Character>,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(Story) private readonly storyRepo: Repository<Story>,
    private readonly storageService: StorageService,
  ) {}

  async add(targetType: BookmarkTargetType, targetId: number, user: UserInfo): Promise<BookmarkStatusDto> {
    await this.assertTargetExists(targetType, targetId);
    const existing = await this.bookmarkRepo.exists({ where: { user: { id: user.id }, targetType, targetId } });

    if (!existing) {
      try {
        await this.bookmarkRepo.save(this.bookmarkRepo.create({ user: { id: user.id }, targetType, targetId }));
      } catch (e) {
        // Concurrent double click: the unique constraint already holds the bookmark
        if (!(isQueryFailedError(e) && e.code === 'ER_DUP_ENTRY')) {
          throw e;
        }
      }
    }

    return { bookmarked: true };
  }

  async remove(targetType: BookmarkTargetType, targetId: number, user: UserInfo): Promise<void> {
    await this.bookmarkRepo.delete({ user: { id: user.id }, targetType, targetId });
  }

  async getStatus(targetType: BookmarkTargetType, targetId: number, user: UserInfo): Promise<BookmarkStatusDto> {
    return { bookmarked: await this.bookmarkRepo.exists({ where: { user: { id: user.id }, targetType, targetId } }) };
  }

  /** The user's bookmarks, newest first, enriched with one batched lookup per target type. */
  async getMine(user: UserInfo): Promise<BookmarkDto[]> {
    const bookmarks = await this.bookmarkRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: MAX_BOOKMARKS,
    });
    const infos = new Map<string, BookmarkTargetInfo | null>();
    const imageUrl = (path: string) => this.storageService.getUrl(path);

    await Promise.all([...groupTargetIds(bookmarks).entries()].map(async ([targetType, ids]) => {
      if (targetType === 'venue') {
        (await this.lookupVenues(ids)).forEach((row) => infos.set(infoKey('venue', Number(row.id)), venueInfo(row, imageUrl)));
      } else if (targetType === 'character') {
        (await this.lookupCharacters(ids)).forEach((row) => infos.set(infoKey('character', Number(row.id)), characterInfo(row)));
      } else if (targetType === 'event') {
        (await this.lookupEvents(ids)).forEach((row) => infos.set(infoKey('event', Number(row.id)), eventInfo(row, imageUrl)));
      } else if (targetType === 'story') {
        (await this.lookupStories(ids)).forEach((row) => infos.set(infoKey('story', Number(row.id)), storyInfo(row)));
      }
    }));

    return bookmarks.map((bookmark) => toBookmarkDto(bookmark, infos.get(infoKey(bookmark.targetType, bookmark.targetId))));
  }

  /** Ids of the user's bookmarked events (for the calendar feed). */
  async getBookmarkedEventIds(userId: number): Promise<number[]> {
    const rows = await this.bookmarkRepo.find({
      where: { user: { id: userId }, targetType: 'event' },
      select: ['id', 'targetId'],
      take: MAX_BOOKMARKS,
    });
    return rows.map((row) => row.targetId);
  }

  private lookupVenues(ids: number[]): Promise<VenueRow[]> {
    return this.venueRepo
      .createQueryBuilder('venue')
      .leftJoin('venue.server', 'server')
      .leftJoin('venue.banner', 'banner')
      .leftJoin('banner.owner', 'bannerOwner')
      .select('venue.id', 'id')
      .addSelect('venue.name', 'name')
      .addSelect('server.name', 'serverName')
      .addSelect('bannerOwner.id', 'imageOwnerId')
      .addSelect('banner.hash', 'imageHash')
      .addSelect('banner.filename', 'imageFilename')
      .where('venue.id IN (:...ids)', { ids })
      .getRawMany();
  }

  private lookupCharacters(ids: number[]): Promise<CharacterRow[]> {
    return this.characterRepo
      .createQueryBuilder('character')
      .leftJoin('character.server', 'server')
      .select('character.id', 'id')
      .addSelect('character.name', 'name')
      .addSelect('server.name', 'serverName')
      .addSelect('character.avatar', 'avatar')
      .addSelect('character.showAvatar', 'showAvatar')
      .where('character.id IN (:...ids)', { ids })
      .andWhere('character.verifiedAt IS NOT NULL')
      .getRawMany();
  }

  private lookupEvents(ids: number[]): Promise<EventRow[]> {
    return this.eventRepo
      .createQueryBuilder('event')
      .leftJoin('event.banner', 'banner')
      .leftJoin('banner.owner', 'bannerOwner')
      .select('event.id', 'id')
      .addSelect('event.title', 'title')
      .addSelect('event.startDateTime', 'startDateTime')
      .addSelect('event.hidden', 'hidden')
      .addSelect('bannerOwner.id', 'imageOwnerId')
      .addSelect('banner.hash', 'imageHash')
      .addSelect('banner.filename', 'imageFilename')
      .where('event.id IN (:...ids)', { ids })
      .getRawMany();
  }

  private lookupStories(ids: number[]): Promise<StoryRow[]> {
    return this.storyRepo
      .createQueryBuilder('story')
      .leftJoin('story.owner', 'owner')
      .select('story.id', 'id')
      .addSelect('story.title', 'title')
      .addSelect('story.published', 'published')
      .addSelect('owner.name', 'authorName')
      .where('story.id IN (:...ids)', { ids })
      .getRawMany();
  }

  private async assertTargetExists(targetType: BookmarkTargetType, targetId: number): Promise<void> {
    let exists = false;

    if (targetType === 'venue') {
      exists = await this.venueRepo.exists({ where: { id: targetId } });
    } else if (targetType === 'character') {
      exists = await this.characterRepo.exists({ where: { id: targetId, verifiedAt: Not(IsNull()) } });
    } else if (targetType === 'event') {
      exists = await this.eventRepo.exists({ where: { id: targetId, hidden: false } });
    } else if (targetType === 'story') {
      exists = await this.storyRepo.exists({ where: { id: targetId, published: true } });
    }

    if (!exists) {
      throw new NotFoundException('Bookmark target not found');
    }
  }
}
