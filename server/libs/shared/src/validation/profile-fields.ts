// ER2 round 2 — profile accent colour, play-style tags and "Was wir spielen" focus items.
// Limits and normalisers shared by the DTO validation, the services and the client.

import { IsOptional, IsString, MaxLength } from 'class-validator';

export const ACCENT_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const PLAY_STYLE_TAGS_MAX = 6;
export const PLAY_STYLE_TAG_MAX_LENGTH = 24;
export const FOCUS_ITEMS_MAX = 6;
export const FOCUS_ITEM_ICON_MAX_LENGTH = 40;
export const FOCUS_ITEM_TITLE_MAX_LENGTH = 60;
export const FOCUS_ITEM_TEXT_MAX_LENGTH = 300;

export function isValidAccentColor(value: unknown): value is string {
  return typeof value === 'string' && ACCENT_COLOR_REGEX.test(value);
}

/** `#RRGGBB` in lower case; empty or null clears. Throws on anything else. */
export function normalizeAccentColor(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') {
    return null;
  }

  const trimmed = value.trim();

  if (!isValidAccentColor(trimmed)) {
    throw new Error('Accent colour must be #RRGGBB');
  }

  return trimmed.toLowerCase();
}

/** Problems with a tag list, empty when valid (before normalisation). */
export function validatePlayStyleTags(tags: unknown): string[] {
  if (tags === null || tags === undefined) {
    return [];
  }

  if (!Array.isArray(tags)) {
    return ['Play-style tags must be a list'];
  }

  const errors: string[] = [];

  if (tags.length > PLAY_STYLE_TAGS_MAX) {
    errors.push(`At most ${PLAY_STYLE_TAGS_MAX} play-style tags are allowed`);
  }

  tags.forEach((tag) => {
    if (typeof tag !== 'string') {
      errors.push('Play-style tags must be text');
    } else if (tag.trim().length > PLAY_STYLE_TAG_MAX_LENGTH) {
      errors.push(`Play-style tags can have at most ${PLAY_STYLE_TAG_MAX_LENGTH} characters`);
    }
  });

  return errors;
}

/** Trimmed, whitespace collapsed, empty and case-insensitive duplicates removed; null when empty. */
export function normalizePlayStyleTags(tags: string[] | null | undefined): string[] | null {
  if (!tags) {
    return null;
  }

  const seen = new Set<string>();
  const result: string[] = [];

  tags.forEach((tag) => {
    const clean = (tag || '').replace(/\s+/g, ' ').trim().substring(0, PLAY_STYLE_TAG_MAX_LENGTH);
    const key = clean.toLowerCase();

    if (clean && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  });

  return result.length > 0 ? result.slice(0, PLAY_STYLE_TAGS_MAX) : null;
}

/** One "Was wir spielen" card. `icon` is an icon name chosen in the client (e.g. a Material Symbols name). */
export class FocusItemDto {
  @IsString()
  @MaxLength(FOCUS_ITEM_ICON_MAX_LENGTH)
  @IsOptional()
  icon: string;

  @IsString()
  @MaxLength(FOCUS_ITEM_TITLE_MAX_LENGTH)
  title: string;

  @IsString()
  @MaxLength(FOCUS_ITEM_TEXT_MAX_LENGTH)
  @IsOptional()
  text: string;
}

export interface FocusItem {
  icon: string;
  title: string;
  text: string;
}

/** Plain-text items with a title, at most FOCUS_ITEMS_MAX; null when empty. */
export function normalizeFocusItems(items: FocusItemDto[] | null | undefined): FocusItem[] | null {
  if (!items) {
    return null;
  }

  const result = items
    .map((item) => ({
      icon: (item.icon || '').trim().substring(0, FOCUS_ITEM_ICON_MAX_LENGTH),
      title: (item.title || '').trim().substring(0, FOCUS_ITEM_TITLE_MAX_LENGTH),
      text: (item.text || '').trim().substring(0, FOCUS_ITEM_TEXT_MAX_LENGTH),
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, FOCUS_ITEMS_MAX);

  return result.length > 0 ? result : null;
}

