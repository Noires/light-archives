<template>
  <section class="venue-hours" aria-labelledby="venue-hours-title">
    <div class="venue-hours__head">
      <h2 id="venue-hours-title" class="venue-hours__title">Öffnungszeiten</h2>
      <status-badge v-if="status.state !== 'unknown'" :type="badgeType" :label="status.label" />
    </div>
    <ul v-if="hasHours" class="venue-hours__list">
      <li
        v-for="row in rows"
        :key="row.weekday"
        class="venue-hours__row"
        :class="{ 'venue-hours__row--today': row.today, 'venue-hours__row--closed': row.ranges.length === 0 }"
        :aria-current="row.today ? 'date' : undefined"
      >
        <span class="venue-hours__day">{{ row.label }}<span v-if="row.today" class="venue-hours__today"> · heute</span></span>
        <span class="venue-hours__range">{{ row.ranges.length ? row.ranges.join(', ') : 'geschlossen' }}</span>
      </li>
    </ul>
    <p v-else class="venue-hours__empty">Keine festen Öffnungszeiten eingetragen.</p>
    <p v-if="hasHours" class="venue-hours__note">
      Serverzeit (Europe/Berlin)<template v-if="derived">, abgeleitet aus dem wöchentlichen Event</template>.
    </p>
  </section>
</template>

<script lang="ts">
import StatusBadge from 'components/vision/StatusBadge.vue';
import type { StatusBadgeType } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';
import { VenueHoursSource, VenueStatus, WeekRow, getVenueStatus, statusBadgeType, weekRows } from './venue-status';

// ER2-509 — Monday-to-Sunday opening hours with today highlighted and the
// current open state. Uses `openingHours` (ER2-805) or the weekly template.

class Props {
  venue = prop<VenueHoursSource & { openingHoursDerived?: boolean }>({ required: true });
}

@Options({
  name: 'VenueHoursCard',
  components: { StatusBadge },
})
export default class VenueHoursCard extends Vue.with(Props) {
  get rows(): WeekRow[] {
    return weekRows(this.venue);
  }

  get hasHours(): boolean {
    return this.rows.some((row) => row.ranges.length > 0);
  }

  get derived(): boolean {
    return !!this.venue.openingHoursDerived || !(this.venue.openingHours && this.venue.openingHours.length);
  }

  get status(): VenueStatus {
    return getVenueStatus(this.venue);
  }

  get badgeType(): StatusBadgeType {
    return statusBadgeType(this.status.state);
  }
}
</script>

<style lang="scss" scoped>
.venue-hours__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.venue-hours__title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.venue-hours__list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.venue-hours__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-primary);
}

.venue-hours__row--closed .venue-hours__range {
  color: var(--ink-muted);
}

.venue-hours__row--today {
  background-color: var(--rule-tint);
  box-shadow: inset 3px 0 0 var(--rule-strong);
  font-weight: 600;
}

.venue-hours__today {
  font-weight: 500;
  color: var(--ink-muted);
}

.venue-hours__range {
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.venue-hours__empty,
.venue-hours__note {
  margin: 10px 0 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}

.venue-hours__empty {
  margin-top: 0;
  font-size: 14px;
}
</style>
