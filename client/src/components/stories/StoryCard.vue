<template>
  <article class="story-card">
    <div class="story-card__top">
      <span class="story-card__type">{{ typeLabel }}</span>
      <span v-if="minutes" class="story-card__minutes">{{ minutes }} Min.</span>
    </div>
    <h3 class="story-card__title">
      <router-link :to="`/story/${story.id}`" class="story-card__link">{{ story.title }}</router-link>
    </h3>
    <p v-if="story.excerpt" class="story-card__excerpt">{{ story.excerpt }}</p>
    <div v-if="story.seriesTitle || hasWarnings || story.published === false" class="story-card__chips">
      <span v-if="story.seriesTitle" class="story-card__series">
        <q-icon name="collections_bookmark" size="14px" aria-hidden="true" />
        {{ seriesLabel }}
      </span>
      <status-badge v-if="hasWarnings" type="cw" :label="warningLabel" />
      <span v-if="story.published === false" class="story-card__draft">Entwurf</span>
    </div>
    <footer class="story-card__footer">
      <span class="story-card__author">{{ story.author }}</span>
      <span class="story-card__meta">
        <span v-if="reactionTotal > 0" class="story-card__reactions" :aria-label="`${reactionTotal} Reaktionen`">
          <q-icon name="auto_awesome" size="14px" aria-hidden="true" /> {{ reactionTotal }}
        </span>
        <span>{{ $display.relativeTime(story.createdAt) }}</span>
      </span>
    </footer>
  </article>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import StatusBadge from '../vision/StatusBadge.vue';
import { readingMinutes } from './reader-storage';
import type { StoryCardData } from './story-card-data';

// ER2-604 — story directory card. Optional fields (reading time, series,
// content warnings, reactions) render only when the API sends them.

class Props {
  story = prop<StoryCardData>({ required: true });
}

@Options({
  name: 'StoryCard',
  components: {
    StatusBadge,
  },
})
export default class StoryCard extends Vue.with(Props) {
  get typeLabel(): string {
    return this.$display.storyTypes[this.story.type] || 'Geschichte';
  }

  get minutes(): number {
    if (this.story.readingMinutes) {
      return this.story.readingMinutes;
    }

    return this.story.wordCount ? readingMinutes(this.story.wordCount) : 0;
  }

  get hasWarnings(): boolean {
    return !!this.story.contentNotes && this.story.contentNotes.length > 0;
  }

  get warningLabel(): string {
    const count = this.story.contentNotes?.length || 0;
    return count === 1 ? 'Inhaltswarnung' : `${count} Inhaltswarnungen`;
  }

  get seriesLabel(): string {
    const title = this.story.seriesTitle || '';
    const index = this.story.seriesIndex;
    return index ? `${title} · Teil ${index}` : title;
  }

  get reactionTotal(): number {
    if (typeof this.story.reactionCount === 'number') {
      return this.story.reactionCount;
    }

    const counts = this.story.reactionCounts || {};
    return Object.values(counts).reduce((sum: number, value) => sum + (value || 0), 0);
  }
}
</script>

<style lang="scss" scoped>
.story-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 18px 18px 14px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: var(--vision-card);
  color: var(--ink-primary);
  transition:
    border-color var(--motion-fast) var(--ease-elpis),
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(43, 36, 24, 0.1);
  }

  &:focus-within {
    border-color: var(--rule-strong);
  }
}

body.body--dark .story-card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

.story-card__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
}

.story-card__type {
  color: var(--ink-link);
}

.story-card__minutes {
  color: var(--ink-muted);
}

.story-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--ls-display);
}

// The title link covers the whole card; chips and footer are plain text.
.story-card__link {
  color: inherit;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
  }

  &:focus-visible {
    outline: none;

    &::after {
      box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
    }
  }
}

.story-card__excerpt {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--ink-muted);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.story-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.story-card__series,
.story-card__draft {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 600;
  color: var(--ink-primary);
}

.story-card__draft {
  border-style: dashed;
  color: var(--ink-muted);
}

.story-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--rule-soft);
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
}

.story-card__author {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.story-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: none;
  color: var(--ink-muted);
  font-size: var(--type-scale-0);
}

.story-card__reactions {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--ink-link);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .story-card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
