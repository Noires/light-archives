import { EventAnnouncement, Image } from '@app/entity';
import { EventType } from '@app/shared/enums/event-type.enum';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
	time,
	TimestampStyles,
} from 'discord.js';
import {
	buildReminderText,
	CONTENT_NOTE_LABELS,
	escapeLinkLabel,
	EVENT_TYPE_LABELS,
	eventUrl,
	formatServerTime,
	imageUrl,
	isSameServerDay,
	isWebUrl,
	truncate,
} from './format';

// Event reminder as a Components V2 message: accent container, title section
// with the event icon, Discord timestamps (shown in each reader's local time,
// plus the in-game server time as text), spoilered content warnings, banner
// gallery and link buttons. A cancelled event keeps the post but greys it out.

export const EVENT_ACCENT = 0x4f7ba6;
export const EVENT_ACCENT_AFTER_START = 0xb77986;
export const EVENT_ACCENT_CANCELLED = 0x7a7f87;

/** Discord's limit for all text in one Components V2 message. */
export const V2_TEXT_LIMIT = 4000;
const MAX_LINK_BUTTONS = 5;

export interface EventMessageImages {
	icon: Image | null;
	banner: Image | null;
}

export interface EventMessageOptions {
	/** Already resolved mention line (`<@id> <@&id>`), shown above the container. */
	mentionLine?: string;
	cancelled?: boolean;
}

export interface V2Message {
	flags: MessageFlags.IsComponentsV2;
	components: Array<ContainerBuilder | TextDisplayBuilder>;
}

function buildLocationText(announcement: EventAnnouncement): string | null {
	const location = announcement.event.locations?.[0];
	if (!location) {
		return null;
	}

	const parts = [location.name || '', location.address || '', location.server?.name || ''].map((part) => part.trim()).filter((part) => part.length > 0);
	return parts.length > 0 ? parts.join(' · ') : null;
}

function buildTypeText(announcement: EventAnnouncement): string {
	const event = announcement.event;
	return [
		EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS[EventType.RP],
		event.adultOnly ? '18+' : null,
		event.closedEvent ? 'Geschlossen' : null,
	].filter((value): value is string => !!value).join(' | ');
}

function buildWarningText(announcement: EventAnnouncement): string | null {
	const warnings = (announcement.event.contentNotes || [])
		.map((note) => CONTENT_NOTE_LABELS[note.name] || note.name)
		.filter((value) => value.length > 0);
	return warnings.length > 0 ? warnings.join(' | ') : null;
}

function buildRegistrationText(announcement: EventAnnouncement): string | null {
	const event = announcement.event;
	if (!event.closedEvent || event.registrationDeadlineDays === null || event.registrationDeadlineDays === undefined) {
		return null;
	}

	return event.registrationDeadlineTime
		? `${event.registrationDeadlineDays} Tag(e) vorher um ${event.registrationDeadlineTime} ST`
		: `${event.registrationDeadlineDays} Tag(e) vorher`;
}

function buildMetaLines(announcement: EventAnnouncement, cancelled: boolean): string[] {
	const event = announcement.event;
	const start = event.startDateTime;
	const lines = [
		cancelled
			? `**Beginn:** ${time(start, TimestampStyles.FullDateShortTime)} · ${formatServerTime(start)}`
			: `**Beginn:** ${time(start, TimestampStyles.FullDateShortTime)} (${time(start, TimestampStyles.RelativeTime)}) · ${formatServerTime(start)}`,
	];

	if (event.endDateTime) {
		const end = event.endDateTime;
		const style = isSameServerDay(start, end) ? TimestampStyles.ShortTime : TimestampStyles.LongDateShortTime;
		lines.push(`**Ende:** ${time(end, style)} · ${formatServerTime(end)}`);
	}

	const location = buildLocationText(announcement);
	if (location) {
		lines.push(`**Ort:** ${location}`);
	}

	lines.push(`**Typ:** ${buildTypeText(announcement)}`);
	return lines;
}

