<template>
  <section class="venue-map" aria-label="Kartenansicht der Treffpunkte">
    <section-tabs
      v-model="district"
      class="venue-map__tabs"
      aria-label="Wohngebiete"
      :tabs="districtTabs"
    />

    <template v-if="district !== OPEN_WORLD_KEY">
      <div class="venue-map__bar">
        <div class="venue-map__ward-nav">
          <q-btn
            class="elpis-btn elpis-btn--ghost venue-map__nav-btn"
            flat
            round
            dense
            icon="chevron_left"
            aria-label="Vorheriger Bezirk"
            :disable="ward <= 1"
            @click="stepWard(-1)"
          />
          <label class="venue-map__ward-label">
            <span>Bezirk</span>
            <select v-model.number="ward" class="venue-map__ward-select">
              <option :value="0">Alle Bezirke</option>
              <option v-for="n in WARD_COUNT" :key="n" :value="n">
                {{ wardCounts[n - 1] > 0 ? `Bezirk ${n} (${wardCounts[n - 1]})` : `Bezirk ${n}` }}
              </option>
            </select>
          </label>
          <q-btn
            class="elpis-btn elpis-btn--ghost venue-map__nav-btn"
            flat
            round
            dense
            icon="chevron_right"
            aria-label="Nächster Bezirk"
            :disable="ward >= WARD_COUNT"
            @click="stepWard(1)"
          />
          <button
            v-if="ward !== 0"
            type="button"
            class="venue-map__overview-link"
            @click="ward = 0"
          >
            Alle Bezirke
          </button>
        </div>
        <ul class="venue-map__legend" aria-label="Legende">
          <li><span class="venue-map__swatch venue-map__swatch--open" aria-hidden="true"></span>Geöffnet</li>
          <li><span class="venue-map__swatch venue-map__swatch--soon" aria-hidden="true"></span>Öffnet bald</li>
          <li><span class="venue-map__swatch venue-map__swatch--closed" aria-hidden="true"></span>Geschlossen oder unbekannt</li>
          <li><span class="venue-map__swatch venue-map__swatch--apartment" aria-hidden="true"></span>Wohnungen</li>
        </ul>
      </div>

      <!-- Overview: venues per ward -->
      <div v-if="ward === 0" class="venue-map__overview">
        <h2 class="venue-map__heading">Alle Bezirke · {{ districtLabel }}</h2>
        <ol class="venue-map__ward-grid">
          <li v-for="n in WARD_COUNT" :key="n">
            <button
              type="button"
              class="venue-map__ward-tile"
              :class="{ 'venue-map__ward-tile--empty': wardCounts[n - 1] === 0 }"
              :aria-label="`Bezirk ${n}, ${countLabel(wardCounts[n - 1])}`"
              @click="ward = n"
            >
              <span class="venue-map__ward-no">{{ n }}</span>
              <span class="venue-map__ward-count">{{ wardCounts[n - 1] > 0 ? countLabel(wardCounts[n - 1]) : '–' }}</span>
            </button>
          </li>
        </ol>
      </div>

      <!-- One ward: original stylised map with pins -->
      <div v-else class="venue-map__frame">
        <div class="venue-map__canvas" @keydown.esc="closeCard">
          <svg
            class="venue-map__svg"
            :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable="false"
          >
            <!-- Original, abstract artwork; no game map assets. -->
            <rect class="venue-map__land" :width="MAP_WIDTH" :height="MAP_HEIGHT" />
            <path v-for="(d, i) in art.water" :key="`w${i}`" class="venue-map__water" :d="d" />
            <path v-for="(d, i) in art.shore" :key="`s${i}`" class="venue-map__shore" :d="d" />
            <path v-for="(d, i) in art.detail" :key="`d${i}`" class="venue-map__detail" :d="d" />
            <circle v-for="(p, i) in art.dots" :key="`t${i}`" class="venue-map__tree" :cx="p.x" :cy="p.y" r="3" />
            <template v-for="(d, i) in ringPaths" :key="`r${i}`">
              <path class="venue-map__road" :d="d" />
              <path class="venue-map__road-line" :d="d" />
            </template>
            <path v-for="(d, i) in art.bridges" :key="`b${i}`" class="venue-map__bridge" :d="d" />
            <rect
              v-for="(p, i) in apartments"
              :key="`a${i}`"
              class="venue-map__apartment"
              :x="p.x - 16"
              :y="p.y - 12"
              width="32"
              height="24"
              rx="3"
            />
            <circle v-for="(p, i) in plotSlots" :key="`p${i}`" class="venue-map__plot" :cx="p.x" :cy="p.y" r="5" />
            <text class="venue-map__half-label" :x="art.rings[0].cx" :y="art.rings[0].cy + 34" text-anchor="middle">Haus 1–30</text>
            <text class="venue-map__half-label" :x="art.rings[1].cx" :y="art.rings[1].cy + 34" text-anchor="middle">Erweiterung · 31–60</text>
            <g class="venue-map__compass" transform="translate(760 92)">
              <circle r="18" />
              <path d="M0 -24 L5 0 L0 24 L-5 0 Z" />
              <text y="-28" text-anchor="middle">N</text>
            </g>
          </svg>

          <template v-for="group in pinGroups" :key="group.key">
            <button
              type="button"
              class="venue-map__pin"
              :class="[`venue-map__pin--${group.state}`, { 'venue-map__pin--apartment': group.apartment }]"
              :style="{ left: `${group.left}%`, top: `${group.top}%` }"
              :aria-label="group.ariaLabel"
              :aria-describedby="activeKey === group.key && !group.multi ? cardId : undefined"
              :aria-expanded="group.multi ? (activeKey === group.key && expanded ? 'true' : 'false') : undefined"
              @mouseenter="openCard(group.key)"
              @mouseleave="scheduleClose"
              @focus="openCard(group.key)"
              @blur="onPinBlur"
              @click="onPinClick(group)"
            >
              <span class="venue-map__pin-mark" aria-hidden="true">
                <span v-if="group.multi" class="venue-map__pin-count">{{ group.places.length }}</span>
              </span>
            </button>
            <div
              v-if="activeKey === group.key"
              :id="cardId"
              class="venue-map__card"
              :class="cardPlacement(group)"
              :style="{ left: `${group.left}%`, top: `${group.top}%` }"
              :role="group.multi && expanded ? 'group' : 'tooltip'"
              :aria-label="group.multi && expanded ? group.unit || 'Treffpunkte' : undefined"
              @mouseenter="cancelClose"
              @mouseleave="scheduleClose"
              @focusout="onCardFocusOut"
            >
              <p v-if="group.unit" class="venue-map__card-unit">Bezirk {{ ward }} · {{ group.unit }}</p>
              <div v-for="place in group.places" :key="place.venue.id" class="venue-map__card-item">
                <p class="venue-map__card-name">{{ place.venue.name }}</p>
                <p class="venue-map__card-status">
                  <span class="venue-map__swatch" :class="`venue-map__swatch--${stateClass(place)}`" aria-hidden="true"></span>
                  <span>{{ statusText(place) }}</span>
                  <span class="venue-map__card-server">· {{ place.venue.server }}</span>
                </p>
                <router-link
                  class="venue-map__card-link"
                  :to="venueLink(place)"
                  :tabindex="group.multi && expanded ? 0 : -1"
                >
                  Zum Treffpunkt
                </router-link>
              </div>
            </div>
          </template>
        </div>
        <p class="venue-map__scroll-hint">Auf kleinen Bildschirmen lässt sich die Karte seitlich verschieben.</p>
      </div>

      <h2 class="venue-map__heading venue-map__list-heading">Liste der Treffpunkte auf dieser Karte</h2>
      <ul v-if="listPlaces.length > 0" class="venue-map__list">
        <li v-for="place in listPlaces" :key="place.venue.id" class="venue-map__list-item">
          <span class="venue-map__swatch" :class="`venue-map__swatch--${stateClass(place)}`" aria-hidden="true"></span>
          <router-link class="venue-map__list-name" :to="venueLink(place)">{{ place.venue.name }}</router-link>
          <span class="venue-map__list-meta">{{ listMeta(place) }}</span>
        </li>
      </ul>
      <p v-else class="venue-map__none">
        {{ ward === 0 ? `Keine Treffpunkte in ${districtLabel}.` : `Keine Treffpunkte in Bezirk ${ward}.` }}
      </p>
    </template>

    <!-- Open world: list grouped by city or area -->
    <div v-else class="venue-map__world">
      <p v-if="cityGroups.length === 0" class="venue-map__none">Keine Treffpunkte in der offenen Welt.</p>
      <section v-for="group in cityGroups" :key="group.city" class="venue-map__city">
        <h2 class="venue-map__heading">
          {{ group.city }}
          <span class="venue-map__city-count">{{ countLabel(group.places.length) }}</span>
        </h2>
        <ul class="venue-map__list">
          <li v-for="place in group.places" :key="place.venue.id" class="venue-map__list-item">
            <span class="venue-map__swatch" :class="`venue-map__swatch--${stateClass(place)}`" aria-hidden="true"></span>
            <router-link class="venue-map__list-name" :to="venueLink(place)">{{ place.venue.name }}</router-link>
            <span class="venue-map__list-meta">{{ worldMeta(place) }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
// ER2 outlook — venue map view. District tabs, a ward selector (1–30) with an
// "Alle Bezirke" overview, and an original stylised SVG map per district with
// pins at the plot positions (60 slots: main ward + subdivision). Pins are
// real buttons on an HTML layer above the SVG; a list below repeats the map
// content for screen readers and small screens. Open-world venues are listed
// by city or area.
//
// The maps are original artwork (see venue-map-model.ts); no game assets.
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { DateTime } from 'luxon';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import { getVenueStatus, VenueOpenState } from 'components/venues/venue-status';
import { Options, prop, Vue } from 'vue-class-component';
import {
  allPlotPositions,
  apartmentPosition,
  DISTRICT_ART,
  DISTRICT_LABELS,
  DISTRICT_ORDER,
  DistrictArt,
  MAP_HEIGHT,
  MAP_WIDTH,
  MapPoint,
  MapVenue,
  OPEN_WORLD_KEY,
  placeOf,
  plotPosition,
  ringPath,
  unitLabel,
  VenuePlace,
  WARD_COUNT,
} from './venue-map-model';

type PinState = 'open' | 'soon' | 'closed';

interface PinGroup {
  key: string;
  left: number;
  top: number;
  places: VenuePlace[];
  state: PinState;
  apartment: boolean;
  multi: boolean;
  unit: string;
  ariaLabel: string;
}

interface CityGroup {
  city: string;
  places: VenuePlace[];
}

const STATE_WORDS: Record<VenueOpenState, string> = {
  open: 'Geöffnet',
  soon: 'Öffnet bald',
  closed: 'Geschlossen',
  unknown: 'Öffnungszeiten unbekannt',
};

const STATE_RANK: Record<VenueOpenState, number> = { open: 0, soon: 1, unknown: 2, closed: 3 };

let uid = 0;

class Props {
  venues = prop<MapVenue[]>({ required: true });
  /** Re-evaluation tick from the parent (epoch millis). */
  now = prop<number>({ default: 0 });
}

@Options({
  name: 'VenueMap',
  components: { SectionTabs },
  watch: {
    venues() {
      (this as VenueMap).onVenuesChange();
    },
    district() {
      (this as VenueMap).onDistrictChange();
    },
    ward() {
      (this as VenueMap).closeCard();
    },
  },
})
export default class VenueMap extends Vue.with(Props) {
  readonly OPEN_WORLD_KEY = OPEN_WORLD_KEY;
  readonly WARD_COUNT = WARD_COUNT;
  readonly MAP_WIDTH = MAP_WIDTH;
  readonly MAP_HEIGHT = MAP_HEIGHT;
  readonly cardId = `venue-map-card-${++uid}`;

  district: string = HousingArea.MIST;
  ward = 0;
  activeKey: string | null = null;
  expanded = false;

  private closeTimer: number | null = null;

  created() {
    this.district = this.defaultDistrict();
    this.ward = this.defaultWard();
  }

  beforeUnmount() {
    this.cancelClose();
  }

  // --- data -----------------------------------------------------------------

  get nowDateTime(): DateTime {
    return this.now ? DateTime.fromMillis(this.now) : DateTime.now();
  }

  get places(): VenuePlace[] {
    return this.venues.map((venue) => placeOf(venue));
  }

  get states(): Map<number, VenueOpenState> {
    const map = new Map<number, VenueOpenState>();
    for (const venue of this.venues) {
      map.set(venue.id, getVenueStatus(venue, this.nowDateTime).state);
    }
    return map;
  }

  get labels(): Map<number, string> {
    const map = new Map<number, string>();
    for (const venue of this.venues) {
      const status = getVenueStatus(venue, this.nowDateTime);
      map.set(venue.id, status.label || STATE_WORDS[status.state]);
    }
    return map;
  }

  private countFor(key: string): number {
    return key === OPEN_WORLD_KEY
      ? this.places.filter((place) => !place.district).length
      : this.places.filter((place) => place.district === key).length;
  }

  get districtTabs(): SectionTab[] {
    return [ ...DISTRICT_ORDER, OPEN_WORLD_KEY ].map((key) => {
      const count = this.countFor(key);
      return { key, label: DISTRICT_LABELS[key], count, dimmed: count === 0 };
    });
  }

  get districtLabel(): string {
    return DISTRICT_LABELS[this.district] || '';
  }

  get districtPlaces(): VenuePlace[] {
    return this.places.filter((place) => place.district === this.district);
  }

  get wardCounts(): number[] {
    const counts = new Array<number>(WARD_COUNT).fill(0);
    for (const place of this.districtPlaces) {
      if (place.ward) {
        counts[place.ward - 1]++;
      }
    }
    return counts;
  }

  get wardPlaces(): VenuePlace[] {
    return this.districtPlaces.filter((place) => place.ward === this.ward);
  }

  get art(): DistrictArt {
    return DISTRICT_ART[this.district] || DISTRICT_ART[HousingArea.MIST];
  }

  get ringPaths(): string[] {
    return this.art.rings.map((ring) => ringPath(ring));
  }

  get apartments(): MapPoint[] {
    return [ apartmentPosition(this.art, 0), apartmentPosition(this.art, 1) ];
  }

  get plotSlots(): MapPoint[] {
    return allPlotPositions(this.art);
  }

  get pinGroups(): PinGroup[] {
    const groups = new Map<string, VenuePlace[]>();
    for (const place of this.wardPlaces) {
      let key: string | null = null;
      if (place.kind === 'house' && place.slot !== null) {
        key = `h${place.slot}`;
      } else if (place.kind === 'apartment') {
        key = `a${place.half}`;
      }
      if (key) {
        groups.set(key, [ ...(groups.get(key) || []), place ]);
      }
    }

    return Array.from(groups.entries()).map(([ key, places ]) => {
      const first = places[0];
      const apartment = first.kind === 'apartment';
      const point = apartment ? apartmentPosition(this.art, first.half) : plotPosition(this.art, first.slot as number);
      const best = places
        .map((place) => this.states.get(place.venue.id) || 'unknown')
        .sort((a, b) => STATE_RANK[a] - STATE_RANK[b])[0];
      const unit = apartment ? (first.half === 1 ? 'Wohnungen (Erweiterung)' : 'Wohnungen') : unitLabel(first);
      const multi = places.length > 1;
      const ariaLabel = multi
        ? `${places.length} Treffpunkte: ${places.map((p) => p.venue.name).join(', ')}, Bezirk ${this.ward}, ${unit}, ${STATE_WORDS[best]}`
        : `${first.venue.name}, Bezirk ${this.ward}, ${unitLabel(first) || unit}, ${STATE_WORDS[best]}`;
      return {
        key,
        left: (point.x / MAP_WIDTH) * 100,
        top: (point.y / MAP_HEIGHT) * 100,
        places,
        state: best === 'open' ? 'open' : best === 'soon' ? 'soon' : 'closed',
        apartment,
        multi,
        unit: multi ? unit : unitLabel(first) || unit,
        ariaLabel,
      } as PinGroup;
    }).sort((a, b) => a.top - b.top || a.left - b.left);
  }

  get listPlaces(): VenuePlace[] {
    const source = this.ward === 0 ? this.districtPlaces : this.wardPlaces;
    return [ ...source ].sort((a, b) =>
      (a.ward || 99) - (b.ward || 99)
      || (a.slot ?? 100 + a.half) - (b.slot ?? 100 + b.half)
      || a.venue.name.localeCompare(b.venue.name));
  }

  get cityGroups(): CityGroup[] {
    const groups = new Map<string, VenuePlace[]>();
    for (const place of this.places) {
      if (!place.district) {
        groups.set(place.city, [ ...(groups.get(place.city) || []), place ]);
      }
    }
    return Array.from(groups.entries())
      .map(([ city, places ]) => ({
        city,
        places: places.sort((a, b) => this.rank(a) - this.rank(b) || a.venue.name.localeCompare(b.venue.name)),
      }))
      .sort((a, b) => b.places.length - a.places.length || a.city.localeCompare(b.city));
  }

  // --- labels ---------------------------------------------------------------

  private rank(place: VenuePlace): number {
    return STATE_RANK[this.states.get(place.venue.id) || 'unknown'];
  }

  countLabel(count: number): string {
    return count === 1 ? '1 Treffpunkt' : `${count} Treffpunkte`;
  }

  stateClass(place: VenuePlace): PinState {
    const state = this.states.get(place.venue.id) || 'unknown';
    return state === 'open' || state === 'soon' ? state : 'closed';
  }

  statusText(place: VenuePlace): string {
    return this.labels.get(place.venue.id) || STATE_WORDS.unknown;
  }

  venueLink(place: VenuePlace): string {
    return `/venue/${place.venue.server}/${place.venue.name.replace(/ /g, '_')}`;
  }

  listMeta(place: VenuePlace): string {
    const where = [
      this.ward === 0 ? (place.ward ? `Bezirk ${place.ward}` : 'Ohne Bezirksangabe') : '',
      unitLabel(place) || (place.ward ? 'Ohne Hausnummer' : ''),
    ].filter((part) => !!part).join(', ');
    return [ where, this.statusText(place), place.venue.server ].filter((part) => !!part).join(' · ');
  }

  worldMeta(place: VenuePlace): string {
    return [ place.venue.address, this.statusText(place), place.venue.server ].filter((part) => !!part).join(' · ');
  }

  cardPlacement(group: PinGroup): string[] {
    return [
      group.top < 38 ? 'venue-map__card--below' : 'venue-map__card--above',
      group.left < 18 ? 'venue-map__card--start' : group.left > 82 ? 'venue-map__card--end' : '',
    ];
  }

  // --- selection ------------------------------------------------------------

  private defaultDistrict(): string {
    const withVenues = DISTRICT_ORDER.find((key) => this.countFor(key) > 0);
    if (withVenues) {
      return withVenues;
    }
    return this.countFor(OPEN_WORLD_KEY) > 0 ? OPEN_WORLD_KEY : HousingArea.MIST;
  }

  /** The only populated ward, else the overview. */
  private defaultWard(): number {
    const populated = this.wardCounts
      .map((count, index) => ({ count, ward: index + 1 }))
      .filter((entry) => entry.count > 0);
    return populated.length === 1 ? populated[0].ward : 0;
  }

  onDistrictChange() {
    this.closeCard();
    this.ward = this.defaultWard();
  }

  onVenuesChange() {
    // Follow the filters: leave a district that became empty.
    if (this.countFor(this.district) === 0) {
      const next = this.defaultDistrict();
      if (next !== this.district) {
        this.district = next;
        return;
      }
    }
    if (this.ward !== 0 && this.wardCounts[this.ward - 1] === 0) {
      this.ward = this.defaultWard();
    }
  }

  stepWard(delta: number) {
    this.ward = Math.min(Math.max(this.ward + delta, 1), WARD_COUNT);
  }

  // --- pin card -------------------------------------------------------------

  openCard(key: string) {
    this.cancelClose();
    if (this.activeKey !== key) {
      this.activeKey = key;
      this.expanded = false;
    }
  }

  closeCard() {
    this.cancelClose();
    this.activeKey = null;
    this.expanded = false;
  }

  cancelClose() {
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  scheduleClose() {
    if (this.expanded) {
      return;
    }
    this.cancelClose();
    this.closeTimer = window.setTimeout(() => {
      this.closeTimer = null;
      this.activeKey = null;
    }, 150);
  }

  private focusInsideCard(target: EventTarget | null): boolean {
    const card = document.getElementById(this.cardId);
    return !!card && target instanceof Node && card.contains(target);
  }

  onPinBlur(event: FocusEvent) {
    if (!this.focusInsideCard(event.relatedTarget)) {
      this.expanded = false;
      this.scheduleClose();
    }
  }

  onCardFocusOut(event: FocusEvent) {
    if (!this.focusInsideCard(event.relatedTarget)) {
      this.expanded = false;
      this.scheduleClose();
    }
  }

  onPinClick(group: PinGroup) {
    if (!group.multi) {
      void this.$router.push(this.venueLink(group.places[0]));
      return;
    }
    if (this.activeKey === group.key && this.expanded) {
      this.expanded = false;
    } else {
      this.cancelClose();
      this.activeKey = group.key;
      this.expanded = true;
    }
  }
}
</script>

<style lang="scss" scoped>
.venue-map {
  --pin-open: var(--vision-live);
  --pin-soon: var(--rule-strong);
  --pin-closed: var(--ink-muted);

  color: var(--ink-primary);
}

.venue-map__tabs {
  margin-bottom: 14px;
}

.venue-map__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 20px;
  margin-bottom: 12px;
}

.venue-map__ward-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.venue-map__nav-btn {
  min-width: 36px;
  min-height: 36px;
}

.venue-map__ward-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
}

