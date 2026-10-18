import {
  buildIcsCalendar,
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
  htmlToIcsPlainText,
} from './ics';

describe('ics', () => {
  describe('escapeIcsText', () => {
    it('escapes commas, semicolons, backslashes and newlines', () => {
      expect(escapeIcsText('a,b;c\\d\ne\r\nf')).toBe('a\\,b\\;c\\\\d\\ne\\nf');
    });

    it('leaves colons and plain text untouched', () => {
      expect(escapeIcsText('Ul\'dah: Taverne')).toBe('Ul\'dah: Taverne');
    });
  });

  describe('formatIcsDate', () => {
    it('formats as UTC basic format', () => {
      expect(formatIcsDate(new Date(Date.UTC(2024, 0, 6, 19, 30, 5, 123)))).toBe('20240106T193005Z');
    });
  });

  describe('foldIcsLine', () => {
    it('does not fold short lines', () => {
      expect(foldIcsLine('SUMMARY:Kurz')).toBe('SUMMARY:Kurz');
    });

    it('folds at 75 octets with CRLF + space', () => {
      const line = `DESCRIPTION:${'x'.repeat(200)}`;
      const folded = foldIcsLine(line);
      const parts = folded.split('\r\n');

      expect(parts.length).toBeGreaterThan(1);
      expect(Buffer.byteLength(parts[0], 'utf8')).toBe(75);
      for (const part of parts.slice(1)) {
        expect(part.startsWith(' ')).toBe(true);
        expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(75);
      }
      expect(parts.map((part, i) => (i === 0 ? part : part.slice(1))).join('')).toBe(line);
    });

    it('never splits multi-byte characters', () => {
      const line = `SUMMARY:${'ä'.repeat(80)}`;
      const parts = foldIcsLine(line).split('\r\n');

      for (const part of parts) {
        expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(75);
        expect(part).not.toContain('�');
      }
      expect(parts.map((part, i) => (i === 0 ? part : part.slice(1))).join('')).toBe(line);
    });
  });

  describe('htmlToIcsPlainText', () => {
    it('strips tags and decodes entities', () => {
      expect(htmlToIcsPlainText('<p>Hallo <strong>Welt</strong> &amp; Co.</p><p>Zweite<br>Zeile</p>'))
        .toBe('Hallo Welt & Co.\nZweite\nZeile');
    });
  });

  describe('buildIcsCalendar', () => {
    const now = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));

    it('builds a VCALENDAR with one VEVENT using CRLF line endings', () => {
      const ics = buildIcsCalendar([{
        uid: 'event-1@example.org',
        start: new Date(Date.UTC(2024, 0, 6, 19, 0, 0)),
        end: new Date(Date.UTC(2024, 0, 6, 22, 0, 0)),
        summary: 'Taverne, Musik; Tanz',
        location: 'Goldene Kelle, Bezirk 5',
        url: 'https://example.org/event/1',
        description: 'Zeile 1\nZeile 2',
      }], { now, name: 'Test', timezone: 'Europe/Berlin' });

      expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
      expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
      expect(ics).not.toMatch(/[^\r]\n/);
      expect(ics).toContain('\r\nUID:event-1@example.org\r\n');
      expect(ics).toContain('\r\nDTSTAMP:20240101T000000Z\r\n');
      expect(ics).toContain('\r\nDTSTART:20240106T190000Z\r\n');
      expect(ics).toContain('\r\nDTEND:20240106T220000Z\r\n');
      expect(ics).toContain('\r\nSUMMARY:Taverne\\, Musik\\; Tanz\r\n');
      expect(ics).toContain('\r\nLOCATION:Goldene Kelle\\, Bezirk 5\r\n');
      expect(ics).toContain('\r\nURL:https://example.org/event/1\r\n');
      expect(ics).toContain('\r\nDESCRIPTION:Zeile 1\\nZeile 2\r\n');
      expect(ics).toContain('\r\nX-WR-TIMEZONE:Europe/Berlin\r\n');
    });

    it('defaults DTEND to two hours after DTSTART when no end is given', () => {
      const ics = buildIcsCalendar([{
        uid: 'event-2@example.org',
        start: new Date(Date.UTC(2024, 0, 6, 19, 0, 0)),
        end: null,
        summary: 'Ohne Ende',
      }], { now });

      expect(ics).toContain('\r\nDTEND:20240106T210000Z\r\n');
      expect(ics).not.toContain('LOCATION:');
    });

    it('builds an empty calendar', () => {
      const ics = buildIcsCalendar([], { now });
      expect(ics).not.toContain('BEGIN:VEVENT');
    });
  });
});
