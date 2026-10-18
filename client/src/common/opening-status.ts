// ER2-304 — shared "Geöffnet / Bald" helper for venues.
//
// Uses the server-computed status (ER2-805: openNow / opensAt / closesAt /
// openingHours) when the API delivers it, and otherwise falls back to the
// venue's weekly event template (eventStartWeekday / eventStartTime /
// eventEndTime / eventEndDurationDays) evaluated in the server time zone.
//
// computeOpeningStatus / deriveOpeningHoursFromTemplate mirror the pure
// functions in server/libs/shared/src/opening-hours.ts. They are ported
// rather than imported because the shared file resolves `luxon` from
// server/node_modules (v3), which would bundle a second Luxon copy next to
// the client's v2. Keep both in sync.
import type { VenueOpeningStatusDto } from '@app/shared/dto/venues/venue-opening-hours.dto';
import type {
	OpeningHoursException,
	OpeningHoursSlot,
	OpeningStatus,
	VenueEventTemplate,
} from '@app/shared/opening-hours';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';

export type { OpeningHoursException, OpeningHoursSlot, OpeningStatus, VenueEventTemplate };

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const LOOKAHEAD_DAYS = 14;
/** Assumed duration when a weekly template has no end time (same as the server). */
const DEFAULT_TEMPLATE_DURATION_HOURS = 3;

function parseTime(time: string | null | undefined): { hour: number; minute: number } | null {
	const match = TIME_REGEX.exec(time || '');
	return match ? { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) } : null;
}

function isValidSlot(slot: OpeningHoursSlot): boolean {
	return Number.isInteger(slot.weekday) && slot.weekday >= 1 && slot.weekday <= 7
		&& !!parseTime(slot.openTime) && !!parseTime(slot.closeTime);
}

/** Derives a single slot from the venue's weekly event template. */
export function deriveOpeningHoursFromTemplate(template: VenueEventTemplate): OpeningHoursSlot[] {
	const weekday = template.eventStartWeekday;
	const start = parseTime(template.eventStartTime);

	if (!weekday || weekday < 1 || weekday > 7 || !start || !template.eventStartTime) {
		return [];
	}

	let closeTime = parseTime(template.eventEndTime) ? (template.eventEndTime as string) : null;
	let overnight = (template.eventEndDurationDays ?? 0) > 0;

	if (!closeTime) {
		const endMinutes = start.hour * 60 + start.minute + DEFAULT_TEMPLATE_DURATION_HOURS * 60;
		closeTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
		overnight = endMinutes >= 24 * 60;
	}

	return [{ weekday, openTime: template.eventStartTime, closeTime, overnight }];
}

interface Interval {
	start: DateTime;
	end: DateTime;
}

function buildIntervals(slots: OpeningHoursSlot[], exceptions: OpeningHoursException[], now: DateTime): Interval[] {
	const closedDates = new Set(exceptions.filter((e) => e.closed).map((e) => e.date));
	const intervals: Interval[] = [];
	const today = now.startOf('day');

	// Start one day back so overnight slots from yesterday are considered.
	for (let offset = -1; offset <= LOOKAHEAD_DAYS; offset++) {
		const day = today.plus({ days: offset });
		if (closedDates.has(day.toISODate() || '')) {
			continue;
		}

		for (const slot of slots) {
			if (slot.weekday !== day.weekday || !isValidSlot(slot)) {
				continue;
			}
			const open = parseTime(slot.openTime)!;
			const close = parseTime(slot.closeTime)!;
			const start = day.set({ hour: open.hour, minute: open.minute, second: 0, millisecond: 0 });
			const crossesMidnight = slot.overnight || close.hour * 60 + close.minute <= open.hour * 60 + open.minute;
			const endDay = crossesMidnight ? day.plus({ days: 1 }) : day;
			const end = endDay.set({ hour: close.hour, minute: close.minute, second: 0, millisecond: 0 });
			if (end > start) {
				intervals.push({ start, end });
			}
		}
	}

	intervals.sort((a, b) => a.start.toMillis() - b.start.toMillis());

	const merged: Interval[] = [];
	for (const interval of intervals) {
		const last = merged[merged.length - 1];
		if (last && interval.start <= last.end) {
			if (interval.end > last.end) {
				last.end = interval.end;
			}
		} else {
			merged.push({ ...interval });
		}
	}
	return merged;
}

/** Whether a venue is open at `nowMillis`, plus the next opening / current closing (ISO). */
export function computeOpeningStatus(
	slots: OpeningHoursSlot[],
	exceptions: OpeningHoursException[],
	nowMillis: number,
	zone: string = SharedConstants.FFXIV_SERVER_TIMEZONE,
): OpeningStatus {
	const now = DateTime.fromMillis(nowMillis, { zone });
	const intervals = buildIntervals(slots, exceptions, now);
	const current = intervals.find((interval) => interval.start <= now && now < interval.end);

	if (current) {
		return { openNow: true, closesAt: current.end.toISO() || undefined };
	}
	const next = intervals.find((interval) => interval.start > now);
	return next ? { openNow: false, opensAt: next.start.toISO() || undefined } : { openNow: false };
}

