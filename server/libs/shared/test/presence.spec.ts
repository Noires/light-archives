import { RpStatus } from '../src/enums/rp-status.enum';
import {
  computeRpStatusExpiry,
  normalizeRpLocation,
  resolveRpPresence,
  RP_STATUS_DEFAULT_MINUTES,
  RP_STATUS_MAX_MINUTES,
} from '../src/presence';

const NOW = Date.UTC(2024, 0, 6, 20, 0, 0);
const MINUTE = 60 * 1000;

describe('presence', () => {
  describe('computeRpStatusExpiry', () => {
    it('defaults to three hours', () => {
      expect(computeRpStatusExpiry(NOW)).toBe(NOW + RP_STATUS_DEFAULT_MINUTES * MINUTE);
      expect(computeRpStatusExpiry(NOW, null)).toBe(NOW + 180 * MINUTE);
    });

    it('caps at six hours', () => {
      expect(computeRpStatusExpiry(NOW, 24 * 60)).toBe(NOW + RP_STATUS_MAX_MINUTES * MINUTE);
    });

    it('enforces a minimum duration', () => {
      expect(computeRpStatusExpiry(NOW, 0)).toBe(NOW + 15 * MINUTE);
      expect(computeRpStatusExpiry(NOW, -5)).toBe(NOW + 15 * MINUTE);
    });

    it('keeps durations in range', () => {
      expect(computeRpStatusExpiry(NOW, 90)).toBe(NOW + 90 * MINUTE);
    });
  });

  describe('resolveRpPresence', () => {
    it('returns the status while it is valid', () => {
      expect(resolveRpPresence('lfrp', ' Ul\'dah,  Markt ', new Date(NOW + MINUTE), NOW)).toEqual({
        rpStatus: RpStatus.LFRP,
        rpLocation: 'Ul\'dah, Markt',
        rpStatusExpiresAt: NOW + MINUTE,
      });
    });

    it('treats expired statuses as null', () => {
      const expected = { rpStatus: null, rpLocation: null, rpStatusExpiresAt: null };
      expect(resolveRpPresence('ic', 'Gridania', new Date(NOW - 1), NOW)).toEqual(expected);
      expect(resolveRpPresence('ic', 'Gridania', NOW, NOW)).toEqual(expected);
    });

    it('treats missing expiry or unknown statuses as null', () => {
      expect(resolveRpPresence('ic', null, null, NOW).rpStatus).toBeNull();
      expect(resolveRpPresence('afk', null, NOW + MINUTE, NOW).rpStatus).toBeNull();
      expect(resolveRpPresence(null, 'x', NOW + MINUTE, NOW).rpLocation).toBeNull();
    });
  });

  describe('normalizeRpLocation', () => {
    it('trims, collapses whitespace and limits the length', () => {
      expect(normalizeRpLocation('  ')).toBeNull();
      expect(normalizeRpLocation(undefined)).toBeNull();
      expect(normalizeRpLocation('a'.repeat(100))).toHaveLength(80);
    });
  });
});
