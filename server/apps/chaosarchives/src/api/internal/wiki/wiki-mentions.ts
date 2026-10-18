// ER2-608 — wiki back-references ("Erwähnt in").
//
// A piece of content mentions a wiki page when it links to it in one of the
// two ways the portal supports:
//   - wikilink syntax `[[Title]]` / `[[Title|Text]]` (also with the HTML
//     entity forms of the brackets the editor may store, see
//     client-common/src/common/wikilinks.ts);
//   - an anchor or plain URL `/link/<wikified title>`, where the title is
//     wikified (spaces -> underscores) and possibly URI-encoded.
// Matching is case-insensitive and ignores surrounding/duplicate whitespace,
// mirroring how the client resolves links.

export interface WikiMentionItemDto {
  id: number;
  title: string;
  link: string;
}

export interface WikiMentionsDto {
  stories: WikiMentionItemDto[];
  noticeboardItems: WikiMentionItemDto[];
  events: WikiMentionItemDto[];
}

const WIKILINK_REGEX = /(?:\[\[|(?:&#91;|&#x5b;|&lbrack;){2})([^[\]]{1,200}?)(?:\]\]|(?:&#93;|&#x5d;|&rbrack;){2})/gi;
// Path segment after /link/: anything up to a quote, whitespace, tag, query or
// fragment; HTML entities (`&#39;`, `&amp;`) are kept whole and decoded later.
const LINK_URL_REGEX = /\/link\/((?:[^"\s<>?#&]|&[a-z0-9#]+;)+)/gi;
const LINK_WHITESPACE_REGEX = /<br\s*\/?>|&nbsp;|&#160;|\s+/gi;

const HTML_ENTITIES: { [entity: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#x27;': "'",
};

function decodeBasicEntities(text: string): string {
  return text.replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] || entity);
}

/** Canonical comparison key: underscores and whitespace runs become one space, trimmed, lower case. */
export function normalizeWikiTitle(title: string): string {
  return decodeBasicEntities(title || '')
    .replace(LINK_WHITESPACE_REGEX, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** True when the HTML/text `content` links to the wiki page `title`. */
export function contentMentionsWikiTitle(content: string | null | undefined, title: string): boolean {
  const wanted = normalizeWikiTitle(title);

  if (!content || !wanted) {
    return false;
  }

  const wikilinkRegex = new RegExp(WIKILINK_REGEX.source, 'gi');
  let match: RegExpExecArray | null;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    const body = match[1];
    const barIndex = body.indexOf('|');
    const target = barIndex === -1 ? body : body.substring(0, barIndex);

    if (normalizeWikiTitle(target) === wanted) {
      return true;
    }
  }

  const linkUrlRegex = new RegExp(LINK_URL_REGEX.source, 'gi');

  while ((match = linkUrlRegex.exec(content)) !== null) {
    const target = safeDecodeURIComponent(decodeBasicEntities(match[1]));

    if (normalizeWikiTitle(target) === wanted) {
      return true;
    }
  }

  return false;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * LIKE patterns for a coarse SQL pre-filter. Every real mention contains at
 * least one of them; `contentMentionsWikiTitle` then decides exactly.
 */
export function buildWikiMentionLikePatterns(title: string): string[] {
  const trimmed = (title || '').replace(/\s+/g, ' ').trim();

  if (!trimmed) {
    return [];
  }

  const wikified = trimmed.replace(/ /g, '_');
  const variants = new Set<string>([
    trimmed,
    escapeHtmlText(trimmed),
    wikified,
    encodeURIComponent(wikified),
  ]);

  return Array.from(variants).map((variant) => `%${escapeLike(variant)}%`);
}
