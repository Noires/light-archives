<template>
  <aside class="calendar-widget">
    <q-card class="calendar-widget__card">
      <header class="calendar-widget__header">
        <div class="calendar-widget__heading">
          <q-icon name="event" />
          <div>
            <div class="calendar-widget__title">Eventkalender (Prototyp)</div>
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

          <div class="calendar-widget__list-header">
            <span>{{ listTitle }}</span>
            <q-btn
              v-if="selectedDate"
              flat
              dense
              size="sm"
              label="Zuruecksetzen"
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
                          {{ formatTimeRange(event) }}
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
                        </div>
                        <div class="calendar-widget__event-actions">
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
        </div>
      </q-slide-transition>
    </q-card>
  </aside>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

type NavigationPayload = { year: number | string; month: number | string };

@Options({})
export default class CalendarSidebarWidget extends Vue {
  collapsed = false;
  selectedDate: string | null = null;
  upcomingEvents: EventSummaryDto[] = [];
  monthEvents: EventSummaryDto[] = [];
  eventDates: string[] = [];
  loadingUpcoming = false;
  loadingMonth = false;
  calendarYear = DateTime.now().year;
  calendarMonth: number = DateTime.now().month;

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
      return this.monthEvents
        .filter((event) => this.eventDateKey(event) === this.selectedDate)
        .sort((a, b) => a.startDateTime - b.startDateTime);
    }

    return this.upcomingEvents
      .slice()
      .sort((a, b) => a.startDateTime - b.startDateTime);
  }

  get groupedDisplayedEvents() {
    return this.buildEventGroups(this.displayedEvents);
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
        const endDateTime = event.endDateTime ?? event.startDateTime;
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
    this.eventDates = Array.from(
      new Set(this.monthEvents.map((event) => this.eventDateKey(event)))
    );
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
}
</script>

<style lang="scss">
.calendar-widget__card {
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.calendar-widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.04);
}

.calendar-widget__heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-widget__title {
  font-weight: bold;
}

.calendar-widget__subtitle,
.calendar-widget__count {
  font-size: 0.85rem;
  color: #666;
}

.calendar-widget__actions .q-btn {
  color: $primary;
}

.calendar-widget__body {
  padding: 12px 16px 16px;
}

.calendar-widget__list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 12px;
  font-weight: 600;
}

.calendar-widget__empty {
  font-size: 0.85rem;
  color: #666;
  padding: 8px 0;
}

.calendar-widget__list {
  display: grid;
  gap: 12px;
}

.calendar-widget__list-group {
  display: grid;
  gap: 10px;
}

.calendar-widget__list-cards {
  display: grid;
  gap: 10px;
}

.calendar-widget__date-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 600;
  font-size: 0.85rem;
}

.calendar-widget__date-divider {
  color: #999;
  font-weight: 400;
}

.calendar-widget__date-weekday {
  color: #666;
  font-weight: 500;
}

.calendar-widget__event-card {
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.calendar-widget__event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
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
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.calendar-widget__event-icon-img {
  border-radius: 8px;
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
}

.calendar-widget__event-summary:focus {
  outline: 2px solid rgba(22, 98, 149, 0.25);
  outline-offset: 2px;
}

.calendar-widget__event-summary-text {
  flex: 1;
  min-width: 0;
}

.calendar-widget__event-time {
  font-size: 0.8rem;
  color: #555;
  margin-bottom: 2px;
}

.calendar-widget__event-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.calendar-widget__event-summary .calendar-widget__event-title {
  margin-bottom: 0;
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

.calendar-widget__event-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

@media screen and (max-width: $breakpoint-sm) {
  .calendar-widget__body {
    padding: 12px;
  }
}
</style>
