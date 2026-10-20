import { decode } from 'html-entities';

/**
 * Minimal RFC 5545 (iCalendar) writer. Pure functions only, so they can be unit tested.
 * All date-times are written in UTC ("Z" form), which every calendar client converts
 * to the viewer's local zone (Europe/Berlin for the FFXIV Light server).
 */

export interface IcsEvent {
  uid: string;
  start: Date;
  end?: Date | null;
  summary: string;
  location?: string | null;
  url?: string | null;
  description?: string | null;
  lastModified?: Date | null;
}

export interface IcsCalendarOptions {
  name?: string;
  timezone?: string;
  now?: Date;
}

const CRLF = '\r\n';
const MAX_LINE_OCTETS = 75;
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

/** Escape a TEXT value (RFC 5545 §3.3.11): backslash, semicolon, comma and newlines. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Format a date as a UTC DATE-TIME value, e.g. 20240101T200000Z. */
export function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Fold a content line to at most 75 octets per line (RFC 5545 §3.1), never splitting a UTF-8 sequence. */
export function foldIcsLine(line: string): string {
  const chunks: string[] = [];
  let current = '';
  let currentOctets = 0;
  // Continuation lines start with a space, which counts towards the limit
  let limit = MAX_LINE_OCTETS;

  for (const char of line) {
    const octets = Buffer.byteLength(char, 'utf8');

    if (currentOctets + octets > limit) {
      chunks.push(current);
      current = '';
      currentOctets = 0;
      limit = MAX_LINE_OCTETS - 1;
    }

    current += char;
    currentOctets += octets;
  }

  chunks.push(current);
  return chunks.join(`${CRLF} `);
}

/** Convert rich-text HTML (as stored by the editor) into plain text for DESCRIPTION. */
export function htmlToIcsPlainText(html: string): string {
  const text = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6]|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '');

  return decode(text)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function property(name: string, value: string): string {
  return foldIcsLine(`${name}:${value}`);
}

export function buildIcsEvent(event: IcsEvent, now: Date): string[] {
  const end = event.end && event.end.getTime() > event.start.getTime()
    ? event.end
    : new Date(event.start.getTime() + DEFAULT_DURATION_MS);
  const lines = [
    'BEGIN:VEVENT',
    property('UID', escapeIcsText(event.uid)),
    property('DTSTAMP', formatIcsDate(now)),
    property('DTSTART', formatIcsDate(event.start)),
    property('DTEND', formatIcsDate(end)),
    property('SUMMARY', escapeIcsText(event.summary)),
  ];

  if (event.location) {
    lines.push(property('LOCATION', escapeIcsText(event.location)));
  }

  if (event.url) {
    // URL is of value type URI and must not be TEXT-escaped
    lines.push(property('URL', event.url));
  }

  if (event.description) {
    lines.push(property('DESCRIPTION', escapeIcsText(event.description)));
  }

  if (event.lastModified) {
    lines.push(property('LAST-MODIFIED', formatIcsDate(event.lastModified)));
  }

  lines.push('END:VEVENT');
  return lines;
}

export function buildIcsCalendar(events: IcsEvent[], options: IcsCalendarOptions = {}): string {
  const now = options.now || new Date();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Light Archives//Elpisgarten//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  if (options.name) {
    lines.push(property('X-WR-CALNAME', escapeIcsText(options.name)));
  }

  if (options.timezone) {
    lines.push(property('X-WR-TIMEZONE', options.timezone));
  }

  for (const event of events) {
    lines.push(...buildIcsEvent(event, now));
  }

  lines.push('END:VCALENDAR');
  return lines.join(CRLF) + CRLF;
}
