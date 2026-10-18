<template>
  <div class="character-profile">
    <banner-view :banner="character.banner" />
    <header class="character-profile__header">
      <div class="layout__filler">
        <aetheryte-badge size="lg" shape="square" :src="character.avatar" :alt="character.name" />
      </div>
      <div class="character-profile__header-names">
        <div v-if="character.title" class="character-profile__header-subtitle character-profile__header-title-text">{{ character.title }}</div>
        <h2 class="character-profile__header-title">{{ character.name }}</h2>
        <div v-if="character.nickname" class="character-profile__header-subtitle character-profile__header-nickname">«{{ character.nickname }}»</div>
      </div>
      <div class="layout__filler"></div>
    </header>
    <character-details-box>
      <character-detail label="Welt" :value="character.server" v-if="character.server" />
      <character-detail label="Volk" :value="$display.races[character.race]" v-if="character.race" />
      <character-detail label="Untervolk" :value="$display.tribes[character.tribe]" v-if="character.tribe" />
      <character-detail label="Familie" :value="detailValue(character.family)" v-if="showDetail(character.family)" /> 
      <character-detail label="Schutzgottheit" :value="detailValue(character.deity)" v-if="showDetail(character.deity)" /> 
      <character-detail label="Profession" :value="detailValue(character.profession)" v-if="showDetail(character.profession)" />   
      <character-detail label="Alter" :value="detailValue(character.age)" v-if="showDetail(character.age)" />
      <character-detail label="Namenstag" :value="detailValue(character.birthday)" v-if="showDetail(character.birthday)" /> 
      <character-detail label="Geschlecht" :value="detailValue(character.pronouns)" v-if="showDetail(character.pronouns)" />
      <character-detail label="Geburtsort" :value="detailValue(character.birthplace)" v-if="showDetail(character.birthplace)" />
      <character-detail label="Wohnort" :value="detailValue(character.residence)" v-if="showDetail(character.residence)" />
      <character-detail label="Beziehungsstatus" :value="detailValue(character.relationsshipstatus)" v-if="showDetail(character.relationsshipstatus)" />
      <character-detail label="Freie&nbsp;Gesellschaft" :value="character.freeCompany.name" :router-link="fcLink" v-if="character.freeCompany" />
    </character-details-box>
    <template v-if="character.background">
      <triskelion-divider class="character-profile__divider" />
      <section class="character-profile__background mat-parchment">
        <html-viewer class="character-profile__appearance-background" :content="character.background" />
      </section>
    </template>
    <template v-if="!character.appearance && (character.combinedDescription || !character.background)">
      &nbsp;
    </template>
    <iframe
      v-if="character.carrdProfile"
      v-iframe-resize
      :src="carrdLink"
      width="100%"
      height="500px"
      class="character-profile__carrd-iframe"
    >
    </iframe>
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import ReportViolationSection from '../common/ReportViolationSection.vue';
import AetheryteBadge from '../aetherium/AetheryteBadge.vue';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import CharacterDetail from './CharacterDetail.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';
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
    AetheryteBadge,
    CharacterDetail,
    CharacterDetailsBox,
    BannerView,
    HtmlViewer,
    ReportViolationSection,
    TriskelionDivider,
  },
})
export default class CharacterProfile extends Vue.with(Props) {
  PageType = PageType;

  // ER2-112 — free-text details: blank ones stay hidden as before; placeholders
  // such as "(FOLGT)" are hidden for visitors and read "Noch leer" for the owner.
  showDetail(value?: string): boolean {
    if (!value || !value.trim()) {
      return false;
    }
    return this.isOwner || !isEmptyFieldValue(value);
  }

  detailValue(value: string): string {
    return isEmptyFieldValue(value) ? EMPTY_FIELD_LABEL : value;
  }

  get isOwner(): boolean {
    return this.preview || !!this.character.mine;
  }

