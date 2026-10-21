import { EventAnnouncement, Image, NoticeboardItem } from '@app/entity';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guild, RESTJSONErrorCodes } from 'discord.js';
import { Repository } from 'typeorm';
import { BotGateway, isUnknownDiscordObject } from './bot.gateway';
import { extractMentionTokens, NO_MENTIONS, resolveMentions } from './mentions';
import { buildEventReminderMessage } from './messages/event-message';
import { buildNoticeboardMessage, noticeboardBodyMarkdown } from './messages/noticeboard-message';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { ScheduledEventSyncService } from './scheduled-event-sync.service';

export type NoticeboardAction = 'create' | 'update' | 'delete';

const RECONCILE_TIMEOUT_MS = 15000;

const ANNOUNCEMENT_RELATIONS = [
	'event',
	'event.locations',
	'event.locations.server',
	'event.contentNotes',
	'event.banner',
	'event.banner.owner',
	'event.discordBanner',
	'event.discordBanner.owner',
	'event.icon',
	'event.icon.owner',
];

// Steward's orchestration: event reminders (scheduled through BullMQ, posted
// once, then kept in sync with the event or marked "Abgesagt"), the Discord
// scheduled event mirror, and noticeboard posts (posted, edited, deleted).
// Every post records its channel and message id.
@Injectable()
export class AnnouncementService implements OnApplicationBootstrap {
	private readonly logger = new Logger(AnnouncementService.name);

	constructor(
		private readonly botGateway: BotGateway,
		private readonly reminderScheduler: ReminderSchedulerService,
		private readonly scheduledEventSync: ScheduledEventSyncService,
		@InjectRepository(EventAnnouncement) private readonly announcementRepo: Repository<EventAnnouncement>,
		@InjectRepository(NoticeboardItem) private readonly noticeboardItemRepo: Repository<NoticeboardItem>,
	) {}

	onApplicationBootstrap(): void {
		// Not awaited: Nest only opens the webhook port after all bootstrap hooks,
		// and a slow or unreachable Redis must never keep Steward offline.
		void this.reconcileReminders().then((ok) => {
			if (ok) {
				this.logger.log('Initial reminder reconcile done');
			}
		});
	}

	/** Called by the site whenever an event is created, edited or deleted. */
	async refresh(eventId: number): Promise<void> {
		await this.reconcileReminders(eventId);
		await this.scheduledEventSync.sync(eventId);

		try {
			await this.updatePostedReminders(eventId);
		} catch (e) {
			this.logError(`Updating posted reminders of event ${eventId} failed`, e);
		}
	}

