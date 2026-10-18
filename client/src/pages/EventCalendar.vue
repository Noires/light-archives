<template>
  <q-page class="page-events">
    <page-head
      eyebrow="Events · Datacenter Light"
      title="Was steht an?"
      lead="Alle Zeiten in Serverzeit (Europe/Berlin). Wiederkehrende Abende findest du in der rechten Spalte."
    >
      <template #actions>
        <q-btn
          v-if="canCreate"
          unelevated
          class="elpis-btn elpis-btn--primary"
          icon="add"
          label="Event eintragen"
          to="/create-event"
        />
      </template>

      <div class="page-events__toolbar">
        <section-tabs
          v-model="range"
          class="page-events__tabs"
          sync="query"
          query-key="zeitraum"
          aria-label="Zeitraum"
          :tabs="rangeTabs"
          @update:model-value="onRangeSelect"
        />
        <div class="page-events__segmented" role="group" aria-label="Ansicht">
          <button
            v-for="option in viewOptions"
            :key="option.value"
            type="button"
            class="page-events__segment"
            :class="{ 'page-events__segment--active': viewMode === option.value }"
            :aria-pressed="viewMode === option.value ? 'true' : 'false'"
            @click="setViewMode(option.value)"
          >
            <q-icon :name="option.icon" aria-hidden="true" />
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>

    </page-head>

    <div class="page-events__grid">
      <div class="page-events__main">
        <div v-if="selectedDate" class="page-events__selection">
          <span>Events am <strong>{{ selectedDateLabel }}</strong></span>
          <q-btn flat class="elpis-btn elpis-btn--ghost" icon="close" label="Auswahl aufheben" @click="clearSelection" />
        </div>

        <template v-if="viewMode === 'liste'">
          <empty-state
            v-if="listGroups.length === 0"
            icon="event_busy"
            :title="emptyTitle"
            :text="emptyText"
            :action-label="hasActiveFilters ? 'Filter zurücksetzen' : (canCreate ? 'Event eintragen' : '')"
            :action-to="hasActiveFilters || !canCreate ? null : '/create-event'"
            @action="onEmptyAction"
          />
          <template v-else>
          <section
            v-for="group in listGroups"
            :key="group.key"
            class="page-events__day"
            :aria-labelledby="`day-${group.key}`"
          >
            <h2 :id="`day-${group.key}`" class="page-events__day-title">
              <span>{{ group.title }}</span>
              <span class="page-events__day-date">{{ group.subtitle }}</span>
            </h2>
            <div class="page-events__cards">
              <event-card
                v-for="event in group.events"
                :key="event.id"
                :event="toCard(event)"
                :state="isLive(event) ? 'live' : 'default'"
              >
                <template #action>
                  <span v-if="countText(event)" class="page-events__count">{{ countText(event) }}</span>
                  <q-btn
                    v-if="canRsvp(event)"
                    flat
                    class="elpis-btn"
                    :class="myRsvp[event.id] ? 'elpis-btn--primary' : 'elpis-btn--secondary'"
                    :icon="myRsvp[event.id] ? 'check' : undefined"
                    :label="rsvpLabel(event)"
                    :loading="!!rsvpPending[event.id]"
                    :aria-pressed="myRsvp[event.id] ? 'true' : 'false'"
                    @click="toggleRsvp(event)"
                  />
                  <q-btn
                    v-else
                    flat
                    class="elpis-btn elpis-btn--secondary"
                    :label="rsvpLabel(event)"
                    :to="`/event/${event.id}`"
                  />
                </template>
              </event-card>
            </div>
          </section>
          </template>
        </template>

        <section v-else class="page-events__calendar" aria-label="Monatskalender">
          <div class="page-events__calendar-head">
            <q-btn flat class="elpis-btn elpis-btn--secondary" icon="chevron_left" label="Vorheriger Monat" :to="prevLink" />
            <h2 class="page-events__calendar-title">{{ yearMonth }}</h2>
            <q-btn flat class="elpis-btn elpis-btn--secondary" icon-right="chevron_right" label="Nächster Monat" :to="nextLink" />
          </div>
          <q-calendar-month
            no-active-date
            :model-value="dateStr"
            :day-min-height="110"
            :weekdays="[1, 2, 3, 4, 5, 6, 0]"
            locale="de-DE"
          >
            <template #day="{ scope: { timestamp } }">
              <div
                class="page-events__cal-day"
                :class="{
                  'page-events__cal-day--selected': selectedDate === timestamp.date,
                  'page-events__cal-day--today': todayIso === timestamp.date,
                }"
                @click.self="pickCalendarDay(timestamp.date)"
              >
                <router-link
                  v-for="event in calendarDayEvents(timestamp.date).slice(0, 2)"
                  :key="event.id"
                  class="page-events__cal-event"
                  :class="{ 'page-events__cal-event--live': isLive(event) }"
                  :to="`/event/${event.id}`"
                >
                  <span class="page-events__cal-time">{{ startClock(event) }}</span>
                  <span class="page-events__cal-name">{{ event.title }}</span>
                </router-link>
                <button
                  v-if="calendarDayEvents(timestamp.date).length > 2"
                  type="button"
                  class="page-events__cal-more"
                  @click="pickCalendarDay(timestamp.date)"
                >
                  +{{ calendarDayEvents(timestamp.date).length - 2 }} weitere
                </button>
              </div>
            </template>
          </q-calendar-month>
        </section>
      </div>

      <aside class="page-events__aside" aria-label="Kalender und Hinweise">
        <div class="page-events__card">
          <event-mini-calendar
            :month="date"
            :counts="monthDayCounts"
            :selected="selectedDate"
            :prev-link="prevLink"
            :next-link="nextLink"
            @select="selectDate"
          />
        </div>

        <div class="page-events__card">
          <h2 class="page-events__card-title">Nie wieder verpassen</h2>
          <p class="page-events__card-text">
            Jede Eventseite hat einen Knopf „In Kalender (.ics)“, damit landet der Termin direkt in deinem Kalender.
          </p>
          <q-btn
            v-if="canDownloadMyIcs"
            flat
            class="elpis-btn elpis-btn--secondary page-events__card-btn"
            icon="event_available"
            label="Meine Zusagen (.ics)"
            :loading="icsPending"
            @click="downloadMyIcs"
          />
          <p class="page-events__card-text">
            Viele Veranstalter kündigen ihre Events zusätzlich auf Discord an.
          </p>
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { QCalendarMonth } from '@quasar/quasar-ui-qcalendar/dist/QCalendarMonth.esm.js';
import { DateTime } from 'luxon';
import { Role } from '@app/shared/enums/role.enum';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { EventTypeOptions } from 'src/common/event-types';
import { useApi } from 'src/boot/axios';
import { useRouter } from 'src/router';
import { RouteLocationNormalized, RouteParams } from 'vue-router';
import { notifyError } from 'src/common/notify';
import { createMetaMixin } from 'quasar';
import PageHead from 'components/vision/PageHead.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import EventCard from 'components/vision/EventCard.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import type { EventCardEvent, SectionTab } from 'components/vision/types';
import EventMiniCalendar from 'components/event/EventMiniCalendar.vue';
import {
  SERVER_ZONE,
  countLabel,
  effectiveEnd,
  isAdultEvent,
  isEventLive,
  isEventOver,
  locationLabel,
  serverDateTime,
} from 'components/event/event-display';
import { WEEKDAYS_LONG } from 'components/venues/venue-status';

