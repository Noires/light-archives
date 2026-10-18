<template>
  <div class="character-contacts">
    <section >
      <h6>Kontakte</h6>
            <q-input autogrow readonly v-model="character.partners" label="Partner" />
            <q-input autogrow readonly v-model="character.parents" label="Eltern" />
            <q-input autogrow readonly v-model="character.children" label="Kinder" />
            <q-input autogrow readonly v-model="character.relatives" label="Verwandte" />
            <q-input autogrow readonly v-model="character.friends" label="Freunde" />
            <q-input autogrow readonly v-model="character.acquaintances" label="Bekannte / Kollegen" />
            <q-input autogrow readonly v-model="character.enemies" label="Rivalen / Feinde" />
            <q-input autogrow readonly v-model="character.past" label="Vergangenheit" />
            <h6>Verbindungen</h6>
            <q-input autogrow readonly v-model="character.freecompanies" label="Freie Gesellschaft" />
            <q-input autogrow readonly v-model="character.meetingplaces" label="Treffpunkte" />
            <q-input autogrow readonly v-model="character.communities" label="Communities" />
            <q-input autogrow readonly v-model="character.mentioned" label="Erwähnt in (Anschlagebrett, Geschichten, ...)" />
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
export default class CharacterContacts extends Vue.with(Props) {
  PageType = PageType;


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
  color: var(--surface-ink);
}

.character-contacts h6:first-child {
  margin-top: 0;
}

.character-contacts .q-field--readonly .q-field__control,
.character-contacts .q-field--readonly .q-field__control::before {
  background-color: var(--surface-vellum);
}

.character-contacts .q-field--readonly .q-field__control::before {
  border: 1px solid var(--rule-gold-soft);
}

.character-contacts .q-field--readonly:hover .q-field__control::before {
  border-color: var(--rule-gold);
}

body.body--dark .character-contacts h6 {
  color: var(--ink-luminous);
}

body.body--dark .character-contacts .q-field--readonly .q-field__control,
body.body--dark .character-contacts .q-field--readonly .q-field__control::before {
  background-color: var(--surface-lift);
}

body.body--dark .character-contacts .q-field--readonly .q-field__control::before {
  border-color: var(--rule-arcane-soft);
}

body.body--dark .character-contacts .q-field--readonly:hover .q-field__control::before {
  border-color: var(--rule-arcane);
}
</style>
