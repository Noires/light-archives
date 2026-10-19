<template>
  <article
    class="story-view"
    :class="[`story-view--${effectiveSurface}`, { 'story-view--preview': preview }]"
    :style="{ '--reader-font-size': `${fontSize}px` }"
    :aria-labelledby="titleId"
  >
    <header class="story-view__head">
      <p class="story-view__eyebrow">
        <span>{{ eyebrow }}</span>
        <span v-if="story.published === false" class="story-view__draft">Entwurf · nur für dich sichtbar</span>
      </p>
      <component :is="preview ? 'h2' : 'h1'" :id="titleId" class="story-view__title">{{ story.title || 'Ohne Titel' }}</component>
      <p v-if="lede" class="story-view__lede">{{ lede }}</p>

      <div class="story-view__byline">
        <q-avatar size="40px" class="story-view__avatar">
          <img v-if="authorAvatar" :src="authorAvatar" alt="" />
          <q-icon v-else name="person" />
        </q-avatar>
        <div class="story-view__byline-text">
          <router-link v-if="story.author" :to="authorLink" class="story-view__author">{{ story.author }}</router-link>
          <span class="story-view__byline-meta">
            <template v-if="story.createdAt">{{ date }} · </template>{{ minutes }} Min. Lesezeit · {{ wordLabel }}
          </span>
        </div>
      </div>

      <div v-if="contentNotes.length" class="story-view__cw" role="note" aria-label="Inhaltswarnungen">
        <q-icon name="warning" size="18px" class="story-view__cw-icon" aria-hidden="true" />
        <span class="story-view__cw-label">Inhaltswarnungen:</span>
        <span class="story-view__cw-list">{{ contentNotes.join(' · ') }}</span>
        <span v-if="cwConfirmed" class="story-view__cw-confirmed">
          <q-icon name="check" size="14px" aria-hidden="true" /> Bestätigt
        </span>
      </div>
    </header>

    <cw-veil
      class="story-view__veil"
      :warnings="contentNotes"
      :disabled="preview"
      :back-to="{ path: '/stories' }"
      @confirm="onVeilConfirm"
    >
      <section class="story-view__body mat-parchment" :class="{ 'story-view__body--drop-cap': hasDropCap }">
        <html-viewer class="story-view__content" :content="story.content || ''" />
      </section>
    </cw-veil>

    <triskelion-divider class="story-view__end" />
  </article>
</template>

<script lang="ts">
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import CwVeil from '../vision/CwVeil.vue';
import { countWords, READER_DEFAULT_FONT_SIZE, ReaderSurface, readingMinutes } from './reader-storage';

// ER2-601 — the reader's article column: eyebrow, Cinzel title, IM Fell lede,
// byline with reading time and word count, CW row, prose (Spectral 19/1.75,
// ELPIS-502 drop cap on >= 200 words) behind the CW veil (ER2-602).
// Font size and the Pergament/Nacht surface come from the page's reader rail;
// the editor preview (`preview`) uses the defaults and no veil.

const DROP_CAP_WORD_THRESHOLD = 200;

let storyViewCounter = 0;

class Props {
  story = prop<StoryDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });

  fontSize = prop<number>({
    default: READER_DEFAULT_FONT_SIZE,
  });

  /** null follows the app theme (Hydaelyn = Pergament, Zodiark = Nacht). */
  surface = prop<ReaderSurface | null>({
    default: null,
  });

  authorAvatar = prop<string>({
    default: '',
  });

  /** 1-based position in the series, 0 when unknown. */
  partIndex = prop<number>({
    default: 0,
  });

  partCount = prop<number>({
    default: 0,
  });
}

@Options({
  name: 'StoryView',
  components: {
    CwVeil,
    HtmlViewer,
    TriskelionDivider,
  },
  emits: [ 'veil-confirm' ],
})
export default class StoryView extends Vue.with(Props) {
  readonly titleId = `story-title-${++storyViewCounter}`;

  cwConfirmed = false;

  get effectiveSurface(): ReaderSurface {
    return this.surface || (this.$q.dark.isActive ? 'nacht' : 'pergament');
  }

