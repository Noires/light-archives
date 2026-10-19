<template>
  <q-page class="page-stories">
    <page-head :eyebrow="eyebrow" title="Was liest Eorzea?" lead="Tagebücher, Legenden, Gedichte und kurze Szenen aus dem Elpisgarten.">
      <template v-if="canWrite" #actions>
        <q-btn class="elpis-btn elpis-btn--primary" unelevated no-caps icon="edit" label="Geschichte schreiben" to="/create-story" />
      </template>
      <section-tabs
        :model-value="activeTab"
        :tabs="tabs"
        aria-label="Geschichten nach Art"
        @update:model-value="onTabChange"
      />
    </page-head>

    <div class="page-stories__toolbar" role="search">
      <q-input
        v-model="searchQuery"
        class="page-stories__search"
        outlined
        dense
        clearable
        debounce="250"
        placeholder="Titel, Autor oder Text suchen"
        aria-label="Geschichten durchsuchen"
        @update:model-value="onFilterChange"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <q-select
        v-model="tag"
        class="page-stories__select"
        outlined
        dense
        use-input
        hide-selected
        fill-input
        input-debounce="150"
        emit-value
        map-options
        label="Schlagwort"
        :options="tagOptions"
        @filter="onTagFilter"
        @update:model-value="onFilterChange"
      />
      <div class="page-stories__chips" role="group" aria-label="Filter">
        <button
          v-if="hasWarningData"
          type="button"
          class="page-stories__chip"
          :aria-pressed="withoutWarnings ? 'true' : 'false'"
          @click="withoutWarnings = !withoutWarnings"
        >Ohne Inhaltswarnung</button>
        <button
          v-if="hasSeriesData"
          type="button"
          class="page-stories__chip"
          :aria-pressed="onlySeries ? 'true' : 'false'"
          @click="onlySeries = !onlySeries"
        >Nur Serien</button>
        <button
          v-if="hasLengthData"
          type="button"
          class="page-stories__chip"
          :aria-pressed="shortOnly ? 'true' : 'false'"
          @click="shortOnly = !shortOnly"
        >Unter 5 Min.</button>
      </div>
      <q-select
        v-model="sort"
        class="page-stories__select page-stories__sort"
        outlined
        dense
        emit-value
        map-options
        label="Sortierung"
        :options="sortOptions"
      />
    </div>

    <div v-if="showHighlights && (featured || continueEntry)" class="page-stories__highlights">
      <router-link v-if="featured" :to="`/story/${featured.id}`" class="page-stories__featured">
        <span class="page-stories__featured-eyebrow">Empfehlung der Woche · {{ $display.storyTypes[featured.type] || 'Geschichte' }}</span>
        <span class="page-stories__featured-title">{{ featured.title }}</span>
        <span v-if="featured.excerpt" class="page-stories__featured-excerpt">{{ featured.excerpt }}</span>
        <span class="page-stories__featured-meta">
          von {{ featured.author }} · {{ $display.relativeTime(featured.createdAt) }}
          <span class="page-stories__featured-cta">Jetzt lesen <q-icon name="arrow_forward" size="16px" aria-hidden="true" /></span>
        </span>
      </router-link>
      <router-link v-if="continueEntry" :to="`/story/${continueEntry.id}`" class="page-stories__continue">
        <span class="page-stories__continue-eyebrow">
          <q-icon name="bookmark" size="16px" aria-hidden="true" /> Weiterlesen
        </span>
        <span class="page-stories__continue-title">{{ continueEntry.title }}</span>
        <span class="page-stories__continue-meta">von {{ continueEntry.author }}</span>
        <span class="page-stories__continue-bar" aria-hidden="true">
          <span :style="{ width: `${Math.round(continueEntry.percent * 100)}%` }"></span>
        </span>
        <span class="page-stories__continue-meta">{{ Math.round(continueEntry.percent * 100) }} % gelesen</span>
      </router-link>
    </div>

    <p class="page-stories__stats" aria-live="polite">
      {{ statsLabel }}
    </p>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Geschichtenliste</h2>
    <div v-if="visibleStories.length" class="page-stories__grid">
      <story-card v-for="story in visibleStories" :key="story.id" :story="story" />
    </div>
    <empty-state
      v-else-if="!loading"
      icon="auto_stories"
      title="Keine Geschichten gefunden"
      :text="hasFilters ? 'Passe die Suche oder die Filter an.' : 'Schreib die erste Geschichte für Elpisgarten.'"
      :action-label="hasFilters ? 'Filter zurücksetzen' : (canWrite ? 'Geschichte schreiben' : '')"
      :action-to="hasFilters ? null : { path: '/create-story' }"
      @action="onEmptyAction"
    />

    <q-pagination
      v-if="maxPage > 1"
      class="page-stories__pagination"
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
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { StoryFilterDto } from '@app/shared/dto/stories/story-filter.dto';
import { StoryType } from '@app/shared/enums/story-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import StoryCard from 'components/stories/StoryCard.vue';
import { getContinueReading, ReadingProgressEntry, readingMinutes } from 'components/stories/reader-storage';
import type { StoryCardData } from 'components/stories/story-card-data';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

