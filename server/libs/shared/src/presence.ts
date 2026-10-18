import { RP_STATUSES, RpStatus } from './enums/rp-status.enum';

/**
 * ER2-806: pure helpers for the RP presence status. A status always expires (DSGVO: opt-in,
 * auto-expiry, no history). Expired statuses are treated as absent when read.
 */

export const RP_STATUS_DEFAULT_MINUTES = 180;
export const RP_STATUS_MAX_MINUTES = 360;
export const RP_STATUS_MIN_MINUTES = 15;
export const RP_LOCATION_MAX_LENGTH = 80;

export interface RpPresence {
  rpStatus: RpStatus | null;
  rpLocation: string | null;
  /** epoch millis */
  rpStatusExpiresAt: number | null;
}

export const NO_RP_PRESENCE: Readonly<RpPresence> = Object.freeze({
  rpStatus: null,
  rpLocation: null,
  rpStatusExpiresAt: null,
});

/** Expiry for a new status: default 3 h, clamped to [15 min, 6 h]. */
export function computeRpStatusExpiry(nowMillis: number, durationMinutes?: number | null): number {
  const requested = durationMinutes === null || durationMinutes === undefined || !Number.isFinite(durationMinutes)
    ? RP_STATUS_DEFAULT_MINUTES
    : Math.floor(durationMinutes);
  const minutes = Math.max(RP_STATUS_MIN_MINUTES, Math.min(RP_STATUS_MAX_MINUTES, requested));
  return nowMillis + minutes * 60 * 1000;
}

export function normalizeRpLocation(location?: string | null): string | null {
  const trimmed = (location || '').replace(/\s+/g, ' ').trim().slice(0, RP_LOCATION_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

/** Returns the effective presence; expired, unknown or incomplete statuses resolve to "no status". */
export function resolveRpPresence(
  status: string | null | undefined,
  location: string | null | undefined,
  expiresAt: Date | number | null | undefined,
  nowMillis: number,
): RpPresence {
  if (!status || !RP_STATUSES.includes(status as RpStatus) || expiresAt === null || expiresAt === undefined) {
    return { ...NO_RP_PRESENCE };
  }

  const expiresMillis = typeof expiresAt === 'number' ? expiresAt : expiresAt.getTime();

  if (!Number.isFinite(expiresMillis) || expiresMillis <= nowMillis) {
    return { ...NO_RP_PRESENCE };
  }

  return {
    rpStatus: status as RpStatus,
    rpLocation: normalizeRpLocation(location),
    rpStatusExpiresAt: expiresMillis,
  };
}
