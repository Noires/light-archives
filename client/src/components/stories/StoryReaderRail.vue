<template>
  <aside class="reader-rail" aria-label="Leseeinstellungen und Kapitel">
    <nav v-if="hasSeries" class="reader-rail__block reader-rail__series" aria-labelledby="reader-rail-series">
      <h2 id="reader-rail-series" class="reader-rail__label">Reihe</h2>
      <p class="reader-rail__series-title">{{ series.seriesTitle }}</p>
      <ol class="reader-rail__parts">
        <li
          v-for="(part, index) in series.parts"
          :key="part.id"
          class="reader-rail__part"
          :class="{ 'reader-rail__part--current': part.id === currentId, 'reader-rail__part--read': isRead(part.id) }"
        >
          <router-link
            :to="`/story/${part.id}`"
            class="reader-rail__part-link"
            :aria-current="part.id === currentId ? 'page' : undefined"
          >
            <span class="reader-rail__part-index">Teil {{ index + 1 }}</span>
            <span class="reader-rail__part-title">{{ part.title }}</span>
            <span v-if="part.id === currentId" class="reader-rail__part-state">du bist hier · {{ percentLabel }}</span>
            <span v-else-if="isRead(part.id)" class="reader-rail__part-state">
              <q-icon name="check" size="12px" aria-hidden="true" /> gelesen
            </span>
          </router-link>
        </li>
      </ol>
      <!-- ER2 social: series follow -->
      <follow-button
        v-if="seriesFollowKey"
        class="reader-rail__follow"
        target-type="story-series"
        :target-key="seriesFollowKey"
        label="Benachrichtigen"
        active-label="Wirst benachrichtigt"
        icon="notifications_none"
        active-icon="notifications_active"
      />
      <!-- /ER2 social: series follow -->
    </nav>
    <!-- ER2 social: series follow (series with one part so far) -->
    <section
      v-else-if="seriesFollowKey"
      class="reader-rail__block reader-rail__series"
      aria-labelledby="reader-rail-series-follow"
    >
      <h2 id="reader-rail-series-follow" class="reader-rail__label">Reihe</h2>
      <p class="reader-rail__series-title">{{ series && series.seriesTitle }}</p>
      <follow-button
        class="reader-rail__follow"
        target-type="story-series"
        :target-key="seriesFollowKey"
        label="Benachrichtigen"
        active-label="Wirst benachrichtigt"
        icon="notifications_none"
        active-icon="notifications_active"
      />
    </section>
    <!-- /ER2 social: series follow -->

    <section class="reader-rail__block" aria-labelledby="reader-rail-read">
      <h2 id="reader-rail-read" class="reader-rail__label">Lesen</h2>

      <div class="reader-rail__group" role="group" aria-label="Schriftgröße">
        <!-- Names start with the visible glyphs (WCAG 2.5.3, voice control). -->
        <button
          type="button"
          class="reader-rail__size reader-rail__size--down"
          :disabled="sizeIndex <= 0"
          aria-label="A−, Schrift kleiner"
          @click="stepSize(-1)"
        >A−</button>
        <button
          type="button"
          class="reader-rail__size"
          :aria-pressed="fontSize === defaultSize ? 'true' : 'false'"
          aria-label="A, Standardgröße"
          @click="setSize(defaultSize)"
        >A</button>
        <button
          type="button"
          class="reader-rail__size reader-rail__size--up"
          :disabled="sizeIndex >= sizes.length - 1"
          aria-label="A+, Schrift größer"
          @click="stepSize(1)"
        >A+</button>
      </div>

      <div class="reader-rail__group reader-rail__surface" role="radiogroup" aria-label="Lesefläche">
        <button
          v-for="option in surfaceOptions"
          :key="option.value"
          type="button"
          role="radio"
          class="reader-rail__surface-btn"
          :class="{ 'reader-rail__surface-btn--active': effectiveSurface === option.value }"
          :aria-checked="effectiveSurface === option.value ? 'true' : 'false'"
          @click="$emit('update:surface', option.value)"
        >
          <q-icon :name="option.icon" size="16px" aria-hidden="true" />
          {{ option.label }}
        </button>
      </div>
    </section>
  </aside>
</template>

<script lang="ts">
import type { StorySeriesDto } from '@app/shared/dto/stories/story-series.dto';
import { Options, prop, Vue } from 'vue-class-component';
import FollowButton from '../social/FollowButton.vue'; // ER2 social: series follow
import { getReadingProgress, READER_DEFAULT_FONT_SIZE, READER_FONT_SIZES, ReaderSurface } from './reader-storage';

// ER2-601 / ER2-603 — left reader rail: series parts (when the API provides
// a series, ER2-808) and the "Lesen" controls (font size, Pergament/Nacht).
// The page persists both settings; this component only emits.