// ER2-501 / ER2-502 — list-first events page. Default view is a day-grouped
// list (Heute / Diese Woche / Monat), the month grid is the secondary
// "Kalender" view. `/calendar/:year/:month` picks the month for the mini
// calendar, the "Monat" tab and the grid.

const $api = useApi();
const $router = useRouter();

type RangeKey = 'heute' | 'woche' | 'monat';
type ViewMode = 'liste' | 'kalender';

interface DayGroup {
  key: string;
  title: string;
  subtitle: string;
  events: EventSummaryDto[];
}

function monthFromParams(params: RouteParams): DateTime {
  const year = parseInt(params.year as string, 10);
  const month = parseInt(params.month as string, 10);
  if (!year || !month) {
    return DateTime.now().setZone(SERVER_ZONE).startOf('month');
  }
  return DateTime.fromObject({ year, month, day: 1 }, { zone: SERVER_ZONE });
}

async function load(params: RouteParams): Promise<{ date: DateTime; events: EventSummaryDto[] }> {
  const date = monthFromParams(params);
  const current = DateTime.now().setZone(SERVER_ZONE).startOf('month');
  // The route month plus this and next month, so "Heute" and "Diese Woche"
  // work on every month page and across month ends.
  const months = [ date, current, current.plus({ months: 1 }) ]
    .filter((month, index, all) => all.findIndex((other) => other.hasSame(month, 'month')) === index);

  try {
    const results = await Promise.all(months.map((month, index) => {
      const request = $api.events.getEventsForMonth(month.year, month.month);
      return index === 0 ? request : request.catch(() => [] as EventSummaryDto[]);
    }));
    const byId = new Map<number, EventSummaryDto>();
    for (const event of results.flat()) {
      byId.set(event.id, event);
    }
    return { date, events: Array.from(byId.values()) };
  } catch (e) {
    notifyError(e);
    void $router.replace('/');
    throw e;
  }
}

