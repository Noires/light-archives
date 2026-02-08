<template>
  <aside class="calendar-widget">
    <q-card class="calendar-widget__card">
      <header class="calendar-widget__header">
        <div class="calendar-widget__heading">
          <q-icon name="event" />
          <div>
            <div class="calendar-widget__title">Eventkalender</div>
            <div v-if="collapsed" class="calendar-widget__count">
              {{ upcomingCountLabel }}
            </div>
            <div v-else class="calendar-widget__subtitle">
              {{ listTitle }}
            </div>
          </div>
        </div>
        <div class="calendar-widget__actions">
          <q-btn
            v-if="$store.getters.role && $store.getters.role !== Role.UNVERIFIED"
            flat
            round
            dense
            icon="add"
            to="/create-event"
            aria-label="Event erstellen"
          />
          <q-btn
            flat
            round
            dense
            icon="open_in_full"
            to="/calendar"
            aria-label="Kalender maximieren"
          />
          <q-btn
            flat
            round
            dense
            :icon="collapsed ? 'expand_more' : 'expand_less'"
            aria-label="Kalender ein- oder ausklappen"
            @click="toggleCollapsed"
          />
        </div>
      </header>

      <q-slide-transition>
        <div v-show="!collapsed" class="calendar-widget__body">
          <q-date
            :model-value="selectedDate"
            mask="YYYY-MM-DD"
            minimal
            flat
            :default-year-month="calendarYearMonth"
            :events="eventDates"
            event-color="primary"
            @navigation="onNavigate"
            @update:model-value="onDateChange"
          />

          <div class="calendar-widget__filters">
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

          <div class="calendar-widget__list-header">
            <span>{{ listTitle }}</span>
            <q-btn
              v-if="selectedDate"
              flat
              dense
              size="sm"
              label="Zurücksetzen"
              @click="clearSelection"
            />
          </div>

          <div v-if="isLoading" class="calendar-widget__empty">
            Events werden geladen...
          </div>
          <div v-else-if="displayedEvents.length === 0" class="calendar-widget__empty">
            Keine Events gefunden.
          </div>
          <div v-else class="calendar-widget__list">
            <div
              v-for="group in groupedDisplayedEvents"
              :key="group.dateKey"
              class="calendar-widget__list-group"
            >
              <div class="calendar-widget__date-header">
                <span class="calendar-widget__date-label">{{ group.dateLabel }}</span>
                <span class="calendar-widget__date-divider">|</span>
                <span class="calendar-widget__date-weekday">{{ group.weekday }}</span>
              </div>
              <div class="calendar-widget__list-cards">
                <div
                  v-for="event in group.events"
                  :key="event.id"
                  class="calendar-widget__event-card"
                >
                  <div class="calendar-widget__event-collapsible">
                    <div
                      class="calendar-widget__event-summary"
                      role="button"
                      tabindex="0"
                      @click="toggleExpanded(event.id)"
                      @keyup.enter="toggleExpanded(event.id)"
                    >
                      <div class="calendar-widget__event-icon">
                        <q-img
                          v-if="event.icon"
                          :src="eventIconUrl(event)"
                          :ratio="1"
                          fit="cover"
                          class="calendar-widget__event-icon-img"
                        />
                        <q-icon v-else name="event" />
                      </div>
                      <div class="calendar-widget__event-summary-text">
                        <div class="calendar-widget__event-time">
                          <span>{{ formatTimeRange(event) }}</span>
                          <span
                            v-if="isAdultEvent(event)"
                            class="calendar-widget__event-badge"
                          >
                            18+
                          </span>
                        </div>
                        <div class="calendar-widget__event-title">
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
                      <div v-show="isExpanded(event.id)" class="calendar-widget__event-details">
                        <div class="calendar-widget__event-meta">
                          <div
                            v-if="primaryLocation(event)"
                            class="calendar-widget__event-row"
                          >
                            <q-icon name="place" />
                            <span>{{ primaryLocation(event) }}</span>
                          </div>
                        <div class="calendar-widget__event-row">
                          <q-icon name="event" />
                          <span>{{ formatDate(event.startDateTime) }}</span>
                        </div>
                        <div class="calendar-widget__event-row">
                          <q-icon name="category" />
                          <span>{{ eventTypeLabel(event) }}</span>
                        </div>
                        </div>
                        <div class="calendar-widget__event-warnings">
                          <div class="calendar-widget__event-warnings-title">Inhaltswarnungen</div>
                          <div
                            v-if="eventWarnings(event).length"
                            class="calendar-widget__event-warnings-list"
                          >
                            <span
                              v-for="warning in eventWarnings(event)"
                              :key="warning"
                              class="calendar-widget__event-warning"
                            >
                              {{ warning }}
                            </span>
                          </div>
                          <div v-else class="calendar-widget__event-warnings-empty">Keine Angaben.</div>
                        </div>
                        <div class="calendar-widget__event-actions">
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
              </div>
            </div>
          </div>
        </div>
      </q-slide-transition>
    </q-card>
  </aside>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { Role } from '@app/shared/enums/role.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { DateTime } from 'luxon';
