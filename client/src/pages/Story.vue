<template>
  <q-page class="page-story">
    <scroll-progress-rule class="page-story__progress" />
    <transition name="page-turn">
      <div v-if="story.id" :key="story.id" class="page-story__pane">
        <breadcrumbs class="page-story__crumbs" :items="crumbs" />

        <section v-if="story.mine" class="page-story__edit-bar" aria-label="Geschichte verwalten">
          <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps icon="edit" label="Geschichte bearbeiten" :to="`/edit-story/${story.id}`" />
          <q-btn class="elpis-btn elpis-btn--ghost" flat no-caps icon="delete_outline" label="Geschichte löschen" @click="onDeleteClick" />
        </section>

        <div class="page-story__layout">
          <story-reader-rail
            class="page-story__left"
            :series="series"
            :current-id="story.id"
            :progress="progress"
            :font-size="fontSize"
            :surface="surface"
            :author-character-id="authorProfile && !story.mine ? authorProfile.id : 0"
            :reading-controls="false"
          />

          <div ref="article" class="page-story__article">
            <story-view
              :story="story"
              :font-size="fontSize"
              :surface="surface"
              :author-avatar="authorAvatar"
              :part-index="partIndex"
              :part-count="partCount"
            >
              <template #byline-actions>
                <story-reading-settings
                  :font-size="fontSize"
                  :surface="surface"
                  @update:font-size="onFontSize"
                  @update:surface="onSurface"
                />
              </template>
            </story-view>
            <story-reactions
              :story-id="story.id"
              :initial-counts="story.reactionCounts || null"
              :initial-mine="story.myReactions || null"
              :mine="story.mine"
              :end-label="partCount > 1 && partIndex > 0 ? `Ende von Teil ${partIndex}` : 'Ende'"
            />
            <story-part-nav :series="series" :current-id="story.id" />
          </div>

          <story-author-rail
            class="page-story__right"
            :author="story.author || ''"
            :author-server="story.authorServer || ''"
            :profile="authorProfile"
            :other-stories="otherStories"
            :tags="story.tags || []"
          />
        </div>

        <report-violation-section :pageType="PageType.STORY" :pageId="story.id" />
      </div>
    </transition>
  </q-page>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import type { StorySeriesDto } from '@app/shared/dto/stories/story-series.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import StoryAuthorRail from 'components/stories/StoryAuthorRail.vue';
import StoryPartNav from 'components/stories/StoryPartNav.vue';
import StoryReactions from 'components/stories/StoryReactions.vue';
import StoryReaderRail from 'components/stories/StoryReaderRail.vue';
import StoryReadingSettings from 'components/stories/StoryReadingSettings.vue';
import StoryView from 'components/stories/StoryView.vue';
import {
  getReadingProgress,
  loadReaderFontSize,
  loadReaderSurface,
  ReaderSurface,
  saveReaderFontSize,
  saveReaderSurface,
  saveReadingProgress,
} from 'components/stories/reader-storage';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import ScrollProgressRule from 'src/components/common/ScrollProgressRule.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();

// ER2-601 — reader page: progress rule under the top bar, three columns
// (reader rail 220 px | article 68ch | author rail 240 px). Below 1280 px the
// rails stack under the article; the reader controls stay on top.

async function load(params: RouteParams): Promise<StoryDto> {
  const id = parseInt(params.id as string, 10);

  if (!id) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const story = await $api.stories.getStory(id);
    document.title = `${story.title} — Elpisgarten`;
    return story;
  } catch (e) {
    if (errors.getStatusCode(e) === 404) {
      notifyError('Geschichte konnte nicht gefunden werden.');
      void $router.replace('/');
    } else {
      notifyError(e);
    }

    throw e;
  }
}

const PROGRESS_SAVE_INTERVAL_MS = 2000;

@Options({
  name: 'PageStory',
  components: {
    Breadcrumbs,
    ReportViolationSection,
    ScrollProgressRule,
    StoryAuthorRail,
    StoryPartNav,
    StoryReactions,
    StoryReaderRail,
    StoryReadingSettings,
    StoryView,
  },
  async beforeRouteEnter(to, _, next) {
    const story = await load(to.params);
    next((vm) => (vm as PageStory).setContent(story));
  },
  async beforeRouteUpdate(to) {
    (this as PageStory).persistProgress();
    const story = await load(to.params);
    (this as PageStory).setContent(story);
  },
})
export default class PageStory extends Vue {
  readonly PageType = PageType;

  story: StoryDto = new StoryDto();
  series: StorySeriesDto | null = null;
  authorProfile: CharacterProfileDto | null = null;
  otherStories: StorySummaryDto[] = [];

  fontSize = loadReaderFontSize();
  surface: ReaderSurface | null = loadReaderSurface();
  progress = 0;

  private rafId: number | null = null;
  private lastSavedAt = 0;
  private boundOnScroll: (() => void) | null = null;
  private loadToken = 0;

  get crumbs(): BreadcrumbItem[] {
    return [ { label: 'Geschichten', to: '/stories' }, { label: this.story.title || 'Geschichte' } ];
  }

  get authorAvatar(): string {
    const profile = this.authorProfile;
    return profile && profile.showAvatar !== false ? profile.avatar || '' : '';
  }

  get partIndex(): number {
    if (this.series && this.series.parts.length > 1) {
      return this.series.parts.findIndex((part) => part.id === this.story.id) + 1;
    }

    return this.story.seriesIndex || 0;
  }

  get partCount(): number {
    if (this.series && this.series.parts.length > 1) {
      return this.series.parts.length;
    }

    return this.story.seriesCount || 0;
  }

