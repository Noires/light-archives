<template>
  <q-page class="page-venues">
    <page-head
      :eyebrow="`Treffpunkte · ${venues.length} ${venues.length === 1 ? 'Ort' : 'Orte'}`"
      title="Wohin heute Abend?"
      lead="Tavernen, Bühnen, Badehäuser und mehr. Was gerade geöffnet hat, steht oben."
    >
      <template #actions>
        <q-btn
          v-if="canCreate"
          unelevated
          class="elpis-btn elpis-btn--primary"
          icon="add"
          label="Treffpunkt eintragen"
          to="/create-venue"
        />
      </template>

      <div class="page-venues__toolbar" role="search">
        <q-input
          v-model="searchQuery"
          class="page-venues__search"
          outlined
          dense
          clearable
          debounce="200"
          placeholder="Name, Ort oder Zweck"
          aria-label="Treffpunkte durchsuchen"
          @update:model-value="onFilterChange"
        >
          <template #prepend>
            <q-icon name="search" aria-hidden="true" />
          </template>
        </q-input>
        <div class="page-venues__chips" role="group" aria-label="Filter">
          <button
            v-if="hasStatusData"
            type="button"
            class="page-venues__chip"
            :class="{ 'page-venues__chip--active': openTodayOnly }"
            :aria-pressed="openTodayOnly ? 'true' : 'false'"
            @click="toggleOpenToday"
          >
            <span class="page-venues__open-dot" aria-hidden="true"></span>
            <span>Heute geöffnet</span>
          </button>
          <button
            v-for="option in areaOptions"
            :key="option.value"
            type="button"
            class="page-venues__chip"
            :class="{ 'page-venues__chip--active': areaFilter === option.value }"
            :aria-pressed="areaFilter === option.value ? 'true' : 'false'"
            @click="toggleArea(option.value)"
          >
            {{ option.label }}
          </button>
          <button
            v-if="serverOptions.length > 2"
            type="button"
            class="page-venues__chip"
            :class="{ 'page-venues__chip--active': !!serverFilter }"
            aria-haspopup="menu"
          >
            <q-icon name="dns" aria-hidden="true" />
            <span>{{ serverFilter ? `Server: ${serverFilter}` : 'Server' }}</span>
            <q-icon name="arrow_drop_down" aria-hidden="true" />
            <q-menu anchor="bottom left" self="top left" class="page-venues__menu">
              <q-list dense>
                <q-item
                  v-for="option in serverOptions"
                  :key="option.value || 'all'"
                  v-close-popup
                  clickable
                  :active="serverFilter === option.value"
                  @click="setServer(option.value)"
                >
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>
        </div>
      </div>
    </page-head>

    <p class="page-venues__stats" aria-live="polite">
      {{ filteredCount }} von {{ venues.length }} Treffpunkten
      <template v-if="openCount > 0"> · {{ openCount }} gerade geöffnet</template>
    </p>

    <!-- ER2 outlook: map -->
    <div class="page-venues__view" role="group" aria-label="Ansicht">
      <button
        type="button"
        class="page-venues__chip"
        :class="{ 'page-venues__chip--active': viewMode === 'raster' }"
        :aria-pressed="viewMode === 'raster' ? 'true' : 'false'"
        @click="setView('raster')"
      >
        <q-icon name="grid_view" aria-hidden="true" />
        <span>Raster</span>
      </button>
      <button
        type="button"
        class="page-venues__chip"
        :class="{ 'page-venues__chip--active': viewMode === 'karte' }"
        :aria-pressed="viewMode === 'karte' ? 'true' : 'false'"
        @click="setView('karte')"
      >
        <q-icon name="map" aria-hidden="true" />
        <span>Kartenansicht</span>
      </button>
    </div>
    <venue-map
      v-if="viewMode === 'karte' && filteredCount > 0"
      :venues="filteredVenues"
      :now="now"
    />
    <div v-else-if="viewMode !== 'karte' && pagedVenues.length > 0" class="page-venues__grid">
      <venue-card
        v-for="venue in pagedVenues"
        :key="venue.id"
        :venue="venue"
        :now="now"
        :show-server="!serverFilter"
      />
    </div>
    <empty-state
      v-else
      icon="storefront"
      :title="venues.length === 0 ? 'Noch keine Treffpunkte' : 'Nichts gefunden'"
      :text="venues.length === 0 ? 'Es gibt noch keine Treffpunkte auf Elpisgarten.' : 'Keine Ergebnisse für die aktuellen Filter.'"
      :action-label="venues.length === 0 ? (canCreate ? 'Treffpunkt eintragen' : '') : 'Filter zurücksetzen'"
      :action-to="venues.length === 0 && canCreate ? '/create-venue' : null"
      @action="onEmptyAction"
    />

    <q-pagination
      v-if="viewMode !== 'karte' && maxPage > 1"
      class="page-venues__pagination elpis-pagination"
      :model-value="page"
      :max="maxPage"
      :max-pages="7"
      direction-links
      boundary-links
      @update:model-value="setPage"
    />
    <!-- /ER2 outlook: map -->
  </q-page>