.venue-map__ward-select {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-size: 14px;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.venue-map__overview-link {
  min-height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-link);
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.venue-map__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.venue-map__swatch {
  display: inline-block;
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--vision-card);
  box-shadow: 0 0 0 1px currentColor;
  color: var(--pin-closed);
  background-color: var(--pin-closed);
}

.venue-map__swatch--open {
  color: var(--pin-open);
  background-color: var(--pin-open);
}

.venue-map__swatch--soon {
  color: var(--pin-soon);
  background-color: var(--pin-soon);
}

.venue-map__swatch--apartment {
  border-radius: 3px;
  color: var(--rule-strong);
  background-color: var(--rule-tint);
}

.venue-map__heading {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: var(--type-scale-2, 1.25rem);
  letter-spacing: var(--ls-display, 0.02em);
  line-height: 1.3;
  color: var(--ink-primary);
}

.venue-map__list-heading {
  margin-top: 24px;
}

// --- overview ---------------------------------------------------------------

.venue-map__ward-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.venue-map__ward-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  min-height: 64px;
  padding: 10px 12px;
  border: 1px solid var(--rule-strong);
  border-radius: 10px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
  font-family: var(--font-ui);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.venue-map__ward-tile--empty {
  border-color: var(--rule-soft);
  color: var(--ink-muted);
}

