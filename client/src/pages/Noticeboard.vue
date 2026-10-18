<template>
  <q-page class="page-noticeboard">
    <page-head :eyebrow="eyebrow" title="Gesucht, geboten, gerüchteweise" lead="Aushänge, Gesuche und Neuigkeiten aus den Städten Eorzeas.">
      <template v-if="canWrite" #actions>
        <q-btn class="elpis-btn elpis-btn--primary" unelevated no-caps icon="push_pin" label="Aushang erstellen" to="/create-noticeboard-item" />
      </template>
    </page-head>

    <div class="page-noticeboard__toolbar" role="search">
      <q-input
        v-model="searchQuery"
        class="page-noticeboard__search"
        outlined
        dense
        clearable
        debounce="200"
        placeholder="Titel, Autor oder Treffpunkt suchen"
        aria-label="Aushänge durchsuchen"
        @update:model-value="onFilterChange"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </div>

    <div class="page-noticeboard__filters">
      <div class="page-noticeboard__chips" role="group" aria-label="Nach Typ filtern">
        <button
          type="button"
          class="page-noticeboard__chip"
          :aria-pressed="!typeFilter ? 'true' : 'false'"
          @click="setType('')"
        >Alle Typen</button>
        <button
          v-for="type in availableTypes"
          :key="type"
          type="button"
          class="page-noticeboard__chip page-noticeboard__chip--type"
          :style="{ '--nb-type': typeColor(type) }"
          :aria-pressed="typeFilter === type ? 'true' : 'false'"
          @click="setType(type)"
        >
          <span class="page-noticeboard__chip-prefix">[{{ $display.noticeboardTypes[type] || type }}]</span>
          <span class="page-noticeboard__chip-count">{{ typeCounts[type] }}</span>
        </button>
      </div>
      <div class="page-noticeboard__chips" role="group" aria-label="Nach Ort filtern">
        <button
          v-for="location in availableLocations"
          :key="location"
          type="button"
          class="page-noticeboard__chip page-noticeboard__chip--location"
          :aria-pressed="locationFilter === location ? 'true' : 'false'"
          @click="setLocation(location)"
        >
          <q-icon name="place" size="14px" aria-hidden="true" />
          {{ $display.noticeboardLocations[location] || location }}
        </button>
      </div>
    </div>

    <p class="page-noticeboard__stats" aria-live="polite">{{ statsLabel }}</p>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Aushänge</h2>
    <div v-if="pagedItems.length" class="page-noticeboard__masonry">
      <noticeboard-card v-for="item in pagedItems" :key="item.id" :item="item" />
    </div>
    <empty-state
      v-else
      icon="push_pin"
      :title="noticeboardItems.length ? 'Keine passenden Aushänge' : 'Das Anschlagbrett ist leer'"
      :text="noticeboardItems.length ? 'Passe die Suche oder die Filter an.' : 'Häng den ersten Aushang auf.'"
      :action-label="noticeboardItems.length ? 'Filter zurücksetzen' : (canWrite ? 'Aushang erstellen' : '')"
      :action-to="noticeboardItems.length ? null : { path: '/create-noticeboard-item' }"
      @action="onEmptyAction"
    />

    <q-pagination
      v-if="maxPage > 1"
      class="page-noticeboard__pagination"
      :model-value="page"
      :max="maxPage"
      :max-pages="7"
      direction-links
      boundary-links
      @update:model-value="setPage"
    />
  </q-page>
</template>

<script lang="ts">
import NoticeboardCard from 'components/noticeboard/NoticeboardCard.vue';
import { NOTICEBOARD_TYPE_ORDER, NoticeboardCardItem, noticeboardTypeColor } from 'components/noticeboard/noticeboard-types';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

// ER2-605 — noticeboard directory: PageHead, "[Typ]" chips in type colour,
// location chips, three-column masonry of note cards. The list endpoint
// returns every notice, so filtering and paging stay client-side. There is
// no pinned flag on notices yet, so the "Angeheftet" row is left out.

const PAGE_SIZE = 18;

@Options({
  name: 'PageNoticeboard',
  components: {
    EmptyState,
    NoticeboardCard,
    PageHead,
  },
  async beforeRouteEnter(to, __, next) {
    try {
      const noticeboardItems = await $api.noticeboard.getNoticeboardItems({});
      next((vm) => {
        const page = vm as PageNoticeboard;
        page.typeFilter = (to.query.type as string) || '';
        page.locationFilter = (to.query.location as string) || '';
        page.setContent(noticeboardItems);
      });
    } catch (e) {
      notifyError(e);
      next();
    }
  },
})
export default class PageNoticeboard extends Vue {
  noticeboardItems: NoticeboardCardItem[] = [];
  searchQuery = '';
  locationFilter = '';
  typeFilter = '';
  page = 1;

  setContent(noticeboardItems: NoticeboardCardItem[]) {
    this.noticeboardItems = noticeboardItems;
    this.page = 1;
  }