import { notifyError } from 'src/common/notify';
import { EventTypeLabels, EventTypeOptions } from 'src/common/event-types';
import { Options, Vue } from 'vue-class-component';

type NavigationPayload = { year: number | string; month: number | string };

@Options({
  watch: {
    selectedType() {
      (this as CalendarSidebarWidget).updateEventDates();
    },
  },
})
export default class CalendarSidebarWidget extends Vue {
  collapsed = false;
  selectedDate: string | null = null;
  selectedType: EventType | '' = '';
  sortMode: 'time' | 'type' = 'time';
  upcomingEvents: EventSummaryDto[] = [];
  monthEvents: EventSummaryDto[] = [];
  eventDates: string[] = [];
  loadingUpcoming = false;
  loadingMonth = false;
  calendarYear = DateTime.now().year;
  calendarMonth: number = DateTime.now().month;
  Role = Role;

  readonly eventTypeFilterOptions = [
    { label: 'Alle Typen', value: '' },
    ...EventTypeOptions,
  ];

  readonly sortOptions = [
    { label: 'Zeit', value: 'time' },
    { label: 'Typ', value: 'type' },
  ];

  async created() {
    try {
      await this.loadMonthEvents(this.calendarYear, this.calendarMonth);
    } catch (e) {
      notifyError(e);
    } finally {
      this.loadingMonth = false;
    }

    this.loadingUpcoming = true;
    try {
      await this.refreshUpcomingEvents();
    } catch (e) {
      notifyError(e);
    } finally {
      this.loadingUpcoming = false;
    }
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
  }

  clearSelection() {
    this.selectedDate = null;
  }

  get calendarYearMonth() {
    const paddedMonth = String(this.calendarMonth).padStart(2, '0');
    return `${this.calendarYear}/${paddedMonth}`;
  }

  get isLoading() {
    return this.loadingUpcoming || this.loadingMonth;
  }

  get upcomingCountLabel() {
    const count = this.upcomingEvents.length;
    return `${count} bevorstehende Events`;
  }

  get listTitle() {
    if (this.selectedDate) {
      return `Events am ${this.formatDateString(this.selectedDate)}`;
    }
    return 'Bevorstehende Events';
  }

  get displayedEvents() {
    if (this.selectedDate) {
      return this.sortEvents(
        this.filterEvents(
          this.monthEvents.filter((event) => this.eventDateKey(event) === this.selectedDate),
        ),
      );
    }

    return this.sortEvents(this.filterEvents(this.upcomingEvents.slice()));
  }

  get groupedDisplayedEvents() {
    return this.buildEventGroups(this.displayedEvents);
  }

  private filterEvents(events: EventSummaryDto[]) {
    if (!this.selectedType) {
      return events;
    }

    return events.filter((event) => event.eventType === this.selectedType);
  }