.venue-map__ward-no {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.1;
}

.venue-map__ward-count {
  font-size: 12px;
  color: var(--ink-muted);
}

// --- map --------------------------------------------------------------------

.venue-map__frame {
  overflow-x: auto;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.venue-map__canvas {
  position: relative;
  min-width: 680px;
  aspect-ratio: 800 / 520;
}

.venue-map__scroll-hint {
  display: none;
  margin: 0;
  padding: 6px 12px 8px;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-muted);

  @media (max-width: 719px) {
    display: block;
  }
}

.venue-map__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.venue-map__land {
  fill: var(--vision-card);
}

.venue-map__water {
  fill: var(--semantic-info);
  fill-opacity: 0.18;
}

.venue-map__shore {
  fill: none;
  stroke: var(--rule-strong);
  stroke-width: 1.5;
  stroke-opacity: 0.55;
}

.venue-map__detail {
  fill: none;
  stroke: var(--rule-strong);
  stroke-width: 1;
  stroke-opacity: 0.35;
  stroke-dasharray: 4 5;
}

.venue-map__tree {
  fill: var(--rule-soft);
}

.venue-map__road {
  fill: none;
  stroke: var(--rule-tint);
  stroke-width: 18;
  stroke-linejoin: round;
}

.venue-map__road-line {
  fill: none;
  stroke: var(--rule-strong);
  stroke-width: 1;
  stroke-opacity: 0.6;
  stroke-dasharray: 6 6;
}

