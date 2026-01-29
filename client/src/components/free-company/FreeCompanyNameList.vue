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
  gap: 12px;
  padding: 12px;
  border: none;
  background: transparent;
}

.free-company-name-list__item {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.free-company-name-list__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.free-company-name-list__crest {
  padding-right: 8px;
}

.free-company-name-list__content {
  gap: 2px;
}

.free-company-name-list__name {
  font-weight: 700;
  color: #1f2c38;
}

.free-company-name-list__goal {
  color: rgba(35, 35, 35, 0.7);
}

.free-company-name-list__server {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  color: rgba(35, 35, 35, 0.55);
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
