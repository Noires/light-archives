<template>
  <q-list class="community-list" bordered>
    <q-item
      v-for="community in communities"
      :key="`${community.id}`"
      class="community-list__item"
      clickable
      v-ripple
      :to="getLink(community)"
    >
      <q-item-section class="community-list__content">
        <q-item-label class="community-list__name">{{ community.name }}</q-item-label>
        <q-item-label caption class="community-list__goal">{{ community.goal || 'Kein Ziel angegeben' }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { CommunitySummaryDto } from '@app/shared/dto/communities/community-summary.dto';
import { prop, Options, Vue } from 'vue-class-component';

class Props {
  communities = prop<CommunitySummaryDto[]>({
    required: true
  });
}

@Options({
  name: 'CommunityList',
})
export default class CommunityList extends Vue.with(Props) {
  getLink(community: CommunitySummaryDto) {
    return `/community/${community.name.replace(/ /g, '_')}`;
  }
}
</script>

<style lang="scss">
.community-list {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

// ELPIS-402 — Community tile mirrors VenueList: Vellum surface, hairline gold
// rule, hover lift. Visual parity with home activity grid + venues directory.
.community-list__item {
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

.community-list__item:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
  border-color: var(--rule-gold);
}

.community-list__content {
  gap: 4px;
}

.community-list__name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--surface-ink);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
}

.community-list__goal {
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
  line-height: 1.5;
}

body.body--dark .community-list__item {
  background: var(--surface-lift);
  color: var(--ink-luminous);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

body.body--dark .community-list__item:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 24px rgba(0, 0, 0, 0.45);
}

body.body--dark .community-list__name {
  color: var(--ink-luminous);
}

body.body--dark .community-list__goal {
  color: rgba(236, 227, 247, 0.74);
}

@media (prefers-reduced-motion: reduce) {
  .community-list__item:hover {
    transform: none;
  }
}
</style>
