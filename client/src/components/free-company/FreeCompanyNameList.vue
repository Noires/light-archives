<template>
  <q-list class="free-company-name-list" bordered>
    <q-item
      v-for="fc in freeCompanies"
      :key="`${fc.name}_${fc.server}`"
      class="free-company-name-list__item"
      clickable
      v-ripple
      :to="links ? getLink(fc) : null"
      @click="select(fc)"
    >
      <q-item-section side class="free-company-name-list__crest">
        <free-company-crest :images="fc.crest" />
      </q-item-section>
      <q-item-section class="free-company-name-list__content">
          <q-item-label class="free-company-name-list__name">{{ fc.name }}</q-item-label>
          <q-item-label caption class="free-company-name-list__goal">{{ fc.goal || 'Kein Ziel angegeben' }}</q-item-label>
          <q-item-label caption class="free-company-name-list__server">{{ fc.server }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import FreeCompanyCrest from './FreeCompanyCrest.vue';
import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  freeCompanies = prop<FreeCompanySummaryDto[]>({
    required: true,
  });

  links = prop<boolean>({
    default: true,
  })
}

@Options({
  emits: [ 'select' ],
  components: {
    FreeCompanyCrest
  }
})
export default class FreeCompanyNameList extends Vue.with(Props) {
  getLink(fc: FreeCompanySummaryDto) {
    return `/fc/${fc.server}/${fc.name.replace(/ /g, '_')}`
  }

  select(profile: FreeCompanySummaryDto) {
    this.$emit('select', profile);
  }
}
</script>

<style lang="scss">
.free-company-name-list {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: none;
  background: transparent;
}

// ELPIS-403 — FC tile mirrors VenueList/CommunityList: Vellum, hairline gold
// rule, hover lift. Visual parity with home activity grid + directory pages.
.free-company-name-list__item {
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

.free-company-name-list__item:hover {
  transform: translateY(-4px);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
  border-color: var(--rule-gold);
}

.free-company-name-list__crest {
  padding-right: 12px;
}

.free-company-name-list__content {
  gap: 4px;
}

.free-company-name-list__name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--surface-ink);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
}

.free-company-name-list__goal {
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
  line-height: 1.5;
}

.free-company-name-list__server {
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
  font-weight: 600;
  margin-top: 4px;
}

body.body--dark .free-company-name-list__item {
  background: var(--surface-lift);
  color: var(--ink-luminous);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

body.body--dark .free-company-name-list__item:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 24px rgba(0, 0, 0, 0.45);
}

body.body--dark .free-company-name-list__name {
  color: var(--ink-luminous);
}

body.body--dark .free-company-name-list__goal,
body.body--dark .free-company-name-list__server {
  color: rgba(236, 227, 247, 0.74);
}

@media (prefers-reduced-motion: reduce) {
  .free-company-name-list__item:hover {
    transform: none;
  }
}
</style>
