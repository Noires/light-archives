<template>
  <q-list class="event-list" dark>
    <section>
      <q-item clickable v-ripple to="/event-calendar">
        <q-item-section>
          <q-item-label header><q-icon class="text-h6" name="event" /> Eventkalender</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator dark />
    </section>
    <event-item v-for="event in $store.state.events" :key="event.title" :event="event" />
  </q-list>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { Options, Vue } from 'vue-class-component';
import EventItem from './EventItem.vue';

@Options({
  components: {
    EventItem
  }
})
export default class EventList extends Vue {
  events: EventSummaryDto[] = [];

  async created() {
    // Show only events from today and later
    await this.loadEvents(false);
  }

  private async loadEvents(refresh: boolean) {
    const result = await this.$api.events.getEvents({ refresh });
    this.$store.commit('setEvents', result.events);

    if (!result.eventsUpToDate) {
      // Currently disabled since this call only queries english websites which do not exist currently for the german part.
      // Update events later without blocking page load
      // void this.loadEvents(true);
    }
  }
}
</script>

<style lang="scss">
.event-list > .q-item:nth-child(even), .event-list > .q-item:hover {
  background: rgba(255, 255, 255, 0.11);
}
</style>