  get contentNotes(): string[] {
    return (this.story.contentNotes || [])
      .filter(Boolean)
      .map((contentNote) => ContentNoteTexts[contentNote] || contentNote);
  }

  get typeLabel(): string {
    return this.$display.storyTypes[this.story.type] || 'Geschichte';
  }

  get eyebrow(): string {
    if (this.partIndex > 0 && this.partCount > 1) {
      return `${this.typeLabel} · Teil ${this.partIndex} von ${this.partCount}`;
    }

    return this.typeLabel;
  }

  get lede(): string {
    return this.story.seriesTitle ? `Aus der Reihe »${this.story.seriesTitle}«` : '';
  }

  get date(): string {
    return this.$display.formatDate(this.story.createdAt);
  }

  get words(): number {
    return countWords(this.story.content);
  }

  get minutes(): number {
    return readingMinutes(this.words);
  }

  get wordLabel(): string {
    return `${this.words.toLocaleString('de-DE')} ${this.words === 1 ? 'Wort' : 'Wörter'}`;
  }

  get authorLink(): string {
    const server = this.story.authorServer || '';
    const character = this.story.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get hasDropCap(): boolean {
    return this.words >= DROP_CAP_WORD_THRESHOLD;
  }

  onVeilConfirm(payload: { remembered: boolean }) {
    this.cwConfirmed = true;
    this.$emit('veil-confirm', payload);
  }
}
</script>

<style lang="scss" scoped>
// Reader surfaces. Pergament and Nacht are fixed palettes (the Hydaelyn and
// Zodiark card values from aetherium/color.scss), so a reader can pick
// "Nacht" in the light app theme and vice versa. Both pairs pass AA.
.story-view--pergament {
  --reader-bg: #FBF6EA;
  --reader-ink: #2B2418;
  --reader-muted: #6E5F46;
  --reader-accent: #8A5A14;
  --reader-rule: rgba(186, 155, 91, 0.28);
  --reader-rule-strong: #9C7A3C;
  --reader-cap: #BA9B5B;
  --reader-lines: rgba(110, 95, 70, 0.08);
  --reader-shadow: 0 1px 2px rgba(43, 36, 24, 0.05), inset 0 0 28px rgba(186, 155, 91, 0.06);
}

.story-view--nacht {
  --reader-bg: #1F1130;
  --reader-ink: #ECE3F7;
  --reader-muted: #B5A6CB;
  --reader-accent: #C19BFF;
  --reader-rule: rgba(107, 79, 168, 0.32);
  --reader-rule-strong: #8F72D6;
  --reader-cap: #B8A5FF;
  --reader-lines: rgba(184, 165, 255, 0.05);
  --reader-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), inset 0 0 28px rgba(107, 79, 168, 0.12);
}

.story-view {
  max-width: 68ch;
  margin: 0 auto;
  font-size: 16px;
}

.story-view__head {
  padding: 4px 0 24px;
}

.story-view__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin: 0 0 10px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 600;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-link);
}

.story-view__draft {
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px dashed var(--rule-strong);
  color: var(--ink-muted);
  letter-spacing: 0.04em;
  text-transform: none;
}

.story-view__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.4vw, 52px);
  line-height: 1.12;
  font-weight: 600;
  letter-spacing: var(--ls-display);
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

.story-view__lede {
  margin: 12px 0 0;
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 1.3rem;
  line-height: 1.45;
  color: var(--ink-muted);
}

.story-view__byline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}

.story-view__avatar {
  flex: none;
  background: var(--rule-tint);
  color: var(--ink-muted);
  box-shadow: 0 0 0 2px var(--vision-card), 0 0 0 3px var(--rule-strong);

  img {
    object-fit: cover;
  }
}

.story-view__byline-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-family: var(--font-ui);
}