	/** Reconciles reminder jobs; logs instead of throwing, and gives up after a timeout. */
	private async reconcileReminders(eventId?: number): Promise<boolean> {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => reject(new Error(`Redis did not answer within ${RECONCILE_TIMEOUT_MS / 1000}s`)), RECONCILE_TIMEOUT_MS);
		});

		try {
			await Promise.race([this.reminderScheduler.reconcile(eventId), timeout]);
			return true;
		} catch (e) {
			this.logError(`Reminder reconcile${eventId !== undefined ? ` for event ${eventId}` : ''} failed`, e);
			return false;
		} finally {
			clearTimeout(timer);
		}
	}

	/** Posts a due reminder (BullMQ job). Throws so the job is retried. */
	async postReminder(announcementId: number): Promise<void> {
		const announcement = await this.announcementRepo.findOne({
			where: { id: announcementId },
			relations: ANNOUNCEMENT_RELATIONS,
		});

		if (!announcement || !announcement.event || announcement.event.hidden || announcement.discordMessageId) {
			return;
		}

		const guild = await this.botGateway.guild();
		const mentions = await resolveMentions(guild, extractMentionTokens(announcement.content));
		const message = buildEventReminderMessage(announcement, await this.eventImages(announcement), {
			mentionLine: mentions.text,
		});
		const posted = await this.botGateway.send(this.botGateway.announcementChannelId, {
			...message,
			allowedMentions: mentions.allowedMentions,
		});

		await this.announcementRepo.update(announcement.id, {
			discordChannelId: posted.channelId,
			discordMessageId: posted.messageId,
			postedAt: new Date(),
		});
	}

	/** Re-renders already posted reminders of an event; deleted or hidden events show as cancelled. */
	private async updatePostedReminders(eventId: number): Promise<void> {
		const announcements = await this.announcementRepo.find({
			where: { event: { id: eventId } },
			withDeleted: true,
			relations: ANNOUNCEMENT_RELATIONS,
		});

		const posted = announcements.filter((announcement) => announcement.discordChannelId && announcement.discordMessageId && announcement.event);
		if (posted.length === 0) {
			return;
		}

		const guild = await this.botGateway.guild();

		for (const announcement of posted) {
			// eslint-disable-next-line no-await-in-loop -- one Discord edit at a time (rate limits)
			await this.editPostedReminder(guild, announcement);
		}
	}

	private async editPostedReminder(guild: Guild, announcement: EventAnnouncement): Promise<void> {
		const cancelled = !!announcement.event.deletedAt || !!announcement.deletedAt || announcement.event.hidden;
		const mentions = cancelled ? null : await resolveMentions(guild, extractMentionTokens(announcement.content));
		const message = buildEventReminderMessage(announcement, await this.eventImages(announcement), {
			mentionLine: mentions?.text,
			cancelled,
		});

		try {
			// Mentions stay readable, but an edit never pings anyone.
			await this.botGateway.edit(announcement.discordChannelId!, announcement.discordMessageId!, {
				...message,
				allowedMentions: NO_MENTIONS,
			});
		} catch (e) {
			if (!isUnknownDiscordObject(e, RESTJSONErrorCodes.UnknownMessage)) {
				throw e;
			}
			await this.announcementRepo.update(announcement.id, { discordChannelId: null, discordMessageId: null });
		}
	}

	/** Called by the site for noticeboard items (create only when the author chose "post on Discord"). */
	async handleNoticeboard(noticeboardItemId: number, action: NoticeboardAction = 'create'): Promise<void> {
		const item = await this.noticeboardItemRepo.findOne({
			where: { id: noticeboardItemId },
			withDeleted: true,
			relations: ['owner', 'owner.server', 'venue', 'venue.server', 'image', 'image.owner'],
		});

		if (!item) {
			this.logger.warn(`Noticeboard item ${noticeboardItemId} not found`);
			return;
		}

		try {
			if (action === 'delete' || item.deletedAt) {
				await this.deleteNoticeboardPost(item);
			} else if (action === 'update') {
				await this.editNoticeboardPost(item);
			} else {
				await this.createNoticeboardPost(item);
			}
		} catch (e) {
			this.logError(`Noticeboard ${action} for item ${noticeboardItemId} failed`, e);
		}
	}

	private async createNoticeboardPost(item: NoticeboardItem): Promise<void> {
		if (item.discordMessageId) {
			return;
		}

		const guild = await this.botGateway.guild();
		const mentions = await resolveMentions(guild, extractMentionTokens(`${item.title}\n\n${noticeboardBodyMarkdown(item.content)}`));
		const message = buildNoticeboardMessage(item, item.image, mentions.text);
		const posted = await this.botGateway.send(this.botGateway.noticeboardChannelId, {
			...message,
			allowedMentions: mentions.allowedMentions,
		});

		await this.storeNoticeboardPost(item.id, posted.channelId, posted.messageId, true);
	}

	private async editNoticeboardPost(item: NoticeboardItem): Promise<void> {
		if (!item.discordChannelId || !item.discordMessageId) {
			return;
		}

		const guild = await this.botGateway.guild();
		const mentions = await resolveMentions(guild, extractMentionTokens(`${item.title}\n\n${noticeboardBodyMarkdown(item.content)}`));
		const message = buildNoticeboardMessage(item, item.image, mentions.text);

		try {
			await this.botGateway.edit(item.discordChannelId, item.discordMessageId, { ...message, allowedMentions: NO_MENTIONS });
		} catch (e) {
			if (!isUnknownDiscordObject(e, RESTJSONErrorCodes.UnknownMessage)) {
				throw e;
			}
			await this.storeNoticeboardPost(item.id, null, null, item.discordPosted);
		}
	}

	private async deleteNoticeboardPost(item: NoticeboardItem): Promise<void> {
		if (!item.discordChannelId || !item.discordMessageId) {
			return;
		}

		try {
			await this.botGateway.delete(item.discordChannelId, item.discordMessageId);
		} catch (e) {
			if (!isUnknownDiscordObject(e, RESTJSONErrorCodes.UnknownMessage)) {
				throw e;
			}
		}

		await this.storeNoticeboardPost(item.id, null, null, item.discordPosted);
	}

	private async storeNoticeboardPost(id: number, channelId: string | null, messageId: string | null, posted: boolean): Promise<void> {
		// Keep updatedAt, so the item is not shown as edited on the site.
		await this.noticeboardItemRepo.createQueryBuilder()
			.update(NoticeboardItem)
			.set({ discordPosted: posted, discordChannelId: channelId, discordMessageId: messageId, updatedAt: () => 'updatedAt' })
			.where('id = :id', { id })
			.execute();
	}

	private async eventImages(announcement: EventAnnouncement): Promise<{ icon: Image | null; banner: Image | null }> {
		const event = announcement.event;
		const [icon, discordBanner, banner] = await Promise.all([event.icon, event.discordBanner, event.banner]);
		return { icon, banner: discordBanner || banner };
	}

	private logError(message: string, e: unknown): void {
		if (e instanceof Error) {
			this.logger.error(`${message}: ${e.message}`, e.stack);
		} else {
			this.logger.error(`${message}: ${String(e)}`);
		}
	}
}
