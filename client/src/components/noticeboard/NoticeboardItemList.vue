<template>
  <q-list class="noticeboard-item-list" bordered>
    <q-item
      v-for="noticeboardItem in noticeboardItems"
      :key="`${noticeboardItem.id}`"
      class="noticeboard-item-list__item"
      clickable
      v-ripple
      :to="getLink(noticeboardItem)"
    >
      <q-item-section class="noticeboard-item-list__content">
        <q-item-label class="noticeboard-item-list__title">{{ noticeboardItem.title }}</q-item-label>
        <q-item-label caption class="noticeboard-item-list__meta">
          <span
            class="noticeboard-item-list__type-chip"
            :class="`noticeboard-item-list__type-chip--${typeIntent(noticeboardItem.type)}`"
          >{{ $display.noticeboardTypes[noticeboardItem.type] || 'Aushang' }}</span>
          <span class="noticeboard-item-list__location">{{ $display.noticeboardLocations[noticeboardItem.location] }}</span>
          <span class="noticeboard-item-list__author">von {{ noticeboardItem.author }}</span>
          <template v-if="noticeboardItem.venueName && noticeboardItem.venueServer">
            <span class="noticeboard-item-list__venue">{{ noticeboardItem.venueName }} ({{ noticeboardItem.venueServer }})</span>
          </template>
        </q-item-label>
      </q-item-section>
      <q-item-section side class="noticeboard-item-list__time">
        <q-item-label>{{ $display.relativeTime(noticeboardItem.createdAt) }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import { prop, Options, Vue } from 'vue-class-component';

// ELPIS-510 — Map each noticeboard type to a visual intent so the chip can
// signal what kind of post it is at a glance. "Offer" tier reads warm gold
// (someone is offering / posting / publishing); "seek" tier reads arcane
// violet (someone is asking / requesting); "rumor" reads danger-soft.
type ChipIntent = 'offer' | 'seek' | 'rumor' | 'article' | 'default';

const NOTICEBOARD_TYPE_INTENT: Record<string, ChipIntent> = {
  [NoticeboardType.STELLENANGEBOT]: 'offer',
  [NoticeboardType.AUFTRAG]: 'offer',
  [NoticeboardType.AUSHANG]: 'default',
  [NoticeboardType.STELLENGESUCH]: 'seek',
  [NoticeboardType.GESUCH]: 'seek',
  [NoticeboardType.GERUECHT]: 'rumor',
  [NoticeboardType.ZEITUNGSARTIKEL]: 'article',
};

class Props {
  noticeboardItems = prop<NoticeboardItemSummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'NoticeboardItemList',
})
export default class NoticeboardItemList extends Vue.with(Props) {
  getLink(noticeboardItem: NoticeboardItemSummaryDto) {
    return `/noticeboard/${noticeboardItem.id}`;
  }

  typeIntent(type: string): ChipIntent {
    return NOTICEBOARD_TYPE_INTENT[type] ?? 'default';
  }
}
</script>

<style lang="scss">
.noticeboard-item-list {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

// ELPIS-510 — Notice tile mirrors the rest of the directory family: Vellum,
// hairline gold rule, hover lift. The type chip carries colour-coded intent
// (offer / seek / rumor / article) so a glance separates "stellt einen
// Anschlag bereit" from "sucht jemanden".
.noticeboard-item-list__item {
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  color: var(--surface-ink);
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
  border-radius: 6px;
  padding: 16px 20px;
}

.noticeboard-item-list__item:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
  border-color: var(--rule-gold);
}

.noticeboard-item-list__content {
  gap: 6px;
}

.noticeboard-item-list__title {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--surface-ink);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
}

.noticeboard-item-list__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
}

.noticeboard-item-list__type-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: var(--type-scale-0);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  background: rgba(186, 155, 91, 0.18);
  border: 1px solid var(--rule-gold-soft);
  color: var(--rule-gold);
}

// Offer tier — Stellenangebot, Auftrag. Solid warm gold rule + brighter fill.
.noticeboard-item-list__type-chip--offer {
  background: rgba(186, 155, 91, 0.22);
  border-color: var(--rule-gold);
  color: var(--rule-gold);
}

// Seek tier — Stellengesuch, Gesuch. Arcane violet on the warm parchment;
// reads as "jemand sucht etwas" without competing with offers.
.noticeboard-item-list__type-chip--seek {
  background: rgba(107, 79, 168, 0.14);
  border-color: rgba(107, 79, 168, 0.45);
  color: #6b4fa8;
}

// Rumor tier — Gerücht. Danger-soft surface; not a warning, but visually
// distinct so rumors don't read like jobs.
.noticeboard-item-list__type-chip--rumor {
  background: rgba(199, 72, 79, 0.14);
  border-color: rgba(199, 72, 79, 0.45);
  color: var(--semantic-danger);
}

// Article tier — Zeitungsartikel. Cool info ink so news content sits apart
// from community-board entries.
.noticeboard-item-list__type-chip--article {
  background: rgba(93, 169, 216, 0.14);
  border-color: rgba(93, 169, 216, 0.45);
  color: var(--semantic-info);
}

.noticeboard-item-list__location {
  font-style: italic;
  color: var(--ink-muted);
}

.noticeboard-item-list__author,
.noticeboard-item-list__venue {
  color: var(--ink-muted);
}

.noticeboard-item-list__time {
  color: var(--ink-muted);
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  font-weight: 600;
  white-space: nowrap;
}

body.body--dark .noticeboard-item-list__item {
  background: var(--surface-lift);
  color: var(--ink-luminous);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

body.body--dark .noticeboard-item-list__item:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 24px rgba(0, 0, 0, 0.45);
}

body.body--dark .noticeboard-item-list__title {
  color: var(--ink-luminous);
}

body.body--dark .noticeboard-item-list__meta,
body.body--dark .noticeboard-item-list__location,
body.body--dark .noticeboard-item-list__author,
body.body--dark .noticeboard-item-list__venue,
body.body--dark .noticeboard-item-list__time {
  color: rgba(236, 227, 247, 0.74);
}

body.body--dark .noticeboard-item-list__type-chip {
  background: rgba(193, 155, 255, 0.14);
  border-color: var(--rule-arcane-soft);
  color: var(--glow-aether-d);
}

body.body--dark .noticeboard-item-list__type-chip--offer {
  background: rgba(193, 155, 255, 0.18);
  border-color: var(--rule-arcane);
  color: var(--glow-aether-d);
}

body.body--dark .noticeboard-item-list__type-chip--seek {
  background: rgba(193, 155, 255, 0.22);
  border-color: var(--glow-zodiark);
  color: var(--glow-zodiark);
}

body.body--dark .noticeboard-item-list__type-chip--rumor {
  background: rgba(199, 100, 110, 0.18);
  border-color: rgba(220, 130, 140, 0.5);
  color: rgba(255, 180, 188, 0.95);
}

body.body--dark .noticeboard-item-list__type-chip--article {
  background: rgba(141, 181, 223, 0.18);
  border-color: rgba(141, 181, 223, 0.5);
  color: rgba(196, 221, 247, 0.95);
}

@media (prefers-reduced-motion: reduce) {
  .noticeboard-item-list__item:hover {
    transform: none;
  }
}
</style>