</template>

<script lang="ts">
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { Role } from '@app/shared/enums/role.enum';
import { DateTime } from 'luxon';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import PageHead from 'components/vision/PageHead.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import VenueCard from 'components/venues/VenueCard.vue';
import VenueMap from 'components/outlook/VenueMap.vue'; // ER2 outlook: map
import { HOUSING_AREA_LABELS } from 'components/venues/venue-location';
import { VenueOpenState, getVenueStatus, isOpenToday } from 'components/venues/venue-status';
import { Options, Vue } from 'vue-class-component';

// ER2-507 — venue directory: banner cards with open state, open venues
// first, closed ones dimmed. Filters: search, "Heute geöffnet" (only when the
// API sends opening data), district and server.

const $api = useApi();

const OPEN_WORLD = '__open_world__';
const STATE_ORDER: Record<VenueOpenState, number> = { open: 0, soon: 1, unknown: 2, closed: 3 };

@Options({
  name: 'PageVenues',
  components: {
    PageHead,
    EmptyState,
    VenueCard,
    VenueMap, // ER2 outlook: map
  },
  async beforeRouteEnter(_, __, next) {
    try {
      const venues = await $api.venues.getVenues();
      next(vm => (vm as PageVenues).setContent(venues));
    } catch (e) {
      notifyError(e);
      next();
    }
  }
})
export default class PageVenues extends Vue {
  venues: VenueSummaryDto[] = [];
  searchQuery = '';
  areaFilter = '';
  serverFilter = '';
  openTodayOnly = false;
  page = 1;
  now = Date.now();
  readonly perPage = 12;
  // ER2 outlook: map — 'karte' from /venues/karte or ?view=karte
  viewMode: 'raster' | 'karte' = 'raster';

  private timer: number | null = null;

  // ER2 outlook: map
  created() {
    if (this.$route.meta.venueView === 'karte' || this.$route.query.view === 'karte') {
      this.viewMode = 'karte';
    }
  }

