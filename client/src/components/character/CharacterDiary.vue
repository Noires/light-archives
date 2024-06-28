<template>
  <div class="character-diary">
    <section class="page-edit-character__form-controls">
      <h6>Tagebuch</h6>
        <template v-if="content.stories.length > 0">
          <story-list :stories="content.stories" />
        </template>
    </section>
  </div>
</template>

<script lang="ts">
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import ReportViolationSection from '../common/ReportViolationSection.vue';
import CharacterDetail from './CharacterDetail.vue';
import CharacterDetailsBox from './CharacterDetailsBox.vue';
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import StoryList from '../stories/StoryList.vue';

class Props {
  content = prop<CharacterContentDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  components: {
    CharacterDetail,
    CharacterDetailsBox,
    BannerView,
    HtmlViewer,
    ReportViolationSection,
    StoryList
  },
})
export default class CharacterDiary extends Vue.with(Props) {
  PageType = PageType;


}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.character-profile__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.character-profile__header-title {
  margin: 0;
  line-height: auto;
}

.character-profile__header-names {
  text-align: center;
}

.character-profile__header-subtitle {
  font-family: $header-font;
  font-size: 1.6em;
}

.character-profile__details td {
  padding: 4px 8px;
}

.character-profile__details tr>td:first-child {
  font-weight: bold;
}

.character-profile__appearance-background {
  margin-bottom: 24px;
}

.character-profile__appearance-background_no-header {
  margin-top: 24px;
}

.character-profile__personality-box {
  margin-bottom: 24px;
}

.character-profile__carrd-iframe {
  border: none;
}
</style>