function sameMonthParams(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  return to.params.year === from.params.year && to.params.month === from.params.month;
}

@Options({
  name: 'PageEventCalendar',
  components: {
    QCalendarMonth,
    PageHead,
    SectionTabs,
    EventCard,
    EmptyState,
    EventMiniCalendar,
  },
  async beforeRouteEnter(to, _, next) {
    const { date, events } = await load(to.params);
    next((vm) => (vm as PageEventCalendar).setContent(date, events));
  },
  async beforeRouteUpdate(to, from) {
    // Tab and view changes only touch the query.
    if (sameMonthParams(to, from)) {
      return;
    }
    const { date, events } = await load(to.params);
    (this as PageEventCalendar).setContent(date, events);
  },
  mixins: [
    createMetaMixin(function (this: PageEventCalendar) {
      return {
        title: `Events ${this.yearMonth} - Elpisgarten`,
      };
    }),
  ],
})
export default class PageEventCalendar extends Vue {
  date: DateTime = DateTime.now().setZone(SERVER_ZONE).startOf('month');
  events: EventSummaryDto[] = [];
  now = Date.now();

  range: RangeKey = 'woche';
  viewMode: ViewMode = 'liste';
  selectedDate = '';

  filterType: EventType | '' = '';
  filterServer = '';
  sfwOnly = false;
  liveOnly = false;

  myRsvp: Record<number, EventRegistrationKind | undefined> = {};
  rsvpPending: Record<number, boolean> = {};
  icsPending = false;

  private timer: number | null = null;

  readonly viewOptions: { value: ViewMode; label: string; icon: string }[] = [
    { value: 'liste', label: 'Liste', icon: 'view_agenda' },
    { value: 'kalender', label: 'Kalender', icon: 'calendar_month' },
  ];

