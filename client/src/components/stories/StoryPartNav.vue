<template>
  <nav v-if="previous || next" class="story-part-nav" aria-label="Teile der Reihe">
    <router-link v-if="previous" :to="`/story/${previous.id}`" class="story-part-nav__card story-part-nav__card--prev" rel="prev">
      <span class="story-part-nav__dir">
        <q-icon name="arrow_back" size="16px" aria-hidden="true" /> Vorheriger Teil
      </span>
      <span class="story-part-nav__title">{{ previous.title }}</span>
    </router-link>
    <span v-else class="story-part-nav__spacer" aria-hidden="true"></span>
    <router-link v-if="next" :to="`/story/${next.id}`" class="story-part-nav__card story-part-nav__card--next" rel="next">
      <span class="story-part-nav__dir">
        Nächster Teil <q-icon name="arrow_forward" size="16px" aria-hidden="true" />
      </span>
      <span class="story-part-nav__title">{{ next.title }}</span>
    </router-link>
  </nav>
</template>

<script lang="ts">
import type { StorySeriesDto, StorySeriesPartDto } from '@app/shared/dto/stories/story-series.dto';
import { Options, prop, Vue } from 'vue-class-component';

// ER2-603 — previous/next part cards below the article. Rendered only when
// the series endpoint (ER2-808) returned neighbours. "Benachrichtigen" is
// left out until there is a follow concept.

class Props {
  series = prop<StorySeriesDto | null>({ default: null });
  currentId = prop<number>({ default: 0 });
}

@Options({
  name: 'StoryPartNav',
})
export default class StoryPartNav extends Vue.with(Props) {
  get index(): number {
    return this.series ? this.series.parts.findIndex((part) => part.id === this.currentId) : -1;
  }

  get previous(): StorySeriesPartDto | null {
    return this.series && this.index > 0 ? this.series.parts[this.index - 1] : null;
  }

  get next(): StorySeriesPartDto | null {
    return this.series && this.index !== -1 && this.index < this.series.parts.length - 1
      ? this.series.parts[this.index + 1]
      : null;
  }
}
</script>

<style lang="scss" scoped>
.story-part-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-width: 68ch;
  margin: 32px auto 0;
  font-family: var(--font-ui);
}

.story-part-nav__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  color: var(--ink-primary);
  text-decoration: none;
  transition:
    border-color var(--motion-fast) var(--ease-elpis),
    transform var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.story-part-nav__card--next {
  text-align: right;
  align-items: flex-end;
}

.story-part-nav__dir {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-link);
}

.story-part-nav__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--type-scale-2);
  line-height: 1.3;
}

@media screen and (max-width: 599px) {
  .story-part-nav {
    grid-template-columns: 1fr;
  }

  .story-part-nav__spacer {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-part-nav__card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
