<template>
  <q-page class="page-event-calendar">
    <header class="page-event-calendar__header">
      <div>
        <h2>Eventkalender</h2>
        <transition name="page-event-calendar__subtitle" mode="out-in">
          <div :key="yearMonth" class="page-event-calendar__subtitle">{{ yearMonth }}</div>
        </transition>
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
      <div class="page-event-calendar__filters">
        <q-select
          v-model="selectedType"
          :options="eventTypeFilterOptions"
          dense
          outlined
          emit-value
          map-options
          label="Event-Typ"
        />
        <q-select
          v-model="sortMode"
          :options="sortOptions"
          dense
          outlined
          emit-value
          map-options
          label="Sortierung"
        />
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
        <transition name="page-event-calendar__month" mode="out-in">
          <div :key="dateStr" class="page-event-calendar__calendar-frame">
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
        </transition>
      </div>

      <aside class="page-event-calendar__sidebar">
        <div class="page-event-calendar__sidebar-header">
          <span>{{ sidebarTitle }}</span>
          <q-btn
            v-if="selectedDate"
            flat
            dense
            size="sm"
            label="Zurücksetzen"
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
            <transition-group name="page-event-calendar__cards" tag="div" class="page-event-calendar__sidebar-cards">
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
                        <span>{{ formatTimeRange(event) }}</span>
                        <span
                          v-if="isAdultEvent(event)"
                          class="page-event-calendar__event-badge"
                        >
                          18+
                        </span>
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
                        <div class="page-event-calendar__event-row">
                          <q-icon name="category" />
                          <span>{{ eventTypeLabel(event) }}</span>
                        </div>
                      </div>
                      <div class="page-event-calendar__event-warnings">
                        <div class="page-event-calendar__event-warnings-title">Inhaltswarnungen</div>
                        <div
                          v-if="eventWarnings(event).length"
                          class="page-event-calendar__event-warnings-list"
                        >
                          <span
                            v-for="warning in eventWarnings(event)"
                            :key="warning"
                            class="page-event-calendar__event-warning"
                          >
                            {{ warning }}
                          </span>
                        </div>
                        <div v-else class="page-event-calendar__event-warnings-empty">Keine Angaben.</div>
                      </div>
                      <div class="page-event-calendar__event-actions">
                        <q-btn
                          v-if="event.link"
                          flat
                          color="secondary"
                          icon="launch"
                          label="Link öffnen"
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
            </transition-group>
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
          <transition-group name="page-event-calendar__cards" tag="div" class="page-event-calendar__list-cards">
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
                      <span>{{ formatTimeRange(event) }}</span>
                      <span
                        v-if="isAdultEvent(event)"
                        class="page-event-calendar__event-badge"
                      >
                        18+
                      </span>
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
                      <div class="page-event-calendar__event-row">
                        <q-icon name="category" />
                        <span>{{ eventTypeLabel(event) }}</span>
                      </div>
                    </div>
                    <div class="page-event-calendar__event-warnings">
                      <div class="page-event-calendar__event-warnings-title">Inhaltswarnungen</div>
                      <div
                        v-if="eventWarnings(event).length"
                        class="page-event-calendar__event-warnings-list"
                      >
                        <span
                          v-for="warning in eventWarnings(event)"
                          :key="warning"
                          class="page-event-calendar__event-warning"
                        >
                          {{ warning }}
                        </span>
                      </div>
                      <div v-else class="page-event-calendar__event-warnings-empty">Keine Angaben.</div>
                    </div>
                    <div class="page-event-calendar__event-actions">
                      <q-btn
                        v-if="event.link"
                        flat
                        color="secondary"
                        icon="launch"
                        label="Link öffnen"
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
          </transition-group>
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
import { EventType } from '@app/shared/enums/event-type.enum';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { EventTypeLabels, EventTypeOptions } from 'src/common/event-types';
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
  watch: {
    selectedType() {
      (this as PageEventCalendar).rebuildEventMap();
    },
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
  selectedType: EventType | '' = '';
  sortMode: 'time' | 'type' = 'time';
  private date: DateTime = this.getThisMonth();
  monthEvents: EventSummaryDto[] = [];
  eventMap: { [k: string]: EventSummaryDto[] } = {};

  readonly eventTypeFilterOptions = [
    { label: 'Alle Typen', value: '' },
    ...EventTypeOptions,
  ];

  readonly sortOptions = [
    { label: 'Zeit', value: 'time' },
    { label: 'Typ', value: 'type' },
  ];

  viewOptions = [
    { label: 'Kalender', value: 'calendar' },
    { label: 'Liste', value: 'list' }
  ];

  setContent(date: DateTime, events: EventSummaryDto[]) {
    this.date = date;
    this.monthEvents = events;
    this.rebuildEventMap();

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
      return this.sortEvents(this.eventMap[this.selectedDate] || []);
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
    return this.sortEvents(this.filteredMonthEvents);
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
    const sorted = this.sortEvents(events);

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

  private get filteredMonthEvents() {
    if (!this.selectedType) {
      return this.monthEvents;
    }

    return this.monthEvents.filter((event) => event.eventType === this.selectedType);
  }

  private sortEvents(events: EventSummaryDto[]): EventSummaryDto[] {
    if (this.sortMode === 'type') {
      return events.slice().sort((a, b) => {
        const typeA = EventTypeLabels[a.eventType] || '';
        const typeB = EventTypeLabels[b.eventType] || '';
        const typeCompare = typeA.localeCompare(typeB);
        if (typeCompare !== 0) {
          return typeCompare;
        }
        return a.startDateTime - b.startDateTime;
      });
    }

    return events.slice().sort((a, b) => a.startDateTime - b.startDateTime);
  }

  private rebuildEventMap() {
    this.eventMap = {};

    for (const event of this.filteredMonthEvents) {
      const dateKey = this.eventDateKey(event);
      const eventsForDay = this.eventMap[dateKey] || [];
      eventsForDay.push(event);
      this.eventMap[dateKey] = eventsForDay;
    }
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

  isAdultEvent(event: EventSummaryDto) {
    const typed = event as EventSummaryDto & { adultOnly?: boolean; isAdult?: boolean };
    if (typed.adultOnly !== undefined) {
      return typed.adultOnly;
    }
    if (typed.isAdult !== undefined) {
      return typed.isAdult;
    }
    return /18\+/.test(event.title);
  }

  eventWarnings(event: EventSummaryDto): string[] {
    const typed = event as EventSummaryDto & { contentWarnings?: string[] };
    const notes = event.contentNotes?.length ? event.contentNotes : (typed.contentWarnings || []);
    return notes.map((note) => (ContentNoteTexts as { [key: string]: string })[note] || note);
  }

  eventTypeLabel(event: EventSummaryDto): string {
    return EventTypeLabels[event.eventType] || EventTypeLabels[EventType.GENERAL];
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
.page-event-calendar {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
  --calendar-surface: rgba(255, 255, 255, 0.92);
  --calendar-surface-muted: #f9f7f2;
  --calendar-ink: #2d2d2d;
  --calendar-accent: #ddb476;
}

.page-event-calendar::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-event-calendar h2 {
  margin-bottom: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-event-calendar__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.page-event-calendar__subtitle {
  font-family: $header-font;
  font-size: 1.2em;
  color: rgba(35, 35, 35, 0.7);
}

.page-event-calendar__view-toggle .q-btn {
  text-transform: none;
  border-radius: 0;
}

.page-event-calendar__view-toggle .q-btn:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
}

.page-event-calendar__navbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.page-event-calendar__navbar > div {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-event-calendar__filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-event-calendar__filters .q-field {
  min-width: 200px;
}

.page-event-calendar__navbar .q-btn {
  border-radius: 0;
}

.page-event-calendar__layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
}

.page-event-calendar__calendar {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: var(--calendar-surface);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: page-event-calendar-rise 420ms ease-out both;
}

.page-event-calendar__calendar-frame {
  width: 100%;
  height: 100%;
}

.page-event-calendar__day {
  height: 100%;
  padding: 8px;
  cursor: pointer;
  position: relative;
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.page-event-calendar__day:hover {
  background: rgba(221, 180, 118, 0.12);
  border-color: rgba(221, 180, 118, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.page-event-calendar__day_selected {
  background: rgba(22, 98, 149, 0.18);
  border-color: transparent;
  box-shadow: 0 10px 22px rgba(22, 98, 149, 0.18);
  animation: page-event-calendar-select 260ms ease-out;
}

.page-event-calendar__day-number {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--calendar-ink);
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
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-event-calendar__day-icon-img {
  width: 20px;
  height: 20px;
}

.page-event-calendar__sidebar {
  background: var(--calendar-surface);
  padding: 16px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  align-self: start;
  animation: page-event-calendar-rise 420ms ease-out both;
  position: sticky;
  top: 120px;
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
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  animation: page-event-calendar-fade 360ms ease-out both;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}

.page-event-calendar__event-card--list {
  background: #ffffff;
}

.page-event-calendar__event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.35);
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
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.page-event-calendar__event-icon-img {
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
  transition: background 0.2s ease;
}

.page-event-calendar__event-summary:hover {
  background: rgba(221, 180, 118, 0.08);
}

.page-event-calendar__event-summary-text {
  flex: 1;
  min-width: 0;
}

.page-event-calendar__event-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  color: #2d2d2d;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
  line-height: 1.2;
}

.page-event-calendar__event-title {
  font-weight: 500;
  color: #555;
  line-height: 1.3;
  margin-bottom: 8px;
}

.page-event-calendar__event-summary .page-event-calendar__event-title {
  margin-bottom: 0;
}

.page-event-calendar__event-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(204, 74, 74, 0.15);
  color: #b33a3a;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
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
  padding: 8px 16px 16px;
}

.page-event-calendar__event-warnings {
  margin-top: 12px;
  display: grid;
  gap: 6px;
}

.page-event-calendar__event-warnings-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(35, 35, 35, 0.65);
  font-weight: 600;
}

.page-event-calendar__event-warnings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.page-event-calendar__event-warning {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(221, 180, 118, 0.22);
  color: #6b4c21;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-event-calendar__event-warnings-empty {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-event-calendar__event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.page-event-calendar__list {
  display: grid;
  gap: 24px;
  position: relative;
  z-index: 1;
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

@keyframes page-event-calendar-rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes page-event-calendar-fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-event-calendar__subtitle-enter-active,
.page-event-calendar__subtitle-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-event-calendar__subtitle-enter-from,
.page-event-calendar__subtitle-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.page-event-calendar__cards-enter-active,
.page-event-calendar__cards-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-event-calendar__cards-enter-from,
.page-event-calendar__cards-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.page-event-calendar__cards-move {
  transition: transform 0.25s ease;
}

.page-event-calendar__month-enter-active,
.page-event-calendar__month-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-event-calendar__month-enter-from,
.page-event-calendar__month-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes page-event-calendar-select {
  from {
    transform: translateY(-1px) scale(0.99);
  }
  to {
    transform: translateY(0) scale(1);
  }
}

@media screen and (max-width: 1100px) {
  .page-event-calendar__layout {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-event-calendar {
    padding: 20px 14px 36px;
  }

  .page-event-calendar__header {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }

  .page-event-calendar__navbar {
    padding: 10px 12px;
  }

  .page-event-calendar__calendar {
    border-radius: 0;
  }

  .page-event-calendar__sidebar {
    position: static;
  }

  .page-event-calendar .q-calendar-month .q-calendar__day {
    min-height: 110px;
  }

  .page-event-calendar__event-summary {
    padding: 12px 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-event-calendar__calendar,
  .page-event-calendar__sidebar,
  .page-event-calendar__event-card,
  .page-event-calendar__day_selected,
  .page-event-calendar__month-enter-active,
  .page-event-calendar__month-leave-active {
    animation: none;
  }

  .page-event-calendar__month-enter-active,
  .page-event-calendar__month-leave-active,
  .page-event-calendar__subtitle-enter-active,
  .page-event-calendar__subtitle-leave-active,
  .page-event-calendar__cards-enter-active,
  .page-event-calendar__cards-leave-active {
    transition: none;
  }
}
</style>
