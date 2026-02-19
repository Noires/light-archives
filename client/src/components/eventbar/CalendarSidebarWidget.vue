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
                        <div class="calendar-widget__event-title-line">
                          <div class="calendar-widget__event-title">
                            {{ event.title }}
                          </div>
                          <div class="calendar-widget__event-indicators">
                            <q-icon
                              v-if="hasEventWarnings(event)"
                              name="priority_high"
                              class="calendar-widget__event-warning-indicator"
                              size="13px"
                            />
                            <span
                              v-if="isAdultEvent(event)"
                              class="calendar-widget__event-badge"
                            >
                              18+
                            </span>
                          </div>
                        </div>
                        <div
                          v-if="summaryLocationText(event) || summaryServerText(event)"
                          class="calendar-widget__event-location-line"
                        >
                          <q-icon name="place" />
                          <span class="calendar-widget__event-location-text">
                            {{ summaryLocationText(event) || summaryServerText(event) }}
                          </span>
                          <span
                            v-if="summaryLocationText(event) && summaryServerText(event)"
                            class="calendar-widget__event-server-chip"
                          >
                            {{ summaryServerText(event) }}
                          </span>
                        </div>
                        <div class="calendar-widget__event-meta-line">
                          <span class="calendar-widget__event-meta-item calendar-widget__event-meta-item--time">
                            <q-icon name="schedule" />
                            <span>{{ formatTimeRange(event) }}</span>
                          </span>
                          <span class="calendar-widget__event-meta-item calendar-widget__event-meta-item--type">
                            <q-icon name="store" />
                            <span>{{ summaryLocationType(event) }}</span>
                          </span>
                        </div>
                      </div>
                      <q-btn
                        class="calendar-widget__event-toggle-btn"
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
                            class="calendar-widget__event-link-btn"
                            :label="eventLinkLabel(event)"
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

  summaryLocationText(event: EventSummaryDto) {
    if (!event.locations || event.locations.length === 0) {
      return '';
    }

    const location = event.locations[0];
    return location.address || location.name || '';
  }

  summaryServerText(event: EventSummaryDto) {
    if (!event.locations || event.locations.length === 0) {
      return '';
    }

    const location = event.locations[0];
    return location.server || '';
  }

  eventIconUrl(event: EventSummaryDto) {
    return event.icon?.thumbUrl || event.icon?.url || '';
  }

  eventLinkLabel(event: EventSummaryDto): string {
    const label = (event.linkText || '').trim();
    return label || event.link;
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

  hasEventWarnings(event: EventSummaryDto): boolean {
    return this.eventWarnings(event).length > 0;
  }

  eventTypeLabel(event: EventSummaryDto): string {
    return EventTypeLabels[event.eventType] || EventTypeLabels[EventType.RP];
  }

  summaryLocationType(event: EventSummaryDto): string {
    if (event.locations && event.locations.length > 0) {
      const tags = (event.locations[0].tags || '').trim();
      if (tags.length > 0) {
        return tags;
      }
    }

    return this.eventTypeLabel(event);
  }
}
</script>

<style lang="scss">
.calendar-widget {
  height: 100%;
  min-height: 0;
  border-radius: 30px;
  overflow: hidden;
}

.calendar-widget__card {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
  background-clip: padding-box;
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
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px 18px 18px;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 0 0 30px 30px;
}

.calendar-widget .q-date {
  border-radius: 0;
  box-shadow: none;
  width: 100%;
  min-width: 0;
  max-width: 100%;
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
  gap: 10px;
}

.calendar-widget__list-group {
  display: grid;
  gap: 8px;
}

.calendar-widget__list-cards {
  display: grid;
  gap: 8px;
}

.calendar-widget__date-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 600;
  font-size: 0.84rem;
  color: #1f2c38;
  border-bottom: 1px solid rgba(221, 180, 118, 0.2);
  padding-bottom: 4px;
  margin-bottom: 8px;
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
  border-radius: 10px;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;
}

