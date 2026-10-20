// ER2-304 / ER2-507 / ER2-509 — the one opening-status helper for venues.
//
// Two front ends share one interval engine (computeOpeningStatus):
// - getVenueOpenInfo (home hub): epoch millis, "Bald" within a time window.
// - getVenueStatus / weekRows / shortHours / isOpenToday (venue directory,
//   venue page, event location card): badge label + detail and the weekly
//   hours table. components/venues/venue-status.ts re-exports these.
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
import type { StatusBadgeType } from 'components/vision/types';
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

// ---------------------------------------------------------------------------
// Venue directory / venue page API (formerly components/venues/venue-status.ts)
//
// Differences to getVenueOpenInfo, kept on purpose because the venue pages
// were designed around them:
// - The weekly template only yields a slot when it has an end time (no
//   assumed 3 h duration), so the hours table never shows invented times.
// - A closed venue is "soon" when it opens later the same (server) day.
// - Labels read "Geöffnet · bis 02:00", "Öffnet um 20:00", "Geschlossen".
// Both share computeOpeningStatus, which merges overlapping or touching
// slots, so "bis" is the end of the merged opening (the old venue helper
// reported the end of the first slot; otherwise the results are identical).
// ---------------------------------------------------------------------------

export const WEEKDAYS_SHORT = [ 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So' ];
export const WEEKDAYS_LONG = [ 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag' ];

export interface VenueHoursSource {
	openNow?: boolean;
	opensAt?: string;
	closesAt?: string;
	openingHours?: { weekday: number; openTime: string; closeTime: string; overnight?: boolean }[];
	eventStartWeekday?: number | null;
	eventStartTime?: string | null;
	eventEndTime?: string | null;
	eventEndDurationDays?: number | null;
}

export interface VenueStatus {
	state: VenueOpenState;
	/** Badge text: "Geöffnet · bis 02:00", "Öffnet um 20:00", "Geschlossen". */
	label: string;
	/** Optional longer hint, e.g. "Öffnet Sa., 20:00". */
	detail: string;
}

export interface WeeklySlot {
	weekday: number;
	openTime: string;
	closeTime: string;
	overnight: boolean;
}

export interface WeekRow {
	weekday: number;
	label: string;
	short: string;
	ranges: string[];
	today: boolean;
}

function parseZonedIso(value?: string): DateTime | null {
	if (!value) {
		return null;
	}
	const dt = DateTime.fromISO(value, { zone: ZONE });
	return dt.isValid ? dt : null;
}

/** Weekly slots from explicit opening hours, else from the event template (only with an end time). */
export function weeklySlots(source: VenueHoursSource): WeeklySlot[] {
	if (source.openingHours && source.openingHours.length > 0) {
		return source.openingHours
			.filter((slot) => slot.weekday >= 1 && slot.weekday <= 7 && parseTime(slot.openTime) && parseTime(slot.closeTime))
			.map((slot) => ({
				weekday: slot.weekday,
				openTime: slot.openTime,
				closeTime: slot.closeTime,
				overnight: !!slot.overnight || slot.closeTime <= slot.openTime,
			}))
			.sort((a, b) => a.weekday - b.weekday || a.openTime.localeCompare(b.openTime));
	}

	const weekday = source.eventStartWeekday;
	const start = source.eventStartTime || '';
	const end = source.eventEndTime || '';
	if (weekday && weekday >= 1 && weekday <= 7 && parseTime(start) && parseTime(end)) {
		return [ {
			weekday,
			openTime: start,
			closeTime: end,
			overnight: (source.eventEndDurationDays || 0) > 0 || end <= start,
		} ];
	}
	return [];
}

function openStatus(closes: DateTime | null): VenueStatus {
	return {
		state: 'open',
		label: closes ? `Geöffnet · bis ${closes.toFormat('HH:mm')}` : 'Geöffnet',
		detail: '',
	};
}

function closedStatus(opens: DateTime | null, now: DateTime): VenueStatus {
	if (opens && opens.hasSame(now, 'day') && opens > now) {
		return { state: 'soon', label: `Öffnet um ${opens.toFormat('HH:mm')}`, detail: '' };
	}
	let detail = '';
	if (opens && opens > now) {
		const days = opens.startOf('day').diff(now.startOf('day'), 'days').days;
		detail = days <= 1
			? `Öffnet morgen, ${opens.toFormat('HH:mm')}`
			: `Öffnet ${opens.setLocale('de').toFormat('ccc., HH:mm')}`;
	}
	return { state: 'closed', label: 'Geschlossen', detail };
}

/** Badge state, label and detail for the venue pages. 'unknown' without any data. */
export function getVenueStatus(source: VenueHoursSource | null | undefined, at?: DateTime): VenueStatus {
	const unknown: VenueStatus = { state: 'unknown', label: '', detail: '' };
	if (!source) {
		return unknown;
	}
	const now = (at || DateTime.now()).setZone(ZONE);

	if (typeof source.openNow === 'boolean') {
		return source.openNow
			? openStatus(parseZonedIso(source.closesAt))
			: closedStatus(parseZonedIso(source.opensAt), now);
	}

	const slots = weeklySlots(source);
	if (slots.length === 0) {
		return unknown;
	}
	const status = computeOpeningStatus(slots, [], now.toMillis(), ZONE);
	return status.openNow
		? openStatus(parseZonedIso(status.closesAt))
		: closedStatus(parseZonedIso(status.opensAt), now);
}

/** True when the venue is open now, opens later today or has a slot today. */
export function isOpenToday(source: VenueHoursSource | null | undefined, at?: DateTime): boolean {
	if (!source) {
		return false;
	}
	const status = getVenueStatus(source, at);
	if (status.state === 'open' || status.state === 'soon') {
		return true;
	}
	const today = (at || DateTime.now()).setZone(ZONE).weekday;
	return weeklySlots(source).some((slot) => slot.weekday === today);
}

export function statusBadgeType(state: VenueOpenState): StatusBadgeType {
	switch (state) {
		case 'open': return 'open';
		case 'soon': return 'soon';
		default: return 'server';
	}
}

function rangeLabel(slot: WeeklySlot): string {
	return `${slot.openTime}–${slot.closeTime}`;
}

/** Short opening hours, e.g. "Fr, Sa · 20:00–02:00". Empty without data. */
export function shortHours(source: VenueHoursSource | null | undefined): string {
	if (!source) {
		return '';
	}
	const groups = new Map<string, number[]>();
	for (const slot of weeklySlots(source)) {
		const key = rangeLabel(slot);
		groups.set(key, [ ...(groups.get(key) || []), slot.weekday ]);
	}
	return Array.from(groups.entries())
		.map(([ range, days ]) => `${days.map((day) => WEEKDAYS_SHORT[day - 1]).join(', ')} · ${range}`)
		.join('; ');
}

/** Monday to Sunday rows for the opening-hours card. */
export function weekRows(source: VenueHoursSource | null | undefined, at?: DateTime): WeekRow[] {
	const slots = source ? weeklySlots(source) : [];
	const today = (at || DateTime.now()).setZone(ZONE).weekday;
	return WEEKDAYS_LONG.map((label, index) => {
		const weekday = index + 1;
		return {
			weekday,
			label,
			short: WEEKDAYS_SHORT[index],
			ranges: slots.filter((slot) => slot.weekday === weekday).map(rangeLabel),
			today: weekday === today,
		};
	});
}

/*
 * Sanity checks (dev only; the client has no test runner). Run them in the
 * browser console of a dev build, or re-check by hand when changing the
 * engine. Server time is Europe/Berlin; 2026-10-16 is a Friday.
 *
 *   const fri = DateTime.fromISO('2026-10-16T21:00', { zone: 'Europe/Berlin' });
 *   const slots = { openingHours: [ { weekday: 5, openTime: '20:00', closeTime: '02:00' } ] };
 *
 *   getVenueStatus(slots, fri)                          -> open, 'Geöffnet · bis 02:00'
 *   getVenueStatus(slots, fri.set({ hour: 18 }))        -> soon, 'Öffnet um 20:00'
 *   getVenueStatus(slots, fri.plus({ days: 1 }).set({ hour: 1 })) -> open (overnight from Friday)
 *   getVenueStatus(slots, fri.plus({ days: 2 }))        -> closed, detail 'Öffnet Fr., 20:00'
 *   getVenueStatus({ eventStartWeekday: 5, eventStartTime: '20:00' }, fri) -> unknown (no end time)
 *   getVenueStatus({ openNow: false, opensAt: fri.plus({ hours: 1 }).toISO() }, fri) -> soon
 *   getVenueStatus(null)                                -> unknown, ''
 *
 *   getVenueOpenInfo(slots, fri.toMillis()).label                    -> 'Geöffnet bis 02:00'
 *   getVenueOpenInfo(slots, fri.set({ hour: 19 }).toMillis()).state  -> 'soon' (within 120 min)
 *   getVenueOpenInfo(slots, fri.set({ hour: 17 }).toMillis()).state  -> 'closed', 'Öffnet um 20:00'
 *   getVenueOpenInfo({ eventStartWeekday: 5, eventStartTime: '20:00' }, fri.toMillis()).label
 *                                                       -> 'Geöffnet bis 23:00' (assumed 3 h)
 *
 *   weekRows(slots, fri)[4]  -> { label: 'Freitag', ranges: [ '20:00–02:00' ], today: true }
 *   shortHours(slots)        -> 'Fr · 20:00–02:00'
 */