  // ER2 outlook: map
  setView(mode: 'raster' | 'karte') {
    this.viewMode = mode;
    if (this.$route.meta.venueView !== 'karte') {
      const query = { ...this.$route.query };
      if (mode === 'karte') {
        query.view = 'karte';
      } else {
        delete query.view;
      }
      void this.$router.replace({ query });
    }
  }

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);
  }

  beforeUnmount() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
    }
  }

  setContent(venues: VenueSummaryDto[]) {
    this.venues = venues;
    this.page = 1;
  }

  get canCreate(): boolean {
    const role = this.$store.getters.role;
    return !!role && role !== Role.UNVERIFIED;
  }

  get nowDateTime(): DateTime {
    return DateTime.fromMillis(this.now);
  }

  get states(): Map<number, VenueOpenState> {
    const map = new Map<number, VenueOpenState>();
    for (const venue of this.venues) {
      map.set(venue.id, getVenueStatus(venue, this.nowDateTime).state);
    }
    return map;
  }

  get hasStatusData(): boolean {
    return Array.from(this.states.values()).some((state) => state !== 'unknown');
  }

  get openCount(): number {
    return this.filteredVenues.filter((venue) => this.states.get(venue.id) === 'open').length;
  }

  get serverOptions(): { label: string; value: string }[] {
    const servers = Array.from(new Set(this.venues.map((venue) => venue.server))).sort();
    return [
      { label: 'Alle Server', value: '' },
      ...servers.map((server) => ({ label: server, value: server })),
    ];
  }

  get areaOptions(): { label: string; value: string }[] {
    const areas = Array.from(new Set(this.venues.map((venue) => venue.housingArea)));
    const options = areas
      .filter((area): area is HousingArea => !!area)
      .map((area) => ({ value: area as string, label: HOUSING_AREA_LABELS[area] || area }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (areas.some((area) => !area)) {
      options.unshift({ value: OPEN_WORLD, label: 'Offene Welt' });
    }
    return options;
  }

  get filteredVenues(): VenueSummaryDto[] {
    const query = (this.searchQuery || '').trim().toLowerCase();
    const filtered = this.venues.filter((venue) => {
      if (this.serverFilter && venue.server !== this.serverFilter) {
        return false;
      }
      if (this.areaFilter === OPEN_WORLD && venue.housingArea) {
        return false;
      }
      if (this.areaFilter && this.areaFilter !== OPEN_WORLD && venue.housingArea !== this.areaFilter) {
        return false;
      }
      if (this.openTodayOnly && !isOpenToday(venue, this.nowDateTime)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const areaLabel = venue.housingArea ? HOUSING_AREA_LABELS[venue.housingArea] : 'Offene Welt';
      const haystack = `${venue.name} ${venue.purpose || ''} ${venue.server} ${venue.address || ''} ${areaLabel}`.toLowerCase();
      return haystack.includes(query);
    });
    // Open first, then opening later today; the API order (newest first) stays within a group.
    return filtered
      .map((venue, index) => ({ venue, index }))
      .sort((a, b) => {
        const diff = STATE_ORDER[this.states.get(a.venue.id) || 'unknown'] - STATE_ORDER[this.states.get(b.venue.id) || 'unknown'];
        return diff !== 0 ? diff : a.index - b.index;
      })
      .map((entry) => entry.venue);
  }

  get filteredCount(): number {
    return this.filteredVenues.length;
  }

  get pagedVenues(): VenueSummaryDto[] {
    const start = (this.page - 1) * this.perPage;
    return this.filteredVenues.slice(start, start + this.perPage);
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil(this.filteredCount / this.perPage));
  }

  onFilterChange() {
    this.page = 1;
  }

  toggleOpenToday() {
    this.openTodayOnly = !this.openTodayOnly;
    this.onFilterChange();
  }

  toggleArea(value: string) {
    this.areaFilter = this.areaFilter === value ? '' : value;
    this.onFilterChange();
  }

  setServer(value: string) {
    this.serverFilter = value;
    this.onFilterChange();
  }

  onEmptyAction() {
    if (this.venues.length > 0) {
      this.searchQuery = '';
      this.areaFilter = '';
      this.serverFilter = '';
      this.openTodayOnly = false;
      this.onFilterChange();
    }
  }

  setPage(newPage: number) {
    this.page = Math.min(Math.max(newPage, 1), this.maxPage);
  }
}
</script>

<style lang="scss" scoped>
.page-venues {
  color: var(--ink-primary);
}

.page-venues__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.page-venues__search {
  flex: 1 1 260px;
  max-width: 360px;
}

.page-venues__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-venues__chip {
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

.page-venues__chip--active,
.page-venues__chip--active:hover {
  border-color: var(--vision-primary);
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);

  .page-venues__open-dot {
    background-color: var(--vision-on-primary);
  }
}

.page-venues__open-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--vision-live);
}

// ER2 outlook: map
.page-venues__view {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 14px;
}

.page-venues__stats {
  margin: 0 0 14px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.page-venues__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1023px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.page-venues__pagination {
  justify-content: center;
  margin-top: 28px;
}
</style>

<style lang="scss">
.page-venues__menu .q-item--active {
  color: var(--ink-link);
  font-weight: 600;
}
</style>
