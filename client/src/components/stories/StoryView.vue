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
      <div class="story-view__warnings-title">Inhaltswarnungen</div>
      <div class="story-view__warnings-chips">
        <q-chip
          v-for="item in contentNotes"
          :key="item"
          dense
          class="story-view__warning-chip"
        >
          {{ item }}
        </q-chip>
      </div>
    </div>

    <hr />
    <html-viewer
      class="story-view__content"
      :content="story.content"
    />
  </div>
</template>

<script lang="ts">
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { Options, prop, Vue } from 'vue-class-component';
import HtmlViewer from '../common/HtmlViewer.vue';

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
    const server = this.story.authorServer;
    const character = this.story.author.replace(/ /g, '_');
    return `/${server}/${character}`;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.story-view__subtitle {
  color: $grey-8;
}

.story-view__posted-by {
  flex-grow: 1;
  padding-right: 16px;
}

.story-view__type {
  flex-grow: 0;
  white-space: nowrap;
}

.story-view__warnings {
  margin: 12px 0 16px;
}

.story-view__warnings-title {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: rgba(35, 35, 35, 0.6);
  font-weight: 600;
  margin-bottom: 6px;
}

.story-view__warnings-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.story-view__warning-chip {
  background: rgba(221, 180, 118, 0.22);
  color: #6b4c21;
  font-weight: 600;
}
</style>
