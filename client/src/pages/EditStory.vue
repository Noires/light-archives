<template>
  <q-page class="page-edit-story">
    <template v-if="loaded">
      <h2>{{ story.id ? 'Geschichte bearbeiten' : 'Neue Geschichte erstellen' }}</h2>
      <q-form @submit="onSubmit">
        <template v-if="!preview">
          <character-selector
            v-if="!story.id"
            v-model="selectedCharacterId"
            :rules="[
              $rules.required('Bitte wähle einen Charakter aus.'),
            ]"
          />
          <q-input
            v-model="story.title"
            label="Titel *"
            :rules="[
              $rules.required('Dieses Feld ist erforderlich.'),
            ]"
          />
          <div class="page-edit-story__select-group">
            <div class="page-edit-story__select-title">Art der Geschichte</div>
            <q-option-group
              v-model="story.type"
              label="type"
              :options="typeOptions"
              class="page-edit-story__options-grid"
            />
          </div>
          <q-input
            :model-value="tags"
            @update:model-value="onTagsChanged"
            label="Schlagworte (mit Komma getrennt)"
          />
          <div class="page-edit-story__select-group">
            <div class="page-edit-story__select-title">Inhaltswarnungen</div>
            <q-option-group
              v-model="story.contentNotes"
              :options="contentNoteOptions"
              type="checkbox"
              color="secondary"
              class="page-edit-story__options-grid"
            />
          </div>
          <h6>Inhalt *</h6>
          <html-editor v-model="story.content" />
        </template>
        <section v-else class="page-edit-story__preview">
          <story-view :story="story" :preview="true" />
        </section>
        <div class="page-edit-story__button-bar">
          <q-btn-toggle
            v-model="preview"
            :options="previewOptions"
            toggle-color="secondary"
          />
          <div class="page-edit-story__revert-submit">
            <q-btn label="Zurücksetzen" color="secondary" @click="revert" />&nbsp;
            <q-btn label="Änderungen speichern" type="submit" color="primary" />
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm"
            >Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Bearbeitung fortsetzen" color="secondary" v-close-popup />
          <q-btn
            flat
            label="Zurücksetzen"
            color="negative"
            v-close-popup
            @click="onConfirmRevert"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { StoryType } from '@app/shared/enums/story-type.enum';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import CharacterSelector from 'components/common/CharacterSelector.vue';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import StoryView from 'components/stories/StoryView.vue';
import { displayOptions } from 'src/boot/display';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

@Options({
  components: {
    CharacterSelector,
    HtmlEditor,
    StoryView,
  },
  beforeRouteEnter(to, _, next) {
    next((vm) => (vm as PageEditStory).load(to.params));
  },
  async beforeRouteUpdate(to) {
    await (this as PageEditStory).load(to.params);
  },
})
export default class PageEditStory extends Vue {
  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  readonly typeOptions = Object.values(StoryType).map((storyType) => ({
    label: displayOptions.storyTypes[storyType],
    value: storyType,
  }));

  story = new StoryDto();
  storyBackup = new StoryDto();
  contentNoteOptions: {label: string, value: string}[];
  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

  selectedCharacterId: number | null = null;

  private async load(params: RouteParams) {
    const contentNotes = await this.$api.contentNotes.getContentNotes();
    this.contentNoteOptions = contentNotes.map((contentNote) => ({
      label: (ContentNoteTexts as {[key:string]: string})[contentNote.name] || contentNote.name,
      value: contentNote.name
    }));

    const id = parseInt(params.id as string, 10);
    const character = this.$store.getters.character;

    if (!character) {
      void this.$router.push('/');
      return;
    }

    if (id) {
      this.loaded = false;
      this.storyBackup = await this.$api.stories.getStory(id);
      this.loaded = true;
    } else {
      this.storyBackup = new StoryDto({
        mine: true,
        createdAt: Date.now(),
        type: StoryType.PUBLISHED_WORK,
        title: '',
        content: '',
        tags: [],
        contentNotes: []
      });
      this.loaded = true;
    }

    // Initialize selected character (default to current active character)
    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.story = new StoryDto(this.storyBackup);
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.story = new StoryDto(this.storyBackup);
  }

  async onSubmit() {
    this.saving = true;
    try {
      if (!this.story.id) {
        if (!this.selectedCharacterId) {
          throw new Error('No character selected');
        }
        this.story.characterId = this.selectedCharacterId;
        const { id } = await this.$api.stories.createStory(this.story);
        this.story.id = id;
        void this.$router.replace(`/edit-story/${id}`);
      } else {
        await this.$api.stories.editStory(this.story);
      }

      this.storyBackup = new StoryDto(this.story);

      notifySuccess('Story saved.', {
        label: 'View',
        color: 'white',
        handler: () => this.viewStory(),
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  viewStory() {
    if (this.story.id) {
      void this.$router.push(`/story/${this.story.id}`);
    }
  }

  get tags() {
    return this.story.tags.join(', ');
  }

  onTagsChanged(newTags: string) {
    this.story.tags = newTags.split(/,\s*/).map((tag) => tag.trim()).filter(tag => tag !== '');
  }
}
</script>

<style lang="scss">
.page-edit-story {
  --edit-story-select-group-border: rgba(221, 180, 118, 0.25);
  --edit-story-select-group-bg: rgba(249, 247, 242, 0.95);
  --edit-story-select-title-color: rgba(35, 35, 35, 0.7);
  --edit-story-option-color: inherit;
}

body.body--dark .page-edit-story {
  --edit-story-select-group-border: rgba(141, 181, 223, 0.3);
  --edit-story-select-group-bg: rgba(17, 25, 37, 0.9);
  --edit-story-select-title-color: rgba(213, 226, 240, 0.76);
  --edit-story-option-color: rgba(213, 226, 240, 0.9);
}

.page-edit-story__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-story__preview {
  margin-bottom: 24px;
}

.page-edit-story__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-story__preview h6 {
  font-family: $header-font;
}

.page-edit-story__select-group {
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid var(--edit-story-select-group-border);
  background: var(--edit-story-select-group-bg);
}

.page-edit-story__select-title {
  margin-bottom: 8px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--edit-story-select-title-color);
}

.page-edit-story__options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 6px;
  color: var(--edit-story-option-color);
}

.page-edit-story__options-grid .q-option-group__option {
  margin: 0;
}

@media screen and (max-width: $breakpoint-sm) {
  .page-edit-story__options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