  private sortEvents(events: EventSummaryDto[]) {
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

  async onNavigate({ year, month }: NavigationPayload) {
    const nextYear = Number(year);
    const nextMonth = Number(month);
    if (!Number.isFinite(nextYear) || !Number.isFinite(nextMonth)) {
      return;
    }
    if (nextMonth < 1 || nextMonth > 12) {
      return;
    }
    this.calendarYear = nextYear;
    this.calendarMonth = nextMonth;
    this.loadingMonth = true;
    try {
      await this.loadMonthEvents(nextYear, nextMonth);
    } catch (e) {
      notifyError(e);
    } finally {
      this.loadingMonth = false;
    }
  }

  private async refreshUpcomingEvents() {
    const upcoming = await this.$api.events.getEvents({ refresh: false });
    const events = Array.isArray(upcoming.events) ? upcoming.events : [];
    if (events.length > 0) {
      this.upcomingEvents = events;
      return;
    }

    this.upcomingEvents = await this.loadUpcomingFromMonths(6);
  }

  private async loadUpcomingFromMonths(monthsAhead: number) {
    const now = DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE);
    const startOfDay = now.startOf('day').toMillis();
    const collected: EventSummaryDto[] = [];

    for (let offset = 0; offset < monthsAhead; offset += 1) {
      const date = now.plus({ months: offset });
      const monthEvents =
        offset === 0 && this.monthEvents.length > 0
          ? this.monthEvents
          : await this.$api.events.getEventsForMonth(date.year, date.month);
      collected.push(...monthEvents);
    }

    return collected
      .filter((event) => {
        const endDateTime = event.endDateTime ? event.endDateTime : event.startDateTime;
        return event.startDateTime >= startOfDay || endDateTime >= startOfDay;
      })
      .sort((a, b) => a.startDateTime - b.startDateTime)
      .slice(0, 10);
  }

  onDateChange(value: string | string[] | null) {
    if (Array.isArray(value)) {
      this.selectedDate = value[0] || null;
      return;
    }
    this.selectedDate = value || null;
  }

  private async loadMonthEvents(year: number, month: number) {
    this.monthEvents = await this.$api.events.getEventsForMonth(year, month);
    this.updateEventDates();
  }

  private updateEventDates() {
    const events = this.filterEvents(this.monthEvents);
    this.eventDates = Array.from(new Set(events.map((event) => this.eventDateKey(event))));
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

  private buildEventGroups(events: EventSummaryDto[]) {
    const groups: { dateKey: string; dateLabel: string; weekday: string; events: EventSummaryDto[] }[] = [];
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
      }).setLocale('de');

      groups.push({
        dateKey,
        dateLabel: date.toFormat('dd.LL.yyyy'),
        weekday: date.toFormat('cccc'),
        events: [event]
      });
    }

    return groups;
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
}
</script>

<style lang="scss">
.calendar-widget__card {
  border-radius: 2px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border-radius: 30px;
}

.calendar-widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.15) 0%, rgba(221, 180, 118, 0.08) 100%);
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, rgba(221, 180, 118, 0.4) 0%, rgba(221, 180, 118, 0.15) 50%, rgba(221, 180, 118, 0.4) 100%);
  border-image-slice: 1;
  border-radius: 30px 30px 0 0;
}

.calendar-widget__heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.calendar-widget__heading .q-icon {
  color: #ddb476;
  font-size: 1.3rem;
}

.calendar-widget__title {
  font-family: $header-font;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #1f2c38;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.calendar-widget__subtitle,
.calendar-widget__count {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.7);
  margin-top: 2px;
}

.calendar-widget__actions {
  display: flex;
  gap: 4px;
}

.calendar-widget__actions .q-btn {
  color: #1f4d64;
  transition: all 0.2s ease;
}

.calendar-widget__actions .q-btn:hover {
  color: #ddb476;
  background: rgba(221, 180, 118, 0.12);
  transform: scale(1.05);
}

.calendar-widget__body {
  padding: 16px 18px 18px;
}

.calendar-widget .q-date {
  border-radius: 0;
  box-shadow: none;
  width: 100%;
}

.calendar-widget .q-date__header {
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.12) 0%, transparent 100%);
  color: #1f2c38;
  font-family: $header-font;
  padding: 12px;
  border-bottom: 1px solid rgba(221, 180, 118, 0.2);
}

.calendar-widget .q-date__header-link {
  color: #1f2c38;
}

.calendar-widget .q-date__header-link:hover {
  color: #ddb476;
}

.calendar-widget .q-date__calendar-weekdays {
  background: rgba(221, 180, 118, 0.08);
  color: rgba(35, 35, 35, 0.7);
  font-weight: 600;
}

.calendar-widget .q-date__calendar-item--out {
  opacity: 0.3;
}

.calendar-widget .q-date__calendar-item button {
  border-radius: 0;
  transition: all 0.2s ease;
}

