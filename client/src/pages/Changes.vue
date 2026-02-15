<template>
  <q-page class="page-changes">
    <header class="page-changes__hero">
      <div class="page-changes__hero-text">
        <span class="page-changes__eyebrow">Wissenswertes</span>
        <h2>Neueste Änderungen</h2>
        <p class="page-changes__lead">
          Hier siehst du, was sich zuletzt auf Elpisgarten geändert hat. Du kannst nach Bereich, Zeitraum, Autor und Begriffen filtern.
        </p>
      </div>
      <div class="page-changes__hero-meta">
        <div class="page-changes__hero-count">
          <span class="page-changes__hero-count-number">{{ total }}</span>
          <span class="page-changes__hero-count-label">Einträge</span>
        </div>
      </div>
    </header>

    <section class="page-changes__content">
      <div class="page-changes__toolbar">
        <q-input
          class="page-changes__search"
          v-model="searchQuery"
          dense
          filled
          label="Suche"
          placeholder="Titel oder Inhalt"
          @keyup.enter="reload"
        />
        <q-input
          class="page-changes__author"
          v-model="author"
          dense
          filled
          label="Autor"
          placeholder="Name"
          @keyup.enter="reload"
        />
        <q-select
          class="page-changes__area"
          v-model="area"
          dense
          filled
          emit-value
          map-options
          label="Bereich"
          :options="areaOptions"
        />
        <q-select
          class="page-changes__period"
          v-model="periodDays"
          dense
          filled
          emit-value
          map-options
          label="Zeitraum"
          :options="periodOptions"
        />
        <q-toggle
          class="page-changes__toggle"
          v-model="onlySinceLastVisit"
          :disable="!hasLastVisit"
          label="Seit letztem Besuch"
        />
        <div class="page-changes__filter-actions">
          <q-btn color="primary" label="Filtern" @click="reload" />
          <q-btn flat color="secondary" label="Zurücksetzen" @click="resetFilters" />
        </div>
        <div class="page-changes__stats">
          {{ total }} gefundene Änderungen
        </div>
      </div>

      <section class="page-changes__list-wrapper">
        <div v-if="!loading && changes.length === 0" class="page-changes__empty">
          <div class="page-changes__empty-title">Keine Änderungen gefunden.</div>
          <div class="page-changes__empty-subtitle">
            Passe die Filter an, um mehr Ergebnisse zu sehen.
          </div>
        </div>
        <q-list v-else class="page-changes__list">
          <q-item
            v-for="item in changes"
            :key="item.id"
            clickable
            :to="item.link"
            class="page-changes__item"
          >
            <q-item-section avatar class="page-changes__item-icon">
              <q-icon :name="areaIcon(item.area)" />
            </q-item-section>
            <q-item-section class="page-changes__item-content">
              <div class="page-changes__item-top">
                <q-item-label class="page-changes__item-title">{{ item.title }}</q-item-label>
                <span class="page-changes__item-time">{{ relativeTime(item.happenedAt) }}</span>
              </div>
              <q-item-label caption class="page-changes__item-meta">
                {{ areaLabel(item.area) }} · {{ typeLabel(item.type) }}
                <span v-if="item.author"> · von {{ item.author }}</span>
              </q-item-label>
              <q-item-label class="page-changes__item-summary">{{ item.summary }}</q-item-label>
            </q-item-section>
            <q-item-section side class="page-changes__item-arrow">
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>

        <div class="page-changes__load-more">
          <q-btn
            v-if="canLoadMore"
            outline
            color="secondary"
            label="Weitere laden"
            :disable="loading"
            @click="loadMore"
          />
        </div>
        <q-inner-loading :showing="loading" />
      </section>
    </section>
  </q-page>
</template>

<script lang="ts">
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { ChangesFilterDto } from '@app/shared/dto/changes/changes-filter.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';
import { LocalStorage } from 'quasar';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

type AreaFilter = ChangeArea | '';
type PeriodFilter = number | '';

interface ChangesApiClient {
  changes: {
    getChanges(filter?: ChangesFilterDto): Promise<PagingResultDto<ChangeItemDto>>;
  };
}