.venue-map__bridge {
  fill: none;
  stroke: var(--rule-strong);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-opacity: 0.55;
}

.venue-map__apartment {
  fill: var(--rule-tint);
  stroke: var(--rule-strong);
  stroke-width: 1.5;
}

.venue-map__plot {
  fill: var(--vision-card);
  stroke: var(--rule-strong);
  stroke-width: 1;
  stroke-opacity: 0.5;
}

.venue-map__half-label {
  fill: var(--ink-muted);
  font-family: var(--font-ui);
  font-size: 13px;
}

.venue-map__compass {
  circle {
    fill: none;
    stroke: var(--rule-soft);
  }

  path {
    fill: var(--rule-strong);
    fill-opacity: 0.6;
  }

  text {
    fill: var(--ink-muted);
    font-family: var(--font-display);
    font-size: 12px;
  }
}

body.body--dark .venue-map__water {
  fill: var(--glow-aether-d);
  fill-opacity: 0.14;
}

// --- pins -------------------------------------------------------------------

.venue-map__pin {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  &:focus-visible {
    outline: none;
    z-index: 3;

    .venue-map__pin-mark {
      box-shadow: 0 0 0 2px var(--vision-card), 0 0 0 4px var(--glow-aether), 0 0 0 5px var(--vision-focus-edge);
    }
  }

  &:hover {
    z-index: 3;
  }
}