  readonly typeOptions: { value: EventType | ''; label: string }[] = [
    { value: '', label: 'Alle Typen' },
    ...EventTypeOptions,
  ];

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);
  }

  beforeUnmount() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  setContent(date: DateTime, events: EventSummaryDto[]) {
    const monthChanged = !this.date.hasSame(date, 'month') || this.events.length === 0;
    this.date = date;
    this.events = events;
    this.now = Date.now();

    const query = this.$route.query;
    if (monthChanged && !query.zeitraum) {
      this.range = this.isCurrentMonth ? 'woche' : 'monat';
    }
    this.viewMode = query.ansicht === 'kalender' ? 'kalender' : 'liste';
    if (this.selectedDate && !this.selectedDate.startsWith(date.toFormat('yyyy-LL'))) {
      this.selectedDate = '';
    }
  }

  // --- Permissions ---------------------------------------------------------

  get canCreate(): boolean {
    const role = this.$store.getters.role;
    return !!role && role !== Role.UNVERIFIED;
  }

  get characterId(): number | null {
    return this.$store.getters.characterId;
  }

  /** ER2-801 fields present means the RSVP and .ics endpoints exist. */
  get apiSupportsRsvp(): boolean {
    return this.events.some((event) => typeof event.goingCount === 'number');
  }

  get canDownloadMyIcs(): boolean {
    return !!this.characterId && this.apiSupportsRsvp;
  }

  // --- Dates ---------------------------------------------------------------

  get isCurrentMonth(): boolean {
    return this.date.hasSame(DateTime.now().setZone(SERVER_ZONE), 'month');
  }

  get todayIso(): string {
    return DateTime.fromMillis(this.now, { zone: SERVER_ZONE }).toISODate() || '';
  }

  get yearMonth(): string {
    return this.date.setLocale('de').toFormat('LLLL yyyy');
  }

  get dateStr(): string {
    return this.date.toISODate() || '';
  }

  get prevLink(): string {
    const prev = this.date.minus({ months: 1 });
    return `/calendar/${prev.year}/${prev.month}`;
  }

  get nextLink(): string {
    const next = this.date.plus({ months: 1 });
    return `/calendar/${next.year}/${next.month}`;
  }

  get selectedDateLabel(): string {
    return DateTime.fromISO(this.selectedDate, { zone: SERVER_ZONE }).setLocale('de').toFormat('cccc, d. LLLL');
  }

  dayKey(millis: number): string {
    return serverDateTime(millis).toISODate() || '';
  }

  startClock(event: EventSummaryDto): string {
    return serverDateTime(event.startDateTime).toFormat('HH:mm');
  }

  isLive(event: EventSummaryDto): boolean {
    return isEventLive(event, this.now);
  }

  // --- Filters (ER2-502) ---------------------------------------------------

  get serverOptions(): { value: string; label: string }[] {
    const servers = new Set<string>();
    for (const event of this.events) {
      for (const location of event.locations || []) {
        if (location.server) {
          servers.add(location.server);
        }
      }
    }
    return [
      { value: '', label: 'Alle Server' },
      ...Array.from(servers).sort().map((server) => ({ value: server, label: server })),
    ];
  }

  get typeChipLabel(): string {
    if (!this.filterType) {
      return 'Typ';
    }
    const option = this.typeOptions.find((entry) => entry.value === this.filterType);
    return `Typ: ${option ? option.label : this.filterType}`;
  }

  get hasActiveFilters(): boolean {
    return !!this.filterType || !!this.filterServer || this.sfwOnly || this.liveOnly;
  }

  resetFilters() {
    this.filterType = '';
    this.filterServer = '';
    this.sfwOnly = false;
    this.liveOnly = false;
  }

  get filteredEvents(): EventSummaryDto[] {
    return this.events
      .filter((event) => {
        if (this.filterType && event.eventType !== this.filterType) {
          return false;
        }
        if (this.filterServer && !(event.locations || []).some((location) => location.server === this.filterServer)) {
          return false;
        }
        if (this.sfwOnly && isAdultEvent(event)) {
          return false;
        }
        if (this.liveOnly && !this.isLive(event)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.startDateTime - b.startDateTime);
  }

  /** Not yet over, for the recurring panel. */
  get upcomingEvents(): EventSummaryDto[] {
    return this.filteredEvents.filter((event) => !isEventOver(event, this.now));
  }

  // --- Ranges (ER2-501) ----------------------------------------------------

  eventsInRange(range: RangeKey): EventSummaryDto[] {
    const today = DateTime.fromMillis(this.now, { zone: SERVER_ZONE }).startOf('day');
    const upcoming = this.upcomingEvents;
    switch (range) {
      case 'heute': {
        const tomorrow = today.plus({ days: 1 }).toMillis();
        return upcoming.filter((event) => event.startDateTime < tomorrow);
      }
      case 'woche': {
        const limit = today.plus({ days: 7 }).toMillis();
        return upcoming.filter((event) => event.startDateTime < limit);
      }
      default: {
        const monthStart = this.date.startOf('month').toMillis();
        const monthEnd = this.date.endOf('month').toMillis();
        const source = this.date < today.startOf('month') ? this.filteredEvents : upcoming;
        return source.filter((event) =>
          event.startDateTime <= monthEnd && effectiveEnd(event) >= monthStart);
      }
    }
  }

  get rangeTabs(): SectionTab[] {
    return [
      { key: 'heute', label: 'Heute', icon: 'today', count: this.eventsInRange('heute').length },
      { key: 'woche', label: 'Diese Woche', icon: 'date_range', count: this.eventsInRange('woche').length },
      { key: 'monat', label: this.isCurrentMonth ? 'Monat' : this.date.setLocale('de').toFormat('LLLL'), icon: 'calendar_month', count: this.eventsInRange('monat').length },
    ];
  }

  get listEvents(): EventSummaryDto[] {
    if (this.selectedDate) {
      return this.filteredEvents.filter((event) => this.dayKey(event.startDateTime) === this.selectedDate);
    }
    return this.eventsInRange(this.range);
  }

  get listGroups(): DayGroup[] {
    const groups: DayGroup[] = [];
    const today = DateTime.fromMillis(this.now, { zone: SERVER_ZONE }).startOf('day');
    for (const event of this.listEvents) {
      // Running events that started yesterday still belong to "Heute".
      const startKey = this.dayKey(event.startDateTime);
      const key = !this.selectedDate && this.isLive(event) && startKey < this.todayIso ? this.todayIso : startKey;
      let group = groups.find((entry) => entry.key === key);
      if (!group) {
        const day = DateTime.fromISO(key, { zone: SERVER_ZONE }).setLocale('de');
        const diff = Math.round(day.diff(today, 'days').days);
        const weekday = WEEKDAYS_LONG[day.weekday - 1];
        group = {
          key,
          title: diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : weekday,
          subtitle: diff === 0 || diff === 1 ? `${weekday}, ${day.toFormat('d. LLLL')}` : day.toFormat('d. LLLL yyyy'),
          events: [],
        };
        groups.push(group);
      }
      group.events.push(event);
    }
    return groups;
  }

  get emptyTitle(): string {
    if (this.liveOnly) {
      return 'Gerade läuft nichts';
    }
    if (this.selectedDate) {
      return 'An diesem Tag ist nichts eingetragen';
    }
    return 'Keine Events in diesem Zeitraum';
  }

  get emptyText(): string {
    if (this.hasActiveFilters) {
      return 'Mit weniger Filtern findest du vielleicht mehr.';
    }
    return 'Schau in einen anderen Zeitraum oder trag selbst etwas ein.';
  }

  onEmptyAction() {
    if (this.hasActiveFilters) {
      this.resetFilters();
    }
  }

  onRangeSelect() {
    this.selectedDate = '';
  }

  // --- View + date selection -----------------------------------------------

  setViewMode(mode: ViewMode) {
    this.viewMode = mode;
    const query = { ...this.$route.query };
    if (mode === 'kalender') {
      query.ansicht = 'kalender';
    } else {
      delete query.ansicht;
    }
    void this.$router.replace({ query });
  }

  selectDate(iso: string) {
    this.selectedDate = this.selectedDate === iso ? '' : iso;
  }

  pickCalendarDay(iso: string) {
    this.selectedDate = iso;
    this.setViewMode('liste');
  }

  clearSelection() {
    this.selectedDate = '';
  }

  get eventsByDay(): Record<string, EventSummaryDto[]> {
    const map: Record<string, EventSummaryDto[]> = {};
    for (const event of this.filteredEvents) {
      const key = this.dayKey(event.startDateTime);
      (map[key] = map[key] || []).push(event);
    }
    return map;
  }

  calendarDayEvents(iso: string): EventSummaryDto[] {
    return this.eventsByDay[iso] || [];
  }

  get monthDayCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [ key, list ] of Object.entries(this.eventsByDay)) {
      counts[key] = list.length;
    }
    return counts;
  }

  // --- Cards + RSVP --------------------------------------------------------

  toCard(event: EventSummaryDto): EventCardEvent {
    const location = (event.locations || [])[0];
    return {
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime,
      endDateTime: effectiveEnd(event),
      imageSrc: event.icon?.thumbUrl || event.icon?.url || null,
      locationLabel: locationLabel(location, !this.filterServer),
      recurringLabel: event.seriesLabel || null,
      live: this.isLive(event),
    };
  }

  countText(event: EventSummaryDto): string {
    const parts: string[] = [];
    if (event.goingCount) {
      parts.push(countLabel(event.goingCount, 'Zusage', 'Zusagen'));
    }
    if (event.interestedCount) {
      parts.push(`${event.interestedCount} interessiert`);
    }
    return parts.join(' · ');
  }

  canRsvp(event: EventSummaryDto): boolean {
    return !!this.characterId && typeof event.goingCount === 'number' && !event.closedEvent;
  }

  rsvpKind(event: EventSummaryDto): EventRegistrationKind {
    return this.isLive(event) ? EventRegistrationKind.GOING : EventRegistrationKind.INTERESTED;
  }

  rsvpLabel(event: EventSummaryDto): string {
    const mine = this.myRsvp[event.id];
    if (mine === EventRegistrationKind.GOING) {
      return 'Bin dabei';
    }
    if (mine === EventRegistrationKind.INTERESTED) {
      return 'Interessiert';
    }
    return this.isLive(event) ? 'Hinkommen' : 'Interessiert';
  }

  private bumpCount(event: EventSummaryDto, kind: EventRegistrationKind, delta: number) {
    if (kind === EventRegistrationKind.GOING) {
      event.goingCount = Math.max(0, (event.goingCount || 0) + delta);
    } else {
      event.interestedCount = Math.max(0, (event.interestedCount || 0) + delta);
    }
  }

  async toggleRsvp(event: EventSummaryDto) {
    const characterId = this.characterId;
    if (!characterId || this.rsvpPending[event.id]) {
      return;
    }
    const current = this.myRsvp[event.id];
    this.rsvpPending = { ...this.rsvpPending, [event.id]: true };
    try {
      if (current) {
        await this.$api.events.unregisterForEvent(event.id, characterId);
        this.bumpCount(event, current, -1);
        this.myRsvp = { ...this.myRsvp, [event.id]: undefined };
      } else {
        const kind = this.rsvpKind(event);
        await this.$api.events.registerForEvent(event.id, characterId, kind);
        this.bumpCount(event, kind, 1);
        this.myRsvp = { ...this.myRsvp, [event.id]: kind };
      }
    } catch (e) {
      notifyError(e);
    } finally {
      this.rsvpPending = { ...this.rsvpPending, [event.id]: false };
    }
  }

  async downloadMyIcs() {
    this.icsPending = true;
    try {
      const ics = await this.$api.events.getMyEventsIcs();
      const url = URL.createObjectURL(new Blob([ ics ], { type: 'text/calendar' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'meine-events.ics';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      notifyError(e);
    } finally {
      this.icsPending = false;
    }
  }
}
</script>

<style src="@quasar/quasar-ui-qcalendar/dist/QCalendarDay.min.css"></style>

<style lang="scss" scoped>
.page-events {
  color: var(--ink-primary);
}

.page-events__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
}

.page-events__tabs {
  flex: 1 1 320px;
  min-width: 0;
}

.page-events__segmented {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--rule-soft);
  border-radius: 10px;
  background-color: var(--vision-card);
}

