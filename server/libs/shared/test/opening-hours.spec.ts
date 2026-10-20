import { DateTime } from 'luxon';
import { computeOpeningStatus, deriveOpeningHoursFromTemplate, OpeningHoursSlot } from '../src/opening-hours';

const ZONE = 'Europe/Berlin';

function at(iso: string): number {
  return DateTime.fromISO(iso, { zone: ZONE }).toMillis();
}

function local(iso?: string): string | undefined {
  return iso ? DateTime.fromISO(iso, { zone: ZONE }).toFormat("yyyy-MM-dd'T'HH:mm") : undefined;
}

describe('opening-hours', () => {
  // 2024-01-06 is a Saturday, 2024-01-07 a Sunday
  const saturdayEvening: OpeningHoursSlot = { weekday: 6, openTime: '20:00', closeTime: '23:00' };

  it('is open inside a slot and reports the closing time', () => {
    const status = computeOpeningStatus([saturdayEvening], [], at('2024-01-06T21:00'), ZONE);
    expect(status.openNow).toBe(true);
    expect(local(status.closesAt)).toBe('2024-01-06T23:00');
    expect(status.opensAt).toBeUndefined();
  });

  it('is closed before a slot and reports the next opening', () => {
    const status = computeOpeningStatus([saturdayEvening], [], at('2024-01-06T19:00'), ZONE);
    expect(status.openNow).toBe(false);
    expect(local(status.opensAt)).toBe('2024-01-06T20:00');
  });

  it('treats the closing minute as closed and points to next week', () => {
    const status = computeOpeningStatus([saturdayEvening], [], at('2024-01-06T23:00'), ZONE);
    expect(status.openNow).toBe(false);
    expect(local(status.opensAt)).toBe('2024-01-13T20:00');
  });

  it('handles overnight slots from the previous day', () => {
    const overnight: OpeningHoursSlot = { weekday: 6, openTime: '22:00', closeTime: '03:00', overnight: true };
    const status = computeOpeningStatus([overnight], [], at('2024-01-07T01:30'), ZONE);
    expect(status.openNow).toBe(true);
    expect(local(status.closesAt)).toBe('2024-01-07T03:00');
  });

  it('infers overnight when the close time is before the open time', () => {
    const slot: OpeningHoursSlot = { weekday: 6, openTime: '22:00', closeTime: '02:00' };
    expect(computeOpeningStatus([slot], [], at('2024-01-07T01:00'), ZONE).openNow).toBe(true);
  });

  it('merges adjacent slots across midnight', () => {
    const slots: OpeningHoursSlot[] = [
      { weekday: 6, openTime: '18:00', closeTime: '00:00', overnight: true },
      { weekday: 7, openTime: '00:00', closeTime: '02:00' },
    ];
    const status = computeOpeningStatus(slots, [], at('2024-01-06T23:30'), ZONE);
    expect(status.openNow).toBe(true);
    expect(local(status.closesAt)).toBe('2024-01-07T02:00');
  });

  it('respects closed exceptions', () => {
    const status = computeOpeningStatus(
      [saturdayEvening],
      [{ date: '2024-01-06', closed: true, note: 'Urlaub' }],
      at('2024-01-06T21:00'),
      ZONE,
    );
    expect(status.openNow).toBe(false);
    expect(local(status.opensAt)).toBe('2024-01-13T20:00');
  });

  it('ignores exceptions that are not closures', () => {
    const status = computeOpeningStatus(
      [saturdayEvening],
      [{ date: '2024-01-06', closed: false, note: 'Themenabend' }],
      at('2024-01-06T21:00'),
      ZONE,
    );
    expect(status.openNow).toBe(true);
  });

  it('a closure on the start day also cancels the overnight part', () => {
    const overnight: OpeningHoursSlot = { weekday: 6, openTime: '22:00', closeTime: '03:00', overnight: true };
    const status = computeOpeningStatus(
      [overnight],
      [{ date: '2024-01-06', closed: true }],
      at('2024-01-07T01:00'),
      ZONE,
    );
    expect(status.openNow).toBe(false);
  });

  it('returns closed without opensAt when there are no slots', () => {
    expect(computeOpeningStatus([], [], at('2024-01-06T21:00'), ZONE)).toEqual({ openNow: false });
  });

  it('ignores invalid slots', () => {
    const status = computeOpeningStatus([{ weekday: 9, openTime: 'xx', closeTime: '23:00' }], [], at('2024-01-06T21:00'), ZONE);
    expect(status).toEqual({ openNow: false });
  });

  describe('deriveOpeningHoursFromTemplate', () => {
    it('derives one slot from the weekly event template', () => {
      expect(deriveOpeningHoursFromTemplate({
        eventStartWeekday: 5,
        eventStartTime: '21:00',
        eventEndTime: '01:00',
        eventEndDurationDays: 1,
      })).toEqual([{ weekday: 5, openTime: '21:00', closeTime: '01:00', overnight: true }]);
    });

    it('assumes three hours without an end time', () => {
      expect(deriveOpeningHoursFromTemplate({ eventStartWeekday: 5, eventStartTime: '22:30' }))
        .toEqual([{ weekday: 5, openTime: '22:30', closeTime: '01:30', overnight: true }]);
    });

    it('returns nothing without a template', () => {
      expect(deriveOpeningHoursFromTemplate({})).toEqual([]);
      expect(deriveOpeningHoursFromTemplate({ eventStartWeekday: 5 })).toEqual([]);
    });
  });
});
