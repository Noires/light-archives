import { Character, Community, Event, FreeCompany, Image, NoticeboardItem, Story, Venue } from '@app/entity';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { ChangesFilterDto } from '@app/shared/dto/changes/changes-filter.dto';
import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class ChangesService {
  private readonly DEFAULT_LIMIT = 40;

  private readonly MAX_LIMIT = 200;

  private readonly MAX_FETCH_PER_ENTITY = 500;

  private readonly MIN_UPDATED_DELTA_MS = 1000;

  constructor(
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(Community)
    private readonly communityRepo: Repository<Community>,
    @InjectRepository(FreeCompany)
    private readonly freeCompanyRepo: Repository<FreeCompany>,
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(NoticeboardItem)
    private readonly noticeboardRepo: Repository<NoticeboardItem>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
  ) {}

  async getChanges(filter: ChangesFilterDto): Promise<PagingResultDto<ChangeItemDto>> {
    const offset = Math.max(0, filter.offset || 0);
    const limit = this.normalizeLimit(filter.limit);
    const fetchLimit = Math.min(this.MAX_FETCH_PER_ENTITY, Math.max(offset + limit, limit) * 4);

    const [
      profiles,
      venues,
      communities,
      freeCompanies,
      stories,
      noticeboardItems,
      events,
      media,
    ] = await Promise.all([
      this.fetchProfiles(filter.area, fetchLimit),
      this.fetchVenues(filter.area, fetchLimit),
      this.fetchCommunities(filter.area, fetchLimit),
      this.fetchFreeCompanies(filter.area, fetchLimit),
      this.fetchStories(filter.area, fetchLimit),
      this.fetchNoticeboardItems(filter.area, fetchLimit),
      this.fetchEvents(filter.area, fetchLimit),
      this.fetchMedia(filter.area, fetchLimit),
    ]);

    let changes: ChangeItemDto[] = [
      ...profiles.flatMap(profile => this.toProfileChanges(profile)),
      ...venues.flatMap(venue => this.toVenueChanges(venue)),
      ...communities.flatMap(community => this.toCommunityChanges(community)),
      ...freeCompanies.flatMap(company => this.toFreeCompanyChanges(company)),
      ...stories.flatMap(story => this.toStoryChanges(story)),
      ...noticeboardItems.flatMap(item => this.toNoticeboardChanges(item)),
      ...events.flatMap(event => this.toEventChanges(event)),
      ...media.flatMap(image => this.toMediaChanges(image)),
    ];

    changes = this.applyFilters(changes, filter);
    changes.sort((a, b) => b.happenedAt - a.happenedAt);

    return {
      total: changes.length,
      data: changes.slice(offset, offset + limit),
    };
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || limit < 1) {
      return this.DEFAULT_LIMIT;
    }

    return Math.min(limit, this.MAX_LIMIT);
  }

  private includeArea(filterArea: ChangeArea | undefined, area: ChangeArea): boolean {
    return !filterArea || filterArea === area;
  }

  private async fetchProfiles(area: ChangeArea | undefined, limit: number): Promise<Character[]> {
    if (!this.includeArea(area, ChangeArea.PROFILE)) {
      return [];
    }

    return this.characterRepo.find({
      where: {
        active: true,
      },
      relations: ['server'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchVenues(area: ChangeArea | undefined, limit: number): Promise<Venue[]> {
    if (!this.includeArea(area, ChangeArea.VENUE)) {
      return [];
    }

    return this.venueRepo.find({
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchCommunities(area: ChangeArea | undefined, limit: number): Promise<Community[]> {
    if (!this.includeArea(area, ChangeArea.COMMUNITY)) {
      return [];
    }

    return this.communityRepo.find({
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchFreeCompanies(area: ChangeArea | undefined, limit: number): Promise<FreeCompany[]> {
    if (!this.includeArea(area, ChangeArea.FREE_COMPANY)) {
      return [];
    }

    return this.freeCompanyRepo.find({
      relations: ['leader', 'server'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchStories(area: ChangeArea | undefined, limit: number): Promise<Story[]> {
    if (!this.includeArea(area, ChangeArea.STORY)) {
      return [];
    }

    return this.storyRepo.find({
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchNoticeboardItems(area: ChangeArea | undefined, limit: number): Promise<NoticeboardItem[]> {
    if (!this.includeArea(area, ChangeArea.NOTICEBOARD)) {
      return [];
    }

    return this.noticeboardRepo.find({
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchEvents(area: ChangeArea | undefined, limit: number): Promise<Event[]> {
    if (!this.includeArea(area, ChangeArea.EVENT)) {
      return [];
    }

    return this.eventRepo.find({
      where: {
        hidden: false,
      },
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private async fetchMedia(area: ChangeArea | undefined, limit: number): Promise<Image[]> {
    if (!this.includeArea(area, ChangeArea.MEDIA)) {
      return [];
    }

    return this.imageRepo.find({
      where: {
        category: In([ImageCategory.ARTWORK, ImageCategory.SCREENSHOT]),
      },
      relations: ['owner'],
      order: {
        updatedAt: 'DESC',
      },
      take: limit,
    });
  }

  private toProfileChanges(profile: Character): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.PROFILE,
      profile.id,
      profile.name,
      'Profil',
      profile.name,
      this.profileLink(profile),
      profile.createdAt,
      profile.updatedAt,
    );
  }

  private toVenueChanges(venue: Venue): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.VENUE,
      venue.id,
      venue.name,
      'Treffpunkt',
      venue.owner?.name || '',
      `/venue/${venue.id}`,
      venue.createdAt,
      venue.updatedAt,
    );
  }

  private toCommunityChanges(community: Community): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.COMMUNITY,
      community.id,
      community.name,
      'Community',
      community.owner?.name || '',
      `/community/${encodeURIComponent(community.name)}`,
      community.createdAt,
      community.updatedAt,
    );
  }

  private toFreeCompanyChanges(company: FreeCompany): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.FREE_COMPANY,
      company.id,
      company.name,
      'Freie Gesellschaft',
      company.leader?.name || '',
      this.freeCompanyLink(company),
      company.createdAt,
      company.updatedAt,
    );
  }

  private toStoryChanges(story: Story): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.STORY,
      story.id,
      story.title,
      'Geschichte',
      story.owner?.name || '',
      `/story/${story.id}`,
      story.createdAt,
      story.updatedAt,
    );
  }

  private toNoticeboardChanges(item: NoticeboardItem): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.NOTICEBOARD,
      item.id,
      item.title,
      'Anschlag',
      item.owner?.name || '',
      `/noticeboard/${item.id}`,
      item.createdAt,
      item.updatedAt,
    );
  }

  private toEventChanges(event: Event): ChangeItemDto[] {
    return this.toEntityChanges(
      ChangeArea.EVENT,
      event.id,
      event.title,
      'Event',
      event.owner?.name || '',
      `/event/${event.id}`,
      event.createdAt,
      event.updatedAt,
    );
  }

  private toMediaChanges(image: Image): ChangeItemDto[] {
    const label = image.category === ImageCategory.ARTWORK ? 'Kunstwerk' : 'Screenshot';
    const title = image.title?.trim() || `Bild #${image.id}`;

    return this.toEntityChanges(
      ChangeArea.MEDIA,
      image.id,
      title,
      label,
      image.owner?.name || '',
      `/image/${image.id}`,
      image.createdAt,
      image.updatedAt,
    );
  }

  private toEntityChanges(
    area: ChangeArea,
    entityId: number,
    title: string,
    entityLabel: string,
    author: string,
    link: string,
    createdAt: Date,
    updatedAt: Date,
  ): ChangeItemDto[] {
    const createdAtMs = createdAt.getTime();
    const updatedAtMs = updatedAt.getTime();
    const items: ChangeItemDto[] = [{
      id: `${area}-${entityId}-${ChangeType.CREATED}`,
      entityId,
      area,
      type: ChangeType.CREATED,
      title,
      summary: `${entityLabel} erstellt`,
      author,
      link,
      happenedAt: createdAtMs,
      createdAt: createdAtMs,
      updatedAt: updatedAtMs,
    }];

    if (updatedAtMs - createdAtMs > this.MIN_UPDATED_DELTA_MS) {
      items.push({
        id: `${area}-${entityId}-${ChangeType.UPDATED}`,
        entityId,
        area,
        type: ChangeType.UPDATED,
        title,
        summary: `${entityLabel} aktualisiert`,
        author,
        link,
        happenedAt: updatedAtMs,
        createdAt: createdAtMs,
        updatedAt: updatedAtMs,
      });
    }

    return items;
  }

  private profileLink(profile: Character): string {
    const server = profile.server?.name || '';
    const characterName = profile.name.replace(/ /g, '_');
    return `/${encodeURIComponent(server)}/${encodeURIComponent(characterName)}`;
  }

  private freeCompanyLink(company: FreeCompany): string {
    const server = company.server?.name || '';
    const freeCompanyName = company.name.replace(/ /g, '_');
    return `/fc/${encodeURIComponent(server)}/${encodeURIComponent(freeCompanyName)}`;
  }

  private applyFilters(items: ChangeItemDto[], filter: ChangesFilterDto): ChangeItemDto[] {
    const searchQuery = (filter.searchQuery || '').trim().toLowerCase();
    const author = (filter.author || '').trim().toLowerCase();
    const now = Date.now();
    const periodCutoff = filter.periodDays && filter.periodDays > 0
      ? now - (filter.periodDays * 24 * 60 * 60 * 1000)
      : null;
    const sinceCutoff = filter.since && filter.since > 0 ? filter.since : null;
    const cutoff = Math.max(periodCutoff || 0, sinceCutoff || 0);

    return items.filter((item) => {
      if (filter.type && item.type !== filter.type) {
        return false;
      }

      if (filter.area && item.area !== filter.area) {
        return false;
      }

      if (cutoff > 0 && item.happenedAt < cutoff) {
        return false;
      }

      if (author && !item.author.toLowerCase().includes(author)) {
        return false;
      }

      if (searchQuery) {
        const haystack = `${item.title} ${item.summary} ${item.author}`.toLowerCase();
        return haystack.includes(searchQuery);
      }

      return true;
    });
  }
}