.calendar-widget__event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
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
  width: 30px;
  height: 30px;
  border-radius: 0;
  background: rgba(221, 180, 118, 0.12);
  border: 1px solid rgba(221, 180, 118, 0.2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.calendar-widget__event-icon .q-icon {
  color: #ddb476;
  font-size: 16px;
}

.calendar-widget__event-icon-img {
  border-radius: 0;
  width: 30px;
  height: 30px;
}

.calendar-widget__event-content {
  flex: 1;
  min-width: 0;
}

.calendar-widget__event-summary {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 24px;
  align-items: start;
  column-gap: 8px;
  padding: 8px 10px;
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

.calendar-widget__event-summary > .q-btn {
  margin-top: 0;
  align-self: flex-start;
}

.calendar-widget__event-toggle-btn {
  width: 24px;
  min-width: 24px;
  height: 24px;
  min-height: 24px;
  margin-top: 1px;
}

.calendar-widget__event-summary-text {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.calendar-widget__event-title-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: flex-start;
  column-gap: 4px;
  min-width: 0;
}

.calendar-widget__event-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1f2c38;
  line-height: 1.2;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

.calendar-widget__event-indicators {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 1px;
}

.calendar-widget__event-warning-indicator {
  color: #d56868;
  font-size: 13px;
}

.calendar-widget__event-location-line {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: flex-start;
  column-gap: 4px;
  color: rgba(35, 35, 35, 0.75);
  min-width: 0;
  line-height: 1.2;
  font-size: 0.78rem;
}

.calendar-widget__event-location-line .q-icon {
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 1px;
}

.calendar-widget__event-location-text {
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

.calendar-widget__event-server-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(31, 77, 100, 0.15);
  color: #1f4d64;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.35;
  text-transform: uppercase;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 1px;
}

.calendar-widget__event-meta-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
  row-gap: 4px;
  min-width: 0;
  margin-top: 1px;
}

.calendar-widget__event-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.73rem;
  color: #43505a;
  min-width: 0;
  max-width: 100%;
  width: fit-content;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(31, 77, 100, 0.08);
}

.calendar-widget__event-meta-item .q-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.calendar-widget__event-meta-item--time {
  white-space: nowrap;
}

.calendar-widget__event-meta-item--type {
  min-width: 0;
}

.calendar-widget__event-meta-item--type > span {
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: break-word;
  word-break: break-word;
}

.calendar-widget__event-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 0;
  background: rgba(204, 74, 74, 0.15);
  color: #b33a3a;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  line-height: 1.2;
}

.calendar-widget__event-meta {
  display: grid;
  gap: 3px;
  font-size: 0.8rem;
  color: #555;
}

.calendar-widget__event-row {
  display: flex;
  gap: 5px;
  align-items: center;
  line-height: 1.2;
}

.calendar-widget__event-row i {
  font-size: 14px;
}

.calendar-widget__event-details {
  padding: 0 10px 10px;
}

.calendar-widget__event-warnings {
  margin-top: 8px;
  display: grid;
  gap: 4px;
}

.calendar-widget__event-warnings-title {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(35, 35, 35, 0.65);
  font-weight: 600;
}

.calendar-widget__event-warnings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.calendar-widget__event-warning {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(221, 180, 118, 0.22);
  color: #6b4c21;
  font-size: 0.68rem;
  font-weight: 600;
}

.calendar-widget__event-warnings-empty {
  font-size: 0.74rem;
  color: rgba(35, 35, 35, 0.6);
}

.calendar-widget__event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  min-width: 0;
}

body.body--dark .calendar-widget__card {
  border-color: rgba(141, 181, 223, 0.28);
  background: rgba(15, 22, 32, 0.95);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.34), 0 4px 12px rgba(0, 0, 0, 0.26);
}

body.body--dark .calendar-widget__header {
  background: linear-gradient(135deg, rgba(141, 181, 223, 0.16) 0%, rgba(141, 181, 223, 0.06) 100%);
  border-image: linear-gradient(90deg, rgba(141, 181, 223, 0.45) 0%, rgba(141, 181, 223, 0.15) 50%, rgba(141, 181, 223, 0.45) 100%);
}

