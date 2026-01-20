<template>
  <q-page class="page-event-calendar">
    <header class="page-event-calendar__header">
      <div>
        <h2>Eventkalender (Prototyp)</h2>
        <div class="page-event-calendar__subtitle">{{ yearMonth }}</div>
      </div>
      <div class="page-event-calendar__view-toggle">
        <q-btn-toggle
          v-model="viewMode"
          :options="viewOptions"
          toggle-color="primary"
          unelevated
        />
      </div>
    </header>

    <section class="page-event-calendar__navbar">
      <div>
        <q-btn color="secondary" label="< Vorheriger Monat" :to="prevLink" />&nbsp;
        <q-btn color="secondary" label="Heute" to="/calendar" />&nbsp;
        <q-btn color="secondary" label="Nächster Monat >" :to="nextLink" />
      </div>
      <div>
        <q-btn
          v-if="$store.getters.role && $store.getters.role !== Role.UNVERIFIED"
          color="primary"
          label="Neues Event"
          icon="add"
          to="/create-event"
        />
      </div>
    </section>

    <section v-if="viewMode === 'calendar'" class="page-event-calendar__layout">
      <div class="page-event-calendar__calendar">
        <q-calendar-month
          no-active-date
          :model-value="dateStr"
          :day-min-height="140"
          :weekdays="[1, 2, 3, 4, 5, 6, 0]"
        >
          <template v-slot:day="{ scope: { timestamp } }">
            <div
              class="page-event-calendar__day"
              :class="{ 'page-event-calendar__day_selected': isSelected(timestamp.date) }"
              @click="selectDate(timestamp.date)"
            >
              <div class="page-event-calendar__day-number">
                {{ timestamp.day }}
              </div>
              <div class="page-event-calendar__day-icons">
                <div
                  v-for="event in dayIconEvents(timestamp.date)"
                  :key="event.id"
                  class="page-event-calendar__day-icon"
                >
                  <q-img
                    v-if="event.icon"
                    :src="eventIconUrl(event)"
                    :ratio="1"
                    fit="cover"
                    class="page-event-calendar__day-icon-img"
                  />
                  <q-icon v-else name="event" size="14px" />
                  <q-tooltip>{{ event.title }}</q-tooltip>
                </div>
              </div>
            </div>
          </template>
        </q-calendar-month>
      </div>

      <aside class="page-event-calendar__sidebar">
        <div class="page-event-calendar__sidebar-header">
          <span>{{ sidebarTitle }}</span>
          <q-btn
            v-if="selectedDate"
            flat
            dense
            size="sm"
            label="Zuruecksetzen"
            @click="clearSelection"
          />
        </div>

        <div v-if="sidebarEvents.length === 0" class="page-event-calendar__empty">
          Keine Events gefunden.
        </div>

        <div v-else class="page-event-calendar__sidebar-list">
          <div
            v-for="group in sidebarGroups"
            :key="group.dateKey"
            class="page-event-calendar__sidebar-group"
          >
            <div class="page-event-calendar__date-header">
              <span class="page-event-calendar__date-label">{{ group.dateLabel }}</span>
              <span class="page-event-calendar__date-divider">|</span>
              <span class="page-event-calendar__date-weekday">{{ group.weekday }}</span>
            </div>
            <div class="page-event-calendar__sidebar-cards">
              <div
                v-for="event in group.events"
                :key="event.id"
                class="page-event-calendar__event-card"
              >
                <div class="page-event-calendar__event-collapsible">
                  <div
                    class="page-event-calendar__event-summary"
                    role="button"
                    tabindex="0"
                    @click="toggleExpanded(event.id)"
                    @keyup.enter="toggleExpanded(event.id)"
                  >
                    <div class="page-event-calendar__event-icon">
                      <q-img
                        v-if="event.icon"
                        :src="eventIconUrl(event)"
                        :ratio="1"
                        fit="cover"
                        class="page-event-calendar__event-icon-img"
                      />
                      <q-icon v-else name="event" />
                    </div>
                    <div class="page-event-calendar__event-summary-text">
                      <div class="page-event-calendar__event-time">
                        {{ formatTimeRange(event) }}
                      </div>
                      <div class="page-event-calendar__event-title">
                        {{ event.title }}
                      </div>
                    </div>
                    <q-btn
                      flat
                      round
                      dense
                      :icon="isExpanded(event.id) ? 'expand_less' : 'expand_more'"
                      @click.stop="toggleExpanded(event.id)"
                    />
                  </div>
                  <q-slide-transition>
                    <div v-show="isExpanded(event.id)" class="page-event-calendar__event-details">
                      <div class="page-event-calendar__event-meta">
                        <div
                          v-if="primaryLocation(event)"
                          class="page-event-calendar__event-row"
                        >
                          <q-icon name="place" />
                          <span>{{ primaryLocation(event) }}</span>
                        </div>
                        <div class="page-event-calendar__event-row">
                          <q-icon name="event" />
                          <span>{{ formatDate(event.startDateTime) }}</span>
                        </div>
                      </div>
                      <div class="page-event-calendar__event-actions">
                        <q-btn
                          v-if="event.link"
                          flat
                          color="secondary"
                          icon="launch"
                          label="Link oeffnen"
                          type="a"
                          target="_blank"
                          :href="event.link"
                        />
                        <q-btn
                          v-else
                          flat
                          color="secondary"
                          icon="event"
                          label="Event anzeigen"
                          :to="`/event/${event.id}`"
                        />
                      </div>
                    </div>
                  </q-slide-transition>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </section>

    <section v-else class="page-event-calendar__list">
      <div v-if="groupedEvents.length === 0" class="page-event-calendar__empty">
        Keine Events gefunden.
      </div>
      <template v-else>
        <h3 class="page-event-calendar__list-title">
          Events im {{ yearMonth }}
        </h3>
        <div
          v-for="group in groupedEvents"
          :key="group.dateKey"
          class="page-event-calendar__list-group"
        >
          <div class="page-event-calendar__date-header">
            <span class="page-event-calendar__date-label">{{ group.dateLabel }}</span>
            <span class="page-event-calendar__date-divider">|</span>
            <span class="page-event-calendar__date-weekday">{{ group.weekday }}</span>
          </div>
          <div class="page-event-calendar__list-cards">
            <div
              v-for="event in group.events"
              :key="event.id"
              class="page-event-calendar__event-card page-event-calendar__event-card--list"
            >
              <div class="page-event-calendar__event-collapsible">
                <div
                  class="page-event-calendar__event-summary"
                  role="button"
                  tabindex="0"
                  @click="toggleExpanded(event.id)"
                  @keyup.enter="toggleExpanded(event.id)"
                >
                  <div class="page-event-calendar__event-icon">
                    <q-img
                      v-if="event.icon"
                      :src="eventIconUrl(event)"
                      :ratio="1"
                      fit="cover"
                      class="page-event-calendar__event-icon-img"
                    />
                    <q-icon v-else name="event" />
                  </div>
                  <div class="page-event-calendar__event-summary-text">
                    <div class="page-event-calendar__event-time">
                      {{ formatTimeRange(event) }}
                    </div>
                    <div class="page-event-calendar__event-title">
                      {{ event.title }}
                    </div>
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    :icon="isExpanded(event.id) ? 'expand_less' : 'expand_more'"
                    @click.stop="toggleExpanded(event.id)"
                  />
                </div>
                <q-slide-transition>
                  <div v-show="isExpanded(event.id)" class="page-event-calendar__event-details">
                    <div class="page-event-calendar__event-meta">
                      <div
                        v-if="primaryLocation(event)"
                        class="page-event-calendar__event-row"
                      >
                        <q-icon name="place" />
                        <span>{{ primaryLocation(event) }}</span>
                      </div>
                      <div class="page-event-calendar__event-row">
                        <q-icon name="event" />
                        <span>{{ formatDate(event.startDateTime) }}</span>
                      </div>
                    </div>
                    <div class="page-event-calendar__event-actions">
                      <q-btn
                        v-if="event.link"
                        flat
                        color="secondary"
                        icon="launch"
                        label="Link oeffnen"
                        type="a"
                        target="_blank"
                        :href="event.link"
                      />
                      <q-btn
                        v-else
                        flat
                        color="secondary"
                        icon="event"
                        label="Event anzeigen"
                        :to="`/event/${event.id}`"
                      />
                    </div>
                  </div>
                </q-slide-transition>
              </div>
            </div>
          </div>
        </div>
      </template>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar/dist/QCalendarMonth.esm.js';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import { Role } from '@app/shared/enums/role.enum';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { useApi } from 'src/boot/axios';