.story-view__author {
  font-weight: 600;
  color: var(--ink-link);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

.story-view__byline-meta {
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.story-view__cw {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 18px;
  padding: 10px 14px;
  border: 1px solid var(--vision-cw-border);
  border-radius: 10px;
  background: var(--vision-cw-bg);
  color: var(--vision-cw-text);
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
}

.story-view__cw-label {
  font-weight: 700;
}

.story-view__cw-list {
  flex: 1 1 200px;
}

.story-view__cw-confirmed {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 10px;
  border-radius: 999px;
  border: 1px solid var(--vision-cw-border);
  font-weight: 600;
  font-size: var(--type-scale-0);
}

// ELPIS-501 parchment, recoloured by the chosen reader surface.
.story-view__body.mat-parchment {
  padding: 36px 44px;
  background-color: var(--reader-bg);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(1.75em - 1px),
    var(--reader-lines) calc(1.75em - 1px),
    var(--reader-lines) 1.75em
  );
  color: var(--reader-ink);
  border-color: var(--reader-rule);
  box-shadow: var(--reader-shadow);
  font-size: var(--reader-font-size, 19px);
  transition: font-size var(--motion-fast) var(--ease-elpis);
}

.story-view__content {
  font-family: var(--font-body);
  font-size: 1em;
  line-height: 1.75;
  color: var(--reader-ink);

  :deep(p) {
    margin: 0 0 1em;
  }

  :deep(a) {
    color: var(--reader-accent);
  }

  :deep(h2),
  :deep(h3) {
    font-family: var(--font-display);
    color: var(--reader-ink);
    line-height: 1.3;
    margin: 1.6em 0 0.6em;
  }

  :deep(h2) {
    font-size: 1.45em;
  }

  :deep(h3) {
    font-size: 1.2em;
  }

  :deep(blockquote) {
    margin: 1.4em 0;
    padding: 0.2em 0 0.2em 1.1em;
    border-left: 3px solid var(--reader-cap);
    font-family: var(--font-lore);
    font-style: italic;
    font-size: 1.08em;
    color: var(--reader-muted);
  }

  // Section breaks: an <hr> in the prose becomes a small triskelion seal,
  // matching the TriskelionDivider glyph (mask, so it takes the surface ink).
  :deep(hr) {
    height: 28px;
    margin: 1.8em auto;
    border: 0;
    background-color: var(--reader-cap);
    -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-60 -16 120 32' fill='none' stroke='black' stroke-width='1.25' stroke-linecap='round'><path d='M-58 0H-20M20 0H58' opacity='0.6'/><path d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/><path transform='rotate(120)' d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/><path transform='rotate(240)' d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/></svg>") center / contain no-repeat;
    mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-60 -16 120 32' fill='none' stroke='black' stroke-width='1.25' stroke-linecap='round'><path d='M-58 0H-20M20 0H58' opacity='0.6'/><path d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/><path transform='rotate(120)' d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/><path transform='rotate(240)' d='M0 -3Q-3 -10 -8 -10Q-12 -8 -10 -4'/></svg>") center / contain no-repeat;
    max-width: 240px;
  }
}

// ELPIS-502 — illuminated drop cap on stories >= 200 words.
.story-view__body--drop-cap .story-view__content > :deep(p:first-of-type::first-letter) {
  float: left;
  font-family: var(--font-ornament);
  font-size: 4.4em;
  line-height: 0.9;
  margin: 0.06em 0.12em 0 0;
  padding: 0;
  color: var(--reader-cap);
  letter-spacing: -0.02em;
  font-weight: 500;
}

.story-view--pergament .story-view__body--drop-cap .story-view__content > :deep(p:first-of-type::first-letter) {
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45);
}

.story-view--nacht .story-view__body--drop-cap .story-view__content > :deep(p:first-of-type::first-letter) {
  text-shadow: 0 0 18px rgba(184, 165, 255, 0.32);
}

.story-view__end {
  margin: 28px auto 8px;
}

@media screen and (max-width: 600px) {
  .story-view__body.mat-parchment {
    padding: 22px 18px;
  }

  .story-view__body--drop-cap .story-view__content > :deep(p:first-of-type::first-letter) {
    font-size: 3.2em;
    margin-right: 0.1em;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-view__body.mat-parchment {
    transition: none;
  }
}
</style>
