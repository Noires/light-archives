<template>
  <div class="story-view">
    <h2 class="story-view__title regular-header-font">{{ story.title }}</h2>
    <section class="text-caption story-view__subtitle row">
      <div class="story-view__posted-by">
      Verfasst von <router-link :to="authorLink">{{ story.author }}</router-link> am {{ date }}
      <template v-if="story.tags.length > 0">
        in
        <template v-for="(tag, index) in story.tags" :key="tag.name">
          <template v-if="index > 0">, </template>
          <router-link :to="{ path: '/stories', query: { tag } }">{{ tag }}</router-link>
        </template>
      </template>
      </div>
      <div class="story-view__type">
        <router-link :to="{ path: '/stories', query: { type: story.type } }">{{ $display.storyTypes[story.type] }}</router-link>
      </div>
    </section>
    <div v-if="contentNotes.length" class="story-view__warnings">
      <div class="story-view__warnings-title">
        <q-icon name="warning" size="16px" aria-hidden="true" />
        Inhaltswarnungen
      </div>
      <div class="story-view__warnings-chips">
        <q-chip
          v-for="item in contentNotes"
          :key="item"
          dense
          icon="warning"
          class="story-view__warning-chip"
        >
          {{ item }}
        </q-chip>
      </div>
    </div>

    <triskelion-divider class="story-view__divider" />
    <section class="story-view__body mat-parchment" :class="{ 'story-view__body--drop-cap': hasDropCap }">
      <html-viewer
        class="story-view__content"
        :content="story.content"
      />
    </section>
  </div>
</template>

<script lang="ts">
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';

const DROP_CAP_WORD_THRESHOLD = 200;

class Props {
  story = prop<StoryDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'StoryView',
  components: {
    HtmlViewer,
    TriskelionDivider,
  }
})
export default class StoryView extends Vue.with(Props) {
  get contentNotes(): string[] {
    return this.story.contentNotes.map((contentNote) => (ContentNoteTexts as {[key:string]: string})[contentNote])
  }

  get date(): string {
    return this.$display.formatDate(this.story.createdAt);
  }

  get authorLink(): string {
    const server = this.story.authorServer || '';
    const character = this.story.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get hasDropCap(): boolean {
    const stripped = (this.story.content || '').replace(/<[^>]*>/g, ' ');
    const wordCount = stripped.split(/\s+/).filter(Boolean).length;
    return wordCount >= DROP_CAP_WORD_THRESHOLD;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

// ELPIS-501 — Story view body lives on Parchment. Triskelion divider replaces
// the old hr separator so the page reads as "header → seal → manuscript".
// Subtitle/warnings rebased onto Aetherium tokens for theme awareness.
.story-view__subtitle {
  color: var(--ink-muted);
  font-family: var(--font-section);
  font-style: italic;
}

.story-view__posted-by {
  flex-grow: 1;
  padding-right: 16px;
}

.story-view__type {
  flex-grow: 0;
  white-space: nowrap;
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
}

.story-view__divider {
  margin: 24px auto 18px;
}

.story-view__body {
  padding: 28px 32px;
  margin-bottom: 24px;
}

.story-view__body .story-view__content {
  font-family: var(--font-body);
  line-height: var(--lh-body);
}

// ELPIS-502 — Illuminated drop cap on stories >= 200 words. Cinzel Eorzea via
// --font-ornament; falls through to Cinzel/serif until ELPIS-001 self-hosts.
// Three-line height tuned to --lh-body (1.6); the float-left lets body copy
// flow around the initial. Mobile collapses to ~2.4 lines so the cap doesn't
// dominate the column.
.story-view__body--drop-cap .story-view__content > p:first-of-type::first-letter {
  float: left;
  font-family: var(--font-ornament);
  font-size: 4.4em;
  line-height: 0.9;
  margin: 0.06em 0.12em 0 0;
  padding: 0;
  color: var(--rule-gold);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
  letter-spacing: -0.02em;
  font-weight: 500;
}

.story-view__warnings {
  margin: 12px 0 16px;
}

// ER2-101 — the content-warning title and chips use the dedicated CW tokens
// (amber in Hydaelyn, pale gold in Zodiark); both pairs pass AA.
.story-view__warnings-title {
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
  color: var(--vision-cw-text);
  font-family: var(--font-ui);
  font-weight: 600;
  margin-bottom: 6px;
}

.story-view__warnings-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

// Doubled class beats Quasar's .q-chip / .q-chip--dark fills (#616161 in dark).
.q-chip.story-view__warning-chip {
  background: var(--vision-cw-bg);
  color: var(--vision-cw-text);
  font-weight: 600;
  border: 1px solid var(--vision-cw-border);

  .q-icon {
    color: inherit;
  }
}

// ER2-104 — byline follows the theme's muted ink (was unthemed #616161 in dark).
.story-view__subtitle,
.story-view__subtitle.text-caption {
  color: var(--ink-muted);
}

body.body--dark .story-view__body--drop-cap .story-view__content > p:first-of-type::first-letter {
  color: var(--ink-luminous);
  text-shadow: 0 0 18px rgba(184, 165, 255, 0.32);
}

@media screen and (max-width: 600px) {
  .story-view__body {
    padding: 20px 18px;
  }

  .story-view__body--drop-cap .story-view__content > p:first-of-type::first-letter {
    font-size: 3.2em;
    margin-right: 0.10em;
  }
}
</style>
