import { Venue, VenueOpeningException, VenueOpeningHours } from '@app/entity';
import {
  VenueOpeningExceptionDto,
  VenueOpeningHoursDto,
  VenueOpeningHoursSlotDto,
  VenueOpeningStatusDto,
} from '@app/shared/dto/venues/venue-opening-hours.dto';
import { computeOpeningStatus, deriveOpeningHoursFromTemplate, OpeningHoursSlot } from '@app/shared/opening-hours';
import SharedConstants from '@app/shared/SharedConstants';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Connection, In, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class VenueOpeningHoursService {
  constructor(
    private readonly connection: Connection,
    @InjectRepository(VenueOpeningHours) private readonly hoursRepo: Repository<VenueOpeningHours>,
    @InjectRepository(VenueOpeningException) private readonly exceptionRepo: Repository<VenueOpeningException>,
  ) {}

  private today(): string {
    return DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).toISODate() || '';
  }

  async getOpeningHours(venueId: number): Promise<VenueOpeningHoursDto> {
    const [hours, exceptions] = await Promise.all([
      this.hoursRepo.find({
        where: { venue: { id: venueId } },
        order: { weekday: 'ASC', openTime: 'ASC' },
      }),
      this.exceptionRepo.find({
        where: { venue: { id: venueId }, date: MoreThanOrEqual(this.today()) },
        order: { date: 'ASC' },
      }),
    ]);

    return new VenueOpeningHoursDto({
      hours: hours.map((slot) => this.toSlotDto(slot)),
      exceptions: exceptions.map((e) => new VenueOpeningExceptionDto({ date: e.date, closed: e.closed, note: e.note })),
    });
  }

  /** Replaces all opening hours and exceptions of a venue. Caller must check edit rights. */
  async saveOpeningHours(venueId: number, dto: VenueOpeningHoursDto): Promise<VenueOpeningHoursDto> {
    const dates = new Set<string>();

    for (const exception of dto.exceptions) {
      if (!DateTime.fromISO(exception.date).isValid) {
        throw new BadRequestException(`Invalid date: ${exception.date}`);
      }

      if (dates.has(exception.date)) {
        throw new BadRequestException(`Duplicate exception date: ${exception.date}`);
      }

      dates.add(exception.date);
    }

    await this.connection.transaction(async (em) => {
      const venue = await em.getRepository(Venue).findOne({ where: { id: venueId } });

      if (!venue) {
        throw new NotFoundException('Venue not found');
      }

      await em.getRepository(VenueOpeningHours).delete({ venue: { id: venueId } });
      await em.getRepository(VenueOpeningException).delete({ venue: { id: venueId } });

      await em.getRepository(VenueOpeningHours).save(dto.hours.map((slot) => {
        const entity = new VenueOpeningHours();
        entity.venue = venue;
        entity.weekday = slot.weekday;
        entity.openTime = slot.openTime;
        entity.closeTime = slot.closeTime;
        entity.overnight = slot.overnight ?? slot.closeTime <= slot.openTime;
        return entity;
      }));

      await em.getRepository(VenueOpeningException).save(dto.exceptions.map((exception) => {
        const entity = new VenueOpeningException();
        entity.venue = venue;
        entity.date = exception.date;
        entity.closed = exception.closed;
        entity.note = (exception.note || '').trim().slice(0, 200);
        return entity;
      }));
    });

    return this.getOpeningHours(venueId);
  }

  /** Computes opening status for several venues with two queries. */
  async getOpeningStatuses(venues: Venue[]): Promise<Map<number, VenueOpeningStatusDto>> {
    const result = new Map<number, VenueOpeningStatusDto>();
    const venueIds = venues.map((venue) => venue.id);

    if (venueIds.length === 0) {
      return result;
    }

    const [hours, exceptions] = await Promise.all([
      this.hoursRepo.find({
        where: { venue: { id: In(venueIds) } },
        relations: ['venue'],
        order: { weekday: 'ASC', openTime: 'ASC' },
      }),
      this.exceptionRepo.find({
        where: {
          venue: { id: In(venueIds) },
          // include yesterday for overnight slots
          date: MoreThanOrEqual(
            DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).minus({ days: 1 }).toISODate() || '',
          ),
        },
        relations: ['venue'],
      }),
    ]);
    const now = Date.now();

    for (const venue of venues) {
      const venueHours = hours.filter((slot) => slot.venue.id === venue.id);
      const venueExceptions = exceptions.filter((e) => e.venue.id === venue.id);
      const derived = venueHours.length === 0;
      const slots: OpeningHoursSlot[] = derived
        ? deriveOpeningHoursFromTemplate(venue)
        : venueHours.map((slot) => this.toSlotDto(slot));
      const status = computeOpeningStatus(
        slots,
        venueExceptions.map((e) => ({ date: e.date, closed: e.closed, note: e.note })),
        now,
        SharedConstants.FFXIV_SERVER_TIMEZONE,
      );

      result.set(venue.id, {
        ...status,
        openingHours: slots.map((slot) => new VenueOpeningHoursSlotDto({ ...slot, overnight: !!slot.overnight })),
        openingHoursDerived: derived && slots.length > 0,
      });
    }

    return result;
  }

  private toSlotDto(slot: VenueOpeningHours): VenueOpeningHoursSlotDto {
    return new VenueOpeningHoursSlotDto({
      weekday: slot.weekday,
      openTime: slot.openTime,
      closeTime: slot.closeTime,
      overnight: slot.overnight,
    });
  }
}
