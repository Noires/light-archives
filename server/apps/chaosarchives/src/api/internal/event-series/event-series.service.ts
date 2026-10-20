import { UserInfo } from '@app/auth/model/user-info';
import { EventSeries, Venue } from '@app/entity';
import { EventOccurrenceDto, EventSeriesDto } from '@app/shared/dto/events/event-series.dto';
import { EventSeriesRule } from '@app/shared/enums/event-series-rule.enum';
import {
  computeNextOccurrences,
  EventSeriesSpec,
  formatEventSeriesLabel,
  validateEventSeriesSpec,
} from '@app/shared/event-series';
import SharedConstants from '@app/shared/SharedConstants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Connection, In, Repository } from 'typeorm';
import { getVerifiedCharacter } from '../../../common/api-checks';

export const MAX_SERIES_OCCURRENCES = 12;

export function toEventSeriesSpec(series: EventSeries): EventSeriesSpec {
  return {
    rule: series.rule,
    weekday: series.weekday,
    nth: series.nth,
    startTime: series.startTime,
    endTime: series.endTime,
    endDurationDays: series.endDurationDays,
    anchorDate: series.anchorDate,
  };
}

@Injectable()
export class EventSeriesService {
  constructor(
    private readonly connection: Connection,
    @InjectRepository(EventSeries) private readonly seriesRepo: Repository<EventSeries>,
  ) {}

  async getSeries(id: number, user?: UserInfo): Promise<EventSeriesDto> {
    return this.toDto(await this.findSeries(id), user, 3);
  }

  async getNextOccurrences(id: number, count: number): Promise<EventOccurrenceDto[]> {
    const series = await this.findSeries(id);

    if (!series.active) {
      return [];
    }

    return computeNextOccurrences(
      toEventSeriesSpec(series),
      Date.now(),
      Math.max(1, Math.min(MAX_SERIES_OCCURRENCES, count || 3)),
      SharedConstants.FFXIV_SERVER_TIMEZONE,
    );
  }

  async getMySeries(user: UserInfo): Promise<EventSeriesDto[]> {
    const characterIds = user.characters.map((character) => character.id);

    if (characterIds.length === 0) {
      return [];
    }

    const series = await this.seriesRepo.find({
      where: { owner: { id: In(characterIds) } },
      relations: ['owner', 'owner.server', 'venue'],
      order: { title: 'ASC' },
    });

    return series.map((s) => this.toDto(s, user, 0));
  }

  async createSeries(dto: EventSeriesDto, user: UserInfo): Promise<EventSeriesDto> {
    if (!dto.characterId) {
      throw new BadRequestException('characterId is required');
    }

    const series = await this.connection.transaction(async (em) => {
      const character = await getVerifiedCharacter(em, dto.characterId!, user);
      const entity = new EventSeries();
      entity.owner = character;
      await this.apply(em.getRepository(Venue), entity, dto);
      return em.getRepository(EventSeries).save(entity);
    });

    return this.getSeries(series.id, user);
  }

  async updateSeries(id: number, dto: EventSeriesDto, user: UserInfo): Promise<EventSeriesDto> {
    await this.connection.transaction(async (em) => {
      const series = await em.getRepository(EventSeries).findOne({
        where: { id, owner: { user: { id: user.id } } },
        relations: ['owner', 'owner.user', 'venue'],
      });

      if (!series) {
        throw new NotFoundException('Event series not found');
      }

      await this.apply(em.getRepository(Venue), series, dto);
      await em.getRepository(EventSeries).save(series);
    });

    return this.getSeries(id, user);
  }

  private async findSeries(id: number): Promise<EventSeries> {
    const series = await this.seriesRepo.findOne({
      where: { id },
      relations: ['owner', 'owner.server', 'owner.user', 'venue'],
    });

    if (!series) {
      throw new NotFoundException('Event series not found');
    }

    return series;
  }

  private async apply(venueRepo: Repository<Venue>, series: EventSeries, dto: EventSeriesDto): Promise<void> {
    const spec: EventSeriesSpec = {
      rule: dto.rule,
      weekday: dto.weekday,
      nth: dto.rule === EventSeriesRule.MONTHLY_NTH ? (dto.nth ?? null) : null,
      startTime: dto.startTime,
      endTime: dto.endTime || null,
      endDurationDays: dto.endTime ? (dto.endDurationDays ?? null) : null,
      anchorDate: dto.anchorDate || null,
    };
    const error = validateEventSeriesSpec(spec);

    if (error) {
      throw new BadRequestException(error);
    }

    if (spec.rule === EventSeriesRule.BIWEEKLY && !spec.anchorDate) {
      // Fix the parity at the first upcoming occurrence
      const first = computeNextOccurrences(spec, Date.now(), 1, SharedConstants.FFXIV_SERVER_TIMEZONE)[0];
      spec.anchorDate = first
        ? DateTime.fromMillis(first.startDateTime, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }).toISODate()
        : null;
    }

    series.title = dto.title.trim();
    series.rule = spec.rule as EventSeriesRule;
    series.weekday = spec.weekday;
    series.nth = spec.nth ?? null;
    series.startTime = spec.startTime;
    series.endTime = spec.endTime ?? null;
    series.endDurationDays = spec.endDurationDays ?? null;
    series.anchorDate = spec.anchorDate ?? null;
    series.active = dto.active ?? series.active ?? true;

    if (dto.venueId !== undefined) {
      if (dto.venueId === null) {
        series.venue = null;
      } else {
        const venue = await venueRepo.findOne({ where: { id: dto.venueId } });

        if (!venue) {
          throw new BadRequestException(`Venue ${dto.venueId} not found`);
        }

        series.venue = venue;
      }
    }
  }

  private toDto(series: EventSeries, user: UserInfo | undefined, occurrenceCount: number): EventSeriesDto {
    const spec = toEventSeriesSpec(series);

    return new EventSeriesDto({
      id: series.id,
      characterId: series.owner?.id,
      title: series.title,
      rule: series.rule,
      weekday: series.weekday,
      nth: series.nth,
      startTime: series.startTime,
      endTime: series.endTime,
      endDurationDays: series.endDurationDays,
      anchorDate: series.anchorDate,
      venueId: series.venue?.id ?? null,
      venueName: series.venue?.name ?? null,
      active: series.active,
      label: formatEventSeriesLabel(spec),
      owner: series.owner?.name,
      ownerServer: series.owner?.server?.name,
      mine: !!user && !!series.owner && user.characters.some((character) => character.id === series.owner.id),
      nextOccurrences: occurrenceCount > 0 && series.active
        ? computeNextOccurrences(spec, Date.now(), occurrenceCount, SharedConstants.FFXIV_SERVER_TIMEZONE)
        : [],
    });
  }
}