.page-events__segment {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-muted);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: var(--ink-primary);
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-events__segment--active,
.page-events__segment--active:hover {
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);
}

.page-events__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.page-events__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background-color: transparent;
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  .q-icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-events__chip--active,
.page-events__chip--active:hover {
  border-color: var(--vision-primary);
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);

  .page-events__live-dot {
    background-color: var(--vision-on-primary);
  }
}

.page-events__chip--ghost {
  border-color: transparent;
  color: var(--ink-link);
}

.page-events__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--vision-live);
}

.page-events__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.page-events__main {
  display: grid;
  gap: 28px;
  min-width: 0;
}

.page-events__selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--rule-tint);
  font-family: var(--font-ui);
  font-size: 14px;
}

.page-events__day {
  display: grid;
  gap: 12px;
}

.page-events__day-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rule-soft);
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.page-events__day-date {
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-muted);
}

.page-events__cards {
  display: grid;
  gap: 10px;
}

.page-events__count {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
  white-space: nowrap;
}

.page-events__aside {
  display: grid;
  gap: 16px;

  @media (min-width: 1024px) {
    position: sticky;
    top: 88px;
  }
}

.page-events__card {
  padding: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.page-events__card-title {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.page-events__card-text {
  margin: 0 0 10px;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-muted);

  &:last-child {
    margin-bottom: 0;
  }
}

.page-events__card-btn {
  margin-bottom: 12px;
}

// Kalender view — q-calendar-month restyled with tokens.
.page-events__calendar {
  --calendar-border: var(--rule-soft) 1px solid;
  --calendar-border-dark: var(--rule-soft) 1px solid;
  --calendar-border-current: var(--rule-strong) 2px solid;
  --calendar-border-current-dark: var(--rule-strong) 2px solid;
  --calendar-color: var(--ink-primary);
  --calendar-color-dark: var(--ink-primary);
  --calendar-background: var(--vision-card);
  --calendar-background-dark: var(--vision-card);
  --calendar-current-color: var(--ink-link);
  --calendar-current-color-dark: var(--ink-link);
  --calendar-outside-color: var(--ink-muted);
  --calendar-outside-color-dark: var(--ink-muted);
  --calendar-disabled-date-color: var(--ink-muted);
  --calendar-disabled-date-color-dark: var(--ink-muted);

  display: grid;
  gap: 14px;
  min-width: 0;
  overflow-x: auto;

  :deep(.q-calendar) {
    min-width: 640px;
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.q-calendar-month__head--weekday) {
    font-family: var(--font-ui);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
}

.page-events__calendar-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.page-events__calendar-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.page-events__cal-day {
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 100%;
  min-height: 72px;
  padding: 2px 4px 6px;
  cursor: pointer;
}

.page-events__cal-day--selected {
  background-color: var(--rule-tint);
  box-shadow: inset 0 0 0 2px var(--rule-strong);
}

.page-events__cal-event {
  display: flex;
  gap: 4px;
  min-width: 0;
  padding: 2px 6px;
  border-left: 3px solid var(--rule-strong);
  border-radius: 4px;
  background-color: var(--rule-tint);
  color: var(--ink-primary) !important;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 16px;
  text-decoration: none !important;

  &:hover,
  &:focus-visible {
    background-color: var(--rule-soft);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether);
  }
}

.page-events__cal-event--live {
  border-left-color: var(--vision-live);
}

.page-events__cal-time {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.page-events__cal-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-events__cal-more {
  align-self: flex-start;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: var(--ink-link);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether);
  }
}
</style>

<style lang="scss">
// q-menu is teleported to <body>, so its active item needs an unscoped rule.
.page-events__menu .q-item--active {
  color: var(--ink-link);
  font-weight: 600;
}
</style>
