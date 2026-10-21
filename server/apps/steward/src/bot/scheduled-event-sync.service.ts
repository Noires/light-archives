import { discordConfiguration } from '@app/configuration/discord.config';
import { Event, Image } from '@app/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
	Guild,
	GuildScheduledEventCreateOptions,
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	GuildScheduledEventStatus,
	RESTJSONErrorCodes,
} from 'discord.js';
import sanitizeHtml from 'sanitize-html';
import { Repository } from 'typeorm';
import { BotGateway, isUnknownDiscordObject } from './bot.gateway';
import { eventUrl, imageUrl, truncate } from './messages/format';

/** External Discord events need an end time; site events may not have one. */
export const DEFAULT_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export type ScheduledEventPayload = GuildScheduledEventCreateOptions & {
	entityType: GuildScheduledEventEntityType.External;
};

/** The Discord scheduled event for a visible site event (18+ events marked in the name). */
export function buildScheduledEventPayload(event: Event, banner: Image | null): ScheduledEventPayload {
	const start = event.startDateTime;
	const end = event.endDateTime && event.endDateTime > start
		? event.endDateTime
		: new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS);
	const url = eventUrl(event.id);
	const location = event.locations?.[0];
	const locationParts = [location?.name, location?.address].map((part) => (part || '').trim()).filter((part) => part.length > 0);
	const serverName = (location?.server?.name || '').trim();
	const locationText = locationParts.length > 0
		? `${locationParts.join(', ')}${serverName ? ` (${serverName})` : ''}`
		: url;
	const details = sanitizeHtml(event.details || '', { allowedTags: [], allowedAttributes: {} })
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	const bannerUrl = imageUrl(banner);

	return {
		name: truncate(`${event.adultOnly ? '[18+] ' : ''}${(event.title || '').trim() || 'Event'}`, 100),
		scheduledStartTime: start,
		scheduledEndTime: end,
		privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
		entityType: GuildScheduledEventEntityType.External,
		entityMetadata: { location: truncate(locationText, 100) },
		description: truncate(details ? `${url}\n\n${details}` : url, 1000),
		...(bannerUrl ? { image: bannerUrl } : {}),
	};
}

// Mirrors site events into the guild's Discord "Events" list: created for
// visible future events, edited when the event changes, cancelled when it is
// deleted or hidden. Needs the bot permissions Create Events and Manage
// Events; failures are logged and never block reminders.
@Injectable()
export class ScheduledEventSyncService {
	private readonly logger = new Logger(ScheduledEventSyncService.name);

	constructor(
		private readonly botGateway: BotGateway,
		@InjectRepository(Event) private readonly eventRepo: Repository<Event>,
	) {}

	async sync(eventId: number): Promise<void> {
		if (!discordConfiguration.syncScheduledEvents) {
			return;
		}

		try {
			await this.syncEvent(eventId);
		} catch (e) {
			this.logger.error(`Scheduled event sync for event ${eventId} failed: ${e instanceof Error ? e.message : String(e)}`);
		}
	}

	private async syncEvent(eventId: number): Promise<void> {
		const event = await this.eventRepo.findOne({
			where: { id: eventId },
			withDeleted: true,
			relations: ['locations', 'locations.server', 'banner', 'banner.owner', 'discordBanner', 'discordBanner.owner'],
		});

		if (!event) {
			return;
		}

		const guild = await this.botGateway.guild();
		const gone = !!event.deletedAt || event.hidden;
		let discordId = event.discordScheduledEventId;

		if (gone) {
			if (discordId) {
				await this.cancel(guild, discordId);
				await this.storeId(event.id, null);
			}
			return;
		}

		const [discordBanner, banner] = await Promise.all([event.discordBanner, event.banner]);
		const payload = buildScheduledEventPayload(event, discordBanner || banner);

		if (discordId) {
			try {
				const existing = await guild.scheduledEvents.fetch(discordId);
				if (existing.status === GuildScheduledEventStatus.Scheduled) {
					await existing.edit(payload);
				} else if (existing.status === GuildScheduledEventStatus.Active) {
					await existing.edit({ scheduledEndTime: payload.scheduledEndTime });
				}
				return;
			} catch (e) {
				if (!isUnknownDiscordObject(e, RESTJSONErrorCodes.UnknownGuildScheduledEvent)) {
					throw e;
				}
				// Deleted on Discord by hand: create it again below.
				discordId = null;
			}
		}

		if (event.startDateTime.getTime() <= Date.now()) {
			return;
		}

		const created = await guild.scheduledEvents.create(payload);
		await this.storeId(event.id, created.id);
	}

	private async cancel(guild: Guild, discordId: string): Promise<void> {
		try {
			const existing = await guild.scheduledEvents.fetch(discordId);
			if (existing.status === GuildScheduledEventStatus.Scheduled) {
				await existing.setStatus(GuildScheduledEventStatus.Canceled);
			}
		} catch (e) {
			if (!isUnknownDiscordObject(e, RESTJSONErrorCodes.UnknownGuildScheduledEvent)) {
				throw e;
			}
		}
	}

	private async storeId(eventId: number, discordId: string | null): Promise<void> {
		// Query builder update so the site's updatedAt is not touched.
		await this.eventRepo.createQueryBuilder()
			.update(Event)
			.set({ discordScheduledEventId: discordId, updatedAt: () => 'updatedAt' })
			.where('id = :id', { id: eventId })
			.execute();
	}
}
