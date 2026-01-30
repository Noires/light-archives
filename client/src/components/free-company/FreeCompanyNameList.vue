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

.free-company-name-list__item {
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-radius: 2px;
  padding: 16px 20px;
}

.free-company-name-list__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: rgba(221, 180, 118, 0.5);
}

.free-company-name-list__crest {
  padding-right: 12px;
}

.free-company-name-list__content {
  gap: 4px;
}

.free-company-name-list__name {
  font-weight: 700;
  color: #1f2c38;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.free-company-name-list__goal {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
}

.free-company-name-list__server {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: rgba(35, 35, 35, 0.55);
  font-weight: 600;
  margin-top: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .free-company-name-list__item {
    transition: none;
  }

  .free-company-name-list__item:hover {
    transform: none;
  }
}
</style>
