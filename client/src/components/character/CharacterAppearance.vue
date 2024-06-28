<template>
  <div class="character-appearance">
    <section class="page-edit-character__form-controls">
      <h6>Allgemeines</h6>
      <q-input readonly v-model="character.haircolor" label="Haarfarbe" />
      <q-input readonly v-model="character.eyecolor" label="Augenfarbe" />
      <q-input readonly v-model="character.skintone" label="Hautfarbe" />
      <q-input readonly v-model="character.build" label="Statur / Körperbau" />
      <q-input readonly v-model="character.height" label="Größe" />
      <q-input readonly v-model="character.weight" label="Gewicht" />
      <q-input readonly v-model="character.apparentage" label="Optisches Alter" />
      <q-input readonly v-model="character.voice" label="Stimme" />
      <q-input readonly v-model="character.tattoosandscars" label="Tattoos & Narben" />
      <q-input readonly v-model="character.specialfeatures" label="Besonderheiten" />
    </section>
    <h6>Erscheinungsbild</h6>
    <html-viewer v-model="character.appearance" />
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
export default class CharacterAppearance extends Vue.with(Props) {
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
