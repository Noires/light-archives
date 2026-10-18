import { DateTime } from 'luxon';
import { EventSeriesRule } from '../src/enums/event-series-rule.enum';
import { computeNextOccurrences, EventSeriesSpec, formatEventSeriesLabel, validateEventSeriesSpec } from '../src/event-series';

const ZONE = 'Europe/Berlin';

function at(iso: string): number {
  return DateTime.fromISO(iso, { zone: ZONE }).toMillis();
}

function fmt(millis: number | null): string | null {
  return millis === null ? null : DateTime.fromMillis(millis, { zone: ZONE }).toFormat("yyyy-MM-dd'T'HH:mm");
}

describe('event-series', () => {
  const saturday20: EventSeriesSpec = {
    rule: EventSeriesRule.WEEKLY,
    weekday: 6,
    startTime: '20:00',
    endTime: '23:00',
  };

  describe('computeNextOccurrences (weekly)', () => {
    it('returns the next Saturdays from a Wednesday', () => {
      // 2024-01-03 is a Wednesday
      const result = computeNextOccurrences(saturday20, at('2024-01-03T12:00'), 3, ZONE);

      expect(result.map((o) => fmt(o.startDateTime))).toEqual([
        '2024-01-06T20:00',
        '2024-01-13T20:00',
        '2024-01-20T20:00',
      ]);
      expect(fmt(result[0].endDateTime)).toBe('2024-01-06T23:00');
    });

    it('includes today when the occurrence has not started yet', () => {
      const result = computeNextOccurrences(saturday20, at('2024-01-06T19:59'), 1, ZONE);
      expect(fmt(result[0].startDateTime)).toBe('2024-01-06T20:00');
    });

    it('skips today when the occurrence already started', () => {
      const result = computeNextOccurrences(saturday20, at('2024-01-06T20:01'), 1, ZONE);
      expect(fmt(result[0].startDateTime)).toBe('2024-01-13T20:00');
    });

    it('keeps the wall-clock time across the DST switch', () => {
      // DST starts on 2024-03-31 in Europe/Berlin
      const result = computeNextOccurrences(saturday20, at('2024-03-25T00:00'), 2, ZONE);
      expect(result.map((o) => fmt(o.startDateTime))).toEqual(['2024-03-30T20:00', '2024-04-06T20:00']);
      expect(new Date(result[0].startDateTime).toISOString()).toBe('2024-03-30T19:00:00.000Z');
      expect(new Date(result[1].startDateTime).toISOString()).toBe('2024-04-06T18:00:00.000Z');
    });

    it('rolls the end over midnight when the end time is earlier than the start time', () => {
      const result = computeNextOccurrences(
        { ...saturday20, startTime: '22:00', endTime: '02:00' },
        at('2024-01-01T00:00'),
        1,
        ZONE,
      );
      expect(fmt(result[0].endDateTime)).toBe('2024-01-07T02:00');
    });

    it('uses endDurationDays when given', () => {
      const result = computeNextOccurrences(
        { ...saturday20, endTime: '18:00', endDurationDays: 1 },
        at('2024-01-01T00:00'),
        1,
        ZONE,
      );
      expect(fmt(result[0].endDateTime)).toBe('2024-01-07T18:00');
    });

    it('returns null end without endTime', () => {
      const result = computeNextOccurrences({ ...saturday20, endTime: null }, at('2024-01-01T00:00'), 1, ZONE);
      expect(result[0].endDateTime).toBeNull();
    });
  });

  describe('computeNextOccurrences (biweekly)', () => {
    it('respects the anchor week parity', () => {
      const spec: EventSeriesSpec = { ...saturday20, rule: EventSeriesRule.BIWEEKLY, anchorDate: '2024-01-13' };
      const result = computeNextOccurrences(spec, at('2024-01-01T00:00'), 3, ZONE);

      // 2024-01-06 is the off week relative to the anchor 2024-01-13
      expect(result.map((o) => fmt(o.startDateTime))).toEqual([
        '2024-01-13T20:00',
        '2024-01-27T20:00',
        '2024-02-10T20:00',
      ]);
    });

    it('works with an anchor in the future and across years', () => {
      const spec: EventSeriesSpec = { ...saturday20, rule: EventSeriesRule.BIWEEKLY, anchorDate: '2025-01-04' };
      const result = computeNextOccurrences(spec, at('2024-12-20T00:00'), 2, ZONE);
      expect(result.map((o) => fmt(o.startDateTime))).toEqual(['2024-12-21T20:00', '2025-01-04T20:00']);
    });

    it('starts with the first matching week without an anchor', () => {
      const spec: EventSeriesSpec = { ...saturday20, rule: EventSeriesRule.BIWEEKLY };
      const result = computeNextOccurrences(spec, at('2024-01-01T00:00'), 2, ZONE);
      expect(result.map((o) => fmt(o.startDateTime))).toEqual(['2024-01-06T20:00', '2024-01-20T20:00']);
    });
  });

  describe('computeNextOccurrences (monthly-nth)', () => {
    it('returns the first Friday of each month', () => {
      const spec: EventSeriesSpec = { rule: EventSeriesRule.MONTHLY_NTH, weekday: 5, nth: 1, startTime: '21:00' };
      const result = computeNextOccurrences(spec, at('2024-01-10T00:00'), 3, ZONE);
      expect(result.map((o) => fmt(o.startDateTime))).toEqual([
        '2024-02-02T21:00',
        '2024-03-01T21:00',
        '2024-04-05T21:00',
      ]);
    });

    it('returns the last Sunday of each month', () => {
      const spec: EventSeriesSpec = { rule: EventSeriesRule.MONTHLY_NTH, weekday: 7, nth: -1, startTime: '19:30' };
      const result = computeNextOccurrences(spec, at('2024-01-01T00:00'), 3, ZONE);
      expect(result.map((o) => fmt(o.startDateTime))).toEqual([
        '2024-01-28T19:30',
        '2024-02-25T19:30',
        '2024-03-31T19:30',
      ]);
    });

    it('skips months without a fifth weekday', () => {
      const spec: EventSeriesSpec = { rule: EventSeriesRule.MONTHLY_NTH, weekday: 1, nth: 5, startTime: '20:00' };
      const result = computeNextOccurrences(spec, at('2024-01-01T00:00'), 2, ZONE);
      // Fifth Mondays in 2024: Jan 29, Apr 29
      expect(result.map((o) => fmt(o.startDateTime))).toEqual(['2024-01-29T20:00', '2024-04-29T20:00']);
    });
  });

  describe('validation', () => {
    it('rejects invalid specs and returns no occurrences', () => {
      const invalid: EventSeriesSpec = { rule: EventSeriesRule.MONTHLY_NTH, weekday: 3, startTime: '20:00' };
      expect(validateEventSeriesSpec(invalid)).not.toBeNull();
      expect(computeNextOccurrences(invalid, at('2024-01-01T00:00'), 3, ZONE)).toEqual([]);
      expect(validateEventSeriesSpec({ ...saturday20, weekday: 8 })).not.toBeNull();
      expect(validateEventSeriesSpec({ ...saturday20, startTime: '25:00' })).not.toBeNull();
      expect(validateEventSeriesSpec(saturday20)).toBeNull();
    });
  });

  describe('formatEventSeriesLabel', () => {
    it('formats German labels', () => {
      expect(formatEventSeriesLabel({ ...saturday20, endTime: null })).toBe('Jeden Samstag · 20:00');
      expect(formatEventSeriesLabel(saturday20)).toBe('Jeden Samstag · 20:00–23:00');
      expect(formatEventSeriesLabel({ ...saturday20, rule: EventSeriesRule.BIWEEKLY, endTime: null }))
        .toBe('Jeden zweiten Samstag · 20:00');
      expect(formatEventSeriesLabel({ rule: EventSeriesRule.MONTHLY_NTH, weekday: 7, nth: -1, startTime: '19:30' }))
        .toBe('Jeden letzten Sonntag im Monat · 19:30');
    });
  });
});