class Props {
  series = prop<StorySeriesDto | null>({ default: null });
  currentId = prop<number>({ default: 0 });
  /** Reading position in the current part, 0..1 */
  progress = prop<number>({ default: 0 });
  fontSize = prop<number>({ default: READER_DEFAULT_FONT_SIZE });
  surface = prop<ReaderSurface | null>({ default: null });
  /** ER2 social: author character id for the series follow key; 0 hides "Benachrichtigen". */
  authorCharacterId = prop<number>({ default: 0 });
}

@Options({
  name: 'StoryReaderRail',
  components: { FollowButton }, // ER2 social: series follow
  emits: [ 'update:fontSize', 'update:surface' ],
})
export default class StoryReaderRail extends Vue.with(Props) {
  readonly sizes = READER_FONT_SIZES;
  readonly defaultSize = READER_DEFAULT_FONT_SIZE;
  readonly surfaceOptions = [
    { value: 'pergament' as ReaderSurface, label: 'Pergament', icon: 'light_mode' },
    { value: 'nacht' as ReaderSurface, label: 'Nacht', icon: 'dark_mode' },
  ];

  get hasSeries(): boolean {
    return !!this.series && !!this.series.seriesTitle && this.series.parts.length > 1;
  }

  // ER2 social: series follow key `${authorCharacterId}:${seriesTitle}`
  get seriesFollowKey(): string {
    const title = this.series?.seriesTitle;
    return title && this.authorCharacterId ? `${this.authorCharacterId}:${title}` : '';
  }

  get effectiveSurface(): ReaderSurface {
    return this.surface || (this.$q.dark.isActive ? 'nacht' : 'pergament');
  }

  get sizeIndex(): number {
    const index = this.sizes.indexOf(this.fontSize);
    return index === -1 ? this.sizes.indexOf(this.defaultSize) : index;
  }

  get percentLabel(): string {
    return `${Math.round(this.progress * 100)} %`;
  }

  isRead(id: number): boolean {
    if (id === this.currentId) {
      return false;
    }

    const entry = getReadingProgress(id);
    return !!entry && entry.max >= 0.9;
  }

  stepSize(delta: number) {
    const next = this.sizes[Math.min(this.sizes.length - 1, Math.max(0, this.sizeIndex + delta))];
    this.setSize(next);
  }

  setSize(size: number) {
    this.$emit('update:fontSize', size);
  }
}
</script>

<style lang="scss" scoped>
.reader-rail {
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
}

.reader-rail__label {
  text-align: left;
  margin: 0 0 10px;
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

// ER2 social: series follow
.reader-rail__follow {
  margin-top: 12px;
}

.reader-rail__series-title {
  margin: -4px 0 10px;
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 1.05rem;
  color: var(--ink-primary);
}

.reader-rail__parts {
  margin: 0;
  padding: 0;
  list-style: none;
  border-left: 1px solid var(--rule-soft);
}

.reader-rail__part-link {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 0 8px 14px;
  color: inherit;
  text-decoration: none;
  border-radius: 0 6px 6px 0;

  &:hover {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--vision-focus-edge);
  }
}

.reader-rail__part--current .reader-rail__part-link::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 2px;
  background: var(--vision-primary);
}

.reader-rail__part-index {
  font-size: var(--type-scale-0);
  font-weight: 600;
  color: var(--ink-muted);
}

.reader-rail__part-title {
  font-size: var(--type-scale-1);
  line-height: 1.35;
}

.reader-rail__part--current .reader-rail__part-title {
  font-weight: 600;
}

.reader-rail__part-state {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--type-scale-0);
  color: var(--ink-link);
}

.reader-rail__part--read .reader-rail__part-state {
  color: var(--vision-live);
}

.reader-rail__group {
  display: flex;
  gap: 4px;
  padding: 3px;
  margin-bottom: 10px;
  border: 1px solid var(--rule-soft);
  border-radius: 10px;
  background: var(--vision-card);
}

.reader-rail__size,
.reader-rail__surface-btn {
  flex: 1 1 0;
  min-height: 34px;
  padding: 0 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--ink-primary);
  font: 600 var(--type-scale-1) / 1 var(--font-ui);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover:not(:disabled) {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }

  &:disabled {
    opacity: 0.42;
    cursor: default;
  }
}

.reader-rail__size--down {
  font-size: 0.8rem;
}

.reader-rail__size--up {
  font-size: 1.05rem;
}

.reader-rail__size[aria-pressed='true'] {
  background: var(--rule-tint);
}

.reader-rail__surface-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.reader-rail__surface-btn--active,
.reader-rail__surface-btn--active:hover:not(:disabled) {
  background: var(--vision-primary);
  color: var(--vision-on-primary);
}

@media (prefers-reduced-motion: reduce) {
  .reader-rail__size,
  .reader-rail__surface-btn {
    transition: none;
  }
}
</style>
