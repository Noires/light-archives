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
  gap: 12px;
  padding: 12px;
  border: none;
  background: transparent;
}

.venue-list__item {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.venue-list__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.venue-list__content {
  gap: 2px;
}

.venue-list__name {
  font-weight: 700;
  color: #1f2c38;
}

.venue-list__meta {
  color: rgba(35, 35, 35, 0.7);
}

.venue-list__server {
  color: rgba(35, 35, 35, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
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
