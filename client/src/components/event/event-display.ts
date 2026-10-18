// ER2-501 / ER2-504 — shared helpers for event lists and the event detail.
// All dates are shown in server time (Europe/Berlin).
import { EventType } from '@app/shared/enums/event-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';

export const SERVER_ZONE = SharedConstants.FFXIV_SERVER_TIMEZONE;

/** Events without an end time count as running for this long. */
const DEFAULT_DURATION_HOURS = 4;

export interface EventTimes {
	startDateTime: number;
	endDateTime?: number | null;
}

export interface EventAdultFlags {
	title?: string;
	adultOnly?: boolean;
	eventType?: EventType | string | null;
}

export interface EventLocationLike {
	name?: string;
	address?: string;
	server?: string;
}

export function serverDateTime(millis: number): DateTime {
	return DateTime.fromMillis(millis, { zone: SERVER_ZONE }).setLocale('de');
}

export function effectiveEnd(event: EventTimes): number {
	if (event.endDateTime && event.endDateTime > event.startDateTime) {
		return event.endDateTime;
	}
	return event.startDateTime + DEFAULT_DURATION_HOURS * 3600 * 1000;
}

export function isEventLive(event: EventTimes, now = Date.now()): boolean {
	return event.startDateTime <= now && now < effectiveEnd(event);
}

export function isEventOver(event: EventTimes, now = Date.now()): boolean {
	return effectiveEnd(event) <= now;
}

export function isAdultEvent(event: EventAdultFlags): boolean {
	if (event.adultOnly) {
		return true;
	}
	return event.eventType === EventType.ADULT || /18\+/.test(event.title || '');
}

/** "20:00–23:30" in server time; just the start when there is no end. */
export function timeRange(event: EventTimes): string {
	const start = serverDateTime(event.startDateTime);
	if (!event.endDateTime || event.endDateTime === event.startDateTime) {
		return start.toFormat('HH:mm');
	}
	const end = serverDateTime(event.endDateTime);
	const endLabel = end.hasSame(start, 'day') || end.diff(start, 'hours').hours < 24
		? end.toFormat('HH:mm')
		: end.toFormat('d. LLL, HH:mm');
	return `${start.toFormat('HH:mm')}–${endLabel}`;
}

export function locationLabel(location: EventLocationLike | null | undefined, withServer = true): string {
	if (!location) {
		return '';
	}
	const main = location.name || location.address || '';
	if (withServer && location.server && main) {
		return `${main} · ${location.server}`;
	}
	return main || location.server || '';
}

export function countLabel(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}
