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

.venue-list__item {
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border-radius: 2px;
  padding: 16px 20px;
}

.venue-list__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.08);
  border-color: rgba(221, 180, 118, 0.5);
}

.venue-list__content {
  gap: 2px;
}

.venue-list__name {
  font-weight: 700;
  color: #1f2c38;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
}

.venue-list__meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.9rem;
  margin-top: 4px;
}

.venue-list__server {
  color: rgba(35, 35, 35, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .venue-list__item {
    transition: none;
  }

  .venue-list__item:hover {
    transform: none;
  }
}
</style>
