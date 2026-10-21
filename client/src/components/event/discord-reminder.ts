import { DISCORD_CONTENT_NOTE_LABELS, DISCORD_EVENT_TYPE_LABELS } from '@app/shared/discord/discord-labels';
import type { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventType } from '@app/shared/enums/event-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import {
  DiscordPreviewButton,
  DiscordPreviewComponent,
  DiscordPreviewMessage,
  escapeLinkLabel,
  extractMentionTokens,
  hexColor,
  isWebUrl,
  truncate,
  V2_TEXT_LIMIT,
} from '../vision/discord-preview';

// Client-side mirror of buildEventReminderMessage() in
// server/apps/steward/src/bot/messages/event-message.ts. Keep both in sync:
// accent container (other colour after the start), linked title with the
// event icon, Beginn/Ende as Discord timestamps plus the server time,
// Ort/Typ, spoilered content warnings, text, contact/registration/notes,
// banner, reminder footer and up to five link buttons.

export const EVENT_ACCENT = 0x4f7ba6;
export const EVENT_ACCENT_AFTER_START = 0xb77986;
const MAX_LINK_BUTTONS = 5;

type PreviewEvent = BaseEventDto & { id?: number };

function serverTime(ms: number): string {
  return DateTime.fromMillis(ms, { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }).toFormat("HH:mm 'ST'");
}

function sameServerDay(a: number, b: number): boolean {
  const zone = SharedConstants.FFXIV_SERVER_TIMEZONE;
  return DateTime.fromMillis(a, { zone }).hasSame(DateTime.fromMillis(b, { zone }), 'day');
}

function unix(ms: number): number {
  return Math.floor(ms / 1000);
}

export function reminderText(minutesBefore: number): string {
  if (minutesBefore === 0) {
    return 'Erinnerung: zum Eventbeginn';
  }

  const absoluteMinutes = Math.abs(minutesBefore);
  const direction = minutesBefore > 0 ? 'vorher' : 'nach Beginn';

  if (absoluteMinutes % 10080 === 0) {
    const weeks = absoluteMinutes / 10080;
    return `Erinnerung: ${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'} ${direction}`;
  }

  if (absoluteMinutes % 1440 === 0) {
    const days = absoluteMinutes / 1440;
    return `Erinnerung: ${days} ${days === 1 ? 'Tag' : 'Tage'} ${direction}`;
  }

  if (absoluteMinutes % 60 === 0) {
    const hours = absoluteMinutes / 60;
    return `Erinnerung: ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'} ${direction}`;
  }

  return `Erinnerung: ${absoluteMinutes} Minuten ${direction}`;
}

function plainText(html: string): string {
  if (!html || typeof DOMParser === 'undefined') {
    return '';
  }

  const doc = new DOMParser().parseFromString(`<body>${html.replace(/<\/(p|div|li)>/gi, '</$1>\n').replace(/<br\s*\/?>/gi, '\n')}</body>`, 'text/html');
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

/** The reminder text as the bot posts it: an empty text falls back to the event description (filled on save). */
function reminderBody(event: PreviewEvent, content: string): string {
  const title = (event.title || '').trim();
  const trimmed = (content || '').trim() || `${title}\n\n${plainText(event.details || '')}`.trim();

  if (!trimmed || trimmed === title) {
    return '';
  }

  const prefix = `${title}\n\n`;
  return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length).trim() : trimmed;
}

function metaLines(event: PreviewEvent): string[] {
  const start = event.startDateTime;
  const lines: string[] = [];

  if (start) {
    lines.push(`**Beginn:** <t:${unix(start)}:F> (<t:${unix(start)}:R>) · ${serverTime(start)}`);
  }

  if (start && event.endDateTime) {
    const style = sameServerDay(start, event.endDateTime) ? 't' : 'f';
    lines.push(`**Ende:** <t:${unix(event.endDateTime)}:${style}> · ${serverTime(event.endDateTime)}`);
  }

  const location = event.locations?.[0];
  const locationParts = [location?.name, location?.address, location?.server].map((part) => (part || '').trim()).filter((part) => part.length > 0);
  if (locationParts.length > 0) {
    lines.push(`**Ort:** ${locationParts.join(' · ')}`);
  }

  const type = [
    DISCORD_EVENT_TYPE_LABELS[event.eventType] || DISCORD_EVENT_TYPE_LABELS[EventType.RP],
    event.adultOnly ? '18+' : null,
    event.closedEvent ? 'Geschlossen' : null,
  ].filter((value): value is string => !!value).join(' | ');
  lines.push(`**Typ:** ${type}`);
  return lines;
}