.venue-map__pin-mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 2px solid var(--vision-card);
  border-radius: 50%;
  background-color: var(--pin-closed);
  box-shadow: 0 0 0 1px var(--pin-closed), 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform var(--motion-fast) var(--ease-elpis);

  .venue-map__pin:hover &,
  .venue-map__pin:focus-visible & {
    transform: scale(1.18);
  }
}

.venue-map__pin--open .venue-map__pin-mark {
  width: 20px;
  height: 20px;
  background-color: var(--pin-open);
  box-shadow: 0 0 0 1px var(--pin-open), 0 2px 6px rgba(0, 0, 0, 0.25);
}

.venue-map__pin--soon .venue-map__pin-mark {
  background-color: var(--pin-soon);
  box-shadow: 0 0 0 1px var(--pin-soon), 0 2px 6px rgba(0, 0, 0, 0.25);
}

.venue-map__pin--apartment .venue-map__pin-mark {
  border-radius: 4px;
}

.venue-map__pin-count {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  color: var(--vision-card);
}

@media (prefers-reduced-motion: no-preference) {
  .venue-map__pin--open .venue-map__pin-mark::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    box-shadow: 0 0 0 0 var(--pin-open);
    animation: venue-map-pulse 2.4s var(--ease-elpis) infinite;
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .venue-map__pin-mark {
    transition: none;

    .venue-map__pin:hover &,
    .venue-map__pin:focus-visible & {
      transform: none;
    }
  }
}