// ER2-604 — stories directory: PageHead, type tabs, toolbar, "Empfehlung der
// Woche" + "Weiterlesen" (localStorage progress written by the reader),
// three-column cards. Type, tag and search go to the API; the chip filters
// and the sort act on the loaded page and appear only when the list response
// carries the data they need (content notes, series, length).

const SERIES_TAB = 'serien';
const ALL_TAB = 'alle';
const PAGE_SIZE = SharedConstants.DEFAULT_ROWS_PER_PAGE;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const TYPE_TABS: { key: string; label: string; icon: string }[] = [
  { key: ALL_TAB, label: 'Alle', icon: 'library_books' },
  { key: StoryType.BOOK, label: 'Geschichten', icon: 'menu_book' },
  { key: StoryType.DIARY, label: 'Tagebücher', icon: 'edit_note' },
  { key: StoryType.POETRY, label: 'Gedichte', icon: 'format_quote' },
  { key: StoryType.IC_HAPPENING, label: 'IC-Geschehen', icon: 'theater_comedy' },
  { key: StoryType.NEWSPAPER, label: 'Zeitung', icon: 'newspaper' },
];

type SortKey = 'newest' | 'oldest' | 'title';

function isStoryType(value: unknown): value is StoryType {
  return typeof value === 'string' && (Object.values(StoryType) as string[]).includes(value);
}

@Options({
  name: 'PageStories',
  components: {
    EmptyState,
    PageHead,
    SectionTabs,
    StoryCard,
  },
  async beforeRouteEnter(to, _, next) {
    const tag = (to.query.tag as string) || '';
    const queryType = to.query.type as string;
    const type = isStoryType(queryType) ? queryType : null;
    const filter: StoryFilterDto = { limit: PAGE_SIZE };

    if (tag) {
      filter.tag = tag;
    }

    if (type) {
      filter.type = type;
    }

    try {
      const [ stories, tags, overview ] = await Promise.all([
        $api.stories.getStories(filter),
        $api.stories.getTags().catch(() => [] as string[]),
        tag || type ? $api.stories.getStories({ limit: PAGE_SIZE }) : Promise.resolve(null),
      ]);

      next((vm) => {
        const page = vm as PageStories;
        page.tag = tag;
        page.type = type;
        page.setContent(stories, tags, overview || stories);
      });
    } catch (e) {
      notifyError(e);
      next();
    }
  },
})
export default class PageStories extends Vue {
  stories: StoryCardData[] = [];
  total = 0;
  allTotal = 0;
  page = 1;
  loading = false;

  searchQuery = '';
  tag = '';
  type: StoryType | null = null;
  seriesTab = false;
  withoutWarnings = false;
  onlySeries = false;
  shortOnly = false;
  sort: SortKey = 'newest';

  tagOptions: { label: string; value: string }[] = [];
  allTagOptions: { label: string; value: string }[] = [];

  featured: StoryCardData | null = null;
  continueEntry: ReadingProgressEntry | null = null;

  private requestToken = 0;

  readonly sortOptions = [
    { label: 'Neueste zuerst', value: 'newest' },
    { label: 'Älteste zuerst', value: 'oldest' },
    { label: 'Titel A–Z', value: 'title' },
  ];

  get canWrite(): boolean {
    return !!this.$store.getters.character;
  }