export type VenueOpenState = 'open' | 'soon' | 'closed' | 'unknown';

/** Anything that may carry server status fields and/or the weekly template. */
export type VenueOpeningSource = VenueOpeningStatusDto & VenueEventTemplate;

export interface VenueOpenInfo {
	state: VenueOpenState;
	openNow: boolean;
	/** epoch millis of the next opening (closed / soon) */
	opensAt: number | null;
	/** epoch millis of the current closing (open) */
	closesAt: number | null;
	/** where the answer came from */
	source: 'server' | 'hours' | 'template' | 'none';
	/** German short label, e.g. "Geöffnet bis 23:00", "Öffnet um 20:00" */
	label: string;
}

/** Default window in which a closed venue counts as "Bald". */
export const OPENING_SOON_MINUTES = 120;

const ZONE = SharedConstants.FFXIV_SERVER_TIMEZONE;

function toMillis(iso: string | undefined | null): number | null {
	if (!iso) {
		return null;
	}
	const dt = DateTime.fromISO(iso);
	return dt.isValid ? dt.toMillis() : null;
}

/** True when the venue object carries anything the helper can evaluate. */
export function hasOpeningData(venue: VenueOpeningSource): boolean {
	return typeof venue.openNow === 'boolean'
		|| (Array.isArray(venue.openingHours) && venue.openingHours.length > 0)
		|| deriveOpeningHoursFromTemplate(venue).length > 0;
}

/** True when the API already delivered the ER2-805 status (no template fallback needed). */
export function hasServerOpeningStatus(venue: VenueOpeningStatusDto): boolean {
	return typeof venue.openNow === 'boolean';
}

function formatClock(millis: number): string {
	return DateTime.fromMillis(millis, { zone: ZONE }).toFormat('HH:mm');
}

function opensLabel(opensAt: number, nowMillis: number): string {
	const minutes = Math.round((opensAt - nowMillis) / 60000);
	if (minutes <= 59) {
		return minutes <= 1 ? 'Öffnet gleich' : `Öffnet in ${minutes} Min.`;
	}
	const open = DateTime.fromMillis(opensAt, { zone: ZONE }).setLocale('de');
	const now = DateTime.fromMillis(nowMillis, { zone: ZONE });
	const days = Math.round(open.startOf('day').diff(now.startOf('day'), 'days').days);
	if (days === 0) {
		return `Öffnet um ${open.toFormat('HH:mm')}`;
	}
	if (days === 1) {
		return `Öffnet morgen ${open.toFormat('HH:mm')}`;
	}
	return `Öffnet ${open.toFormat('ccc, HH:mm')}`;
}

/**
 * Opening state of a venue at `nowMillis`.
 * `soonMinutes`: a closed venue opening within this window is reported as 'soon'.
 */
export function getVenueOpenInfo(
	venue: VenueOpeningSource,
	nowMillis: number = Date.now(),
	soonMinutes: number = OPENING_SOON_MINUTES,
): VenueOpenInfo {
	let openNow = false;
	let opensAt: number | null = null;
	let closesAt: number | null = null;
	let source: VenueOpenInfo['source'] = 'none';

	if (typeof venue.openNow === 'boolean') {
		source = 'server';
		openNow = venue.openNow;
		opensAt = toMillis(venue.opensAt);
		closesAt = toMillis(venue.closesAt);
	} else {
		let slots: OpeningHoursSlot[] = [];
		if (Array.isArray(venue.openingHours) && venue.openingHours.length > 0) {
			slots = venue.openingHours;
			source = 'hours';
		} else {
			slots = deriveOpeningHoursFromTemplate(venue);
			source = slots.length > 0 ? 'template' : 'none';
		}

		if (source !== 'none') {
			const status = computeOpeningStatus(slots, [], nowMillis, ZONE);
			openNow = status.openNow;
			opensAt = toMillis(status.opensAt);
			closesAt = toMillis(status.closesAt);
		}
	}

	if (source === 'none') {
		return { state: 'unknown', openNow: false, opensAt: null, closesAt: null, source, label: '' };
	}

	if (openNow) {
		return {
			state: 'open',
			openNow,
			opensAt: null,
			closesAt,
			source,
			label: closesAt ? `Geöffnet bis ${formatClock(closesAt)}` : 'Geöffnet',
		};
	}

	const soon = opensAt !== null && opensAt > nowMillis && opensAt - nowMillis <= soonMinutes * 60000;
	return {
		state: soon ? 'soon' : 'closed',
		openNow: false,
		opensAt,
		closesAt: null,
		source,
		label: opensAt ? opensLabel(opensAt, nowMillis) : 'Geschlossen',
	};
}