function bottomLines(event: PreviewEvent): string[] {
  const lines: string[] = [];

  if (event.contact && event.contact.trim().length > 0) {
    lines.push(`**Kontakt:** ${event.contact.trim()}`);
  }

  if (event.closedEvent && event.registrationDeadlineDays !== null && event.registrationDeadlineDays !== undefined) {
    lines.push(event.registrationDeadlineTime
      ? `**Anmeldung:** ${event.registrationDeadlineDays} Tag(e) vorher um ${event.registrationDeadlineTime} ST`
      : `**Anmeldung:** ${event.registrationDeadlineDays} Tag(e) vorher`);
  }

  if (event.extraInfo && event.extraInfo.trim().length > 0) {
    lines.push(`**Hinweis:** ${event.extraInfo.trim()}`);
  }

  return lines;
}

function linkButtons(event: PreviewEvent, url: string): DiscordPreviewButton[] {
  const links: DiscordPreviewButton[] = [{ label: 'Zum Event', url }];

  for (const link of event.links || []) {
    if (isWebUrl(link?.url)) {
      links.push({ label: (link.label || '').trim() || 'Link', url: link.url });
    }
  }

  if ((event.links || []).length === 0 && isWebUrl(event.link)) {
    links.push({ label: (event.linkText || '').trim() || 'Link', url: event.link });
  }

  const location = event.locations?.[0];
  if (location && isWebUrl(location.link)) {
    links.push({ label: (location.linkText || '').trim() || 'Standort', url: location.link });
  }

  return links.slice(0, MAX_LINK_BUTTONS).map((link) => ({ label: truncate(link.label, 80), url: link.url }));
}

export function buildEventReminderPreview(
  event: PreviewEvent,
  announcement: { minutesBefore: number; content: string },
  origin: string,
): DiscordPreviewMessage {
  const url = `${origin}/event/${event.id || '…'}`;
  const title = (event.title || '').trim() || 'Event';
  const header = `## [${escapeLinkLabel(title)}](${url})`;
  const meta = metaLines(event).join('\n');
  const warnings = (event.contentNotes || []).map((note) => DISCORD_CONTENT_NOTE_LABELS[note] || note).filter((value) => value.length > 0);
  const warningText = warnings.length > 0 ? `**Inhaltswarnungen:** ||${warnings.join(' | ')}||` : '';
  const bottom = bottomLines(event).join('\n');
  const footer = `-# ${reminderText(announcement.minutesBefore)} · Elpisgarten`;
  const mentionLine = extractMentionTokens(announcement.content || '');

  const fixedLength = [header, meta, warningText, bottom, footer, mentionLine].reduce((sum, part) => sum + part.length, 0);
  const body = truncate(reminderBody(event, announcement.content), Math.max(0, V2_TEXT_LIMIT - fixedLength - 50));

  const components: DiscordPreviewComponent[] = [];
  const iconUrl = event.icon?.thumbUrl || event.icon?.url || '';
  components.push(iconUrl ? { type: 'section', content: header, thumbnailUrl: iconUrl } : { type: 'text', content: header });
  components.push({ type: 'text', content: meta });

  if (warningText) {
    components.push({ type: 'text', content: warningText });
  }
  if (body) {
    components.push({ type: 'text', content: body });
  }
  if (bottom) {
    components.push({ type: 'text', content: bottom });
  }

  const bannerUrl = event.discordBanner?.url || event.banner?.url || '';
  if (bannerUrl) {
    components.push({ type: 'media', url: bannerUrl, alt: title });
  }

  components.push({ type: 'separator' }, { type: 'text', content: footer }, { type: 'buttons', buttons: linkButtons(event, url) });

  return {
    mentionLine,
    accentColor: hexColor(announcement.minutesBefore >= 0 ? EVENT_ACCENT : EVENT_ACCENT_AFTER_START),
    components,
  };
}