function buildBottomLines(announcement: EventAnnouncement): string[] {
	const event = announcement.event;
	const lines: string[] = [];

	if (event.contact && event.contact.trim().length > 0) {
		lines.push(`**Kontakt:** ${event.contact.trim()}`);
	}

	const registration = buildRegistrationText(announcement);
	if (registration) {
		lines.push(`**Anmeldung:** ${registration}`);
	}

	if (event.extraInfo && event.extraInfo.trim().length > 0) {
		lines.push(`**Hinweis:** ${event.extraInfo.trim()}`);
	}

	return lines;
}

/** Reminder texts often repeat the event title as their first line. */
function stripTitleFromContent(content: string, title: string): string {
	const trimmed = (content || '').trim();
	if (!trimmed || trimmed === title) {
		return '';
	}

	const prefix = `${title}\n\n`;
	return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length).trim() : trimmed;
}

function buildLinkButtons(announcement: EventAnnouncement, url: string): ButtonBuilder[] {
	const event = announcement.event;
	const links: Array<{ label: string; url: string }> = [{ label: 'Zum Event', url }];

	for (const link of event.links || []) {
		if (isWebUrl(link?.url)) {
			links.push({ label: (link.label || '').trim() || 'Link', url: link.url });
		}
	}

	if ((event.links || []).length === 0 && isWebUrl(event.link)) {
		links.push({ label: (event.linkText || '').trim() || 'Link', url: event.link });
	}

	const location = event.locations?.[0];
	if (isWebUrl(location?.link)) {
		links.push({ label: (location!.linkText || '').trim() || 'Standort', url: location!.link! });
	}

	return links.slice(0, MAX_LINK_BUTTONS).map((link) =>
		new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(truncate(link.label, 80)).setURL(link.url),
	);
}

export function buildEventReminderMessage(
	announcement: EventAnnouncement,
	images: EventMessageImages,
	options: EventMessageOptions = {},
): V2Message {
	const event = announcement.event;
	const cancelled = !!options.cancelled;
	const url = eventUrl(event.id);
	const title = (event.title || '').trim() || 'Event';
	let accent = announcement.minutesBefore >= 0 ? EVENT_ACCENT : EVENT_ACCENT_AFTER_START;
	if (cancelled) {
		accent = EVENT_ACCENT_CANCELLED;
	}

	const header = cancelled
		? `## ~~${title}~~\n**Abgesagt** – dieses Event findet nicht statt.`
		: `## [${escapeLinkLabel(title)}](${url})`;
	const meta = buildMetaLines(announcement, cancelled).join('\n');
	const warnings = buildWarningText(announcement);
	const warningText = warnings ? `**Inhaltswarnungen:** ||${warnings}||` : '';
	const bottom = buildBottomLines(announcement).join('\n');
	const footer = `-# ${buildReminderText(announcement.minutesBefore)} · Elpisgarten`;
	const mentionLine = (options.mentionLine || '').trim();

	// The body gets whatever text budget is left after all other parts.
	const fixedLength = [header, meta, warningText, bottom, footer, mentionLine].reduce((sum, part) => sum + part.length, 0);
	const body = truncate(stripTitleFromContent(announcement.content, title), Math.max(0, V2_TEXT_LIMIT - fixedLength - 50));

	const container = new ContainerBuilder().setAccentColor(accent);
	const iconUrl = imageUrl(images.icon, 'thumb');
	const headerDisplay = new TextDisplayBuilder().setContent(header);

	if (iconUrl) {
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(headerDisplay)
				.setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl).setDescription(truncate(title, 1024))),
		);
	} else {
		container.addTextDisplayComponents(headerDisplay);
	}

	container.addTextDisplayComponents(new TextDisplayBuilder().setContent(meta));

	if (warningText) {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(warningText));
	}

	if (body) {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
	}

	if (bottom) {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(bottom));
	}

	const bannerUrl = imageUrl(images.banner);
	if (bannerUrl && !cancelled) {
		container.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(bannerUrl).setDescription(truncate(title, 1024))),
		);
	}

	container
		.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(footer));

	if (!cancelled) {
		const buttons = buildLinkButtons(announcement, url);
		if (buttons.length > 0) {
			container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
		}
	}

	const components: Array<ContainerBuilder | TextDisplayBuilder> = [];
	if (mentionLine) {
		components.push(new TextDisplayBuilder().setContent(mentionLine));
	}
	components.push(container);

	return { flags: MessageFlags.IsComponentsV2, components };
}