  get fcLink() {
    const fc = this.character.freeCompany;
		return fc == null ? null : `/fc/${fc.server}/${fc.name.replace(/ /g, '_')}`;
  }

  hasDrawer(): boolean {
		return !!this.character.showAppearance || !!this.character.showPersonality || !!this.character.showContacts || !!this.character.showRumors || !!this.character.showDiary || !!this.character.showGallery;
	}

  get hasPersonalityBox(): boolean {
    return !!(this.character.loves || this.character.hates || this.character.slogan || this.character.motivation);
  }

  get carrdLink(): string {
    if (this.preview) {
      return `${this.$api.prefix}carrd/character/preview/${this.character.carrdProfile}`;
    }

    return `${this.$api.prefix}carrd/character/${this.character.id}`;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.character-profile {
  min-width: 0;
}

.character-profile__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

// ELPIS-204 — character header typography pass.
// h2 name → Cinzel display @ scale-7 (49 px); the chronicled-title chrome above
// it → Spectral italic (font-section / lore-adjacent serif); the nickname below
// it → IM Fell English italic (font-lore) so the «» reads as an inscribed alias.
// h2 picks up Cinzel Eorzea + scale-5 (31 px) globally — locally bumped to
// scale-7 here only because the character page treats the name as the hero.
.character-profile__header-title {
  margin: 0;
  line-height: var(--lh-display);
  font-family: 'Cinzel Eorzea', var(--font-display);
  font-size: var(--type-scale-7);
  letter-spacing: var(--ls-display);
}

.character-profile__header-names {
  text-align: center;
}

.character-profile__header-subtitle {
  font-size: var(--type-scale-3);
  line-height: var(--lh-heading);
  color: var(--ink-muted);
}

.character-profile__header-title-text {
  font-family: var(--font-section);
  font-style: italic;
  font-weight: 500;
  margin-bottom: 4px;
}

.character-profile__header-nickname {
  font-family: var(--font-lore);
  font-style: italic;
  font-weight: 400;
  margin-top: 6px;
  letter-spacing: 0.01em;
}

body.body--dark .character-profile__header-subtitle {
  color: rgba(236, 227, 247, 0.74); // --ink-luminous channel @ 74%
}

.character-profile__details td {
  padding: 4px 8px;
}

.character-profile__details tr > td:first-child {
  font-weight: bold;
}

.character-profile__appearance-background {
  margin-bottom: 24px;
}

.character-profile__appearance-background_no-header {
  margin-top: 24px;
}

// ELPIS-203 — background prose lives on a Parchment surface, separated from
// the details box above by a Triskelion ornament. Inner padding gives the
// ruled-line backdrop room to breathe under typical body line-heights.
.character-profile__divider {
  margin: 28px auto 20px;
}

.character-profile__background {
  padding: 24px 28px;
  margin-bottom: 24px;
}

.character-profile__background .character-profile__appearance-background {
  margin-bottom: 0;
}

.character-profile__personality-box {
  margin-bottom: 24px;
}

.character-profile__carrd-iframe {
  border: none;
  height: 500px;
}

@media screen and (max-width: 768px) {
  .character-profile__header {
    flex-direction: column;
    gap: 10px;
  }

  .character-profile__header > .layout__filler {
    flex: 0 0 auto;
  }

  .character-profile__header > .layout__filler:last-child {
    display: none;
  }

  .character-profile__header-title {
    line-height: 1.15;
    text-align: center;
    overflow-wrap: anywhere;
    font-size: var(--type-scale-5); // 31 px on mobile — keep the hero readable
  }

  .character-profile__header-names {
    width: 100%;
  }

  .character-profile__header-subtitle {
    font-size: var(--type-scale-2);
    line-height: 1.3;
  }

  .character-profile__appearance-background {
    margin-bottom: 16px;
  }

  .character-profile__background {
    padding: 18px 16px;
  }

  .character-profile__carrd-iframe {
    height: 70vh;
    min-height: 380px;
  }
}
</style>
