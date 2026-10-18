// ER2-507 / ER2-509 — venue opening status and weekly hours.
//
// Uses the server-computed `openNow` / `opensAt` / `closesAt` (ER2-805) when
// the API sends them, and otherwise derives the status from `openingHours` or
// the legacy weekly event template (`eventStartWeekday` / `eventStartTime` /
// `eventEndTime` / `eventEndDurationDays`). All times are server time
// (Europe/Berlin). Older APIs send none of these fields: the status is then
// 'unknown' and callers show no badge.
//
// NOTE: a sibling helper (`common/opening-status.ts`) is being written for the
// home hub on another branch; deduplicate once both are merged.
import SharedConstants from '@app/shared/SharedConstants';
import type { StatusBadgeType } from 'components/vision/types';
import { DateTime } from 'luxon';

const ZONE = SharedConstants.FFXIV_SERVER_TIMEZONE;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

export type VenueOpenState = 'open' | 'soon' | 'closed' | 'unknown';

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

interface Interval {
	start: DateTime;
	end: DateTime;
}

function parseTime(value: string): [number, number] | null {
	const match = TIME_REGEX.exec(value);
	return match ? [ Number(match[1]), Number(match[2]) ] : null;
}

function parseIso(value?: string): DateTime | null {
	if (!value) {
		return null;
	}
	const dt = DateTime.fromISO(value, { zone: ZONE });
	return dt.isValid ? dt : null;
}

/** Weekly slots from explicit opening hours, else from the event template. */
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

function intervals(slots: WeeklySlot[], now: DateTime): Interval[] {
	const weekStart = now.startOf('week');
	const result: Interval[] = [];
	for (const offset of [ -1, 0, 1 ]) {
		for (const slot of slots) {
			const open = parseTime(slot.openTime);
			const close = parseTime(slot.closeTime);
			if (!open || !close) {
				continue;
			}
			const start = weekStart
				.plus({ weeks: offset, days: slot.weekday - 1 })
				.set({ hour: open[0], minute: open[1], second: 0, millisecond: 0 });
			let end = start.set({ hour: close[0], minute: close[1] });
			if (slot.overnight || end <= start) {
				end = end.plus({ days: 1 });
			}
			result.push({ start, end });
		}
	}
	return result.sort((a, b) => a.start.toMillis() - b.start.toMillis());
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

export function getVenueStatus(source: VenueHoursSource | null | undefined, at?: DateTime): VenueStatus {
	const unknown: VenueStatus = { state: 'unknown', label: '', detail: '' };
	if (!source) {
		return unknown;
	}
	const now = (at || DateTime.now()).setZone(ZONE);

	if (typeof source.openNow === 'boolean') {
		return source.openNow
			? openStatus(parseIso(source.closesAt))
			: closedStatus(parseIso(source.opensAt), now);
	}

	const slots = weeklySlots(source);
	if (slots.length === 0) {
		return unknown;
	}
	const list = intervals(slots, now);
	const current = list.find((interval) => now >= interval.start && now < interval.end);
	if (current) {
		return openStatus(current.end);
	}
	const next = list.find((interval) => interval.start > now);
	return closedStatus(next ? next.start : null, now);
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
