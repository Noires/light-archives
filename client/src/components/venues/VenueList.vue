<template>
  <q-list class="venue-list" bordered>
    <q-item
      v-for="venue in venues"
      :key="`${venue.id}`"
      class="venue-list__item"
      clickable
      v-ripple
      :to="getLink(venue)"
    >
      <q-item-section class="venue-list__content">
        <q-item-label class="venue-list__name">{{ venue.name }}</q-item-label>
        <q-item-label caption class="venue-list__meta">
          <template v-if="venue.housingArea">{{ $display.housingAreas[venue.housingArea] }}</template>
          <template v-else>Offene Welt</template>
          <template v-if="venue.purpose"> - {{ venue.purpose }}</template>
        </q-item-label>
      </q-item-section>
      <q-item-section side class="venue-list__server">
        <q-item-label>{{ venue.server }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  venues = prop<VenueSummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'VenueList',
})
export default class VenueList extends Vue.with(Props) {
  getLink(venue: VenueSummaryDto) {
    return `/venue/${venue.server}/${venue.name.replace(/ /g, '_')}`;
  }
}
</script>

<style lang="scss">
.venue-list {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

// ELPIS-401 — Venue tile reads as Vellum: cream surface, hairline gold rule
// (--rule-gold-soft @ 0.28), warm body ink. Hover lifts 4 px, rule goes solid
// gold, drop deepens to elevation/2. Visual parity with home activity grid.
.venue-list__item {
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

.venue-list__item:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
  border-color: var(--rule-gold);
}

.venue-list__content {
  gap: 2px;
}

.venue-list__name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--surface-ink);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
}

.venue-list__meta {
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
  margin-top: 4px;
}

.venue-list__server {
  color: var(--ink-muted);
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
  font-weight: 600;
}

body.body--dark .venue-list__item {
  background: var(--surface-lift);
  color: var(--ink-luminous);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

body.body--dark .venue-list__item:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 24px rgba(0, 0, 0, 0.45);
}

body.body--dark .venue-list__name {
  color: var(--ink-luminous);
}

body.body--dark .venue-list__meta,
body.body--dark .venue-list__server {
  color: rgba(236, 227, 247, 0.74);
}

@media (prefers-reduced-motion: reduce) {
  .venue-list__item:hover {
    transform: none;
  }
}
</style>
