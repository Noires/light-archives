import { UserInfo } from '@app/auth/model/user-info';
import { Character, ContentNote, Image, Server, Venue, VenueMembership, VenueOffering, VenueOfferingCategory } from '@app/entity';
import { VenueTag } from '@app/entity/venue-tag.entity';
import { CharacterIdWrapper } from '@app/shared/dto/common/character-id-wrapper.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueMemberFlagsDto } from '@app/shared/dto/venues/venue-member-flags.dto';
import { VenueOfferingCategoryDto, VenueOfferingDto, VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueStaffMemberDto } from '@app/shared/dto/venues/venue-staff-member.dto';
import { EventIconDto } from '@app/shared/dto/events/event-icon.dto';
import { EventLinkDto } from '@app/shared/dto/events/event-link.dto';
import { EventType } from '@app/shared/enums/event-type.enum';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { ImageFormat } from '@app/shared/enums/image-format.enum';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import html from '@app/shared/html';
import SharedConstants from '@app/shared/SharedConstants';
import { isValidUrl } from '@app/shared/validation/validators';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { DateTime } from 'luxon';
import sharp from 'sharp';
import { Connection, EntityManager, FindOneOptions, IsNull, Not, Repository } from 'typeorm';
import { assertUserCharacterId, checkCarrdProfile, getVerifiedCharacter } from '../../../common/api-checks';
import { Contains } from '../../../common/db';
import { getBannerAspectRatioErrorMessage } from '../../../common/image-requirements';
import { ImagesService } from '../images/images.service';
import { StorageService } from '../images/storage.service';
import { hashFile } from '@app/security';

