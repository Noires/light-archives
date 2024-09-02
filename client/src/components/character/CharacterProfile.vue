<template>
  <div class="character-profile">
    <banner-view :banner="character.banner" />
    <header class="character-profile__header">
      <div class="layout__filler">
        <q-avatar round>
          <img :src="character.avatar" />
        </q-avatar>
      </div>
      <div class="character-profile__header-names">
        <div v-if="character.title" class="character-profile__header-subtitle">{{ character.title }}</div>
        <h2 class="character-profile__header-title">{{ character.name }}</h2>
        <div v-if="character.nickname" class="character-profile__header-subtitle">«{{ character.nickname }}»</div>
      </div>
      <div class="layout__filler"></div>
    </header>
    <character-details-box>
      <character-detail label="Welt" :value="character.server" v-if="character.server" />
      <character-detail label="Volk" :value="$display.races[character.race]" v-if="character.race" />
      <character-detail label="Untervolk" :value="$display.tribes[character.tribe]" v-if="character.tribe" />
      <character-detail label="Familie" :value="character.family" v-if="character.family" /> 
      <character-detail label="Schutzgottheit" :value="character.deity" v-if="character.deity" /> 
      <character-detail label="Profession" :value="character.profession" v-if="character.profession" />   
      <character-detail label="Alter" :value="character.age" v-if="character.age" />
      <character-detail label="Namenstag" :value="character.birthday" v-if="character.birthday" /> 
      <character-detail label="Geschlecht" :value="character.pronouns" v-if="character.pronouns" />
      <character-detail label="Geburtsort" :value="character.birthplace" v-if="character.birthplace" />
      <character-detail label="Wohnort" :value="character.residence" v-if="character.residence" />
      <character-detail label="Beziehungsstatus" :value="character.relationsshipstatus" v-if="character.relationsshipstatus" />
      <character-detail label="Freie&nbsp;Gesellschaft" :value="character.freeCompany.name" :router-link="fcLink" v-if="character.freeCompany" />
    </character-details-box>
      <br>
      <template v-if="character.background">
        <html-viewer class="character-profile__appearance-background" :content="character.background" />
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
export default class CharacterProfile extends Vue.with(Props) {
  PageType = PageType;

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

.character-profile__details tr > td:first-child {
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