  get eyebrow(): string {
    const count = this.allTotal || this.total;
    return `Geschichten · ${count.toLocaleString('de-DE')} ${count === 1 ? 'Text' : 'Texte'}`;
  }

  get hasWarningData(): boolean {
    return this.stories.some((story) => Array.isArray(story.contentNotes));
  }

  /** Serien tab and "Nur Serien" appear once any loaded story belongs to a series. */
  get hasSeriesData(): boolean {
    return this.stories.some((story) => !!story.seriesTitle);
  }

  get hasLengthData(): boolean {
    return this.stories.some((story) => typeof story.wordCount === 'number' || typeof story.readingMinutes === 'number');
  }

  get activeTab(): string {
    if (this.seriesTab) {
      return SERIES_TAB;
    }

    return this.type || ALL_TAB;
  }

  get tabs(): SectionTab[] {
    const tabs: SectionTab[] = TYPE_TABS.map((tab) => ({
      ...tab,
      count: tab.key === this.activeTab && !this.seriesTab ? this.total : undefined,
    }));

    tabs.push({
      key: SERIES_TAB,
      label: 'Serien',
      icon: 'collections_bookmark',
      hidden: !this.hasSeriesData && !this.seriesTab,
    });

    return tabs;
  }

  get hasFilters(): boolean {
    return !!(this.searchQuery || this.tag || this.type || this.seriesTab || this.withoutWarnings || this.onlySeries || this.shortOnly);
  }

  get showHighlights(): boolean {
    return this.page === 1 && !this.searchQuery && !this.tag && !this.type && !this.seriesTab;
  }

  get visibleStories(): StoryCardData[] {
    const filtered = this.stories.filter((story) => {
      if (this.withoutWarnings && story.contentNotes && story.contentNotes.length > 0) {
        return false;
      }

      if ((this.onlySeries || this.seriesTab) && !story.seriesTitle) {
        return false;
      }

      if (this.shortOnly) {
        const minutes = story.readingMinutes || (story.wordCount ? readingMinutes(story.wordCount) : 0);

        if (!minutes || minutes >= 5) {
          return false;
        }
      }

      return true;
    });

    if (this.sort === 'oldest') {
      return [ ...filtered ].sort((a, b) => a.createdAt - b.createdAt);
    }

    if (this.sort === 'title') {
      return [ ...filtered ].sort((a, b) => a.title.localeCompare(b.title, 'de'));
    }

    return filtered;
  }

  get statsLabel(): string {
    if (this.loading) {
      return 'Geschichten werden geladen …';
    }

    const shown = this.visibleStories.length;
    const base = `${this.total.toLocaleString('de-DE')} ${this.total === 1 ? 'Geschichte' : 'Geschichten'}`;
    return shown !== this.stories.length ? `${shown} von ${this.stories.length} auf dieser Seite · ${base}` : base;
  }

  get maxPage(): number {
    return Math.max(1, Math.ceil(this.total / PAGE_SIZE));
  }

  mounted() {
    this.continueEntry = getContinueReading();
  }

  setContent(stories: PagingResultDto<StoryCardData>, tags: string[], overview: PagingResultDto<StoryCardData>) {
    this.allTagOptions = [
      { label: 'Alle Schlagworte', value: '' },
      ...tags.map((tag) => ({ label: tag, value: tag })),
    ];
    this.tagOptions = this.allTagOptions;
    this.stories = stories.data;
    this.total = stories.total;
    this.allTotal = overview.total;
    this.featured = this.pickFeatured(overview.data);
  }

  /**
   * Longest story of the last week, else of the six newest. Length is the word
   * count when the API sends it (ER2 round 2), else the excerpt length.
   */
  pickFeatured(stories: StoryCardData[]): StoryCardData | null {
    const published = stories.filter((story) => story.published !== false);
    const byWords = published.some((story) => typeof story.wordCount === 'number');
    const candidates = byWords
      ? published.filter((story) => (story.wordCount || 0) > 0)
      : published.filter((story) => !!story.excerpt);
    const weekAgo = Date.now() - WEEK_MS;
    const length = (story: StoryCardData) => (byWords ? story.wordCount || 0 : (story.excerpt || '').length);
    const recent = candidates.filter((story) => story.createdAt >= weekAgo);
    const pool = recent.length ? recent : candidates.slice(0, 6);

    if (!pool.length) {
      return null;
    }

    return pool.reduce((best, story) => (length(story) > length(best) ? story : best), pool[0]);
  }

