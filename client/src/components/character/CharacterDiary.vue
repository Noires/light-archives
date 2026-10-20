<template>
  <div class="character-diary">
    <section>
      <h6 aria-level="2">Tagebuch</h6>
      <div class="character-diary__list" v-if="content.stories.length > 0">
        <div v-for="story in content.stories" :key="story.id" class="character-diary__card mat-parchment">
          <router-link :to="getLink(story)" class="character-diary__card-link">
            <div class="character-diary__card-top">
              <span class="character-diary__card-type">
                {{ $display.storyTypes[story.type] }}
              </span>
              <div class="character-diary__card-meta">
                <span class="character-diary__card-author">{{ story.author }}</span>
                <span class="character-diary__card-time">{{ $display.relativeTime(story.createdAt) }}</span>
              </div>
            </div>
            <h3 class="character-diary__card-title">{{ story.title }}</h3>
            <p v-if="story.excerpt" class="character-diary__card-excerpt">{{ story.excerpt }}</p>
            <span class="character-diary__card-action">Lesen</span>
          </router-link>
        </div>
      </div>
      <p v-else class="character-diary__empty">
        Noch keine Tagebucheinträge vorhanden.
      </p>
      <section>
        <br>
        <q-btn v-if="character.mine" to="/create-story" outline color="secondary" style="max-width: 140px">
          <i class="material-icons q-icon">edit</i>Geschichte erstellen
        </q-btn>
      </section>
    </section>
  </div>
</template>

<script lang="ts">
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';

class Props {
  content = prop<CharacterContentDto>({
    required: true,
  });
  character = prop<CharacterProfileDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });
}

@Options({
  name: 'CharacterDiary',
})
export default class CharacterDiary extends Vue.with(Props) {
  PageType = PageType;

  getLink(story: StorySummaryDto) {
    return `/story/${story.id}`;
  }
}
</script>

<style lang="scss">
// ELPIS-208 — Diary cards re-skinned to Parchment. The legacy --diary-card-*
// ad-hoc tokens are gone; surface, ink, and rule colour come from the
// material + Aetherium tokens. Hover lift / shadow / border colour all ride
// on motion-fast + ease-elpis so the global reduced-motion guard handles the
// fallback (no per-component @media block).
.character-diary h6 {
  margin-bottom: 16px;
}

.character-diary__list {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.character-diary__card {
  overflow: hidden;
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
}

.character-diary__card-link {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  min-height: 160px;
  color: inherit;
  text-decoration: none;
}

.character-diary__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

// Type badge re-skinned: Hydaelyn = soft gold tint with deep gold ink;
// Zodiark = soft arcane tint with luminous ink. Letter-spacing kept.
.character-diary__card-type {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 2px;
  background: var(--rule-gold-soft);
  color: var(--rule-gold);
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

body.body--dark .character-diary__card-type {
  background: var(--rule-arcane-soft);
  color: var(--ink-luminous);
}

// Title in Cinzel (--font-display), excerpt in IM Fell English italic
// (--font-lore — falls back to Spectral → serif until ELPIS-001 lands).
.character-diary__card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  line-height: 1.3;
  color: var(--ink-primary);
}

body.body--dark .character-diary__card-title {
  color: var(--ink-luminous);
}

.character-diary__card-meta {
  display: grid;
  justify-items: end;
  text-align: right;
  gap: 2px;
  color: var(--ink-muted);
  font-family: var(--font-ui);
  font-size: 0.8rem;
}

body.body--dark .character-diary__card-meta {
  // No --ink-muted on Zodiark (per AETHERIUM.md table — use ink-luminous at
  // lower opacity instead).
  color: rgba(217, 225, 234, 0.72);
}

.character-diary__card-excerpt {
  margin: 0;
  font-family: var(--font-lore);
  font-style: italic;
  color: var(--ink-primary);
  font-size: 0.92rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.85;
}

body.body--dark .character-diary__card-excerpt {
  color: var(--ink-luminous);
  opacity: 0.85;
}

.character-diary__card-action {
  margin-top: auto;
  font-family: var(--font-ui);
  font-weight: 600;
  color: var(--rule-gold);
  letter-spacing: 0.01em;
}

body.body--dark .character-diary__card-action {
  color: var(--glow-aether-d);
}

.character-diary__card:hover {
  transform: translateY(-4px);
  // Lift: stronger shadow + brighter rule. Stays composed with mat-parchment's
  // base box-shadow because the hover replaces (not adds) the outer shadow.
  box-shadow:
    0 12px 28px rgba(43, 36, 24, 0.14),
    inset 0 0 28px rgba(186, 155, 91, 0.06);
  border-color: var(--rule-gold);
}

body.body--dark .character-diary__card:hover {
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.5),
    inset 0 0 28px rgba(141, 181, 223, 0.16);
  border-color: var(--rule-arcane);
}

.character-diary__card-link:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--glow-aether);
  border-radius: 4px;
}

body.body--dark .character-diary__card-link:focus-visible {
  box-shadow: inset 0 0 0 2px var(--glow-aether-d);
}

.character-diary__empty {
  color: var(--ink-muted);
  padding: 16px 0;
}

body.body--dark .character-diary__empty {
  color: rgba(217, 225, 234, 0.72);
}
</style>