  setContent(story: StoryDto) {
    this.story = story;
    this.series = null;
    this.authorProfile = null;
    this.otherStories = [];
    this.progress = getReadingProgress(story.id || 0)?.percent || 0;
    this.lastSavedAt = 0;
    void this.loadExtras(story);
  }

  // Everything below is optional: older APIs or hidden profiles just leave
  // the corresponding block out.
  async loadExtras(story: StoryDto) {
    const token = ++this.loadToken;
    const id = story.id as number;

    const seriesPromise = story.seriesTitle
      ? this.$api.stories.getStorySeries(id).catch(() => null)
      : Promise.resolve(null);

    const profilePromise = story.author && story.authorServer
      ? this.$api.characters.getCharacterProfile(story.author, story.authorServer).catch(() => null)
      : Promise.resolve(null);

    const [ series, profile ] = await Promise.all([ seriesPromise, profilePromise ]);

    if (token !== this.loadToken) {
      return;
    }

    this.series = series;
    this.authorProfile = profile;

    if (profile) {
      try {
        const result = await this.$api.stories.getStories({ characterId: profile.id, limit: 6 });

        if (token === this.loadToken) {
          this.otherStories = result.data.filter((item) => item.id !== id && item.published !== false).slice(0, 4);
        }
      } catch {
        // keep the rail without "Auch von"
      }
    }
  }

  mounted() {
    this.boundOnScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.boundOnScroll, { passive: true });
  }

  beforeUnmount() {
    this.persistProgress();

    if (this.boundOnScroll) {
      window.removeEventListener('scroll', this.boundOnScroll);
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  onScroll() {
    if (this.rafId !== null) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.computeProgress();
    });
  }

  computeProgress() {
    const article = this.$refs.article as HTMLElement | undefined;

    if (!article || !this.story.id) {
      return;
    }

    const rect = article.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight * 0.5);
    const read = window.innerHeight * 0.5 - rect.top;
    this.progress = Math.min(1, Math.max(0, read / total));

    if (Date.now() - this.lastSavedAt > PROGRESS_SAVE_INTERVAL_MS) {
      this.persistProgress();
    }
  }

  persistProgress() {
    if (!this.story.id || this.story.published === false) {
      return;
    }

    this.lastSavedAt = Date.now();
    saveReadingProgress({
      id: this.story.id,
      title: this.story.title,
      author: this.story.author || '',
      type: this.story.type,
      percent: this.progress,
    });
  }

  onFontSize(size: number) {
    this.fontSize = size;
    saveReaderFontSize(size);
  }

  onSurface(surface: ReaderSurface) {
    this.surface = surface;
    saveReaderSurface(surface);
  }

  onDeleteClick() {
    this.$q.dialog({
      title: 'Löschbestätigung',
      message: `Möchtest du “${this.story.title}” wirklich löschen?`,
      ok: {
        label: 'Löschen',
        color: 'negative',
        flat: true,
      },
      cancel: 'Abbrechen',
    }).onOk(async () => {
      try {
        await this.$api.stories.deleteStory(this.story.id!);

        notifySuccess('Geschichte gelöscht.');
        void this.$router.replace('/');
      } catch (e) {
        notifyError(e);
      }
    });
  }
}
</script>

<style lang="scss" scoped>
.page-story {
  position: relative;
  // clip, not hidden: hidden would make this a scroll container (and the
  // page-turn transition overflows the pane while it runs).
  overflow: clip;
}

// The rule sits directly under the fixed top bar instead of over it.
.page-story__progress.elpis-scroll-progress {
  top: var(--nav-height, 68px);
  z-index: 2001;
}

.page-story__crumbs {
  margin-bottom: 16px;
}

.page-story__edit-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
}

// One reading column (at most 800px, centred in the page container): the
// reading controls sit above the text as a toolbar and the author section
// closes the article below it. The calendar widget stays beside the page, so
// the text keeps its 68ch measure (StoryView) instead of being squeezed by
// side rails.
.page-story__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'left'
    'article'
    'right';
  gap: 28px;
  max-width: 800px;
  margin: 0 auto;
}

.page-story__layout > .page-story__left {
  grid-area: left;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px 32px;

  > :deep(*) {
    flex: 1 1 240px;
  }
}

.page-story__article {
  grid-area: article;
  min-width: 0;
}

.page-story__right {
  grid-area: right;
  padding-top: 24px;
  border-top: 1px solid var(--rule-soft);
}

// Author card on the left, "Auch von …" and tags on the right.
@media screen and (min-width: 700px) {
  .page-story__layout > .page-story__right {
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    gap: 16px 28px;
    align-items: start;

    > :deep(.author-rail__card) {
      grid-row: span 2;
    }
  }
}

// ELPIS-504 — page-turn transition between stories (e.g. series next link).
// First arrival has no prior pane, so nothing animates.
.page-story__pane {
  transform-origin: left center;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.page-turn-enter-active,
.page-turn-leave-active {
  transition:
    transform 380ms cubic-bezier(0.43, 0.13, 0.23, 0.96),
    opacity 380ms ease-out;
}

.page-turn-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.page-turn-enter-from {
  opacity: 0;
  transform: perspective(1200px) rotateY(8deg) translateX(10px);
}

.page-turn-leave-to {
  opacity: 0;
  transform: perspective(1200px) rotateY(-26deg) translateX(-14px);
  box-shadow: -18px 0 32px rgba(43, 36, 24, 0.18);
}

@media (prefers-reduced-motion: reduce) {
  .page-turn-enter-active,
  .page-turn-leave-active {
    transition: none;
  }

  .page-turn-enter-from,
  .page-turn-leave-to {
    opacity: 1;
    transform: none;
    box-shadow: none;
  }

  .page-turn-leave-active {
    position: static;
  }
}
</style>
