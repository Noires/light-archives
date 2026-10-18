import type { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';

/** List item plus fields a newer API may add (all optional). */
export type NoticeboardCardItem = NoticeboardItemSummaryDto & {
  excerpt?: string;
  imageUrl?: string;
  postedToDiscord?: boolean;
};

// ER2-605 — type colours of the noticeboard (Penpot "I · Anschlagbrett").
// Offers read green (live), searches read in the strong rule colour, news in
// link ink, rumours in the "now" red and plain notices in primary ink.
// Components set `--nb-type` from here; text derived from it is mixed with
// --ink-primary so it keeps AA contrast in both themes.
export const NOTICEBOARD_TYPE_COLORS: { [type: string]: string } = {
  [NoticeboardType.STELLENANGEBOT]: 'var(--vision-live)',
  [NoticeboardType.AUFTRAG]: 'var(--vision-live)',
  [NoticeboardType.GESUCH]: 'var(--rule-strong)',
  [NoticeboardType.STELLENGESUCH]: 'var(--rule-strong)',
  [NoticeboardType.ZEITUNGSARTIKEL]: 'var(--ink-link)',
  [NoticeboardType.GERUECHT]: 'var(--vision-now)',
  [NoticeboardType.AUSHANG]: 'var(--ink-primary)',
};

export function noticeboardTypeColor(type: string | undefined | null): string {
  return NOTICEBOARD_TYPE_COLORS[type || NoticeboardType.AUSHANG] || 'var(--ink-primary)';
}

/** Order of the type chips in the directory. */
export const NOTICEBOARD_TYPE_ORDER: string[] = [
  NoticeboardType.STELLENANGEBOT,
  NoticeboardType.AUFTRAG,
  NoticeboardType.GESUCH,
  NoticeboardType.STELLENGESUCH,
  NoticeboardType.ZEITUNGSARTIKEL,
  NoticeboardType.GERUECHT,
  NoticeboardType.AUSHANG,
];