.calendar-widget .q-date__calendar-item button:hover {
  background: rgba(221, 180, 118, 0.15) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.calendar-widget .q-date__calendar-item--selected {
  background: rgba(221, 180, 118, 0.25) !important;
  box-shadow: inset 0 0 0 2px rgba(221, 180, 118, 0.4);
}

.calendar-widget .q-date__event {
  background: #ddb476 !important;
  border-radius: 0;
  width: 6px;
  height: 6px;
}

.calendar-widget__filters {
  display: grid;
  gap: 10px;
  margin: 14px 0 10px;
}

.calendar-widget__filters .q-field__control {
  background: #f6f1e8;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  transition: all 0.2s ease;
}

.calendar-widget__filters .q-field__control:hover {
  border-color: rgba(221, 180, 118, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-widget__filters .q-field__control:before,
.calendar-widget__filters .q-field__control:after {
  display: none;
}

.calendar-widget__list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0 14px;
  font-weight: 600;
  color: #1f2c38;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(221, 180, 118, 0.2);
}

.calendar-widget__empty {
  font-size: 0.9rem;
  color: rgba(35, 35, 35, 0.6);
  padding: 12px 0;
  text-align: center;
}

.calendar-widget__list {
  display: grid;
  gap: 16px;
}

.calendar-widget__list-group {
  display: grid;
  gap: 12px;
}

.calendar-widget__list-cards {
  display: grid;
  gap: 12px;
}

.calendar-widget__date-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #1f2c38;
  border-bottom: 1px solid rgba(221, 180, 118, 0.2);
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.calendar-widget__date-divider {
  color: rgba(221, 180, 118, 0.6);
  font-weight: 400;
}

.calendar-widget__date-weekday {
  color: rgba(35, 35, 35, 0.65);
  font-weight: 500;
}

.calendar-widget__event-card {
  background: #ffffff;
  border: 1px solid rgba(221, 180, 118, 0.2);
  border-radius: 0;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.calendar-widget__event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.calendar-widget__event-link {
  display: block;
  padding: 12px;
  color: inherit;
  text-decoration: none;
}

.calendar-widget__event-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.calendar-widget__event-icon {
  width: 32px;
  height: 32px;
  border-radius: 0;
  background: rgba(221, 180, 118, 0.12);
  border: 1px solid rgba(221, 180, 118, 0.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.calendar-widget__event-icon .q-icon {
  color: #ddb476;
}

.calendar-widget__event-icon-img {
  border-radius: 0;
  width: 32px;
  height: 32px;
}

.calendar-widget__event-content {
  flex: 1;
  min-width: 0;
}

.calendar-widget__event-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.calendar-widget__event-summary:focus {
  outline: none;
}

.calendar-widget__event-summary:hover {
  background: rgba(221, 180, 118, 0.12);
  box-shadow: inset 0 0 0 1px rgba(221, 180, 118, 0.25);
}

.calendar-widget__event-summary-text {
  flex: 1;
  min-width: 0;
}

.calendar-widget__event-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #2d2d2d;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
  line-height: 1.2;
}

.calendar-widget__event-title {
  font-weight: 500;
  color: #555;
  line-height: 1.3;
  margin-bottom: 6px;
}

.calendar-widget__event-summary .calendar-widget__event-title {
  margin-bottom: 0;
}

.calendar-widget__event-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 0;
  background: rgba(204, 74, 74, 0.15);
  color: #b33a3a;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.calendar-widget__event-meta {
  display: grid;
  gap: 4px;
  font-size: 0.85rem;
  color: #555;
}

.calendar-widget__event-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.calendar-widget__event-row i {
  font-size: 16px;
}

.calendar-widget__event-details {
  padding: 0 12px 12px;
}

.calendar-widget__event-warnings {
  margin-top: 10px;
  display: grid;
  gap: 6px;
}

.calendar-widget__event-warnings-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(35, 35, 35, 0.65);
  font-weight: 600;
}

.calendar-widget__event-warnings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.calendar-widget__event-warning {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(221, 180, 118, 0.22);
  color: #6b4c21;
  font-size: 0.75rem;
  font-weight: 600;
}

.calendar-widget__event-warnings-empty {
  font-size: 0.8rem;
  color: rgba(35, 35, 35, 0.6);
}

.calendar-widget__event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

@media screen and (max-width: $breakpoint-sm) {
  .calendar-widget__body {
    padding: 12px;
  }

  .calendar-widget__header {
    padding: 14px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .calendar-widget__event-card,
  .calendar-widget__actions .q-btn,
  .calendar-widget .q-date__calendar-item button {
    transition: none;
  }

  .calendar-widget__event-card:hover,
  .calendar-widget__actions .q-btn:hover,
  .calendar-widget .q-date__calendar-item button:hover {
    transform: none;
  }
}
</style>
