<template>
  <div class="character-gallery">
    <section>
      <h6 aria-level="2">Galerie</h6>
        <template v-if="content.images && content.images.length > 0">
          <thumb-gallery :images="content.images" />
        </template>
    </section>
    <!-- ER2 round 2: the character's albums (hidden without albums or API) -->
    <section v-if="albums.length > 0" class="character-gallery__albums" aria-labelledby="character-gallery-albums">
      <h6 id="character-gallery-albums" aria-level="2">Alben</h6>
      <album-grid :albums="albums" :show-owner="false" />
    </section>
  </div>
</template>

<script lang="ts">
import { PageType } from '@app/shared/enums/page-type.enum';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import ReportViolationSection from '../common/ReportViolationSection.vue';
import CharacterDetail from './CharacterDetail.vue';
import CharacterDetailsBox from './CharacterDetailsBox.vue';
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import ThumbGallery from '../images/ThumbGallery.vue';
import AlbumGrid from '../images/AlbumGrid.vue';
import type { AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';

class Props {
  content = prop<CharacterContentDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });

  characterId = prop<number>({
    required: false,
  });
}

@Options({
  components: {
    CharacterDetail,
    CharacterDetailsBox,
    BannerView,
    HtmlViewer,
    ReportViolationSection,
    ThumbGallery,
    AlbumGrid,
  },
  watch: {
    characterId() {
      void (this as CharacterGallery).loadAlbums();
    },
  },
})
export default class CharacterGallery extends Vue.with(Props) {
  PageType = PageType;
  albums: AlbumSummaryDto[] = [];

  mounted() {
    void this.loadAlbums();
  }

  /** ER2 round 2: GET /albums?characterId=; the production API may lack it. */
  async loadAlbums() {
    const characterId = this.characterId;
    if (!characterId) {
      this.albums = [];
      return;
    }
    try {
      const albums = await this.$api.albums.getAlbums(characterId);
      if (characterId === this.characterId) {
        this.albums = albums.filter((album) => album.ownerId === characterId);
      }
    } catch {
      this.albums = [];
    }
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
