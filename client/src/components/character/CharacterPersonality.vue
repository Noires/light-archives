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
    <html-viewer :content="character.personality" />
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
// ELPIS-207 — Personality re-skin. Section h6 → Cinzel via --font-display;
// readonly inputs lift onto a Vellum surface so the data reads as inscribed
// rather than fading into the page chrome.
.character-personality h6 {
  margin: 18px 0 10px;
  font-family: var(--font-display);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
  color: var(--surface-ink);
}

.character-personality h6:first-child {
  margin-top: 0;
}

.character-personality .q-field--readonly .q-field__control,
.character-personality .q-field--readonly .q-field__control::before {
  background-color: var(--surface-vellum);
}

.character-personality .q-field--readonly .q-field__control::before {
  border: 1px solid var(--rule-gold-soft);
}

.character-personality .q-field--readonly:hover .q-field__control::before {
  border-color: var(--rule-gold);
}

body.body--dark .character-personality h6 {
  color: var(--ink-luminous);
}

body.body--dark .character-personality .q-field--readonly .q-field__control,
body.body--dark .character-personality .q-field--readonly .q-field__control::before {
  background-color: var(--surface-lift);
}

body.body--dark .character-personality .q-field--readonly .q-field__control::before {
  border-color: var(--rule-arcane-soft);
}

body.body--dark .character-personality .q-field--readonly:hover .q-field__control::before {
  border-color: var(--rule-arcane);
}
</style>