  onTabChange(key: string) {
    this.seriesTab = key === SERIES_TAB;
    this.type = isStoryType(key) ? key : null;

    const query = { ...this.$route.query };

    if (this.type) {
      query.type = this.type;
    } else {
      delete query.type;
    }

    void this.$router.replace({ query });
    this.onFilterChange();
  }

  onTagFilter(value: string, update: (callback: () => void) => void) {
    update(() => {
      const needle = value.trim().toLowerCase();
      this.tagOptions = needle
        ? [ this.allTagOptions[0], ...this.allTagOptions.slice(1).filter((tag) => tag.value.toLowerCase().includes(needle)) ]
        : this.allTagOptions;
    });
  }

  onFilterChange() {
    this.page = 1;
    void this.refresh();
  }

  onEmptyAction() {
    if (!this.hasFilters) {
      return;
    }

    this.searchQuery = '';
    this.tag = '';
    this.withoutWarnings = false;
    this.onlySeries = false;
    this.shortOnly = false;
    this.onTabChange(ALL_TAB);
  }

  setPage(page: number) {
    this.page = Math.min(Math.max(page, 1), this.maxPage);
    void this.refresh();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async refresh() {
    const token = ++this.requestToken;
    const filter: StoryFilterDto = {
      offset: (this.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    };

    if (this.searchQuery) {
      filter.searchQuery = this.searchQuery;
    }

    if (this.tag) {
      filter.tag = this.tag;
    }

    if (this.type) {
      filter.type = this.type;
    }

    this.loading = true;

    try {
      const result = await this.$api.stories.getStories(filter);

      if (token === this.requestToken) {
        this.stories = result.data;
        this.total = result.total;
      }
    } catch (e) {
      notifyError(e);
    } finally {
      if (token === this.requestToken) {
        this.loading = false;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page-stories {
  color: var(--ink-primary);
}

.page-stories__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin: 20px 0 24px;
}

.page-stories__search {
  flex: 1 1 260px;
}

.page-stories__select {
  flex: 0 1 200px;
  min-width: 160px;
}

.page-stories__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-stories__chip {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-primary);
  font: 600 var(--type-scale-1) / 1 var(--font-ui);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background: var(--rule-tint);
  }

  &[aria-pressed='true'] {
    background: var(--vision-primary);
    border-color: var(--vision-primary);
    color: var(--vision-on-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-stories__highlights {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 18px;
  margin-bottom: 28px;

  > :only-child {
    grid-column: 1 / -1;
  }
}

.page-stories__featured,
.page-stories__continue {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 26px 28px;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background: var(--vision-card);
  color: var(--ink-primary);
  text-decoration: none;
  transition: border-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-stories__featured {
  position: relative;
  overflow: hidden;
  border-color: var(--rule-strong);

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: var(--vision-primary);
  }
}

.page-stories__featured-eyebrow,
.page-stories__continue-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-link);
}

.page-stories__featured-title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.6vw, 2.1rem);
  font-weight: 600;
  line-height: 1.2;
}

.page-stories__featured-excerpt {
  font-family: var(--font-body);
  font-size: 1.08rem;
  line-height: 1.6;
  color: var(--ink-muted);
}

.page-stories__featured-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.page-stories__featured-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--ink-link);
}

.page-stories__continue-title {
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  font-weight: 600;
  line-height: 1.3;
}

.page-stories__continue-meta {
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.page-stories__continue-bar {
  display: block;
  height: 4px;
  margin-top: auto;
  border-radius: 2px;
  background: var(--rule-tint);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--vision-primary);
  }
}

.page-stories__stats {
  margin: 0 0 12px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.page-stories__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.page-stories__pagination {
  justify-content: center;
  margin-top: 28px;
}

@media screen and (max-width: 1023px) {
  .page-stories__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-stories__highlights {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media screen and (max-width: 599px) {
  .page-stories__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-stories__select {
    flex: 1 1 100%;
  }

  .page-stories__featured,
  .page-stories__continue {
    padding: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-stories__chip,
  .page-stories__featured,
  .page-stories__continue {
    transition: none;
  }
}
</style>
