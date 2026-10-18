<template>
  <div class="character-personality">
    <section class="page-edit-character__form-controls">
      <template v-if="showSection(preferenceFields)">
        <h6>Vorlieben und Abneigungen</h6>
        <character-text-field
          v-for="field in preferenceFields"
          :key="field.label"
          :label="field.label"
          :value="field.value"
          :owner="owner"
        />
      </template>
      <template v-if="showSection(traitFields)">
        <h6>Charakteristika</h6>
        <character-text-field
          v-for="field in traitFields"
          :key="field.label"
          :label="field.label"
          :value="field.value"
          :owner="owner"
        />
      </template>
    </section>
    <template v-if="!personalityEmpty || owner">
      <h6>Persönlichkeit</h6>
      <p v-if="personalityEmpty" class="character-personality__empty">{{ emptyLabel }}</p>
      <html-viewer v-else :content="character.personality" />
    </template>
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
import CharacterTextField from './CharacterTextField.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';

type PersonalityField = { label: string; value?: string };

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
    CharacterTextField,
    BannerView,
    HtmlViewer,
    ReportViolationSection,
  },
})
export default class CharacterPersonality extends Vue.with(Props) {
  PageType = PageType;
  readonly emptyLabel = EMPTY_FIELD_LABEL;

  get owner(): boolean {
    return this.preview || !!this.character.mine;
  }

  get preferenceFields(): PersonalityField[] {
    const c = this.character;
    return [
      { label: 'Liebt', value: c.loves },
      { label: 'Hasst', value: c.hates },
      { label: 'Wünsche', value: c.wishes },
      { label: 'Ängste', value: c.fears },
      { label: 'Motto', value: c.slogan },
      { label: 'Motivation', value: c.motivation },
    ];
  }

  get traitFields(): PersonalityField[] {
    const c = this.character;
    return [
      { label: 'Stärken', value: c.strengths },
      { label: 'Schwächen', value: c.weaknesses },
      { label: 'Eigenheiten', value: c.ticks },
    ];
  }

  get personalityEmpty(): boolean {
    return isEmptyFieldValue(this.character.personality);
  }

  showSection(fields: PersonalityField[]): boolean {
    return this.owner || fields.some((field) => !isEmptyFieldValue(field.value));
  }
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

.character-personality__empty {
  color: var(--ink-muted);
  font-style: italic;
}

body.body--dark .character-personality h6 {
  color: var(--ink-luminous);
}

</style>
