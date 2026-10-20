import type { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { noticeboardLocations } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType, noticeboardTypes } from '@app/shared/enums/noticeboard-type.enum';

// ER2-606 — client-side mirror of AnnouncementService.buildNoticeboardMessage()
// (server/apps/steward/src/bot/announcement.service.ts). Keep both in sync:
// colour, author "Name (Server)", title, description = body as Discord
// Markdown, fields Typ / Ort / Treffpunkt / Link(s), footer
// "Anschlagbrett • <Typ>", timestamp = creation time.

export const NOTICEBOARD_EMBED_COLOR = '#8B6B79';

const EMBED_DESCRIPTION_LIMIT = 4096;
const EMBED_FIELD_LIMIT = 1024;
const ALLOWED_TAGS = [ 'a', 'b', 'i', 'strong', 'em', 'code', 'tt', 'blockquote', 'p', 'br', 'ul', 'ol', 'li' ];

export interface NoticeboardEmbed {
  color: string;
  authorName: string;
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
  footer: string;
  timestamp: number | null;
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function inlineText(node: Node): string {
  return Array.from(node.childNodes).map((child) => nodeToMarkdown(child, 0)).join('');
}

function nodeToMarkdown(node: Node, depth: number): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').replace(/\s+/g, ' ');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  if (!ALLOWED_TAGS.includes(tag)) {
    // Like sanitize-html: drop the tag, keep the text.
    const inner = inlineText(element);
    return [ 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr' ].includes(tag) ? `\n\n${inner.trim()}\n\n` : inner;
  }

  switch (tag) {
    case 'b':
    case 'strong': {
      const inner = inlineText(element).trim();
      return inner ? `**${inner}**` : '';
    }
    case 'i':
    case 'em': {
      const inner = inlineText(element).trim();
      return inner ? `*${inner}*` : '';
    }
    case 'code':
    case 'tt':
      return `\`${element.textContent || ''}\``;
    case 'a': {
      const href = element.getAttribute('href') || '';
      const text = inlineText(element).trim();
      return /^https?:\/\//.test(href) ? `[${text || href}](${href})` : text;
    }
    case 'br':
      return '\n';
    case 'p':
      return `\n\n${inlineText(element).trim()}\n\n`;
    case 'blockquote':
      return `\n\n${inlineText(element).trim().split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
    case 'ul':
    case 'ol': {
      const ordered = tag === 'ol';
      const items = Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .map((child, index) => `${'  '.repeat(depth)}${ordered ? `${index + 1}.` : '*'} ${nodeToMarkdown(child, depth + 1).trim()}`);
      return `\n\n${items.join('\n')}\n\n`;
    }
    case 'li':
      return inlineText(element);
    default:
      return inlineText(element);
  }
}

/** HTML body -> Discord Markdown, roughly like sanitize-html + NodeHtmlMarkdown on the server. */
export function htmlToDiscordMarkdown(html: string): string {
  if (!html || typeof DOMParser === 'undefined') {
    return '';
  }

  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return nodeToMarkdown(doc.body, 0)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildNoticeboardEmbed(item: NoticeboardItemDto, origin: string, fallbackAuthor?: { name: string; server: string } | null): NoticeboardEmbed {
  const typeLabel = noticeboardTypes[item.type] || noticeboardTypes[NoticeboardType.AUSHANG];
  const locationLabel = noticeboardLocations[item.location] || item.location || '';
  const authorName = (item.author || fallbackAuthor?.name || '').trim();
  const serverName = (item.authorServer || fallbackAuthor?.server || '').trim();
  const authorText = authorName ? (serverName ? `${authorName} (${serverName})` : authorName) : '';
  const noticeboardUrl = `${origin}/noticeboard/${item.id || '…'}`;
  const body = htmlToDiscordMarkdown(item.content || '');
  const subtitle = locationLabel ? `${locationLabel} — by ${authorName}` : '';

  const fields: NoticeboardEmbed['fields'] = [
    { name: 'Typ', value: truncate(typeLabel, EMBED_FIELD_LIMIT), inline: true },
    { name: 'Ort', value: truncate(locationLabel, EMBED_FIELD_LIMIT), inline: true },
  ];

  const venueName = (item.venueName || '').trim();

  if (venueName) {
    const venueServer = (item.venueServer || '').trim();
    fields.push({
      name: 'Treffpunkt',
      value: truncate(venueServer ? `${venueName} (${venueServer})` : venueName, EMBED_FIELD_LIMIT),
      inline: true,
    });
  }

  const links = [ `Aushang: ${noticeboardUrl}` ];

  if (item.venueId) {
    links.push(`Treffpunkt: ${origin}/venue/${item.venueId}`);
  }

  fields.push({ name: links.length === 1 ? 'Link' : 'Links', value: truncate(links.join('\n'), EMBED_FIELD_LIMIT) });

  return {
    color: NOTICEBOARD_EMBED_COLOR,
    authorName: truncate(authorText, 256),
    title: truncate((item.title || '').trim(), 256),
    description: truncate(body || subtitle.trim(), EMBED_DESCRIPTION_LIMIT),
    fields,
    footer: `Anschlagbrett • ${typeLabel}`,
    timestamp: item.createdAt || null,
  };
}
