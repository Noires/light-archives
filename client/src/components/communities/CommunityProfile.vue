<template>
  <div class="community-profile">
    <banner-view :banner="community.banner" />
    <header class="community-profile__header mat-aetherglass">
      <glyph-corner size="md" position="tl" class="community-profile__corner" />
      <glyph-corner size="md" position="tr" class="community-profile__corner" />
      <glyph-corner size="md" position="br" class="community-profile__corner" />
      <glyph-corner size="md" position="bl" class="community-profile__corner" />
      <h2 class="community-profile__header-title">{{ community.name }}</h2>
    </header>
    <character-details-box class="community-profile__infobox">
      <character-detail label="Gründung" :value="$display.formatDate(community.foundedAt)" v-if="community.foundedAt" />
      <character-detail label="Webseite" :value="community.website" :link="community.website" v-if="community.website" />
      <character-detail label="Discord" :value="community.discord" :link="community.discord" v-if="community.discord" />
      <character-detail label="Ziel" :value="community.goal" v-if="community.goal" />
      <character-detail label="Status" :value="community.status" v-if="community.status" />
      <character-detail label="Rekrutierer" :value="community.recruitingOfficers" v-if="community.recruitingOfficers" />
    </character-details-box>
    <template v-if="community.description">
      <triskelion-divider class="community-profile__divider" />
      <section class="community-profile__description-body mat-parchment">
        <html-viewer class="community-profile__description" :content="community.description" />
      </section>
    </template>
    <iframe
      v-if="community.carrdProfile"
      v-iframe-resize
      :src="carrdLink"
      width="100%"
      height="500px"
      class="community-profile__carrd-iframe"
    >
    </iframe>
    <template v-if="!community.description && !community.carrdProfile">
      Keine Beschreibung.
    </template>
    <template v-if="community.tags.length > 0">
      <hr />
      <strong>Schlagworte:</strong> {{ community.tags.join(', ') }}
    </template>
  </div>
</template>

<script lang="ts">
import { CommunityDto } from '@app/shared/dto/communities/community.dto';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import CharacterDetail from 'components/character/CharacterDetail.vue';
import CharacterDetailsBox from 'components/character/CharacterDetailsBox.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import GlyphCorner from '../aetherium/GlyphCorner.vue';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';

class Props {
  community = prop<CommunityDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'CommunityProfile',
  components: {
    CharacterDetail,
    CharacterDetailsBox,
    BannerView,
    HtmlViewer,
    GlyphCorner,
    TriskelionDivider,
  },
})
export default class CommunityProfile extends Vue.with(Props) {
	get editCommunityLink(): string {
		return `/edit-community/${this.community.id}`;
	}

  get carrdLink(): string {
    return `${this.$api.prefix}carrd/character/preview/${this.community.carrdProfile}`;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

// ELPIS-409: hero + parchment description, mirroring VenueProfile (407 / 408).
.community-profile__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 28px;
  margin-bottom: 18px;
  text-align: center;
  border-radius: 8px;
}

.community-profile__corner {
  position: absolute;
  z-index: 1;
}

.community-profile__corner.glyph-corner--tl { top: 8px;    left: 8px;    }
.community-profile__corner.glyph-corner--tr { top: 8px;    right: 8px;   }
.community-profile__corner.glyph-corner--br { bottom: 8px; right: 8px;   }
.community-profile__corner.glyph-corner--bl { bottom: 8px; left: 8px;    }

.community-profile__header-title {
  margin: 0;
  font-family: 'Cinzel Eorzea', var(--font-display);
  font-size: var(--type-scale-6);
  line-height: var(--lh-display);
  letter-spacing: var(--ls-display);
  color: var(--surface-ink);
}

body.body--dark .community-profile__header-title {
  color: var(--ink-luminous);
}

@media screen and (max-width: 600px) {
  .community-profile__header {
    padding: 18px 18px;
  }

  .community-profile__header-title {
    font-size: var(--type-scale-5);
  }
}

.community-profile__divider {
  margin: 8px auto 16px;
}

.community-profile__description-body {
  margin-bottom: 24px;
  padding: 28px 32px;
  border-radius: 6px;
}

.community-profile__description-body .community-profile__description {
  margin-bottom: 0;
}

@media screen and (max-width: 600px) {
  .community-profile__description-body {
    padding: 20px 18px;
  }
}

.community-profile__description {
  margin-bottom: 24px;
}

.community-profile__infobox {
  margin-bottom: 24px;
}

.community-profile__carrd-iframe {
  border: none;
}
</style>
