<template>
  <div class="character-rumors">
    <section class="page-edit-character__form-controls">
      <h6>Häufige Gerüchte</h6>
        <html-viewer v-model="character.commonrumors" />
        <h6>Seltene Gerüchte</h6>
        <html-viewer v-model="character.rarerumors" />
    </section>
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import ReportViolationSection from '../common/ReportViolationSection.vue';
import CharacterDetail from './CharacterDetail.vue';
import CharacterDetailsBox from './CharacterDetailsBox.vue';

class Props {
  character = prop<CharacterProfileDto>({
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
  },
})
export default class CharacterRumors extends Vue.with(Props) {
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
