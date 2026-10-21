import { s3Configuration, serverConfiguration } from '@app/configuration';
import { Image, NoticeboardItem } from '@app/entity';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';

// Shared formatting for Steward's Discord posts (labels, links, image URLs,
// server-time text). Pure functions only, so the message builders stay testable.

export {
	DISCORD_CONTENT_NOTE_LABELS as CONTENT_NOTE_LABELS,
	DISCORD_EVENT_TYPE_LABELS as EVENT_TYPE_LABELS,
} from '@app/shared/discord/discord-labels';

export function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

/** Escapes characters that would break a Markdown link label `[label](url)`. */
export function escapeLinkLabel(value: string): string {
	return value.replace(/[[\]\\]/g, (char) => `\\${char}`);
}

/** Only absolute http(s) URLs can be used as Discord link buttons and media. */
export function isWebUrl(value: string | null | undefined): value is string {
	if (!value) {
		return false;
	}

	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:';
	} catch {
		return false;
	}
}

/** In-game server time (Europe/Berlin) as text, e.g. "20:00 ST". */
export function formatServerTime(value: Date): string {
	return DateTime.fromJSDate(value, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }).toFormat("HH:mm 'ST'");
}

export function isSameServerDay(a: Date, b: Date): boolean {
	const zone = SharedConstants.FFXIV_SERVER_TIMEZONE;
	return DateTime.fromJSDate(a, { zone }).hasSame(DateTime.fromJSDate(b, { zone }), 'day');
}

export function buildReminderText(minutesBefore: number): string {
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

export function eventUrl(eventId: number): string {
	return `${serverConfiguration.frontendRoot}/event/${eventId}`;
}

export function noticeboardUrl(noticeboardItemId: number): string {
	return `${serverConfiguration.frontendRoot}/noticeboard/${noticeboardItemId}`;
}

export function venueUrl(venueId: number): string {
	return `${serverConfiguration.frontendRoot}/venue/${venueId}`;
}

export function characterUrl(item: NoticeboardItem): string | null {
	const serverName = (item.owner?.server?.name || '').trim();
	const characterName = (item.owner?.name || '').trim();

	if (!serverName || !characterName) {
		return null;
	}

	return `${serverConfiguration.frontendRoot}/${encodeURIComponent(serverName)}/${encodeURIComponent(characterName.replace(/ /g, '_'))}`;
}

/** Public S3 URL of an uploaded image (`thumb_` / `icon_` variants share the folder). */
export function imageUrl(image: Image | null | undefined, variant: 'original' | 'icon' | 'thumb' = 'original'): string | null {
	if (!image?.owner?.id) {
		return null;
	}

	const publicRootUrl = s3Configuration.publicRootUrl.endsWith('/')
		? s3Configuration.publicRootUrl
		: `${s3Configuration.publicRootUrl}/`;
	const filename = variant === 'original' ? image.filename : `${variant}_${image.filename}`;
	const path = [String(image.owner.id), image.hash, filename].map((segment) => encodeURIComponent(segment)).join('/');

	try {
		return new URL(path, publicRootUrl).toString();
	} catch {
		return null;
	}
}