@Options({
  name: 'PageChanges',
})
export default class PageChanges extends Vue {
  private readonly LAST_VISIT_KEY = 'changes:last-visited-at';

  readonly pageSize = 40;

  loading = false;
  total = 0;
  offset = 0;
  changes: ChangeItemDto[] = [];

  searchQuery = '';
  author = '';
  area: AreaFilter = '';
  periodDays: PeriodFilter = 30;
  onlySinceLastVisit = false;
  lastVisitedAt: number | null = null;

  readonly areaOptions = [
    { label: 'Alle Bereiche', value: '' },
    { label: 'Profile', value: ChangeArea.PROFILE },
    { label: 'Treffpunkte', value: ChangeArea.VENUE },
    { label: 'Communities', value: ChangeArea.COMMUNITY },
    { label: 'Freie Gesellschaften', value: ChangeArea.FREE_COMPANY },
    { label: 'Geschichten', value: ChangeArea.STORY },
    { label: 'Anschlagbrett', value: ChangeArea.NOTICEBOARD },
    { label: 'Events', value: ChangeArea.EVENT },
    { label: 'Medien', value: ChangeArea.MEDIA },
  ];

  readonly periodOptions = [
    { label: 'Alle Zeiträume', value: '' },
    { label: 'Letzte 24 Stunden', value: 1 },
    { label: 'Letzte 7 Tage', value: 7 },
    { label: 'Letzte 30 Tage', value: 30 },
    { label: 'Letzte 90 Tage', value: 90 },
  ];

  async created() {
    const value = LocalStorage.getItem(this.LAST_VISIT_KEY);
    const parsed = typeof value === 'number' ? value : Number(value);
    this.lastVisitedAt = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    await this.reload();
  }

  unmounted() {
    LocalStorage.set(this.LAST_VISIT_KEY, Date.now());
  }

  get hasLastVisit(): boolean {
    return !!this.lastVisitedAt;
  }

  get canLoadMore(): boolean {
    return this.changes.length < this.total;
  }

  areaLabel(area: ChangeArea): string {
    const labels: Record<ChangeArea, string> = {
      [ChangeArea.PROFILE]: 'Profil',
      [ChangeArea.VENUE]: 'Treffpunkt',
      [ChangeArea.COMMUNITY]: 'Community',
      [ChangeArea.FREE_COMPANY]: 'Freie Gesellschaft',
      [ChangeArea.STORY]: 'Geschichte',
      [ChangeArea.NOTICEBOARD]: 'Anschlagbrett',
      [ChangeArea.EVENT]: 'Event',
      [ChangeArea.MEDIA]: 'Medien',
    };

    return labels[area];
  }

  typeLabel(type: ChangeType): string {
    return type === ChangeType.CREATED ? 'Erstellt' : 'Aktualisiert';
  }

  areaIcon(area: ChangeArea): string {
    const icons: Record<ChangeArea, string> = {
      [ChangeArea.PROFILE]: 'badge',
      [ChangeArea.VENUE]: 'storefront',
      [ChangeArea.COMMUNITY]: 'groups',
      [ChangeArea.FREE_COMPANY]: 'shield',
      [ChangeArea.STORY]: 'auto_stories',
      [ChangeArea.NOTICEBOARD]: 'campaign',
      [ChangeArea.EVENT]: 'event',
      [ChangeArea.MEDIA]: 'photo_library',
    };

    return icons[area];
  }

  relativeTime(timestamp: number): string {
    return this.$display.relativeTime(timestamp);
  }

  async reload() {
    this.offset = 0;
    await this.fetchChanges(true);
  }

  async loadMore() {
    this.offset += this.pageSize;
    await this.fetchChanges(false);
  }

  async resetFilters() {
    this.searchQuery = '';
    this.author = '';
    this.area = '';
    this.periodDays = 30;
    this.onlySinceLastVisit = false;
    await this.reload();
  }