body.body--dark .calendar-widget__title,
body.body--dark .calendar-widget__list-header,
body.body--dark .calendar-widget__date-header,
body.body--dark .calendar-widget__event-title,
body.body--dark .calendar-widget__event-meta,
body.body--dark .calendar-widget__event-meta-item {
  color: rgba(213, 226, 240, 0.94);
}

body.body--dark .calendar-widget__subtitle,
body.body--dark .calendar-widget__count,
body.body--dark .calendar-widget__empty,
body.body--dark .calendar-widget__date-weekday,
body.body--dark .calendar-widget__event-location-line,
body.body--dark .calendar-widget__event-warnings-empty,
body.body--dark .calendar-widget__event-warnings-title {
  color: rgba(213, 226, 240, 0.72);
}

body.body--dark .calendar-widget__list-header,
body.body--dark .calendar-widget__date-header {
  border-bottom-color: rgba(141, 181, 223, 0.26);
}

body.body--dark .calendar-widget__actions .q-btn,
body.body--dark .calendar-widget__heading .q-icon {
  color: #8db5df;
}

body.body--dark .calendar-widget__actions .q-btn:hover {
  color: #dcecff;
  background: rgba(141, 181, 223, 0.16);
}

body.body--dark .calendar-widget .q-date {
  background: rgba(17, 24, 34, 0.96);
  color: rgba(213, 226, 240, 0.92);
}

body.body--dark .calendar-widget .q-date__header {
  background: linear-gradient(135deg, rgba(141, 181, 223, 0.14) 0%, transparent 100%);
  color: rgba(213, 226, 240, 0.92);
  border-bottom-color: rgba(141, 181, 223, 0.26);
}

body.body--dark .calendar-widget .q-date__header-link,
body.body--dark .calendar-widget .q-date__calendar-weekdays {
  color: rgba(213, 226, 240, 0.84);
}

body.body--dark .calendar-widget .q-date__calendar-weekdays {
  background: rgba(141, 181, 223, 0.12);
}

body.body--dark .calendar-widget .q-date__calendar-item button:hover {
  background: rgba(141, 181, 223, 0.18) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

body.body--dark .calendar-widget .q-date__calendar-item--selected {
  background: rgba(141, 181, 223, 0.24) !important;
  box-shadow: inset 0 0 0 2px rgba(141, 181, 223, 0.36);
}

body.body--dark .calendar-widget .q-date__event {
  background: #8db5df !important;
}

body.body--dark .calendar-widget__filters .q-field__control {
  background: rgba(17, 24, 34, 0.94);
  border-color: rgba(141, 181, 223, 0.28);
}

body.body--dark .calendar-widget__filters .q-field__control:hover {
  border-color: rgba(141, 181, 223, 0.44);
}

body.body--dark .calendar-widget__filters .q-field__native,
body.body--dark .calendar-widget__filters .q-field__label,
body.body--dark .calendar-widget__filters .q-field__append {
  color: rgba(213, 226, 240, 0.84);
}

body.body--dark .calendar-widget__event-card {
  background: rgba(17, 24, 34, 0.96);
  border-color: rgba(141, 181, 223, 0.24);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

body.body--dark .calendar-widget__event-card:hover {
  border-color: rgba(141, 181, 223, 0.42);
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.34);
}

body.body--dark .calendar-widget__event-icon {
  background: rgba(141, 181, 223, 0.18);
  border-color: rgba(141, 181, 223, 0.32);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.24);
}

body.body--dark .calendar-widget__event-icon .q-icon {
  color: rgba(196, 221, 247, 0.95);
}

body.body--dark .calendar-widget__event-summary:hover {
  background: rgba(141, 181, 223, 0.13);
  box-shadow: inset 0 0 0 1px rgba(141, 181, 223, 0.3);
}

body.body--dark .calendar-widget__event-meta-item {
  background: rgba(141, 181, 223, 0.16);
}

body.body--dark .calendar-widget__event-warning {
  background: rgba(141, 181, 223, 0.18);
  color: rgba(213, 226, 240, 0.92);
}

.calendar-widget__event-link-btn {
  max-width: 100%;
}

.calendar-widget__event-link-btn .q-btn__content {
  max-width: 100%;
  min-width: 0;
}

.calendar-widget__event-link-btn .block {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
