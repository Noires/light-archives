<template>
  <div class="character-contacts">
    <!-- ER2 outlook: constellation (renders itself only with at least 2 parsed contacts) -->
    <relationship-constellation :character="character" />
    <!-- /ER2 outlook: constellation -->
    <section>
      <template v-if="showSection(contactFields)">
        <h6 aria-level="2">Kontakte</h6>
        <character-text-field
          v-for="field in contactFields"
          :key="field.label"
          :label="field.label"
          :value="field.value"
          :owner="owner"
        />
      </template>
      <template v-if="showSection(connectionFields)">
        <h6 aria-level="2">Verbindungen</h6>
        <character-text-field
          v-for="field in connectionFields"
          :key="field.label"
          :label="field.label"
          :value="field.value"
          :owner="owner"
        />
      </template>
      <p v-if="!showSection(contactFields) && !showSection(connectionFields)" class="character-contacts__empty">
        Noch keine Kontakte eingetragen.
      </p>
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
import CharacterTextField from './CharacterTextField.vue';
import { isEmptyFieldValue } from './empty-field';
import RelationshipConstellation from '../outlook/RelationshipConstellation.vue'; // ER2 outlook: constellation

type ContactField = { label: string; value?: string };

class Props {
  character = prop<CharacterProfileDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
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
    RelationshipConstellation, // ER2 outlook: constellation
  },
})
export default class CharacterContacts extends Vue.with(Props) {
  PageType = PageType;

  get owner(): boolean {
    return this.preview || !!this.character.mine;
  }

  get contactFields(): ContactField[] {
    const c = this.character;
    return [
      { label: 'Partner', value: c.partners },
      { label: 'Eltern', value: c.parents },
      { label: 'Kinder', value: c.children },
      { label: 'Verwandte', value: c.relatives },
      { label: 'Freunde', value: c.friends },
      { label: 'Bekannte / Kollegen', value: c.acquaintances },
      { label: 'Rivalen / Feinde', value: c.enemies },
      { label: 'Vergangenheit', value: c.past },
    ];
  }

  get connectionFields(): ContactField[] {
    const c = this.character;
    return [
      { label: 'Freie Gesellschaft', value: c.freecompanies },
      { label: 'Treffpunkte', value: c.meetingplaces },
      { label: 'Communities', value: c.communities },
      { label: 'Erwähnt in', value: c.mentioned },
    ];
  }

  showSection(fields: ContactField[]): boolean {
    return this.owner || fields.some((field) => !isEmptyFieldValue(field.value));
  }
}
</script>

<style lang="scss">
// ELPIS-207 — Contacts re-skin (mirrors CharacterPersonality). Section h6 →
// Cinzel via --font-display; readonly inputs lift onto a Vellum surface so
// each named relationship reads as engraved into the page rather than dim.
.character-contacts h6 {
  margin: 18px 0 10px;
  font-family: var(--font-display);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
  color: var(--ink-primary);
}

.character-contacts h6:first-child {
  margin-top: 0;
}

.character-contacts__empty {
  color: var(--ink-muted);
  font-style: italic;
}

body.body--dark .character-contacts h6 {
  color: var(--ink-luminous);
}

</style>
