<template>
  <template v-if="content">
    <h2>Tagebuch</h2>
    <template v-if="content.stories && content.stories.length > 0">
      <story-list :stories="content.stories" />
    </template>
    <br>
    <section>
      <q-btn to="/create-story" outline color="secondary" style="max-width: 140px"><i
          class="material-icons q-icon">edit</i>Geschichte erstellen</q-btn>
    </section>
  </template>
</template>

<script lang="ts">
import CharacterProfile from 'components/character/CharacterProfile.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CarrdEditSection from 'src/components/common/CarrdEditSection.vue';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import HtmlEditor from '../components/common/HtmlEditor.vue';
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import StoryList from 'src/components/stories/StoryList.vue';
import { StoryType } from '@app/shared/enums/story-type.enum';
import errors from '@app/shared/errors';

const $api = useApi();

async function load(params: RouteParams): Promise<CharacterContentDto> {
  const id = parseInt(params.id as string, 10);

  try {
    return await $api.characters.getCharacterContent(id);
  } catch (e) {
    if (errors.getStatusCode(e) === 404) {
      return { stories: [], images: [] };
    } else {
      notifyError(e);
      throw e;
    }
  }
}

@Options({
  components: {
    HtmlEditor,
    CharacterProfile,
    BannerEditSection,
    CarrdEditSection,
    StoryList
  },
  async beforeRouteEnter(to, _, next) {
    const content = await load(to.params);
    next((vm) => (vm as PageEditProfile).setContent(content));
  },
  emits: ['updateCharacter']
})
export default class PageEditProfile extends Vue {
  content: CharacterContentDto = { stories: [], images: [] };

  setContent(content: CharacterContentDto) {
    this.content = content;
    this.content.stories = content.stories.filter(x => x.type === StoryType.DIARY);
  }
}
</script>

<style lang="scss">
.page-edit-character__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-character__lodestone-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-edit-character__checkbox .q-field__bottom {
  padding-top: 0;
}

.page-edit-character__preview {
  margin-bottom: 24px;
}

.page-edit-character__age,
.page-edit-character__pronouns {
  width: 200px;
}

.page-edit-character__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-character__preview h6 {
  font-family: $header-font;
}
</style>
