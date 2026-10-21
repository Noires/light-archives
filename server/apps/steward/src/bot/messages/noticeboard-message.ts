import { Image, NoticeboardItem } from '@app/entity';
import { noticeboardLocations } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType, noticeboardTypes } from '@app/shared/enums/noticeboard-type.enum';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	TextDisplayBuilder,
	time,
	TimestampStyles,
} from 'discord.js';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import sanitizeHtml from 'sanitize-html';
import { V2_TEXT_LIMIT, V2Message } from './event-message';
import { characterUrl, escapeLinkLabel, imageUrl, noticeboardUrl, truncate, venueUrl } from './format';

// Noticeboard item ("Aushang") as a Components V2 message: accent container
// with a type/location/author line, title, Markdown body, optional image and
// link buttons to the item and its venue.

export const NOTICEBOARD_ACCENT = 0x8b6b79;

const DISCORD_HTML_ALLOWED_TAGS = ['a', 'b', 'i', 'strong', 'em', 'code', 'tt', 'blockquote', 'p', 'br', 'ul', 'ol', 'li'];
const DISCORD_HTML_ALLOWED_ATTRIBUTES = { a: ['href'] };

export function noticeboardBodyMarkdown(content: string): string {
	const sanitized = sanitizeHtml(content || '', {
		allowedTags: DISCORD_HTML_ALLOWED_TAGS,
		allowedAttributes: DISCORD_HTML_ALLOWED_ATTRIBUTES,
	});
	return NodeHtmlMarkdown.translate(sanitized).trim();
}

export function buildNoticeboardMessage(item: NoticeboardItem, image: Image | null, mentionLine?: string): V2Message {
	const url = noticeboardUrl(item.id);
	const title = (item.title || '').trim() || 'Aushang';
	const typeLabel = noticeboardTypes[item.type] || noticeboardTypes[NoticeboardType.AUSHANG];
	const locationLabel = noticeboardLocations[item.location] || item.location;

	const authorName = (item.owner?.name || '').trim();
	const authorServer = (item.owner?.server?.name || '').trim();
	const authorUrl = characterUrl(item);
	const authorLabel = authorServer ? `${authorName} (${authorServer})` : authorName;
	let author = '';
	if (authorName) {
		author = authorUrl ? ` · von [${escapeLinkLabel(authorLabel)}](${authorUrl})` : ` · von ${authorLabel}`;
	}
	const eyebrow = `-# Anschlagbrett · ${typeLabel} · ${locationLabel}${author}`;
	const header = `## [${escapeLinkLabel(title)}](${url})`;

	const venueName = (item.venue?.name || '').trim();
	const venueServer = (item.venue?.server?.name || '').trim();
	const venueLine = venueName ? `**Treffpunkt:** ${venueServer ? `${venueName} (${venueServer})` : venueName}` : '';
	const footer = `-# Aushang vom ${time(item.createdAt || new Date(), TimestampStyles.LongDate)} · Elpisgarten`;
	const mention = (mentionLine || '').trim();

	const fixedLength = [eyebrow, header, venueLine, footer, mention].reduce((sum, part) => sum + part.length, 0);
	const body = truncate(noticeboardBodyMarkdown(item.content), Math.max(0, V2_TEXT_LIMIT - fixedLength - 50));

	const container = new ContainerBuilder()
		.setAccentColor(NOTICEBOARD_ACCENT)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${eyebrow}\n${header}`));

	if (body) {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));
	}

	const pictureUrl = imageUrl(image);
	if (pictureUrl) {
		container.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(pictureUrl).setDescription(truncate(title, 1024))),
		);
	}

	if (venueLine) {
		container.addTextDisplayComponents(new TextDisplayBuilder().setContent(venueLine));
	}

	container.addTextDisplayComponents(new TextDisplayBuilder().setContent(footer));

	const buttons = [new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Aushang ansehen').setURL(url)];
	if (item.venue?.id) {
		buttons.push(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Treffpunkt').setURL(venueUrl(item.venue.id)));
	}
	container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));

	const components: Array<ContainerBuilder | TextDisplayBuilder> = [];
	if (mention) {
		components.push(new TextDisplayBuilder().setContent(mention));
	}
	components.push(container);

	return { flags: MessageFlags.IsComponentsV2, components };
}
