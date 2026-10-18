<template>
  <div class="character-rumors">
    <section class="character-rumors__intro">
      <h6>Gerüchte</h6>
      <p>Die hier aufgelisteten Gerüchte können im RP verwendet werden. Die Kategorien geben an, wie hoch die
          Wahrscheinlichkeit ist, dass ein Gerücht in der Öffentlichkeit geteilt wird und man es gehört haben kann. Gerüchte
          der Kategorie "Häufig" kann potentiell jeder gehört haben. Gerüchte der der Kategorie "Selten" sind Gerüchte, die
          man nur unter speziellen Voraussetzungen kennen kann. Diese sollten nur in gemeinsamer Absprache genutzt werden.
        </p>
    </section>
    <section class="character-rumors__section character-rumors__section--open mat-parchment">
      <h6 class="character-rumors__heading">Offene Informationen</h6>
      <html-viewer :content="character.openinformation" />
    </section>
    <section class="character-rumors__section character-rumors__section--common mat-parchment">
      <h6 class="character-rumors__heading">Häufige Gerüchte</h6>
      <html-viewer :content="character.commonrumors" />
    </section>
    <section class="character-rumors__section character-rumors__section--rare mat-parchment">
      <h6 class="character-rumors__heading">Seltene Gerüchte</h6>
      <html-viewer :content="character.rarerumors" />
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

// ELPIS-210 — three Parchment variants for the rumor visibility tiers.
// Rule weight signals "intimacy of knowledge": Offen reads like public
// posting (lightest), Häufig like common gossip (medium), Selten like
// closely-held private knowledge (heaviest, with a doubled inset rule).
.character-rumors__section {
  padding: 22px 26px;
  margin: 18px 0;
}

.character-rumors__section .character-rumors__heading {
  margin-top: 0;
  margin-bottom: 14px;
}

// Offen — public-facing notes. Lightest treatment, default mat-parchment
// border (--rule-gold-soft @ 0.28) is enough.
.character-rumors__section--open {
  // No additional rule-weight overrides — inherits mat-parchment defaults.
}

// Häufig — common rumors. Bumped border to a solid --rule-gold so the
// frame reads more deliberately than the public notes above.
.character-rumors__section--common {
  border-color: var(--rule-gold);
}

body.body--dark .character-rumors__section--common {
  border-color: var(--rule-arcane);
}

// Selten — rare/private knowledge. Heaviest treatment: a 2 px outer rule
// plus an inset hairline reading as a "framed scroll" stamp.
.character-rumors__section--rare {
  border-width: 2px;
  border-color: var(--rule-gold);
  box-shadow:
    0 1px 2px rgba(43, 36, 24, 0.05),
    inset 0 0 0 1px var(--rule-gold-soft),
    inset 0 0 28px rgba(186, 155, 91, 0.10);
}

body.body--dark .character-rumors__section--rare {
  border-color: var(--rule-arcane);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    inset 0 0 0 1px var(--rule-arcane-soft),
    inset 0 0 28px rgba(107, 79, 168, 0.18);
}

@media screen and (max-width: 768px) {
  .character-rumors__section {
    padding: 16px 18px;
  }
}
</style>
