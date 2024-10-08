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
    <div>
        <q-btn color="red" glossy label="Inhaltswarnungen" @click="alert = true"/>
        <q-dialog v-model="alert">
        <q-card>
          <q-card-section>
            <div class="text-h6">Inhaltswarnungen</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            Diese Seite enthält Inhalte, die sensibler Natur sind.
            Wir empfehlen, nicht fortzufahren, wenn dir folgende Themen Unwohlsein bereiten:
            <ul>
              <li v-for="item in contentNotes" :key="item">
                {{ item }}
              </li>
            </ul>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="OK" color="primary" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>

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
import { ref } from 'vue';
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
  alert = ref(false);

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
</style>
