import { decode } from 'html-entities';

/** Strips tags (block boundaries become spaces), decodes entities and collapses whitespace. */
export function htmlToPlainText(content: string | null | undefined): string {
  if (!content) {
    return '';
  }

  return decode(content.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text excerpt of at most `maxLength` characters, cut at a word boundary and suffixed with "...". */
export function buildExcerpt(content: string | null | undefined, maxLength: number): string {
  const plainText = htmlToPlainText(content);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.slice(0, maxLength);
  const trimmed = truncated.replace(/\s+\S*$/, '').trim();
  return `${trimmed || truncated.trim()}...`;
}

/** Number of words in HTML content; punctuation-only tokens (e.g. "–") are not counted. */
export function countWords(content: string | null | undefined): number {
  const plainText = htmlToPlainText(content);

  if (!plainText) {
    return 0;
  }

  return plainText.split(' ').filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}
