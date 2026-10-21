// Model and Markdown renderer for previews of Steward's Discord posts
// (Components V2: an accent container holding text, a title section with a
// thumbnail, media, separators and link buttons). Mirrors what the bot builds
// in server/apps/steward/src/bot/messages/*.ts; the builders that fill this
// model live next to the features (noticeboard/discord-message.ts,
// event/discord-reminder.ts).

export interface DiscordPreviewButton {
  label: string;
  url: string;
}

export type DiscordPreviewComponent =
  | { type: 'text'; content: string }
  | { type: 'section'; content: string; thumbnailUrl: string }
  | { type: 'media'; url: string; alt: string }
  | { type: 'separator' }
  | { type: 'buttons'; buttons: DiscordPreviewButton[] };

export interface DiscordPreviewMessage {
  /** Mention tokens posted above the container (shown as mention pills). */
  mentionLine: string;
  /** Container accent colour, e.g. '#4F7BA6'. */
  accentColor: string;
  components: DiscordPreviewComponent[];
}

export function hexColor(value: number): string {
  return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
}

/** Discord's limit for all text in one Components V2 message. */
export const V2_TEXT_LIMIT = 4000;

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function escapeLinkLabel(value: string): string {
  return value.replace(/[[\]\\]/g, (char) => `\\${char}`);
}

export function isWebUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Mention tokens, as Steward extracts them (server/apps/steward/src/bot/mentions.ts).
const LEGACY_USER = /@([A-Za-z0-9_.-]+)#([0-9]{1,4})/g;
const NAMED_USER = /@\{([^}]+)\}/g;
const ROLE = /(^|[\s(])@([A-Za-z0-9][A-Za-z0-9_-]*)/g;
const RESERVED_ROLE_NAMES = new Set(['everyone', 'here']);

export function extractMentionTokens(content: string): string {
  const tokens = new Set<string>();
  const text = content || '';

  for (const match of text.matchAll(LEGACY_USER)) {
    tokens.add(match[0]);
  }

  for (const match of text.matchAll(NAMED_USER)) {
    tokens.add(match[0]);
  }

  const withoutUsers = text.replace(LEGACY_USER, '').replace(NAMED_USER, '');
  for (const match of withoutUsers.matchAll(ROLE)) {
    if (!RESERVED_ROLE_NAMES.has(match[2].toLowerCase())) {
      tokens.add(`@${match[2]}`);
    }
  }

  return Array.from(tokens).join(' ');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { hour: '2-digit', minute: '2-digit' },
  T: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  d: { day: '2-digit', month: '2-digit', year: 'numeric' },
  D: { day: 'numeric', month: 'long', year: 'numeric' },
  f: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  F: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
};

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** A Discord timestamp `<t:unix:style>` the way Discord shows it to a German reader (local time). */
export function formatDiscordTimestamp(unix: number, style: string, now = Date.now()): string {
  const date = new Date(unix * 1000);

  if (style === 'R') {
    const diffSeconds = Math.round((date.getTime() - now) / 1000);
    const [unit, size] = RELATIVE_UNITS.find(([, seconds]) => Math.abs(diffSeconds) >= seconds) || RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
    return new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' }).format(Math.round(diffSeconds / size), unit);
  }

  return new Intl.DateTimeFormat('de-DE', DATE_FORMATS[style] || DATE_FORMATS.f).format(date);
}

function renderInline(line: string, now: number): string {
  const codes: string[] = [];
  let html = line.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  html = html
    .replace(/&lt;t:(-?\d+)(?::([tTdDfFR]))?&gt;/g, (_, unix: string, style?: string) =>
      `<span class="discord-preview__timestamp">${escapeHtml(formatDiscordTimestamp(Number(unix), style || 'f', now))}</span>`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<span class="discord-preview__link">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\|\|([^|]+)\|\|/g, '<span class="discord-preview__spoiler" role="button" tabindex="0" aria-label="Spoiler anzeigen">$1</span>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\\([[\]\\])/g, '$1');

  return html.replace(/\u0000(\d+)\u0000/g, (_, index: string) => codes[Number(index)]);
}

/** The Discord Markdown subset Steward uses, as escaped HTML. */
export function renderDiscordMarkdown(source: string, now = Date.now()): string {
  const lines = escapeHtml(source || '').split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (heading) {
      out.push(`<span class="discord-preview__h${heading[1].length}">${renderInline(heading[2], now)}</span>`);
      continue;
    }

    if (line.startsWith('-# ')) {
      out.push(`<span class="discord-preview__subtext">${renderInline(line.slice(3), now)}</span>`);
      continue;
    }

    if (line.startsWith('&gt; ')) {
      out.push(`<span class="discord-preview__quote">${renderInline(line.slice(5), now)}</span>`);
      continue;
    }

    out.push(`${renderInline(line, now)}<br>`);
  }

  return out.join('').replace(/<br>$/, '');
}

/** Mention tokens as Discord-style pills; the real bot resolves them against the guild. */
export function renderMentionLine(tokens: string): string {
  return (tokens || '')
    .split(' ')
    .filter((token) => token.length > 0)
    .map((token) => {
      const named = /^@\{(.+)\}$/.exec(token);
      const label = named ? `@${named[1]}` : token;
      return `<span class="discord-preview__mention">${escapeHtml(label)}</span>`;
    })
    .join(' ');
}
