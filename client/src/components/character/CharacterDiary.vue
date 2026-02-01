<template>
  <div class="character-diary">
    <section>
      <h6>Tagebuch</h6>
      <div class="character-diary__list" v-if="content.stories.length > 0">
        <div v-for="story in content.stories" :key="story.id" class="character-diary__card">
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

  preview = prop<boolean>({
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
.character-diary {
  h6 {
    margin-bottom: 16px;
  }
}

.character-diary__list {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.character-diary__card {
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
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

.character-diary__card-type {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 0;
  background: rgba(221, 180, 118, 0.2);
  color: #6b4c21;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.character-diary__card-title {
  margin: 0;
  font-family: $header-font;
  font-size: 1.05rem;
  line-height: 1.3;
  color: #1f2c38;
}

.character-diary__card-meta {
  display: grid;
  justify-items: end;
  text-align: right;
  gap: 2px;
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.8rem;
}

.character-diary__card-excerpt {
  margin: 0;
  color: rgba(35, 35, 35, 0.72);
  font-size: 0.92rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.character-diary__card-action {
  margin-top: auto;
  font-weight: 600;
  color: #1f4d64;
  letter-spacing: 0.01em;
}

.character-diary__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.5);
}

.character-diary__card-link:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(31, 77, 100, 0.3);
  border-radius: 0;
}

.character-diary__empty {
  color: rgba(35, 35, 35, 0.7);
  padding: 16px 0;
}

@media (prefers-reduced-motion: reduce) {
  .character-diary__card {
    transition: none;
  }

  .character-diary__card:hover {
    transform: none;
  }
}
</style>