  private buildFilter(): ChangesFilterDto {
    const filter: ChangesFilterDto = {
      offset: this.offset,
      limit: this.pageSize,
    };
    const searchQuery = this.searchQuery.trim();
    const author = this.author.trim();

    if (searchQuery) {
      filter.searchQuery = searchQuery;
    }

    if (author) {
      filter.author = author;
    }

    if (this.area) {
      filter.area = this.area;
    }

    if (this.periodDays) {
      filter.periodDays = this.periodDays;
    }

    if (this.onlySinceLastVisit && this.lastVisitedAt) {
      filter.since = this.lastVisitedAt;
    }

    return filter;
  }

  private async fetchChanges(replace: boolean) {
    this.loading = true;

    try {
      const api = this.$api as ChangesApiClient;
      const result = await api.changes.getChanges(this.buildFilter());
      this.total = result.total;

      if (replace) {
        this.changes = result.data;
      } else {
        this.changes = [...this.changes, ...result.data];
      }
    } catch (e) {
      notifyError(e);
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style lang="scss">
.page-changes {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-changes::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background:
    radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-changes h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-changes__hero {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-changes__hero-text {
  display: grid;
  gap: 8px;
}

.page-changes__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-changes__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: none;
}

.page-changes__hero-meta {
  display: grid;
  gap: 6px;
  align-items: end;
  justify-items: end;
}

.page-changes__hero-count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-changes__hero-count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-changes__hero-count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-changes__content {
  position: relative;
  z-index: 1;
}

.page-changes__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr) repeat(2, minmax(160px, 0.68fr)) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-changes__search .q-field__control,
.page-changes__author .q-field__control,
.page-changes__area .q-field__control,
.page-changes__period .q-field__control {
  background: #f6f1e8;
  border-radius: 0;
}

.page-changes__search .q-field__native,
.page-changes__search .q-field__label,
.page-changes__author .q-field__native,
.page-changes__author .q-field__label,
.page-changes__area .q-field__native,
.page-changes__area .q-field__label,
.page-changes__period .q-field__native,
.page-changes__period .q-field__label {
  font-size: 0.9rem;
}

.page-changes__toggle {
  align-self: center;
}

.page-changes__filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.page-changes__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-changes__list-wrapper {
  position: relative;
  z-index: 1;
  padding: 12px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-changes__list {
  display: grid;
  gap: 12px;
}

.page-changes__item {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  border-radius: 0;
  min-height: 88px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  animation: page-changes-item-rise 360ms ease-out both;
}

.page-changes__item:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-changes__item-icon .q-icon {
  color: rgba(53, 94, 118, 0.9);
  font-size: 1.3rem;
}

.page-changes__item-content {
  gap: 4px;
}

.page-changes__item-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.page-changes__item-title {
  font-family: $header-font;
  font-weight: 600;
  color: #1f2c38;
}

.page-changes__item-time {
  color: rgba(35, 35, 35, 0.62);
  font-size: 0.8rem;
  white-space: nowrap;
}

.page-changes__item-meta {
  color: rgba(35, 35, 35, 0.66);
}

.page-changes__item-summary {
  color: rgba(35, 35, 35, 0.74);
  font-size: 0.92rem;
  line-height: 1.45;
}

.page-changes__item-arrow .q-icon {
  color: rgba(35, 35, 35, 0.5);
}

.page-changes__empty {
  padding: 30px 16px;
  text-align: center;
  color: rgba(35, 35, 35, 0.7);
}

.page-changes__empty-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.page-changes__empty-subtitle {
  font-size: 0.9rem;
}

.page-changes__load-more {
  padding: 14px 0 0;
  display: flex;
  justify-content: center;
}

@keyframes page-changes-item-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 1220px) {
  .page-changes__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-changes__hero-meta {
    justify-items: start;
  }

  .page-changes__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-changes__filter-actions,
  .page-changes__stats {
    justify-content: flex-start;
    text-align: left;
  }
}

@media (max-width: $breakpoint-sm) {
  .page-changes {
    padding: 20px 14px 36px;
  }

  .page-changes__hero {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-changes__item {
    animation: none;
    transition: none;
  }

  .page-changes__item:hover {
    transform: none;
  }
}
</style>
