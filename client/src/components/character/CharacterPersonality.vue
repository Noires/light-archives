<template>
  <div class="character-personality">
    <section class="page-edit-character__form-controls">
      <h6>Vorlieben und Abneigungen</h6>
            <q-input readonly v-model="character.loves" label="Liebt" />
            <q-input readonly v-model="character.hates" label="Hass" />
            <q-input readonly v-model="character.wishes" label="Wünsche" />
            <q-input readonly v-model="character.fears" label="Ängste" />
            <q-input readonly v-model="character.slogan" label="Motto" />
            <q-input readonly v-model="character.motivation" label="Motivation" />
            <h6>Charakteristika</h6>
            <q-input readonly v-model="character.strengths" label="Stärken" />
            <q-input readonly v-model="character.weaknesses" label="Schwächen" />
            <q-input readonly v-model="character.ticks" label="Eigenheiten" />
    </section>
    <h6>Persönlichkeit</h6>
    <html-viewer v-model="character.personality" />
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
export default class CharacterPersonality extends Vue.with(Props) {
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
