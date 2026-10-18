import { DateTime } from 'luxon';
import { EventSeriesRule } from './enums/event-series-rule.enum';
import SharedConstants from './SharedConstants';

/**
 * ER2-804: pure recurrence logic for event series. No Node-only imports, so the client can reuse it.
 * Weekdays follow Luxon (1 = Monday ... 7 = Sunday). Times are 'HH:mm' in the server timezone.
 */

export interface EventSeriesSpec {
  rule: EventSeriesRule | string;
  weekday: number;
  nth?: number | null;
  startTime: string;
  endTime?: string | null;
  endDurationDays?: number | null;
  /** ISO date (yyyy-MM-dd) of a reference occurrence; decides the week parity for 'biweekly' */
  anchorDate?: string | null;
}

export interface EventOccurrence {
  startDateTime: number;
  endDateTime: number | null;
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const GERMAN_WEEKDAYS: readonly string[] = Object.freeze([
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
]);

const GERMAN_ORDINALS: { [nth: number]: string } = {
  1: 'ersten',
  2: 'zweiten',
  3: 'dritten',
  4: 'vierten',
  5: 'fünften',
  [-1]: 'letzten',
};

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = TIME_REGEX.exec(time || '');
  return match ? { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) } : null;
}

/** Returns a German error message, or null when the spec is valid. */
export function validateEventSeriesSpec(spec: EventSeriesSpec): string | null {
  if (![EventSeriesRule.WEEKLY, EventSeriesRule.BIWEEKLY, EventSeriesRule.MONTHLY_NTH].includes(spec.rule as EventSeriesRule)) {
    return 'Unbekannte Wiederholungsregel.';
  }

  if (!Number.isInteger(spec.weekday) || spec.weekday < 1 || spec.weekday > 7) {
    return 'Ungültiger Wochentag.';
  }

  if (spec.rule === EventSeriesRule.MONTHLY_NTH
    && (spec.nth === null || spec.nth === undefined || GERMAN_ORDINALS[spec.nth] === undefined)) {
    return 'Für monatliche Serien muss angegeben werden, der wievielte Wochentag gemeint ist.';
  }

  if (!parseTime(spec.startTime)) {
    return 'Ungültige Startzeit.';
  }

  if (spec.endTime && !parseTime(spec.endTime)) {
    return 'Ungültige Endzeit.';
  }

  if (spec.endDurationDays !== null && spec.endDurationDays !== undefined
    && (!Number.isInteger(spec.endDurationDays) || spec.endDurationDays < 0 || spec.endDurationDays > 7)) {
    return 'Ungültige Dauer.';
  }

  if (spec.anchorDate && !DateTime.fromISO(spec.anchorDate).isValid) {
    return 'Ungültiges Referenzdatum.';
  }

  return null;
}

/** German label, e.g. "Jeden Samstag · 20:00", "Jeden zweiten Freitag · 21:00–23:00", "Jeden letzten Sonntag im Monat · 19:30". */
export function formatEventSeriesLabel(spec: EventSeriesSpec): string {
  const weekday = GERMAN_WEEKDAYS[spec.weekday - 1] || '';
  let prefix: string;

  switch (spec.rule) {
    case EventSeriesRule.BIWEEKLY:
      prefix = `Jeden zweiten ${weekday}`;
      break;
    case EventSeriesRule.MONTHLY_NTH:
      prefix = `Jeden ${GERMAN_ORDINALS[spec.nth ?? 1] || GERMAN_ORDINALS[1]} ${weekday} im Monat`;
      break;
    default:
      prefix = `Jeden ${weekday}`;
  }

  const time = spec.endTime ? `${spec.startTime}–${spec.endTime}` : spec.startTime;
  return time ? `${prefix} · ${time}` : prefix;
}

