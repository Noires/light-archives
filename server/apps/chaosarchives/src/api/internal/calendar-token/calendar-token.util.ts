import { randomBytes } from 'crypto';

const TOKEN_BYTES = 32;
/** 32 bytes in unpadded base64url are exactly 43 characters */
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{43}$/;

export function generateCalendarToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function isCalendarTokenFormat(token: string): boolean {
  return TOKEN_FORMAT.test(token);
}

export function calendarFeedUrl(frontendRoot: string, token: string): string {
  return `${frontendRoot.replace(/\/+$/, '')}/api/internal/calendar/${token}.ics`;
}
