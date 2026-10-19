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

    <section v-if="page === 1 && pinnedItems.length" class="page-noticeboard__pinned" aria-labelledby="nb-pinned-title">
      <h2 id="nb-pinned-title" class="page-noticeboard__pinned-title">
        <q-icon name="push_pin" size="18px" aria-hidden="true" /> Angeheftet
      </h2>
      <div class="page-noticeboard__pinned-row">
        <noticeboard-card
          v-for="item in pinnedItems"
          :key="item.id"
          :item="item"
          :can-pin="isModerator"
          :pin-busy="pinBusy.includes(item.id)"
          @toggle-pin="togglePin"
        />
      </div>
    </section>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Aushänge</h2>
    <div v-if="pagedItems.length" class="page-noticeboard__masonry">
      <noticeboard-card
        v-for="item in pagedItems"
        :key="item.id"
        :item="item"
        :can-pin="isModerator"
        :pin-busy="pinBusy.includes(item.id)"
        @toggle-pin="togglePin"
      />
    </div>
    <empty-state
      v-else-if="!pinnedItems.length || page > 1"
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
import { Role, roleImplies } from '@app/shared/enums/role.enum';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

// ER2-605 — noticeboard directory: PageHead, "[Typ]" chips in type colour,
// location chips, three-column masonry of note cards. The list endpoint
// returns every notice, so filtering and paging stay client-side. ER2 round
// 2: notices with `pinned` (optional field) fill the "Angeheftet" row above
// the masonry; moderators pin and unpin from the cards.

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
  pinBusy: number[] = [];

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

  get isModerator(): boolean {
    const role = this.$store.getters.role;
    return !!role && roleImplies(role, Role.MODERATOR);
  }

  get pinnedItems(): NoticeboardCardItem[] {
    return this.filteredItems.filter((item) => item.pinned);
  }

  get unpinnedItems(): NoticeboardCardItem[] {
    return this.filteredItems.filter((item) => !item.pinned);
  }

  get pagedItems(): NoticeboardCardItem[] {
    const start = (this.page - 1) * PAGE_SIZE;
    return this.unpinnedItems.slice(start, start + PAGE_SIZE);
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil(this.unpinnedItems.length / PAGE_SIZE));
  }

  /** Optimistic: flip the flag at once, roll back if the request fails. */
  async togglePin(item: NoticeboardCardItem) {
    if (!this.isModerator || this.pinBusy.includes(item.id)) {
      return;
    }
    const pinned = !item.pinned;
    const setPinned = (value: boolean) => {
      this.noticeboardItems = this.noticeboardItems.map((entry) => (entry.id === item.id ? { ...entry, pinned: value } : entry));
    };
    setPinned(pinned);
    this.pinBusy = [ ...this.pinBusy, item.id ];
    this.refocusPin(item.id);
    try {
      await this.$api.noticeboard.setPinned(item.id, pinned);
    } catch (e) {
      console.log(e);
      setPinned(!pinned);
      this.refocusPin(item.id);
      notifyError(pinned ? 'Der Aushang konnte nicht angeheftet werden.' : 'Der Aushang konnte nicht gelöst werden.');
    } finally {
      this.pinBusy = this.pinBusy.filter((id) => id !== item.id);
    }
  }

  /**
   * The card re-renders in the other list (pinned row vs. masonry), so the
   * focused button is gone. Move focus to the same card's pin button in its
   * new place; if the card left the current page, fall back to the content.
   */
  refocusPin(id: number) {
    void this.$nextTick(() => {
      const button = this.$el instanceof HTMLElement
        ? this.$el.querySelector<HTMLElement>(`[data-nb-pin="${id}"]`)
        : null;
      const target = button || document.getElementById('inhalt');
      target?.focus({ preventScroll: !!button });
      button?.scrollIntoView({ block: 'nearest' });
    });
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

.page-noticeboard__pinned {
  margin-bottom: 24px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--rule-soft);
}

.page-noticeboard__pinned-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-link);
}

.page-noticeboard__pinned-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
  margin-bottom: 18px;
}

.page-noticeboard__pagination {
  justify-content: center;
  margin-top: 16px;
}

@media screen and (max-width: 1023px) {
  .page-noticeboard__masonry {
    column-count: 2;
  }

  .page-noticeboard__pinned-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 599px) {
  .page-noticeboard__masonry {
    column-count: 1;
  }

  .page-noticeboard__pinned-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-noticeboard__chip {
    transition: none;
  }
}
</style>
