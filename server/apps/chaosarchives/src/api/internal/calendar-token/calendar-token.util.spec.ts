import { calendarFeedUrl, generateCalendarToken, isCalendarTokenFormat } from './calendar-token.util';

describe('calendar token', () => {
  it('generates 32 random bytes as unpadded base64url', () => {
    const token = generateCalendarToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(isCalendarTokenFormat(token)).toBe(true);
  });

  it('generates a different token each time', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateCalendarToken()));
    expect(tokens.size).toBe(50);
  });

  it('rejects malformed tokens without a lookup', () => {
    expect(isCalendarTokenFormat('')).toBe(false);
    expect(isCalendarTokenFormat('a'.repeat(42))).toBe(false);
    expect(isCalendarTokenFormat('a'.repeat(44))).toBe(false);
    expect(isCalendarTokenFormat(`${'a'.repeat(42)}=`)).toBe(false);
    expect(isCalendarTokenFormat(`${'a'.repeat(42)}+`)).toBe(false);
  });

  it('builds the public feed URL', () => {
    expect(calendarFeedUrl('https://elpisgarten.de/', 'abc')).toBe('https://elpisgarten.de/api/internal/calendar/abc.ics');
  });
});
