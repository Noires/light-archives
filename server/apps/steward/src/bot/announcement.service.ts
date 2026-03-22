import { s3Configuration, serverConfiguration } from '@app/configuration';
import { EventAnnouncement, Image, NoticeboardItem } from '@app/entity';
import SharedConstants from '@app/shared/SharedConstants';
import { EventType } from '@app/shared/enums/event-type.enum';
import { noticeboardLocations } from '@app/shared/enums/noticeboard-location.enum';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmbedBuilder, MessageCreateOptions } from 'discord.js';
import escape from 'escape-html';
import { DateTime } from 'luxon';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import schedule, { Job } from 'node-schedule';
import sanitizeHtml from 'sanitize-html';
import { Repository } from 'typeorm';
import { BotGateway } from './bot.gateway';

const EVENT_EMBED_COLOR = 0x4f7ba6;
const EVENT_EMBED_COLOR_AFTER_START = 0xb77986;
const EMBED_DESCRIPTION_LIMIT = 4096;
const EMBED_FIELD_LIMIT = 1024;

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.GENERAL]: 'Offenes Rollenspiel',
  [EventType.TAVERN]: 'Taverne / Kneipe',
  [EventType.BAR_LOUNGE]: 'Bar / Lounge',
  [EventType.BATHHOUSE]: 'Badehaus',
  [EventType.CLUB]: 'Club / Tanzlokal',
  [EventType.RESTAURANT_GASTHAUS]: 'Restaurant / Gasthaus',
  [EventType.TEAHOUSE]: 'Teehaus',
  [EventType.HEALERHOUSE]: 'Heilerhaus',
  [EventType.COMBAT_ARENA]: 'Kampfarena',
  [EventType.SALES]: 'Verkauf',
  [EventType.LIBRARY]: 'Bibliothek',
  [EventType.GALLERY_MUSEUM]: 'Galerie / Museum',
  [EventType.MARKET]: 'Markt',
  [EventType.ADVENTURERS_GUILD]: 'Abenteurergilde',
  [EventType.EDUCATION_UNIVERSITY]: 'Ausbildung / Universität',
  [EventType.RP]: 'Offenes Rollenspiel',
  [EventType.ADULT]: '18+',
  [EventType.OTHER]: 'Sonstiges',
};