@keyframes venue-map-pulse {
  0% { box-shadow: 0 0 0 0 var(--pin-open); opacity: 0.5; }
  100% { box-shadow: 0 0 0 10px var(--pin-open); opacity: 0; }
}

// --- pin card ---------------------------------------------------------------

.venue-map__card {
  position: absolute;
  z-index: 4;
  width: 240px;
  max-width: 70vw;
  padding: 10px 12px;
  border: 1px solid var(--rule-strong);
  border-radius: 10px;
  background-color: var(--surface-raised);
  color: var(--ink-primary);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  font-family: var(--font-ui);
  font-size: 13px;
}

.venue-map__card--above {
  transform: translate(-50%, calc(-100% - 18px));
}

.venue-map__card--below {
  transform: translate(-50%, 18px);
}

.venue-map__card--start.venue-map__card--above {
  transform: translate(-16px, calc(-100% - 18px));
}

.venue-map__card--start.venue-map__card--below {
  transform: translate(-16px, 18px);
}

.venue-map__card--end.venue-map__card--above {
  transform: translate(calc(-100% + 16px), calc(-100% - 18px));
}

.venue-map__card--end.venue-map__card--below {
  transform: translate(calc(-100% + 16px), 18px);
}

.venue-map__card-unit {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--ink-muted);
}

.venue-map__card-item + .venue-map__card-item {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--rule-soft);
}

.venue-map__card-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  line-height: 1.3;
}

.venue-map__card-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 4px 0 6px;
}

.venue-map__card-server {
  color: var(--ink-muted);
}

.venue-map__card-link,
.venue-map__list-name {
  color: var(--ink-link);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: none;
    border-radius: 3px;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

// --- lists ------------------------------------------------------------------

.venue-map__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.venue-map__list-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  min-height: 40px;
  padding: 6px 0;
  border-bottom: 1px solid var(--rule-soft);
  font-family: var(--font-ui);
  font-size: 14px;
}

.venue-map__list-meta {
  color: var(--ink-muted);
  font-size: 13px;
}

.venue-map__none {
  margin: 0;
  color: var(--ink-muted);
  font-style: italic;
}

.venue-map__city + .venue-map__city {
  margin-top: 24px;
}

.venue-map__city-count {
  margin-left: 8px;
  font-family: var(--font-ui);
  font-size: 13px;
  letter-spacing: 0;
  color: var(--ink-muted);
}
</style>