const HOUSING_AREA_LABELS: Record<HousingArea, string> = {
  [HousingArea.MIST]: 'Dorf des Nebels',
  [HousingArea.LAVENDER_BEDS]: 'Lavendelbeete',
  [HousingArea.GOBLET]: 'Kelchkuppe',
  [HousingArea.SHIROGANE]: 'Shirogane',
  [HousingArea.EMPYREUM]: 'Empyreum',
};

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue) private venueRepo: Repository<Venue>,
    @InjectRepository(VenueMembership) private venueMembershipRepo: Repository<VenueMembership>,
    @InjectRepository(VenueOfferingCategory) private offeringCategoryRepo: Repository<VenueOfferingCategory>,
    @InjectRepository(VenueOffering) private offeringRepo: Repository<VenueOffering>,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
    private connection: Connection,
    private imagesService: ImagesService,
    private storageService: StorageService,
  ) {}

	async getVenues(filter: { characterId?: number, limit?: number }): Promise<VenueSummaryDto[]> {
		const myVenues = await this.venueRepo.find({
			where: filter.characterId ? { owner: { id: filter.characterId } } : undefined,
			order: { 'createdAt': 'DESC' },
			relations: [ 'owner', 'server' ],
			take: filter.limit || undefined,
		});

		return myVenues.map(venue => this.toVenueSummaryDto(venue));
	}

  async getEditableVenues(user: UserInfo): Promise<VenueSummaryDto[]> {
    const characterIds = user.characters.map((character) => character.id);
    if (characterIds.length === 0) {
      return [];
    }

    const venues = await this.venueRepo
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.server', 'server')
      .leftJoinAndSelect('venue.owner', 'owner')
      .leftJoin(
        VenueMembership,
        'membership',
        'membership.venueId = venue.id AND membership.status = :status AND membership.canEdit = :canEdit',
        {
          status: MembershipStatus.CONFIRMED,
          canEdit: true,
        },
      )
      .where('owner.id IN (:...characterIds)', { characterIds })
      .orWhere('membership.characterId IN (:...characterIds)', { characterIds })
      .orderBy('venue.createdAt', 'DESC')
      .getMany();

    const uniqueVenues = new Map<number, Venue>();
    for (const venue of venues) {
      uniqueVenues.set(venue.id, venue);
    }

    return Array.from(uniqueVenues.values()).map((venue) => this.toVenueSummaryDto(venue));
  }

  async searchVenues(query: string, server?: string): Promise<VenueSummaryDto[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const where: { name: ReturnType<typeof Contains>; server?: { name: string } } = {
      name: Contains(trimmed),
    };

    if (server) {
      where.server = { name: server };
    }

    const venues = await this.venueRepo.find({
      where,
      order: { name: 'ASC' },
      relations: ['server'],
      take: 10,
    });

    return venues.map((venue) => this.toVenueSummaryDto(venue));
  }

	private toVenueSummaryDto(venue: Venue): VenueSummaryDto {
		return {
			id: venue.id,
			name: venue.name,
			server: venue.server.name,
			purpose: venue.purpose,
			housingArea: venue.housingArea,
			address: this.formatVenueSummaryAddress(venue),
		}
	}

  private formatVenueSummaryAddress(venue: Venue): string {
    if (venue.location === VenueLocation.OPEN_WORLD) {
      return venue.address;
    }

    const housingArea = venue.housingArea ? (HOUSING_AREA_LABELS[venue.housingArea] || '') : '';
    const ward = venue.ward !== null && venue.ward !== undefined ? `Bezirk ${venue.ward}` : '';

    const unit = venue.location === VenueLocation.HOUSE
      ? `Grundstück ${venue.plot ?? ''}`
      : `Wohnung ${venue.room ?? ''}`;

    const parts = [housingArea, ward, unit].filter((part) => part.length > 0);
    let address = parts.join(', ');

    if (venue.subdivision) {
      address += ' (Erweiterung)';
    }

    return address;
  }

  private normalizeEventType(eventType?: EventType | null): EventType {
    if (!eventType || this.isLegacyAdultType(eventType)) {
      return EventType.RP;
    }

    return eventType;
  }

  private isLegacyAdultType(eventType?: EventType | null): boolean {
    return eventType === EventType.ADULT;
  }

  private normalizeTemplateLinks(
    links: EventLinkDto[] | null | undefined,
    legacyLink?: string | null,
  ): EventLinkDto[] {
    const normalized = (links || [])
      .map((link) => ({
        url: (link?.url || '').trim(),
        label: (link?.label || '').trim(),
      }))
      .filter((link) => link.url.length > 0)
      .map((link) => new EventLinkDto({
        url: link.url,
        label: link.label || undefined,
      }));

    if (normalized.length === 0) {
      const url = (legacyLink || '').trim();
      if (url.length > 0) {
        return [new EventLinkDto({ url })];
      }
    }

    return normalized;
  }

  private normalizeRegistrationDeadlineDays(value: number | null | undefined): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    return Math.max(0, Math.floor(value));
  }

  private normalizeOptionalWeekday(value: number | null | undefined, fieldName: string): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    const normalized = Math.floor(value);
    if (normalized < 1 || normalized > 7) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return normalized;
  }

  private normalizeOptionalNonNegativeInteger(value: number | null | undefined, fieldName: string): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    const normalized = Math.floor(value);
    if (normalized < 0) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return normalized;
  }

  private normalizeOptionalTime(value: string | null | undefined, fieldName: string): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return normalized;
  }

  private toTimeStringFromDate(date: Date | null): string | null {
    if (!date) {
      return null;
    }

    return DateTime.fromJSDate(date, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    }).toFormat('HH:mm');
  }

  private toWeekdayFromDate(date: Date | null): number | null {
    if (!date) {
      return null;
    }

    return DateTime.fromJSDate(date, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    }).weekday;
  }

  private buildLegacyTemplateDateTime(weekday: number, time: string): Date {
    const [hour, minute] = time.split(':').map((part) => parseInt(part, 10));
    const baseWeekStart = DateTime.fromObject(
      { year: 2024, month: 1, day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 },
      { zone: SharedConstants.FFXIV_SERVER_TIMEZONE },
    );

    return baseWeekStart
      .plus({ days: weekday - 1 })
      .set({ hour, minute, second: 0, millisecond: 0 })
      .toJSDate();
  }

  private normalizeOptionalDateTime(value: number | null | undefined, fieldName: string): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (!Number.isFinite(value)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }

    return new Date(value);
  }

	async getVenueByName(name: string, server: string, characterId?: number, user?: UserInfo): Promise<VenueDto> {
		const venue = await this.venueRepo.findOne({
			where: {
				name,
				server: {
					name: server,
				},
			},
			relations: [
        'server',
        'owner',
        'owner.server',
        'banner',
        'banner.owner',
        'eventBanner',
        'eventBanner.owner',
        'eventDiscordBanner',
        'eventDiscordBanner.owner',
        'eventIcon',
        'eventIcon.owner',
        'tags',
        'eventContentNotes',
      ]
		});

		if (!venue) {
			throw new NotFoundException('Venue not found');
		}

		return this.toVenueDto(venue, characterId, user);
	}

	async getVenue(venueId: number, characterId?: number, user?: UserInfo): Promise<VenueDto> {
		const venue = await this.venueRepo.findOne({
			where: {
				id: venueId,
			},
			relations: [
        'server',
        'owner',
        'owner.server',
        'banner',
        'banner.owner',
        'eventBanner',
        'eventBanner.owner',
        'eventDiscordBanner',
        'eventDiscordBanner.owner',
        'eventIcon',
        'eventIcon.owner',
        'tags',
        'eventContentNotes',
      ]
		});

		if (!venue) {
			throw new NotFoundException('Venue not found');
		}

		return this.toVenueDto(venue, characterId, user);
	}

	private async toVenueDto(venue: Venue, characterId?: number, user?: UserInfo): Promise<VenueDto> {
		const banner = await venue.banner;
    const eventBanner = await venue.eventBanner;
    const eventDiscordBanner = await venue.eventDiscordBanner;
    const eventIcon = await venue.eventIcon;
    const userCharacterIds = user?.characters?.map((ch) => ch.id) || [];

    if (user && characterId && !userCharacterIds.includes(characterId)) {
      throw new ForbiddenException('Invalid character ID');
    }

    const isSelectedCharacterOwner = !!characterId && venue.owner.id === characterId;
    const membership = characterId ? await this.getMembership(this.venueMembershipRepo, venue.id, characterId) : null;
    const membershipStatus = membership
      ? membership.status
      : (isSelectedCharacterOwner ? MembershipStatus.CONFIRMED : null);
    const canEdit = isSelectedCharacterOwner || (!!membership && membership.status === MembershipStatus.CONFIRMED && membership.canEdit);
    const canManageMembers = isSelectedCharacterOwner
      || (!!membership && membership.status === MembershipStatus.CONFIRMED && membership.canManageMembers);
    const staff = venue.showStaff ? await this.getVisibleStaffMembers(venue.id, venue.owner) : [];
    const legacyStart = venue.eventStartDateTime || null;
    const legacyEnd = venue.eventEndDateTime || null;
    const eventStartWeekday = venue.eventStartWeekday ?? this.toWeekdayFromDate(legacyStart);
    const eventStartTime = venue.eventStartTime ?? this.toTimeStringFromDate(legacyStart);
    const eventEndTime = venue.eventEndTime ?? this.toTimeStringFromDate(legacyEnd);
    const eventEndDurationDays = venue.eventEndDurationDays
      ?? (legacyStart && legacyEnd
        ? Math.max(
            0,
            Math.floor(
              DateTime.fromJSDate(legacyEnd, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE })
                .diff(DateTime.fromJSDate(legacyStart, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }), 'days')
                .days,
            ),
          )
        : null);
    const eventRegistrationDeadlineTime = venue.eventRegistrationDeadlineTime || eventStartTime || null;

    if (eventIcon) {
      await this.imagesService.ensureIconThumb(eventIcon);
    }

		return {
			id: venue.id,
			mine: !!venue.owner && !!user && userCharacterIds.includes(venue.owner!.id),
      membershipStatus,
      canEdit,
      canManageMembers,
			foundedAt: venue.foundedAt,
			name: venue.name,
			server: venue.server.name,
			owner: venue.owner.name,
			ownerServer: venue.owner.server.name,
			description: venue.description,
			eventDescription: venue.eventDescription,
			eventOocDetails: venue.eventOocDetails,
			eventContact: venue.eventContact,
			eventLink: venue.eventLink,
      eventLinks: this.normalizeTemplateLinks(venue.eventLinks, venue.eventLink),
      eventTitle: venue.eventTitle,
      eventType: this.normalizeEventType(venue.eventType),
      eventAdultOnly: !!venue.eventAdultOnly,
      eventClosed: !!venue.eventClosed,
      eventRegistrationDeadlineDays: venue.eventRegistrationDeadlineDays,
      eventRegistrationDeadlineTime,
      eventStartDateTime: venue.eventStartDateTime ? venue.eventStartDateTime.getTime() : null,
      eventEndDateTime: venue.eventEndDateTime ? venue.eventEndDateTime.getTime() : null,
      eventStartWeekday,
      eventStartTime,
      eventEndTime,
      eventEndDurationDays,
      eventExtraInfo: venue.eventExtraInfo || '',
			purpose: venue.purpose,
			website: venue.website,
			status: venue.status,
			location: venue.location,
			address: venue.address,
			housingArea: venue.housingArea,
			ward: venue.ward,
			plot: venue.plot,
			room: venue.room,
			subdivision: venue.subdivision,
			carrdProfile: venue.carrdProfile,
			tags: venue.tags.map(tag => tag.name),
      eventContentNotes: venue.eventContentNotes?.map((note) => note.name) || [],
      showRules: venue.showRules,
      rules: venue.rules,
      showPremises: venue.showPremises,
      premises: venue.premises,
      showMenu: venue.showMenu,
      menu: venue.menu,
      showStaff: venue.showStaff,
      showJobs: venue.showJobs,
      showOoc: venue.showOoc,
      ooc: venue.ooc,
      showMedia: venue.showMedia,
      showEvents: venue.showEvents,
      showNetwork: venue.showNetwork,
      network: venue.network,
      staff,
      eventIcon: !eventIcon
        ? null
        : new EventIconDto({
            id: eventIcon.id,
            previewUrl: this.imagesService.getThumbUrl(eventIcon),
            url: this.imagesService.getUrl(eventIcon),
            thumbUrl: this.imagesService.getIconUrl(eventIcon),
            width: eventIcon.width,
            height: eventIcon.height,
          }),
      eventBanner: !eventBanner
        ? null
        : {
            id: eventBanner.id,
            url: this.imagesService.getUrl(eventBanner),
            width: eventBanner.width,
            height: eventBanner.height,
          },
      eventDiscordBanner: !eventDiscordBanner
        ? null
        : {
            id: eventDiscordBanner.id,
            url: this.imagesService.getUrl(eventDiscordBanner),
            width: eventDiscordBanner.width,
            height: eventDiscordBanner.height,
          },
			banner: !banner ? null : {
				id: banner.id,
				url: this.imagesService.getUrl(banner),
				width: banner.width,
				height: banner.height,
			}
		}
	}

  private async getVisibleStaffMembers(venueId: number, owner: Character): Promise<VenueStaffMemberDto[]> {
    const memberships = await this.venueMembershipRepo
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.character', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .where('membership.venueId = :venueId', { venueId })
      .andWhere('membership.status = :status', { status: MembershipStatus.CONFIRMED })
      .andWhere('membership.showInStaff = :showInStaff', { showInStaff: true })
      .orderBy('character.name', 'ASC')
      .select([
        'membership.id',
        'character.id',
        'character.name',
        'character.avatar',
        'server.id',
        'server.name',
      ])
      .getMany();

    const result = memberships.map((membership) => ({
      characterId: membership.character.id,
      name: membership.character.name,
      server: membership.character.server.name,
      avatar: membership.character.avatar,
    }));

    if (!result.some((member) => member.characterId === owner.id)) {
      result.unshift({
        characterId: owner.id,
        name: owner.name,
        server: owner.server.name,
        avatar: owner.avatar,
      });
    }

    return result;
  }

	async createVenue(venueDto: VenueDto, user: UserInfo): Promise<IdWrapper> {
		return this.connection.transaction(async em => {
			let character: Character;

			if (venueDto.characterId) {
				// New approach: use character ID
				character = await getVerifiedCharacter(em, venueDto.characterId, user);
			} else if (venueDto.owner && venueDto.ownerServer) {
				// Legacy approach: use name + server WITH VERIFICATION
				const foundCharacter = await em.getRepository(Character).findOne({
					where: {
						name: venueDto.owner,
						server: { name: venueDto.ownerServer },
						user: { id: user.id },
						verifiedAt: Not(IsNull()),
					},
					relations: ['server', 'user'],
				});

				if (!foundCharacter) {
					throw new BadRequestException('Invalid owner character or character not verified');
				}

				character = foundCharacter;
			} else {
				throw new BadRequestException('Either characterId or owner/ownerServer must be provided');
			}

			const venue = new Venue();
			venue.owner = character;
			venue.tags = [];
			await this.saveInternal(em, venue, venueDto, user);

      const membership = new VenueMembership();
      membership.character = character;
      membership.venue = venue;
      membership.status = MembershipStatus.CONFIRMED;
      membership.canEdit = true;
      membership.canManageMembers = true;
      membership.showInStaff = true;
      await em.getRepository(VenueMembership).save(membership);

			return { id: venue.id };
		});		
	}

	async editVenue(venueDto: VenueDto, user: UserInfo): Promise<void> {
    await this.assertEditRights(venueDto.id, user);

		await this.connection.transaction(async em => {
			const venue = await em.getRepository(Venue).findOne({
				where: {
					id: venueDto.id,
				},
				relations: [
          'owner',
          'banner',
          'banner.owner',
          'eventBanner',
          'eventBanner.owner',
          'eventDiscordBanner',
          'eventDiscordBanner.owner',
          'eventIcon',
          'eventIcon.owner',
          'tags',
        ]
			});

			if (!venue) {
				throw new NotFoundException('Venue not found');
			}

			await this.saveInternal(em, venue, venueDto, user);
		});		
	}

	/* eslint-disable no-param-reassign */
	private async saveInternal(em: EntityManager, venue: Venue, venueDto: VenueDto, user: UserInfo): Promise<void> {
		venue.name = venueDto.name;
		venue.description = html.sanitize(venueDto.description);
    venue.eventDescription = html.sanitize(venueDto.eventDescription || '');
    venue.eventOocDetails = html.sanitize(venueDto.eventOocDetails || '');
    venue.eventTitle = venueDto.eventTitle || '';
    venue.eventContact = venueDto.eventContact || '';
    const eventLinks = this.normalizeTemplateLinks(venueDto.eventLinks, venueDto.eventLink);
    for (const link of eventLinks) {
      if (!isValidUrl(link.url)) {
        throw new BadRequestException(`Invalid event template link: ${link.url}`);
      }
    }
    venue.eventLinks = eventLinks;
    venue.eventLink = eventLinks[0]?.url || '';
    const eventType = this.normalizeEventType(venueDto.eventType);
    venue.eventType = eventType;
    venue.eventAdultOnly = venueDto.eventAdultOnly ?? this.isLegacyAdultType(venueDto.eventType);
    venue.eventClosed = !!venueDto.eventClosed;
    venue.eventRegistrationDeadlineDays = venue.eventClosed
      ? this.normalizeRegistrationDeadlineDays(venueDto.eventRegistrationDeadlineDays)
      : null;
    venue.eventRegistrationDeadlineTime = venue.eventClosed
      ? this.normalizeOptionalTime(venueDto.eventRegistrationDeadlineTime, 'eventRegistrationDeadlineTime')
      : null;

    const normalizedStartWeekday = this.normalizeOptionalWeekday(venueDto.eventStartWeekday, 'eventStartWeekday');
    const normalizedStartTime = this.normalizeOptionalTime(venueDto.eventStartTime, 'eventStartTime');
    const normalizedEndTime = this.normalizeOptionalTime(venueDto.eventEndTime, 'eventEndTime');
    const normalizedEndDurationDays = this.normalizeOptionalNonNegativeInteger(
      venueDto.eventEndDurationDays,
      'eventEndDurationDays',
    );
    const legacyStartDateTime = this.normalizeOptionalDateTime(venueDto.eventStartDateTime, 'eventStartDateTime');
    const legacyEndDateTime = this.normalizeOptionalDateTime(venueDto.eventEndDateTime, 'eventEndDateTime');
    const effectiveStartWeekday = normalizedStartWeekday ?? this.toWeekdayFromDate(legacyStartDateTime);
    const effectiveStartTime = normalizedStartTime ?? this.toTimeStringFromDate(legacyStartDateTime);
    const effectiveEndTime = normalizedEndTime ?? this.toTimeStringFromDate(legacyEndDateTime);
    const effectiveEndDurationDays = normalizedEndDurationDays
      ?? (legacyStartDateTime && legacyEndDateTime
        ? Math.max(
            0,
            Math.floor(
              DateTime.fromJSDate(legacyEndDateTime, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE })
                .diff(DateTime.fromJSDate(legacyStartDateTime, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }), 'days')
                .days,
            ),
          )
        : null);

    if ((effectiveStartWeekday === null) !== (effectiveStartTime === null)) {
      throw new BadRequestException('eventStartWeekday and eventStartTime must be set together');
    }

    if ((effectiveEndTime === null) !== (effectiveEndDurationDays === null)) {
      throw new BadRequestException('eventEndTime and eventEndDurationDays must be set together');
    }

    if (effectiveEndTime !== null && (effectiveStartWeekday === null || effectiveStartTime === null)) {
      throw new BadRequestException('eventEndTime and eventEndDurationDays require eventStartWeekday and eventStartTime');
    }

    venue.eventStartWeekday = effectiveStartWeekday;
    venue.eventStartTime = effectiveStartTime;
    venue.eventEndTime = effectiveEndTime;
    venue.eventEndDurationDays = effectiveEndDurationDays;

    if (effectiveStartWeekday !== null && effectiveStartTime !== null) {
      const referenceStart = this.buildLegacyTemplateDateTime(effectiveStartWeekday, effectiveStartTime);
      venue.eventStartDateTime = referenceStart;

      if (effectiveEndTime !== null && effectiveEndDurationDays !== null) {
        const [endHour, endMinute] = effectiveEndTime.split(':').map((part) => parseInt(part, 10));
        venue.eventEndDateTime = DateTime.fromJSDate(referenceStart, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE })
          .plus({ days: effectiveEndDurationDays })
          .set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 })
          .toJSDate();
      } else {
        venue.eventEndDateTime = null;
      }
    } else {
      venue.eventStartDateTime = null;
      venue.eventEndDateTime = null;
    }

    venue.eventExtraInfo = html.sanitize((venueDto.eventExtraInfo || '').trim()).slice(0, 100);
		venue.website = venueDto.website; // TODO: Validate
		venue.purpose = venueDto.purpose;
		venue.status = venueDto.status;
		venue.rules = html.sanitize(venueDto.rules || '');
		venue.premises = html.sanitize(venueDto.premises || '');
		venue.menu = html.sanitize(venueDto.menu || '');
		venue.ooc = html.sanitize(venueDto.ooc || '');
		venue.network = html.sanitize(venueDto.network || '');
		venue.showRules = !!venueDto.showRules;
		venue.showPremises = !!venueDto.showPremises;
		venue.showMenu = !!venueDto.showMenu;
		venue.showStaff = !!venueDto.showStaff;
		venue.showJobs = !!venueDto.showJobs;
		venue.showOoc = !!venueDto.showOoc;
		venue.showMedia = !!venueDto.showMedia;
		venue.showEvents = !!venueDto.showEvents;
		venue.showNetwork = !!venueDto.showNetwork;
		venue.carrdProfile = checkCarrdProfile(venueDto.carrdProfile, user);

		// Validate founding date

		if (venueDto.foundedAt) {
			const foundedAt = DateTime.fromISO(venueDto.foundedAt, {
				zone: SharedConstants.FFXIV_SERVER_TIMEZONE
			});

			if (!foundedAt.isValid || foundedAt.toMillis() > Date.now()) {
				throw new BadRequestException('Invalid founding date');
			}

			venue.foundedAt = foundedAt.toISODate();
		} else {
			venue.foundedAt = null;
		}

		// Validate server

		const server = await em.getRepository(Server).findOne({
			where: {
				name: venueDto.server
			}
		});

		if (!server) {
			throw new BadRequestException('Invalid server');
		}

		venue.server = server;

		// Set location

		venue.location = venueDto.location;

		if (venueDto.location === VenueLocation.OPEN_WORLD) {
			venue.address = venueDto.address;
			venue.housingArea = null;
			venue.ward = null;
			venue.plot = null;
			venue.room = null;
			venue.subdivision = null;
		} else {
			venue.address = '';
			venue.housingArea = venueDto.housingArea;
			venue.ward = venueDto.ward;

			if (venueDto.location === VenueLocation.HOUSE) {
				const plot = venueDto.plot!;

				if (plot > SharedConstants.housing.MAX_SUBDIVISION_PLOT) {
					throw new BadRequestException('Invalid plot number');
				}

				venue.plot = plot;
				venue.room = null;
				venue.subdivision = plot >= SharedConstants.housing.MIN_SUBDIVISION_PLOT;
			} else {
				const room = venueDto.room!;

				if (parseInt(room, 10) > SharedConstants.housing.MAX_APARTMENT_NUMBER) {
					throw new BadRequestException('Invalid room number');
				}

				venue.room = room;
				venue.plot = null;
				venue.subdivision = venueDto.subdivision;
			}
		}

		// Set banner

		if (venueDto.banner && venueDto.banner.id) {
			const banner = await em.getRepository(Image).findOne({
				where: {
					id: venueDto.banner.id,
					owner: {
						user: {
							id: user.id,
						},
					},
				}
			});

			if (!banner) {
				throw new BadRequestException('Banner not found');
			}

			if (banner.width / banner.height < SharedConstants.MIN_BANNER_ASPECT_RATIO) {
				throw new BadRequestException(
					getBannerAspectRatioErrorMessage(
						'Banner',
						banner.width,
						banner.height,
						SharedConstants.MIN_BANNER_ASPECT_RATIO,
					),
				);
			}

			venue.banner = Promise.resolve(banner);
		} else {
			venue.banner = Promise.resolve(null);
		}

    if (venueDto.eventBanner && venueDto.eventBanner.id) {
      const eventBanner = await em.getRepository(Image).findOne({
        where: {
          id: venueDto.eventBanner.id,
          owner: {
            user: {
              id: user.id,
            },
          },
        },
      });

      if (!eventBanner) {
        throw new BadRequestException('Event banner not found');
      }

      if (eventBanner.width / eventBanner.height < SharedConstants.MIN_BANNER_ASPECT_RATIO) {
        throw new BadRequestException(
          getBannerAspectRatioErrorMessage(
            'Event-Banner',
            eventBanner.width,
            eventBanner.height,
            SharedConstants.MIN_BANNER_ASPECT_RATIO,
          ),
        );
      }

      venue.eventBanner = Promise.resolve(eventBanner);
    } else {
      venue.eventBanner = Promise.resolve(null);
    }

    if (venueDto.eventDiscordBanner && venueDto.eventDiscordBanner.id) {
      const eventDiscordBanner = await em.getRepository(Image).findOne({
        where: {
          id: venueDto.eventDiscordBanner.id,
          owner: {
            user: {
              id: user.id,
            },
          },
        },
      });

      if (!eventDiscordBanner) {
        throw new BadRequestException('Event discord banner not found');
      }

      if (eventDiscordBanner.width / eventDiscordBanner.height < SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
        throw new BadRequestException(
          getBannerAspectRatioErrorMessage(
            'Event Discord-Banner',
            eventDiscordBanner.width,
            eventDiscordBanner.height,
            SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO,
          ),
        );
      }

      venue.eventDiscordBanner = Promise.resolve(eventDiscordBanner);
    } else {
      venue.eventDiscordBanner = Promise.resolve(null);
    }

    if (venueDto.eventIcon && venueDto.eventIcon.id) {
      const eventIcon = await em.getRepository(Image).findOne({
        where: {
          id: venueDto.eventIcon.id,
          owner: {
            user: {
              id: user.id,
            },
          },
        },
      });

      if (!eventIcon) {
        throw new BadRequestException('Event icon not found');
      }

      venue.eventIcon = Promise.resolve(eventIcon);
    } else {
      venue.eventIcon = Promise.resolve(null);
    }
		
		// Set tags

		const existingTagNames = venue.tags.map((tag) => tag.name);
		const newTagNames = venueDto.tags.filter((tagName) => tagName !== '' && !existingTagNames.includes(tagName));
		const tagsToDelete = venue.tags.filter(tag => !venueDto.tags.includes(tag.name));
		const tagsToRetain = venue.tags.filter(tag => venueDto.tags.includes(tag.name));

		venue.tags = [
			...tagsToRetain,
			...newTagNames.map(
				(tag) =>
					new VenueTag({
						name: tag,
						venue,
					}),
			),
		];

    venue.eventContentNotes = (venueDto.eventContentNotes || [])
      .filter(note => note !== '')
      .map((note) => new ContentNote({ name: note }));

		if (tagsToDelete.length > 0) {
			await Promise.all(tagsToDelete.map(tag => em.remove(tag)));
		}

		await em.save(venue);
	}

  async getVenueMembers(venueId: number, user: UserInfo): Promise<VenueMemberDto[]> {
    await this.assertEditRights(venueId, user);

    const memberships = await this.venueMembershipRepo
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.venue', 'venue')
      .innerJoinAndSelect('venue.owner', 'owner')
      .innerJoinAndSelect('membership.character', 'character')
      .innerJoinAndSelect('character.server', 'server')
      .where('venue.id = :venueId', { venueId })
      .andWhere('membership.status <> :rejected', { rejected: MembershipStatus.REJECTED })
      .orderBy('character.name', 'ASC')
      .select([
        'membership.id',
        'character.id',
        'character.name',
        'character.avatar',
        'server.id',
        'server.name',
        'membership.status',
        'membership.canEdit',
        'membership.canManageMembers',
        'membership.showInStaff',
      ])
      .getMany();

    const members = memberships.map((membership) => ({
      characterId: membership.character.id,
      name: membership.character.name,
      server: membership.character.server.name,
      avatar: membership.character.avatar,
      status: membership.status,
      canEdit: membership.canEdit,
      canManageMembers: membership.canManageMembers,
      showInStaff: membership.showInStaff,
    }));

    const venue = await this.venueRepo.findOne({
      where: { id: venueId },
      relations: ['owner', 'owner.server'],
    });
    const ownerId = venue?.owner?.id;
    const hasOwnerRow = !!ownerId && members.some((member) => member.characterId === ownerId);

    if (!hasOwnerRow) {
      if (venue?.owner) {
        members.unshift({
          characterId: venue.owner.id,
          name: venue.owner.name,
          server: venue.owner.server.name,
          avatar: venue.owner.avatar,
          status: MembershipStatus.CONFIRMED,
          canEdit: true,
          canManageMembers: true,
          showInStaff: true,
        });
      }
    }

    return members;
  }

  async applyForMembership(venueId: number, characterIdWrapper: CharacterIdWrapper, user: UserInfo): Promise<void> {
    const characterId = characterIdWrapper.characterId;
    assertUserCharacterId(characterId, user);

    await this.connection.transaction(async (em) => {
      const membershipRepo = em.getRepository(VenueMembership);
      const existingMembership = await this.getMembership(membershipRepo, venueId, characterId);

      if (existingMembership) {
        return;
      }

      const [venue, character] = await Promise.all([
        em.getRepository(Venue).findOne({
          where: { id: venueId },
          relations: ['owner'],
        }),
        em.getRepository(Character).findOneBy({ id: characterId }),
      ]);

      if (!character) {
        throw new NotFoundException('Invalid character');
      }

      if (!venue) {
        throw new NotFoundException('Invalid venue');
      }

      if (venue.owner.id === characterId) {
        const ownerMembership = membershipRepo.create({
          venue,
          character,
          status: MembershipStatus.CONFIRMED,
          canEdit: true,
          canManageMembers: true,
          showInStaff: true,
        });

        await membershipRepo.save(ownerMembership);
        return;
      }

      const newMembership = membershipRepo.create({
        venue,
        character,
        status: MembershipStatus.APPLIED,
        canEdit: false,
        canManageMembers: false,
      });

      await membershipRepo.save(newMembership);
    });
  }

  async approveMember(venueId: number, characterIdWrapper: CharacterIdWrapper, user: UserInfo): Promise<void> {
    await this.setMembershipStatus(venueId, characterIdWrapper, user, MembershipStatus.CONFIRMED);
  }

  async rejectMember(venueId: number, characterIdWrapper: CharacterIdWrapper, user: UserInfo): Promise<void> {
    await this.setMembershipStatus(venueId, characterIdWrapper, user, MembershipStatus.REJECTED);
  }

  private async setMembershipStatus(
    venueId: number,
    characterIdWrapper: CharacterIdWrapper,
    user: UserInfo,
    status: MembershipStatus,
  ): Promise<void> {
    await this.assertManageMembersRights(venueId, user);

    const characterId = characterIdWrapper.characterId;

    await this.connection.transaction(async (em) => {
      const membershipRepo = em.getRepository(VenueMembership);
      const membership = await this.getMembership(membershipRepo, venueId, characterId, true);

      if (!membership) {
        throw new NotFoundException('Venue member not found');
      }

      if (membership.status === status) {
        return;
      }

      if (status === MembershipStatus.REJECTED && characterId === membership.venue.owner.id) {
        throw new ConflictException('Venue owner cannot be rejected');
      }

      membership.status = status;
      await membershipRepo.save(membership);
    });
  }

  async setMemberFlags(venueId: number, characterId: number, flags: VenueMemberFlagsDto, user: UserInfo): Promise<void> {
    await this.assertManageMembersRights(venueId, user);

    const canEdit = await this.checkEditRights(venueId, user);

    await this.connection.transaction(async (em) => {
      const membershipRepo = em.getRepository(VenueMembership);
      const membership = await this.getMembership(membershipRepo, venueId, characterId, true);

      if (!membership) {
        throw new NotFoundException('Venue member not found');
      }

      if (!canEdit && !membership.canEdit && flags.canEdit) {
        throw new ForbiddenException('You do not have edit permission and cannot set it for others');
      }

      if (membership.status !== MembershipStatus.CONFIRMED) {
        throw new ConflictException("Non-confirmed member's flags cannot be edited");
      }

      if (characterId === membership.venue.owner.id) {
        throw new ConflictException('Venue owner flags cannot be edited');
      }

      membership.canEdit = flags.canEdit;
      membership.canManageMembers = flags.canManageMembers;
      membership.showInStaff = flags.showInStaff;
      await membershipRepo.save(membership);
    });
  }

  private async checkEditRights(venueId: number, user: UserInfo): Promise<boolean> {
    return this.checkFlag(venueId, user.characters.map((ch) => ch.id), false);
  }

  private async assertEditRights(venueId: number, user: UserInfo): Promise<void> {
    if (!(await this.checkEditRights(venueId, user))) {
      throw new ForbiddenException('Operation not permitted');
    }
  }

  async assertCanEditVenue(venueId: number, user: UserInfo): Promise<void> {
    await this.assertEditRights(venueId, user);
  }

  private async checkManageMembersRights(venueId: number, user: UserInfo): Promise<boolean> {
    return this.checkFlag(venueId, user.characters.map((ch) => ch.id), true);
  }

  private async assertManageMembersRights(venueId: number, user: UserInfo): Promise<void> {
    if (!(await this.checkManageMembersRights(venueId, user))) {
      throw new ForbiddenException('Operation not permitted');
    }
  }

  private async checkFlag(venueId: number, characterIds: number[], manageMembersFlag: boolean): Promise<boolean> {
    if (characterIds.length === 0) {
      return false;
    }

    const ownerCount = await this.venueRepo
      .createQueryBuilder('venue')
      .innerJoinAndSelect('venue.owner', 'owner')
      .where('venue.id = :venueId', { venueId })
      .andWhere('owner.id IN (:...characterIds)', { characterIds })
      .getCount();

    if (ownerCount > 0) {
      return true;
    }

    const flagName = manageMembersFlag ? 'canManageMembers' : 'canEdit';

    const membershipCount = await this.venueMembershipRepo
      .createQueryBuilder('membership')
      .innerJoinAndSelect('membership.venue', 'venue')
      .innerJoinAndSelect('membership.character', 'character')
      .where('venue.id = :venueId', { venueId })
      .andWhere('character.id IN (:...characterIds)', { characterIds })
      .andWhere('membership.status = :status', { status: MembershipStatus.CONFIRMED })
      .andWhere(`membership.${flagName} = :flag`, { flag: true })
      .getCount();

    return membershipCount > 0;
  }

  private async getMembership(
    repo: Repository<VenueMembership>,
    venueId: number,
    characterId: number,
    extended?: boolean
  ): Promise<VenueMembership | null> {
    const options: FindOneOptions<VenueMembership> = {
      where: {
        venue: {
          id: venueId,
        },
        character: {
          id: characterId,
        },
      },
    };

    if (extended) {
      options.relations = ['venue', 'venue.owner'];
    }

    return (await repo.findOne(options)) || null;
  }

  // ─── Offerings ────────────────────────────────────────────────────────────────

  async getOfferings(venueId: number): Promise<VenueOfferingsDto> {
    const topCategories = await this.offeringCategoryRepo.find({
      where: { venue: { id: venueId }, parentCategory: IsNull() },
      relations: [
        'subcategories',
        'subcategories.offerings',
        'subcategories.offerings.image',
        'subcategories.offerings.image.owner',
        'offerings',
        'offerings.image',
        'offerings.image.owner',
      ],
      order: { sortOrder: 'ASC' },
    });

    return {
      categories: topCategories.map((cat) => this.toCategoryDto(cat)),
    };
  }

  private toCategoryDto(cat: VenueOfferingCategory): VenueOfferingCategoryDto {
    const subcategories = (cat.subcategories || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((sub) => this.toCategoryDto(sub));

    const offerings = (cat.offerings || [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((off) => this.toOfferingDto(off));

    return {
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder,
      subcategories,
      offerings,
    };
  }

  private toOfferingDto(off: VenueOffering): VenueOfferingDto {
    const image = off.image as Image | null;
    return {
      id: off.id,
      name: off.name,
      description: off.description,
      price: off.price,
      imageId: image?.id,
      imageUrl: image ? this.imagesService.getUrl(image) : undefined,
      sortOrder: off.sortOrder,
    };
  }

  async saveOfferings(venueId: number, dto: VenueOfferingsDto, user: UserInfo): Promise<void> {
    await this.assertEditRights(venueId, user);

    // Collect image IDs referenced in the new structure
    const referencedImageIds = this.collectReferencedImageIds(dto);

    // Load current offering images with owner info (needed for S3 path after deletion)
    const currentOfferingImages = await this.imageRepo.find({
      where: { category: ImageCategory.OFFERING_ITEM, venue: { id: venueId } },
      relations: ['owner'],
    });

    const imagesToDelete = currentOfferingImages.filter((img) => !referencedImageIds.has(img.id));
    const imageIdsToDelete = imagesToDelete.map((img) => img.id);

    await this.connection.transaction(async (em) => {
      const venue = await em.getRepository(Venue).findOne({ where: { id: venueId } });
      if (!venue) throw new NotFoundException('Venue not found');

      // Delete existing top-level categories (cascade deletes subcategories and offerings)
      await em.getRepository(VenueOfferingCategory).delete({ venue: { id: venueId }, parentCategory: IsNull() });

      // Delete orphaned images from DB
      // (ON DELETE SET NULL on VenueOffering.image means no FK violation)
      if (imageIdsToDelete.length > 0) {
        await em.getRepository(Image).delete(imageIdsToDelete);
      }

      // Create new structure
      for (let i = 0; i < dto.categories.length; i++) {
        const catDto = dto.categories[i];
        const cat = em.getRepository(VenueOfferingCategory).create({
          venue,
          name: catDto.name,
          sortOrder: catDto.sortOrder ?? i,
          parentCategory: null,
        });
        await em.save(cat);

        // Direct offerings in category
        for (let j = 0; j < (catDto.offerings || []).length; j++) {
          const offDto = catDto.offerings![j];
          const offering = await this.buildOfferingEntity(em, venue, cat, offDto, j);
          await em.save(offering);
        }

        // Subcategories
        for (let j = 0; j < (catDto.subcategories || []).length; j++) {
          const subDto = catDto.subcategories![j];
          const sub = em.getRepository(VenueOfferingCategory).create({
            venue,
            name: subDto.name,
            sortOrder: subDto.sortOrder ?? j,
            parentCategory: cat,
          });
          await em.save(sub);

          // Offerings in subcategory
          for (let k = 0; k < (subDto.offerings || []).length; k++) {
            const offDto = subDto.offerings![k];
            const offering = await this.buildOfferingEntity(em, venue, sub, offDto, k);
            await em.save(offering);
          }
        }
      }
    });

    // Delete orphaned images from S3 after successful transaction
    if (imagesToDelete.length > 0) {
      await Promise.all(
        imagesToDelete.map((img) =>
          Promise.all([
            this.storageService.deleteFile(`${img.owner.id}/${img.hash}/${img.filename}`).catch(() => undefined),
            this.storageService.deleteFile(`${img.owner.id}/${img.hash}/thumb_${img.filename}`).catch(() => undefined),
          ]),
        ),
      );
    }
  }

  private collectReferencedImageIds(dto: VenueOfferingsDto): Set<number> {
    const ids = new Set<number>();
    for (const cat of dto.categories) {
      for (const off of cat.offerings || []) {
        if (off.imageId) ids.add(off.imageId);
      }
      for (const sub of cat.subcategories || []) {
        for (const off of sub.offerings || []) {
          if (off.imageId) ids.add(off.imageId);
        }
      }
    }
    return ids;
  }

  private async buildOfferingEntity(
    em: EntityManager,
    venue: Venue,
    category: VenueOfferingCategory,
    dto: VenueOfferingDto,
    fallbackOrder: number,
  ): Promise<VenueOffering> {
    const offering = em.getRepository(VenueOffering).create({
      venue,
      category,
      name: dto.name,
      description: html.sanitize(dto.description || ''),
      price: dto.price || '',
      sortOrder: dto.sortOrder ?? fallbackOrder,
      image: null,
    });

    if (dto.imageId) {
      const image = await em.getRepository(Image).findOne({
        where: { id: dto.imageId, category: ImageCategory.OFFERING_ITEM, venue: { id: venue.id } },
      });
      if (image) offering.image = image;
    }

    return offering;
  }

  async uploadOfferingImage(
    venueId: number,
    characterId: number,
    file: Express.Multer.File,
    user: UserInfo,
  ): Promise<{ id: number; url: string }> {
    await this.assertEditRights(venueId, user);

    if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
      throw new BadRequestException('Only JPEG and PNG formats are allowed');
    }

    if (file.size > 1024 * 1024) {
      throw new BadRequestException('File too large (maximum 1 MB)');
    }

    const uploadedPaths: string[] = [];

    try {
      return await this.connection.transaction(async (em) => {
        const character = await getVerifiedCharacter(em, characterId, user);

        const venue = await em.getRepository(Venue).findOne({ where: { id: venueId } });
        if (!venue) throw new NotFoundException('Venue not found');

        // Process image
        const imageSharp = sharp(file.buffer);
        const metadata = await imageSharp.metadata();

        const isJpeg = metadata.format === 'jpeg' || metadata.format === 'jpg';
        const isPng = metadata.format === 'png';
        if (!isJpeg && !isPng) {
          throw new BadRequestException('Only JPEG and PNG formats are allowed');
        }

        const format = isPng ? ImageFormat.PNG : ImageFormat.JPEG;
        const mimetype = isPng ? 'image/png' : 'image/jpeg';

        const resized = imageSharp.resize(800, 800, { fit: 'inside', withoutEnlargement: true });
        const buffer = isPng
          ? await resized.png().toBuffer()
          : await resized.jpeg({ quality: 90 }).toBuffer();

        const resizedMeta = await sharp(buffer).metadata();
        const width = resizedMeta.width || 0;
        const height = resizedMeta.height || 0;

        const thumbOp = sharp(buffer).resize(400, 400, { fit: 'inside' });
        const thumbBuffer = isPng
          ? await thumbOp.png().toBuffer()
          : await thumbOp.jpeg({ quality: 85 }).toBuffer();

        const hash = await hashFile(buffer);
        const filename = file.originalname.replace(/[<>:"/\\|?*#]/g, '_');
        const size = buffer.length;

        const path = `${character.id}/${hash}/${filename}`;
        const thumbPath = `${character.id}/${hash}/thumb_${filename}`;

        await this.storageService.uploadFile(path, buffer, mimetype);
        uploadedPaths.push(path);
        await this.storageService.uploadFile(thumbPath, thumbBuffer, mimetype);
        uploadedPaths.push(thumbPath);

        const imageEntity = em.getRepository(Image).create({
          owner: character,
          width,
          height,
          size,
          hash,
          filename,
          category: ImageCategory.OFFERING_ITEM,
          title: '',
          description: '',
          credits: '',
          format,
          venue,
        });

        await em.getRepository(Image).save(imageEntity);

        return {
          id: imageEntity.id,
          url: this.storageService.getUrl(path),
        };
      });
    } catch (e) {
      if (uploadedPaths.length > 0) {
        await Promise.all(uploadedPaths.map((p) => this.storageService.deleteFile(p).catch(() => undefined)));
      }
      throw e;
    }
  }

  async deleteOfferingImage(venueId: number, imageId: number, user: UserInfo): Promise<void> {
    await this.assertEditRights(venueId, user);

    const imageEntity = await this.connection.transaction(async (em) => {
      const image = await em.getRepository(Image).findOne({
        where: { id: imageId, category: ImageCategory.OFFERING_ITEM, venue: { id: venueId } },
        relations: ['owner'],
      });

      if (!image) throw new NotFoundException('Image not found');

      // ON DELETE SET NULL handles FK references in VenueOffering
      await em.getRepository(Image).remove(image);
      return image;
    });

    await Promise.all([
      this.storageService.deleteFile(`${imageEntity.owner.id}/${imageEntity.hash}/${imageEntity.filename}`).catch(() => undefined),
      this.storageService.deleteFile(`${imageEntity.owner.id}/${imageEntity.hash}/thumb_${imageEntity.filename}`).catch(() => undefined),
    ]);
  }

  // ─── End Offerings ────────────────────────────────────────────────────────────

  async deleteVenue(venueId: number, user: UserInfo): Promise<void> {
		await this.connection.transaction(async em => {
			const venueRepo = em.getRepository(Venue);
			const venue = await venueRepo.findOne({
				where: {
					id: venueId,
					owner: {
						user: {
							id: user.id
						}
					},
				},
				relations: [ 'owner', 'owner.user' ]
			});

			if (!venue) {
				throw new NotFoundException('Venue not found');
			}

			// Free the name for new venues, but keep the record with a deleted flag
			venue.name = `${crypto.randomUUID()} ${venue.name}`;
			await venueRepo.save(venue);
			await venueRepo.softRemove(venue);
		});
	}
}
