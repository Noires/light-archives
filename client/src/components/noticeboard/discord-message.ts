import type { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { noticeboardLocations } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType, noticeboardTypes } from '@app/shared/enums/noticeboard-type.enum';
import {
  DiscordPreviewComponent,
  DiscordPreviewMessage,
  escapeLinkLabel,
  extractMentionTokens,
  hexColor,
  truncate,
  V2_TEXT_LIMIT,
} from '../vision/discord-preview';

// Client-side mirror of buildNoticeboardMessage() in
// server/apps/steward/src/bot/messages/noticeboard-message.ts. Keep both in
// sync: accent container, "Anschlagbrett · Typ · Ort · von Name (Server)"
// subtext, linked title, body as Discord Markdown, image, venue line, footer
// with the creation date, link buttons "Aushang ansehen" / "Treffpunkt".

export const NOTICEBOARD_ACCENT = 0x8b6b79;

const ALLOWED_TAGS = [ 'a', 'b', 'i', 'strong', 'em', 'code', 'tt', 'blockquote', 'p', 'br', 'ul', 'ol', 'li' ];

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

export function buildNoticeboardDiscordPreview(
  item: NoticeboardItemDto,
  origin: string,
  fallbackAuthor?: { name: string; server: string } | null,
  imageUrl?: string,
): DiscordPreviewMessage {
  const url = `${origin}/noticeboard/${item.id || '…'}`;
  const title = (item.title || '').trim() || 'Aushang';
  const typeLabel = noticeboardTypes[item.type] || noticeboardTypes[NoticeboardType.AUSHANG];
  const locationLabel = noticeboardLocations[item.location] || item.location || '';
  const authorName = (item.author || fallbackAuthor?.name || '').trim();
  const authorServer = (item.authorServer || fallbackAuthor?.server || '').trim();
  const authorLabel = authorServer ? `${authorName} (${authorServer})` : authorName;
  let author = '';
  if (authorName) {
    author = authorServer
      ? ` · von [${escapeLinkLabel(authorLabel)}](${origin}/${encodeURIComponent(authorServer)}/${encodeURIComponent(authorName.replace(/ /g, '_'))})`
      : ` · von ${authorLabel}`;
  }
  const eyebrow = `-# Anschlagbrett · ${typeLabel} · ${locationLabel}${author}`;
  const header = `## [${escapeLinkLabel(title)}](${url})`;

  const venueName = (item.venueName || '').trim();
  const venueServer = (item.venueServer || '').trim();
  const venueLine = venueName ? `**Treffpunkt:** ${venueServer ? `${venueName} (${venueServer})` : venueName}` : '';
  const created = Math.floor((item.createdAt || Date.now()) / 1000);
  const footer = `-# Aushang vom <t:${created}:D> · Elpisgarten`;
  const markdown = htmlToDiscordMarkdown(item.content || '');
  const mentionLine = extractMentionTokens(`${item.title || ''}

${markdown}`);

  const fixedLength = [eyebrow, header, venueLine, footer, mentionLine].reduce((sum, part) => sum + part.length, 0);
  const body = truncate(markdown, Math.max(0, V2_TEXT_LIMIT - fixedLength - 50));

  const components: DiscordPreviewComponent[] = [{ type: 'text', content: `${eyebrow}
${header}` }];
  if (body) {
    components.push({ type: 'text', content: body });
  }
  if (imageUrl) {
    components.push({ type: 'media', url: imageUrl, alt: title });
  }
  if (venueLine) {
    components.push({ type: 'text', content: venueLine });
  }
  components.push({ type: 'text', content: footer });

  const buttons = [{ label: 'Aushang ansehen', url }];
  if (item.venueId) {
    buttons.push({ label: 'Treffpunkt', url: `${origin}/venue/${item.venueId}` });
  }
  components.push({ type: 'buttons', buttons });

  return { mentionLine, accentColor: hexColor(NOTICEBOARD_ACCENT), components };
}
