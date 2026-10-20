import { DateTime } from 'luxon';
import SharedConstants from './SharedConstants';

/**
 * ER2-805: pure opening-hours logic for venues. No Node-only imports, so the client can reuse it.
 * Weekdays follow Luxon (1 = Monday ... 7 = Sunday); times are 'HH:mm' in the server timezone.
 */

export interface OpeningHoursSlot {
  weekday: number;
  openTime: string;
  closeTime: string;
  /** Closes on the following day. Implied when closeTime <= openTime. */
  overnight?: boolean;
}

export interface OpeningHoursException {
  /** yyyy-MM-dd in the server timezone */
  date: string;
  /** true: closed on that day (slots starting that day are skipped) */
  closed: boolean;
  note?: string | null;
}

export interface OpeningStatus {
  openNow: boolean;
  /** ISO timestamp of the next opening (only when currently closed) */
  opensAt?: string;
  /** ISO timestamp of the current closing (only when currently open) */
  closesAt?: string;
}

export interface VenueEventTemplate {
  eventStartWeekday?: number | null;
  eventStartTime?: string | null;
  eventEndTime?: string | null;
  eventEndDurationDays?: number | null;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const LOOKAHEAD_DAYS = 14;
/** Assumed duration when a weekly template has no end time */
export const DEFAULT_TEMPLATE_DURATION_HOURS = 3;

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = TIME_REGEX.exec(time || '');
  return match ? { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) } : null;
}

export function isValidOpeningHoursSlot(slot: OpeningHoursSlot): boolean {
  return Number.isInteger(slot.weekday) && slot.weekday >= 1 && slot.weekday <= 7
    && !!parseTime(slot.openTime) && !!parseTime(slot.closeTime);
}

/** Derives a single slot from the venue's weekly event template (fallback when no opening hours exist). */
export function deriveOpeningHoursFromTemplate(template: VenueEventTemplate): OpeningHoursSlot[] {
  const weekday = template.eventStartWeekday;
  const start = template.eventStartTime ? parseTime(template.eventStartTime) : null;

  if (!weekday || weekday < 1 || weekday > 7 || !start || !template.eventStartTime) {
    return [];
  }

  let closeTime = template.eventEndTime && parseTime(template.eventEndTime) ? template.eventEndTime : null;
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

function buildIntervals(
  slots: OpeningHoursSlot[],
  exceptions: OpeningHoursException[],
  now: DateTime,
): Interval[] {
  const closedDates = new Set(exceptions.filter((e) => e.closed).map((e) => e.date));
  const intervals: Interval[] = [];
  const today = now.startOf('day');

  // Start one day back so overnight slots from yesterday are considered
  for (let offset = -1; offset <= LOOKAHEAD_DAYS; offset++) {
    const day = today.plus({ days: offset });

    if (closedDates.has(day.toISODate() || '')) {
      continue;
    }

    for (const slot of slots) {
      if (slot.weekday !== day.weekday || !isValidOpeningHoursSlot(slot)) {
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

  // Merge overlapping or touching intervals (e.g. 18:00-24:00 + 00:00-02:00)
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

/** Computes whether a venue is open at `nowMillis`, plus the next opening / current closing time. */
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