function buildOccurrence(day: DateTime, spec: EventSeriesSpec, zone: string): EventOccurrence | null {
  const start = parseTime(spec.startTime);

  if (!start) {
    return null;
  }

  const startDateTime = DateTime.fromObject(
    { year: day.year, month: day.month, day: day.day, hour: start.hour, minute: start.minute },
    { zone },
  );
  let endDateTime: DateTime | null = null;
  const end = spec.endTime ? parseTime(spec.endTime) : null;

  if (end) {
    const crossesMidnight = end.hour * 60 + end.minute <= start.hour * 60 + start.minute;
    const durationDays = spec.endDurationDays ?? (crossesMidnight ? 1 : 0);
    const endDay = day.plus({ days: durationDays });
    endDateTime = DateTime.fromObject(
      { year: endDay.year, month: endDay.month, day: endDay.day, hour: end.hour, minute: end.minute },
      { zone },
    );

    if (endDateTime.toMillis() <= startDateTime.toMillis()) {
      endDateTime = endDateTime.plus({ days: 1 });
    }
  }

  return {
    startDateTime: startDateTime.toMillis(),
    endDateTime: endDateTime ? endDateTime.toMillis() : null,
  };
}

function nthWeekdayOfMonth(monthStart: DateTime, weekday: number, nth: number): DateTime | null {
  if (nth === -1) {
    const last = monthStart.endOf('month').startOf('day');
    return last.minus({ days: (last.weekday - weekday + 7) % 7 });
  }

  const day = monthStart.plus({ days: ((weekday - monthStart.weekday + 7) % 7) + (nth - 1) * 7 });
  return day.month === monthStart.month ? day : null;
}

/**
 * Computes the next `count` occurrences that start at or after `fromMillis`, in the given zone
 * (default: the FFXIV server timezone). Wall-clock times are kept stable across DST changes.
 */
export function computeNextOccurrences(
  spec: EventSeriesSpec,
  fromMillis: number,
  count: number,
  zone: string = SharedConstants.FFXIV_SERVER_TIMEZONE,
): EventOccurrence[] {
  const result: EventOccurrence[] = [];

  if (count <= 0 || validateEventSeriesSpec(spec) !== null) {
    return result;
  }

  const from = DateTime.fromMillis(fromMillis, { zone });

  if (spec.rule === EventSeriesRule.MONTHLY_NTH) {
    let monthStart = from.startOf('month');

    for (let i = 0; i < count * 3 + 24 && result.length < count; i++) {
      const day = nthWeekdayOfMonth(monthStart, spec.weekday, spec.nth!);

      if (day) {
        const occurrence = buildOccurrence(day, spec, zone);

        if (occurrence && occurrence.startDateTime >= fromMillis) {
          result.push(occurrence);
        }
      }

      monthStart = monthStart.plus({ months: 1 });
    }

    return result;
  }

  const fromDay = from.startOf('day');
  let day = fromDay.plus({ days: (spec.weekday - fromDay.weekday + 7) % 7 });
  const anchorWeek = spec.rule === EventSeriesRule.BIWEEKLY && spec.anchorDate
    ? DateTime.fromISO(spec.anchorDate, { zone }).startOf('week')
    : null;

  for (let i = 0; i < count * 2 + 4 && result.length < count; i++) {
    let matchesParity = true;

    if (spec.rule === EventSeriesRule.BIWEEKLY) {
      if (anchorWeek) {
        const weeks = Math.round(day.startOf('week').diff(anchorWeek, 'days').days / 7);
        matchesParity = Math.abs(weeks) % 2 === 0;
      } else {
        // Without an anchor the first matching week counts as week 0
        matchesParity = result.length === 0 || Math.round(
          day.diff(DateTime.fromMillis(result[0].startDateTime, { zone }).startOf('day'), 'days').days / 7,
        ) % 2 === 0;
      }
    }

    if (matchesParity) {
      const occurrence = buildOccurrence(day, spec, zone);

      if (occurrence && occurrence.startDateTime >= fromMillis) {
        result.push(occurrence);
      }
    }

    day = day.plus({ days: 7 });
  }

  return result;
}