  get canWrite(): boolean {
    return !!this.$store.getters.character;
  }

  get eyebrow(): string {
    const count = this.noticeboardItems.length;
    return `Anschlagbrett · ${count.toLocaleString('de-DE')} ${count === 1 ? 'Aushang' : 'Aushänge'}`;
  }

  get typeCounts(): { [type: string]: number } {
    const counts: { [type: string]: number } = {};
    this.noticeboardItems.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }

  get availableTypes(): string[] {
    const present = Object.keys(this.typeCounts);
    return [
      ...NOTICEBOARD_TYPE_ORDER.filter((type) => present.includes(type)),
      ...present.filter((type) => !NOTICEBOARD_TYPE_ORDER.includes(type)),
    ];
  }

  get availableLocations(): string[] {
    return Array.from(new Set(this.noticeboardItems.map((item) => item.location))).sort((a, b) =>
      (this.$display.noticeboardLocations[a] || a).localeCompare(this.$display.noticeboardLocations[b] || b, 'de'),
    );
  }

  get filteredItems(): NoticeboardCardItem[] {
    const query = (this.searchQuery || '').trim().toLowerCase();

    return this.noticeboardItems.filter((item) => {
      if (this.locationFilter && item.location !== this.locationFilter) {
        return false;
      }

      if (this.typeFilter && item.type !== this.typeFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        item.title,
        item.author,
        item.venueName || '',
        item.excerpt || '',
        this.$display.noticeboardLocations[item.location] || '',
        this.$display.noticeboardTypes[item.type] || '',
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get pagedItems(): NoticeboardCardItem[] {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.filteredItems.slice(start, start + PAGE_SIZE);
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil(this.filteredItems.length / PAGE_SIZE));
  }

  get statsLabel(): string {
    const shown = this.filteredItems.length;
    const total = this.noticeboardItems.length;
    return shown === total ? `${total} ${total === 1 ? 'Aushang' : 'Aushänge'}` : `${shown} von ${total} Aushängen`;
  }

  typeColor(type: string): string {
    return noticeboardTypeColor(type);
  }

  setType(type: string) {
    this.typeFilter = this.typeFilter === type ? '' : type;
    this.syncQuery();
    this.onFilterChange();
  }

  setLocation(location: string) {
    this.locationFilter = this.locationFilter === location ? '' : location;
    this.syncQuery();
    this.onFilterChange();
  }

  syncQuery() {
    const query = { ...this.$route.query };

    if (this.typeFilter) {
      query.type = this.typeFilter;
    } else {
      delete query.type;
    }

    if (this.locationFilter) {
      query.location = this.locationFilter;
    } else {
      delete query.location;
    }

    void this.$router.replace({ query });
  }

  onFilterChange() {
    this.page = 1;
  }

  onEmptyAction() {
    if (!this.noticeboardItems.length) {
      return;
    }

    this.searchQuery = '';
    this.typeFilter = '';
    this.locationFilter = '';
    this.syncQuery();
    this.onFilterChange();
  }

  setPage(page: number) {
    this.page = Math.min(Math.max(page, 1), this.maxPage);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
</script>

<style lang="scss" scoped>
.page-noticeboard {
  color: var(--ink-primary);
}

.page-noticeboard__toolbar {
  display: flex;
  margin: 20px 0 14px;
}

.page-noticeboard__search {
  flex: 1 1 auto;
  max-width: 560px;
}

.page-noticeboard__filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.page-noticeboard__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-noticeboard__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  background: var(--vision-card);
  color: var(--ink-primary);
  font: 600 var(--type-scale-1) / 1 var(--font-ui);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }

  &[aria-pressed='true'] {
    border-color: var(--vision-primary);
    background: var(--vision-primary);
    color: var(--vision-on-primary);
  }
}

.page-noticeboard__chip--type {
  border-left: 4px solid var(--nb-type);

  .page-noticeboard__chip-prefix {
    color: var(--ink-primary);
    color: color-mix(in srgb, var(--nb-type) 72%, var(--ink-primary));
  }

  &[aria-pressed='true'] {
    border-left-color: var(--nb-type);

    .page-noticeboard__chip-prefix {
      color: inherit;
    }
  }
}

.page-noticeboard__chip-count {
  min-width: 20px;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--rule-tint);
  font-size: var(--type-scale-0);
  text-align: center;
}

.page-noticeboard__chip--location {
  font-weight: 500;
}

.page-noticeboard__stats {
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

// Masonry via CSS columns; cards avoid breaking across columns.
.page-noticeboard__masonry {
  column-count: 3;
  column-gap: 18px;

  > * {
    margin-bottom: 18px;
  }
}

.page-noticeboard__pagination {
  justify-content: center;
  margin-top: 16px;
}

@media screen and (max-width: 1023px) {
  .page-noticeboard__masonry {
    column-count: 2;
  }
}

@media screen and (max-width: 599px) {
  .page-noticeboard__masonry {
    column-count: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-noticeboard__chip {
    transition: none;
  }
}
</style>
