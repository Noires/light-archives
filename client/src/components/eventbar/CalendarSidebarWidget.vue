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
              v-for="event in displayedEvents"
              :key="event.id"
              class="calendar-widget__event-card"
            >
              <router-link
                v-if="!event.link"
                class="calendar-widget__event-link"
                :to="`/event/${event.id}`"
              >
                <div class="calendar-widget__event-title">
                  {{ event.title }}
                </div>
                <div class="calendar-widget__event-meta">
                  <div class="calendar-widget__event-row">
                    <q-icon name="schedule" />
                    <span>{{ formatTimeRange(event) }}</span>
                  </div>
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
              </router-link>
              <a
                v-else
                class="calendar-widget__event-link"
                :href="event.link"
                target="_blank"
                rel="noopener"
              >
                <div class="calendar-widget__event-title">
                  {{ event.title }}
                </div>
                <div class="calendar-widget__event-meta">
                  <div class="calendar-widget__event-row">
                    <q-icon name="schedule" />
                    <span>{{ formatTimeRange(event) }}</span>
                  </div>
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
              </a>
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

.calendar-widget__event-title {
  font-weight: 700;
  margin-bottom: 6px;
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

@media screen and (max-width: $breakpoint-sm) {
  .calendar-widget__body {
    padding: 12px;
  }
}
</style>