const CONTENT_NOTE_LABELS: Record<string, string> = {
  RAPE: 'Vergewaltigung',
  ABUSE: 'Missbrauch',
  SEXUALABUSE: 'Sexueller Missbrauch',
  VIOLENCE: 'Gewalt | Gewaltdarstellung',
  DOMESTICVIOLENCE: 'Häusliche Gewalt',
  GORE: 'Gore',
  MENTALDISORDER: 'Psychische Störung | Phobie | Manipulation',
  PSYCHOLOGICALVIOLENCE: 'Psychische Gewalt | Seelische Gewalt | Mobbing',
  SWEARWORDS: 'Vulgärsprache | Kraftausdrücke | Derbe Sprache',
  SELFHARM: 'Selbstverletzendes Verhalten',
  SUICIDE: 'Suizid',
  ADDICTION: 'Sucht | Spielsucht | Glücksspiel',
  DRUGS: 'Drogen | Alkohol | Drogenkonsum',
  CRIME: 'Crime | Kriminalität',
  SEXISM: 'Sexismus',
  PORNOGRAPHIC: 'Pornografie | Voyeurismus',
  ERP: 'ERP | Sex',
  BODYSHAMING: 'Body-Shaming',
  MISOGYNY: 'Misogynie',
  MISANDRY: 'Misandrie',
  HOMOPHOBE: 'Homophobie',
  TRANSPHOBIA: 'Transphobie',
  RACISM: 'Rassismus',
};

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  private readonly timers = new Map<number, Job[]>();

  constructor(
    private readonly botGateway: BotGateway,
    @InjectRepository(EventAnnouncement) private eventAnnouncementRepo: Repository<EventAnnouncement>,
		@InjectRepository(NoticeboardItem) private noticeboardItemRepo: Repository<NoticeboardItem>,
  ) {
    void this.load();
  }

	async postNoticeboardItem(noticeboardItemId: number): Promise<void> {
		const noticeboardItem = await this.noticeboardItemRepo.findOne({
			where: {
				id: noticeboardItemId,
			},
			relations: [ 'owner' ],
		});

		if (!noticeboardItem) {
			throw new NotFoundException(`Noticeboard item with id ${noticeboardItemId} not found.`);
		}

		const subtitle = `${noticeboardLocations[noticeboardItem.location]} — by ${noticeboardItem.owner.name}`
		const link = `${serverConfiguration.frontendRoot}/noticeboard/${noticeboardItem.id}`;
		const content = `<strong>${escape(noticeboardItem.title)}</strong><br><em>${escape(subtitle)}</em><br><br>${noticeboardItem.content}`;
		const contentHtml = sanitizeHtml(content, {
			allowedTags: [ 'b', 'i', 'strong', 'em', 'code', 'tt', 'blockquote', 'p', 'br' ]
		});
		let contentMarkdown = NodeHtmlMarkdown.translate(contentHtml);

		if (!contentMarkdown.endsWith('\n')) {
			contentMarkdown += '\n';
		}

		contentMarkdown += `\n${link}`;

		try {
			await this.botGateway.sendNoticeboardItem(contentMarkdown);
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}
		}
	}

  async refresh(eventId: number): Promise<void> {
    const eventTimers = this.timers.get(eventId);

    if (eventTimers) {
      // Prevent existing timers for this event from firing, as we're about to reload its data
      eventTimers.forEach((timer) => timer.cancel());
      this.timers.delete(eventId);
    }

    await this.load(eventId);
  }

  async load(eventId?: number): Promise<void> {
    this.logger.log(`Refreshing event timers for ${eventId ? `event ${eventId}` : 'all events'}`);

		const query = this.eventAnnouncementRepo.createQueryBuilder('ea')
			.innerJoinAndSelect('ea.event', 'event')
			.select([ 'ea.id', 'ea.content', 'ea.postAt', 'event.id' ])
			.where('ea.postAt >= :now', { now: new Date() });

		if (eventId) {
			query.andWhere('event.id = :eventId', { eventId });
		}

		const announcements = await query.getMany();
		const now = Date.now();

		for (const announcement of announcements) {
			const remainingMS = announcement.postAt.getTime() - now;
			const announcementEventId = announcement.event.id;

			const timerId = schedule.scheduleJob(announcement.postAt, async () => {
				this.unregisterTimer(announcementEventId, timerId);
				await this.postAnnouncement(announcement.id);
			});

			this.registerTimer(announcementEventId, timerId);
			this.logger.log(`Event ${announcementEventId} firing in ${remainingMS} msec`);
		}
  }

	private async postAnnouncement(announcementId: number) {
		try {
			const announcement = await this.eventAnnouncementRepo.findOne({
				where: {
					id: announcementId,
				},
				relations: [
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
				],
			});

			if (!announcement) {
				this.logger.warn(`Event announcement ${announcementId} no longer exists.`);
				return;
			}

			await this.botGateway.sendAnnouncement(await this.buildAnnouncementMessage(announcement));
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(e.message, e.stack);
			} else {
				this.logger.error(e);
			}
		}
	}

	private async buildAnnouncementMessage(announcement: EventAnnouncement): Promise<MessageCreateOptions> {
		const event = announcement.event;
		const eventUrl = `${serverConfiguration.frontendRoot}/event/${event.id}`;
		const description = this.buildDescription(announcement.content, event.title);
		const fields = this.buildEventFields(announcement);
		const [icon, discordBanner, banner] = await Promise.all([
			event.icon as unknown as Promise<Image | null>,
			event.discordBanner as unknown as Promise<Image | null>,
			event.banner as unknown as Promise<Image | null>,
		]);
		const embed = new EmbedBuilder()
			.setColor(announcement.minutesBefore >= 0 ? EVENT_EMBED_COLOR : EVENT_EMBED_COLOR_AFTER_START)
			.setTitle(this.truncate(event.title, 256))
			.setURL(eventUrl)
			.setFooter({
				text: this.buildReminderText(announcement.minutesBefore),
			})
			.setTimestamp(event.startDateTime);

		if (description) {
			embed.setDescription(this.truncate(description, EMBED_DESCRIPTION_LIMIT));
		}

		if (fields.length > 0) {
			embed.addFields(fields);
		}

		const thumbnailUrl = this.getImageUrl(icon);
		if (thumbnailUrl) {
			embed.setThumbnail(thumbnailUrl);
		}

		const imageUrl = this.getImageUrl(discordBanner || banner);
		if (imageUrl) {
			embed.setImage(imageUrl);
		}

		return {
			content: this.extractMentionContent(announcement.content),
			embeds: [embed],
		};
	}

	private buildDescription(content: string, eventTitle: string): string {
		const trimmed = (content || '').trim();
		if (!trimmed) {
			return '';
		}

		const normalizedTitle = eventTitle.trim();
		if (!normalizedTitle) {
			return trimmed;
		}

		if (trimmed === normalizedTitle) {
			return '';
		}

		const titledPrefix = `${normalizedTitle}\n\n`;
		return trimmed.startsWith(titledPrefix) ? trimmed.slice(titledPrefix.length).trim() : trimmed;
	}

	private buildEventFields(announcement: EventAnnouncement): Array<{ name: string; value: string; inline?: boolean }> {
		const event = announcement.event;
		const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
		const location = event.locations?.[0];
		const eventType = EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS[EventType.RP];
		const typeFlags = [
			eventType,
			event.adultOnly ? '18+' : null,
			event.closedEvent ? 'Geschlossen' : null,
		].filter((value): value is string => !!value);
		const warnings = (event.contentNotes || [])
			.map((note) => CONTENT_NOTE_LABELS[note.name] || note.name)
			.filter((value) => value.length > 0);
		const links = this.buildLinkLines(announcement);
		const registration = this.buildRegistrationText(announcement);

		fields.push({
			name: 'Zeit',
			value: this.truncate(this.buildScheduleText(announcement), EMBED_FIELD_LIMIT),
		});

		if (location) {
			const locationValue = [
				location.name || '',
				location.address || '',
				location.server?.name || '',
			].filter((value) => value.length > 0).join('\n');
			if (locationValue.length > 0) {
				fields.push({
					name: 'Ort',
					value: this.truncate(locationValue, EMBED_FIELD_LIMIT),
					inline: true,
				});
			}
		}

		fields.push({
			name: 'Typ',
			value: this.truncate(typeFlags.join('\n'), EMBED_FIELD_LIMIT),
			inline: true,
		});

		if (warnings.length > 0) {
			fields.push({
				name: 'Warnungen',
				value: this.truncate(warnings.join('\n'), EMBED_FIELD_LIMIT),
				inline: true,
			});
		}

		if (event.contact && event.contact.trim().length > 0) {
			fields.push({
				name: 'Kontakt',
				value: this.truncate(event.contact.trim(), EMBED_FIELD_LIMIT),
				inline: true,
			});
		}

		if (registration) {
			fields.push({
				name: 'Anmeldung',
				value: this.truncate(registration, EMBED_FIELD_LIMIT),
				inline: true,
			});
		}

		if (event.extraInfo && event.extraInfo.trim().length > 0) {
			fields.push({
				name: 'Hinweis',
				value: this.truncate(event.extraInfo.trim(), EMBED_FIELD_LIMIT),
			});
		}

		if (links.length > 0) {
			fields.push({
				name: 'Links',
				value: this.truncate(links.join('\n'), EMBED_FIELD_LIMIT),
			});
		}

		return fields.slice(0, 25);
	}

	private buildScheduleText(announcement: EventAnnouncement): string {
		const event = announcement.event;
		const start = this.formatDateTime(event.startDateTime);
		if (!event.endDateTime) {
			return `Beginn: ${start}`;
		}

		const end = this.formatDateTime(event.endDateTime);
		return `Beginn: ${start}\nEnde: ${end}`;
	}

	private buildRegistrationText(announcement: EventAnnouncement): string | null {
		const event = announcement.event;
		if (!event.closedEvent) {
			return null;
		}

		if (event.registrationDeadlineDays === null || event.registrationDeadlineDays === undefined) {
			return 'Geschlossenes Event';
		}

		if (event.registrationDeadlineTime) {
			return `${event.registrationDeadlineDays} Tag(e) vorher um ${event.registrationDeadlineTime} ST`;
		}

		return `${event.registrationDeadlineDays} Tag(e) vorher`;
	}

	private buildLinkLines(announcement: EventAnnouncement): string[] {
		const event = announcement.event;
		const links = (event.links || [])
			.filter((link) => !!link?.url)
			.map((link) => {
				const label = (link.label || '').trim();
				return label ? `${label}: ${link.url}` : link.url;
			});
		const location = event.locations?.[0];

		if (links.length === 0 && event.link) {
			const label = (event.linkText || '').trim();
			links.push(label ? `${label}: ${event.link}` : event.link);
		}

		if (location?.link) {
			const label = (location.linkText || '').trim() || 'Standort';
			links.push(`${label}: ${location.link}`);
		}

		return links;
	}

	private formatDateTime(value: Date): string {
		return DateTime.fromJSDate(value, {
			zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
		}).toFormat("dd.LL.yyyy, HH:mm 'ST'", { locale: 'de-DE' });
	}

	private buildReminderText(minutesBefore: number): string {
		if (minutesBefore === 0) {
			return 'Erinnerung: zum Eventbeginn';
		}

		const absoluteMinutes = Math.abs(minutesBefore);
		const direction = minutesBefore > 0 ? 'vorher' : 'nach Beginn';

		if (absoluteMinutes % 10080 === 0) {
			const weeks = absoluteMinutes / 10080;
			return `Erinnerung: ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'} ${direction}`;
		}

		if (absoluteMinutes % 1440 === 0) {
			const days = absoluteMinutes / 1440;
			return `Erinnerung: ${days} ${days === 1 ? 'Tag' : 'Tage'} ${direction}`;
		}

		if (absoluteMinutes % 60 === 0) {
			const hours = absoluteMinutes / 60;
			return `Erinnerung: ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'} ${direction}`;
		}

		return `Erinnerung: ${absoluteMinutes} Minuten ${direction}`;
	}

	private extractMentionContent(content: string): string | undefined {
		const matches = new Set<string>();
		let match: RegExpExecArray | null = null;

		const userRegex = /@([A-Za-z0-9_-]+#[0-9]+)/g;
		while ((match = userRegex.exec(content)) !== null) {
			matches.add(`@${match[1]}`);
		}

		const nicknameRegex = /@\{([^}]+)\}/g;
		while ((match = nicknameRegex.exec(content)) !== null) {
			matches.add(`@{${match[1]}}`);
		}

		const roleSource = content.replace(/@([A-Za-z0-9_-]+#[0-9]+)/g, '').replace(/@\{([^}]+)\}/g, '');
		const roleRegex = /(^|[\s(])@([A-Za-z0-9-]+)/g;
		while ((match = roleRegex.exec(roleSource)) !== null) {
			matches.add(`@${match[2]}`);
		}

		return matches.size > 0 ? Array.from(matches).join(' ') : undefined;
	}

	private getImageUrl(image: Image | null | undefined): string | null {
		if (!image?.owner?.id) {
			return null;
		}

		const publicRootUrl = s3Configuration.publicRootUrl.endsWith('/')
			? s3Configuration.publicRootUrl
			: `${s3Configuration.publicRootUrl}/`;
		return `${publicRootUrl}${image.owner.id}/${image.hash}/${image.filename}`;
	}

	private truncate(value: string, maxLength: number): string {
		if (value.length <= maxLength) {
			return value;
		}

		return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
	}

	private registerTimer(eventId: number, timerId: Job) {
		let timers = this.timers.get(eventId);

		if (!timers) {
			timers = [];
			this.timers.set(eventId, timers);
		}

		timers.push(timerId);
	}

	private unregisterTimer(eventId: number, timerId: Job) {
		const timers = this.timers.get(eventId);

		if (!timers) {
			return;
		}

		const timerIndex = timers.indexOf(timerId);

		if (timerIndex !== -1) {
			timers.splice(timerIndex, 1);
		}
	}
}