import { useRouter } from 'src/router';
import { RouteParams } from 'vue-router';
import { notifyError } from 'src/common/notify';
import { createMetaMixin } from 'quasar';

const $api = useApi();
const $router = useRouter();

async function load(params: RouteParams): Promise<{ date: DateTime; events: EventSummaryDto[] }> {
  let year = parseInt(params.year as string, 10);
  let month = parseInt(params.month as string, 10);
  let date: DateTime;

  if (!year || !month) {
    date = DateTime.now()
      .setZone(SharedConstants.FFXIV_SERVER_TIMEZONE)
      .set({
        day: 1
      });
  } else {
    date = DateTime.fromObject(
      {
        year,
        month,
        day: 1
      },
      { zone: SharedConstants.FFXIV_SERVER_TIMEZONE }
    );
  }

  try {
    const events = await $api.events.getEventsForMonth(date.year, date.month);
    return { date, events };
  } catch (e) {
    notifyError(e);
    void $router.replace('/');
    throw e;
  }
}

interface EventGroup {
  dateKey: string;
  dateLabel: string;
  weekday: string;
  events: EventSummaryDto[];
}

@Options({
  name: 'PageEventCalendar',
  components: {
    QCalendarMonth
  },
  async beforeRouteEnter(to, _, next) {
    const { date, events } = await load(to.params);
    next((vm) => (vm as PageEventCalendar).setContent(date, events));
  },
  async beforeRouteUpdate(to) {
    const { date, events } = await load(to.params);
    (this as PageEventCalendar).setContent(date, events);
  },
  mixins: [
    createMetaMixin(function (this: PageEventCalendar) {
      return {
        title: `${this.yearMonth} events - Chaos Archives`
      };
    })
  ]
})
export default class PageEventCalendar extends Vue {
  Role = Role;
  viewMode: 'calendar' | 'list' = 'calendar';
  selectedDate = '';
  private date: DateTime = this.getThisMonth();
  monthEvents: EventSummaryDto[] = [];
  eventMap: { [k: string]: EventSummaryDto[] } = {};

