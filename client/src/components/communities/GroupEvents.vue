<template>
  <section class="group-events" :aria-labelledby="headingId">
    <h2 :id="headingId" class="group-events__heading">Events</h2>
    <p class="group-events__lead">Events, die Mitglieder von {{ groupName }} eingetragen haben.</p>

    <section class="group-events__list" :aria-labelledby="`${headingId}-upcoming`">
      <h3 :id="`${headingId}-upcoming`" class="group-events__subheading">Demnächst</h3>
      <div v-if="upcomingCards.length" class="group-events__cards">
        <event-card v-for="card in upcomingCards" :key="card.id" :event="card" :state="card.live ? 'live' : 'default'" />
      </div>
      <p v-else class="group-events__empty">Keine anstehenden Events.</p>
    </section>

    <section class="group-events__list" :aria-labelledby="`${headingId}-past`">
      <h3 :id="`${headingId}-past`" class="group-events__subheading">Vergangen</h3>
      <div v-if="pastCards.length" class="group-events__cards">
        <event-card v-for="card in pastCards" :key="card.id" :event="card" />
      </div>
      <p v-else class="group-events__empty">Keine Events in den letzten 90 Tagen.</p>
    </section>
  </section>
</template>

<script lang="ts">
import type { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { toEventCard } from 'components/mainpage/home-data';
import EventCard from 'components/vision/EventCard.vue';
import type { EventCardEvent } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 backend finish — "Events" tab of a free company or community: the
// events of its members, split into upcoming and past (see member-content.ts).

let counter = 0;

class Props {
  upcoming = prop<EventSummaryDto[]>({ required: true });
  past = prop<EventSummaryDto[]>({ required: true });
  groupName = prop<string>({ default: '' });
}

@Options({
  name: 'GroupEvents',
  components: { EventCard },
})
export default class GroupEvents extends Vue.with(Props) {
  readonly headingId = `group-events-${++counter}`;

  get upcomingCards(): EventCardEvent[] {
    const now = Date.now();
    return this.upcoming.map((event) => toEventCard(event, now));
  }

  get pastCards(): EventCardEvent[] {
    const now = Date.now();
    return this.past.map((event) => toEventCard(event, now));
  }
}
</script>

<style lang="scss" scoped>
.group-events {
  color: var(--ink-primary);
}

.group-events__heading {
  text-align: left;
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.group-events__lead {
  margin: 0 0 16px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.group-events__list + .group-events__list {
  margin-top: 24px;
}

.group-events__subheading {
  text-align: left;
  margin: 0 0 10px;
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--ink-link);
}

.group-events__cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-events__empty {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}
</style>