  viewOptions = [
    { label: 'Calendar', value: 'calendar' },
    { label: 'List', value: 'list' }
  ];

  setContent(date: DateTime, events: EventSummaryDto[]) {
    this.date = date;
    this.monthEvents = events;
    this.eventMap = {};

    for (const event of events) {
      const dateKey = this.eventDateKey(event);
      const eventsForDay = this.eventMap[dateKey] || [];
      eventsForDay.push(event);
      this.eventMap[dateKey] = eventsForDay;
    }

    if (this.selectedDate) {
      const monthKey = this.date.toFormat('yyyy-LL');
      if (!this.selectedDate.startsWith(monthKey)) {
        this.selectedDate = '';
      }
    }
  }

  private getThisMonth(): DateTime {
    return DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).set({
      day: 1
    });
  }

  selectDate(dateStr: string) {
    if (this.selectedDate === dateStr) {
      this.selectedDate = '';
      return;
    }
    this.selectedDate = dateStr;
  }

  clearSelection() {
    this.selectedDate = '';
  }

  isSelected(dateStr: string) {
    return this.selectedDate === dateStr;
  }

  dayIconEvents(dateStr: string) {
    const events = this.eventMap[dateStr] || [];
    return events.slice(0, 3);
  }

  get sidebarEvents() {
    if (this.selectedDate) {
      return (this.eventMap[this.selectedDate] || [])
        .slice()
        .sort((a, b) => a.startDateTime - b.startDateTime);
    }
    return this.sortedMonthEvents;
  }

  get sidebarTitle() {
    if (this.selectedDate) {
      return `Events am ${this.formatDateString(this.selectedDate)}`;
    }
    return `Events im ${this.yearMonth}`;
  }

  get sortedMonthEvents() {
    return this.monthEvents.slice().sort((a, b) => a.startDateTime - b.startDateTime);
  }

  get groupedEvents(): EventGroup[] {
    return this.buildEventGroups(this.sortedMonthEvents);
  }

  get sidebarGroups(): EventGroup[] {
    return this.buildEventGroups(this.sidebarEvents);
  }

  expandedEvents: Record<number, boolean> = {};

  isExpanded(eventId: number) {
    return !!this.expandedEvents[eventId];
  }

  toggleExpanded(eventId: number) {
    this.expandedEvents = {
      ...this.expandedEvents,
      [eventId]: !this.expandedEvents[eventId]
    };
  }

  private buildEventGroups(events: EventSummaryDto[]): EventGroup[] {
    const groups: EventGroup[] = [];
    const sorted = events.slice().sort((a, b) => a.startDateTime - b.startDateTime);

    for (const event of sorted) {
      const dateKey = this.eventDateKey(event);
      const existing = groups.find((group) => group.dateKey === dateKey);

      if (existing) {
        existing.events.push(event);
        continue;
      }

      const date = DateTime.fromISO(dateKey, {
        zone: SharedConstants.FFXIV_SERVER_TIMEZONE
      });
      const localizedDate = date.setLocale('de');
      groups.push({
        dateKey,
        dateLabel: localizedDate.toFormat('dd.LL.yyyy'),
        weekday: localizedDate.toFormat('cccc'),
        events: [event]
      });
    }

    return groups;
  }

  eventLinkProps(event: EventSummaryDto) {
    if (event.link) {
      return {
        href: event.link,
        target: '_blank',
        rel: 'noopener'
      };
    }
    return {
      to: `/event/${event.id}`
    };
  }

  private eventDateKey(event: EventSummaryDto): string {
    return DateTime.fromMillis(event.startDateTime)
      .setZone(SharedConstants.FFXIV_SERVER_TIMEZONE)
      .toISODate();
  }

  private formatDateString(dateStr: string) {
    return DateTime.fromISO(dateStr, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE
    }).toFormat('dd.LL.yyyy');
  }

  formatDate(dateMillis: number) {
    return DateTime.fromMillis(dateMillis, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE
    }).toFormat('dd.LL.yyyy');
  }

  formatTimeRange(event: EventSummaryDto) {
    const start = DateTime.fromMillis(event.startDateTime, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE
    });
    const end = event.endDateTime
      ? DateTime.fromMillis(event.endDateTime, {
          zone: SharedConstants.FFXIV_SERVER_TIMEZONE
        })
      : null;
    if (end && end.toMillis() !== start.toMillis()) {
      return `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
    }
    return start.toFormat('HH:mm');
  }

  primaryLocation(event: EventSummaryDto) {
    if (!event.locations || event.locations.length === 0) {
      return '';
    }
    const location = event.locations[0];
    return location.name || location.address || location.server || '';
  }

  eventIconUrl(event: EventSummaryDto) {
    return event.icon?.thumbUrl || event.icon?.url || '';
  }

  get year() {
    return this.date.year;
  }

  get month() {
    return this.date.month;
  }

  get yearMonth() {
    return this.date.toFormat('LLLL yyyy', { locale: 'de' });
  }

  get dateStr() {
    return this.date.toISODate();
  }

  get prevLink() {
    const prevDate = this.date.minus({ months: 1 });
    return `/calendar/${prevDate.year}/${prevDate.month}`;
  }

  get nextLink() {
    const nextDate = this.date.plus({ months: 1 });
    return `/calendar/${nextDate.year}/${nextDate.month}`;
  }
}
</script>

<style src="@quasar/quasar-ui-qcalendar/dist/QCalendarDay.min.css"></style>

<style lang="scss">
.page-event-calendar h2 {
  margin-bottom: 0;
}

.page-event-calendar__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.page-event-calendar__subtitle {
  font-family: $header-font;
  font-size: 1.4em;
}

.page-event-calendar__view-toggle .q-btn {
  text-transform: none;
}

.page-event-calendar__navbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.page-event-calendar__layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 24px;
}

.page-event-calendar__calendar {
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.page-event-calendar__day {
  height: 100%;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.page-event-calendar__day:hover {
  background: rgba(0, 0, 0, 0.06);
}

.page-event-calendar__day_selected {
  background: rgba(22, 98, 149, 0.2);
}

.page-event-calendar__day-number {
  font-weight: 600;
}

.page-event-calendar__day-icons {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.page-event-calendar__day-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-event-calendar__day-icon-img {
  width: 20px;
  height: 20px;
  border-radius: 6px;
}

.page-event-calendar__sidebar {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  align-self: start;
}

.page-event-calendar__sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 12px;
}

.page-event-calendar__sidebar-list {
  display: grid;
  gap: 16px;
}

.page-event-calendar__sidebar-group {
  display: grid;
  gap: 12px;
}

.page-event-calendar__sidebar-cards {
  display: grid;
  gap: 12px;
}

.page-event-calendar__event-card {
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.page-event-calendar__event-card--list {
  background: #fdfdfd;
}

.page-event-calendar__event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.page-event-calendar__event-link {
  display: block;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.page-event-calendar__event-header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.page-event-calendar__event-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.page-event-calendar__event-icon-img {
  border-radius: 8px;
  width: 32px;
  height: 32px;
}

.page-event-calendar__event-content {
  flex: 1;
  min-width: 0;
}

.page-event-calendar__event-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
}

.page-event-calendar__event-summary:focus {
  outline: 2px solid rgba(22, 98, 149, 0.3);
  outline-offset: 2px;
}

.page-event-calendar__event-summary-text {
  flex: 1;
  min-width: 0;
}

.page-event-calendar__event-time {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 2px;
}

.page-event-calendar__event-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.page-event-calendar__event-summary .page-event-calendar__event-title {
  margin-bottom: 0;
}

.page-event-calendar__event-meta {
  display: grid;
  gap: 6px;
  color: #555;
  font-size: 0.9rem;
}

.page-event-calendar__event-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-event-calendar__event-details {
  padding: 0 16px 16px;
}

.page-event-calendar__event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.page-event-calendar__list {
  display: grid;
  gap: 24px;
}

.page-event-calendar__list-title {
  margin: 0;
  font-family: $header-font;
}

.page-event-calendar__list-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}

.page-event-calendar__date-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-weight: 600;
  font-size: 1rem;
}

.page-event-calendar__date-weekday {
  color: #666;
  font-weight: 500;
}

.page-event-calendar__date-divider {
  color: #999;
  font-weight: 400;
}

.page-event-calendar__list-cards {
  display: grid;
  gap: 16px;
}

.page-event-calendar__empty {
  color: #666;
  padding: 12px 0;
}

@media screen and (max-width: 1100px) {
  .page-event-calendar__layout {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-event-calendar__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
