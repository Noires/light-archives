<template>
  <q-page class="page-gallery">
    <page-head
      :eyebrow="eyebrow"
      title="Momente aus Eorzea"
      :lead="description"
    >
      <section-tabs sync="route" :tabs="tabs" aria-label="Galeriebereiche" />
    </page-head>

    <!-- ER2 round 2: albums view (/gallery/alben) -->
    <template v-if="view === 'albums'">
      <div v-if="characterId && albums" class="page-gallery__toolbar">
        <q-btn
          class="elpis-btn elpis-btn--primary"
          unelevated
          no-caps
          icon="add"
          label="Album anlegen"
          @click="onCreateAlbumClick"
        />
        <div class="page-gallery__chips" role="group" aria-label="Alben filtern">
          <button
            type="button"
            class="page-gallery__chip"
            :class="{ 'page-gallery__chip--active': !mine }"
            :aria-pressed="!mine ? 'true' : 'false'"
            @click="setMine(false)"
          >
            Neueste
          </button>
          <button
            type="button"
            class="page-gallery__chip"
            :class="{ 'page-gallery__chip--active': mine }"
            :aria-pressed="mine ? 'true' : 'false'"
            @click="setMine(true)"
          >
            Von {{ characterShortName || 'meinem Charakter' }}
          </button>
        </div>
      </div>
      <h2 class="vision-sr-only">Alben</h2>
      <album-grid v-if="albums && albums.length" :albums="albums" :show-owner="!mine" />
      <empty-state
        v-else-if="albums"
        icon="photo_album"
        title="Noch keine Alben"
        :text="characterId ? 'Fasse deine Bilder in einem Album zusammen.' : 'Hier erscheinen Alben aus der Community.'"
        :action-label="characterId ? 'Album anlegen' : ''"
        @action="onCreateAlbumClick"
      />
      <empty-state
        v-else
        icon="photo_album"
        title="Alben sind noch nicht verfügbar"
        text="Der Server unterstützt Alben noch nicht. Schau bald wieder vorbei."
        action-label="Zu den Screenshots"
        action-to="/gallery/screenshot"
      />
    </template>

    <template v-else>
    <div class="page-gallery__toolbar">
      <q-input
        class="page-gallery__search"
        label="Titel oder Name suchen"
        debounce="200"
        :model-value="searchQuery"
        outlined
        dense
        clearable
        @update:model-value="setSearchQuery"
      >
        <template #prepend>
          <q-icon name="search" aria-hidden="true" />
        </template>
      </q-input>

      <div v-if="characterId" class="page-gallery__chips" role="group" aria-label="Bilder filtern">
        <button
          type="button"
          class="page-gallery__chip"
          :class="{ 'page-gallery__chip--active': !mine }"
          :aria-pressed="!mine ? 'true' : 'false'"
          @click="setMine(false)"
        >
          Alle
        </button>
        <button
          type="button"
          class="page-gallery__chip"
          :class="{ 'page-gallery__chip--active': mine }"
          :aria-pressed="mine ? 'true' : 'false'"
          @click="setMine(true)"
        >
          Von {{ characterShortName || 'meinem Charakter' }}
        </button>
      </div>

      <div class="page-gallery__paging">
        <span class="page-gallery__stats">{{ first }}–{{ last }} von {{ total }}</span>
        <q-pagination
          v-if="maxPage > 1"
          class="page-gallery__pagination"
          aria-label="Seiten (oben)"
          :model-value="page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
    </div>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Bilder</h2>
    <ul v-if="images.length" class="page-gallery__grid">
      <li v-for="(image, index) in images" :key="image.id" class="page-gallery__tile">
        <a
          class="page-gallery__link"
          :href="`/image/${image.id}`"
          :aria-label="tileLabel(image)"
          @click.prevent="openLightbox(index)"
        >
          <img :src="image.url" alt="" loading="lazy" decoding="async" />
          <span class="page-gallery__caption" aria-hidden="true">
            <span class="page-gallery__caption-title">{{ image.title || 'Ohne Titel' }}</span>
            <span class="page-gallery__caption-meta">
              <span v-if="image.owner" class="page-gallery__caption-author">{{ image.owner }}</span>
              <span v-if="reactionTotal(image) > 0" class="page-gallery__caption-reactions">
                <q-icon name="favorite" size="14px" />
                {{ reactionTotal(image) }}
              </span>
            </span>
          </span>
        </a>
      </li>
    </ul>

    <empty-state
      v-else
      icon="photo_library"
      :title="searchQuery || mine ? 'Keine Bilder gefunden' : 'Hier ist noch nichts'"
      :text="searchQuery || mine ? 'Versuche es mit einem anderen Suchbegriff oder Filter.' : 'Lade das erste Bild in dieser Kategorie hoch.'"
    />

    <div v-if="maxPage > 1" class="page-gallery__bottom">
      <q-pagination
        class="page-gallery__pagination"
        aria-label="Seiten (unten)"
        :model-value="page"
        :max="maxPage"
        :max-pages="7"
        direction-links
        boundary-links
        @update:model-value="setPage"
      />
    </div>
    </template>
  </q-page>
</template>

<script lang="ts">
import type { AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import SharedConstants from '@app/shared/SharedConstants';
import AlbumGrid from 'components/images/AlbumGrid.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import { createMetaMixin } from 'quasar';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteLocationNormalized } from 'vue-router';

// ER2-701 — gallery as a showcase: PageHead, Screenshots / Kunstwerke tabs
// (the existing /gallery/:category routes), search, a "mine" chip (the
// images API filters by character), large tiles with a caption on hover and
// focus, and the Lightbox. Paging and search stay in the query string.

const $api = useApi();
const $router = useRouter();

interface PageData {
  view: 'images' | 'albums';
  category: ImageCategory;
  page: number;
  searchQuery: string;
  mine: boolean;
  images: PagingResultDto<ImageSummaryDto>;
  /** null = albums API missing (production may lack it) */
  albums: AlbumSummaryDto[] | null;
}

// ER2 round 2: whether GET /albums answers; probed once per session.
let albumsApiAvailable: boolean | null = null;

async function probeAlbums(characterId?: number): Promise<AlbumSummaryDto[] | null> {
  try {
    const albums = await $api.albums.getAlbums(characterId);
    albumsApiAvailable = true;
    return albums;
  } catch {
    albumsApiAvailable = false;
    return null;
  }
}

async function load(to: RouteLocationNormalized): Promise<PageData> {
  const category = to.params.category as ImageCategory;
  const page = Math.max(1, parseInt(to.query.page as string)) || 1;
  const searchQuery = (to.query.searchQuery as string) || '';
  const characterId = useStore().getters.characterId;
  const mine = to.query.mine === '1' && !!characterId;

  if (to.meta.galleryView === 'alben') {
    return {
      view: 'albums',
      category: ImageCategory.SCREENSHOT,
      searchQuery: '',
      page: 1,
      mine,
      images: { total: 0, data: [] },
      albums: await probeAlbums(mine && characterId ? characterId : undefined),
    };
  }

  if (!Object.values(ImageCategory).includes(category) || category == ImageCategory.UNLISTED || category == ImageCategory.OFFERING_ITEM) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    return {
      view: 'images',
      albums: null,
      category,
      searchQuery,
      page,
      mine,
      images: await $api.images.getImages({
        category,
        searchQuery,
        characterId: mine && characterId ? characterId : undefined,
        offset: (page - 1) * SharedConstants.DEFAULT_ROWS_PER_PAGE,
        limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
      }),
    };
  } catch (e) {
    notifyError(e);
    throw e;
  }
}

@Options({
  name: 'PageGallery',
  components: {
    AlbumGrid,
    EmptyState,
    PageHead,
    SectionTabs,
  },
  async beforeRouteEnter(to, _, next) {
    const data = await load(to);
    next((vm) => (vm as PageGallery).setContent(data));
  },
  async beforeRouteUpdate(to) {
    const data = await load(to);
    (this as PageGallery).setContent(data);
  },
  mixins: [
    createMetaMixin(function (this: PageGallery) {
      return {
        title: `${this.title} - Elpisgarten`,
      };
    }),
  ],
})
export default class PageGallery extends Vue {
  view: 'images' | 'albums' = 'images';
  albums: AlbumSummaryDto[] | null = null;
  albumsTab = albumsApiAvailable === true;
  category = ImageCategory.UNLISTED;
  images = [] as ImageSummaryDto[];
  total = 0;
  page = 1;
  searchQuery = '';
  mine = false;

  setContent({ view, albums, category, page, images, searchQuery, mine }: PageData) {
    this.view = view;
    this.albums = albums;
    this.category = category;
    this.page = page;
    this.searchQuery = searchQuery;
    this.mine = mine;
    this.total = images.total;
    this.images = images.data;
    document.title = `${this.title} - Elpisgarten`;
    this.syncAlbumsTab();
  }

  /** Shows the "Alben" tab once GET /albums is known to answer. */
  syncAlbumsTab() {
    if (albumsApiAvailable !== null) {
      this.albumsTab = albumsApiAvailable;
      return;
    }

    void probeAlbums().then(() => {
      this.albumsTab = albumsApiAvailable === true;
    });
  }

  get title() {
    if (this.view === 'albums') {
      return 'Alben · Galerie';
    }
    return `${this.$display.imageCategories[this.category]} · Galerie`;
  }

  get eyebrow(): string {
    if (this.view === 'albums') {
      const count = this.albums ? this.albums.length : 0;
      return `Galerie · ${count} ${count === 1 ? 'Album' : 'Alben'}`;
    }
    return `Galerie · ${this.total} ${this.total === 1 ? 'Bild' : 'Bilder'}`;
  }

  get characterId(): number | null {
    return this.$store.getters.characterId;
  }

  get characterShortName(): string | null {
    return this.$store.getters.characterShortName;
  }

  get tabs(): SectionTab[] {
    const countFor = (category: ImageCategory) => (category === this.category ? this.total : undefined);
    return [
      { key: ImageCategory.SCREENSHOT, label: 'Screenshots', icon: 'photo_camera', count: countFor(ImageCategory.SCREENSHOT), to: '/gallery/screenshot' },
      { key: ImageCategory.ARTWORK, label: 'Kunstwerke', icon: 'palette', count: countFor(ImageCategory.ARTWORK), to: '/gallery/artwork' },
      {
        key: 'alben',
        label: 'Alben',
        icon: 'photo_album',
        count: this.view === 'albums' && this.albums ? this.albums.length : undefined,
        to: '/gallery/alben',
        hidden: !this.albumsTab && this.view !== 'albums',
      },
    ];
  }

  get description() {
    if (this.view === 'albums') {
      return 'Sammlungen von Bildern, zusammengestellt von Charakteren aus der Community.';
    }

    switch (this.category) {
      case ImageCategory.ARTWORK:
        return 'Illustrationen, Konzeptkunst und Charakterdesigns aus der Community.';
      case ImageCategory.SCREENSHOT:
        return 'Screenshots, Szenen und Momente aus dem Spiel.';
      default:
        return 'Bilder aus der Community.';
    }
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.total / SharedConstants.DEFAULT_ROWS_PER_PAGE));
  }

  get first() {
    if (this.total === 0) {
      return 0;
    }
    return (this.page - 1) * SharedConstants.DEFAULT_ROWS_PER_PAGE + 1;
  }

  get last() {
    if (this.total === 0) {
      return 0;
    }
    return Math.max(this.first, this.first + this.images.length - 1);
  }

  tileLabel(image: ImageSummaryDto): string {
    const title = image.title || 'Ohne Titel';
    return image.owner ? `${title} von ${image.owner}` : title;
  }

  /** Sum of reactions once the summary carries them (ER2-807, optional). */
  reactionTotal(image: ImageSummaryDto): number {
    const counts = (image as ImageSummaryDto & { reactionCounts?: Record<string, number | undefined> }).reactionCounts;
    if (!counts) {
      return 0;
    }
    return Object.values(counts).reduce<number>((sum, value) => sum + (value || 0), 0);
  }

  async openLightbox(index: number) {
    const Lightbox = (await import('components/vision/Lightbox.vue')).default;
    this.$q.dialog({
      component: Lightbox,
      componentProps: {
        images: this.images,
        initialIndex: index,
      },
    });
  }

  async onCreateAlbumClick() {
    const characterId = this.characterId;

    if (!characterId) {
      return;
    }

    const AlbumEditDialog = (await import('components/images/AlbumEditDialog.vue')).default;
    this.$q
      .dialog({ component: AlbumEditDialog, componentProps: { album: null, characterId } })
      .onOk((id: number) => void this.$router.push(`/album/${id}`));
  }

  setPage(newPage: number) {

    if (newPage >= 1 && newPage <= this.maxPage) {
      this.page = newPage;
      this.refresh();
    }
  }

  setSearchQuery(newSearchQuery: string | null) {
    this.searchQuery = newSearchQuery || '';
    this.page = 1;
    this.refresh();
  }

  setMine(mine: boolean) {
    if (mine !== this.mine) {
      this.mine = mine;
      this.page = 1;
      this.refresh();
    }
  }

  refresh() {
    const queryParams: { [k: string]: string | number } = {
      page: this.page,
    };

    if (this.searchQuery) {
      queryParams.searchQuery = this.searchQuery;
    }

    if (this.mine) {
      queryParams.mine = '1';
    }

    void this.$router.replace({
      path: window.location.pathname,
      query: queryParams,
    });
  }
}
</script>

<style lang="scss" scoped>
.page-gallery {
  color: var(--ink-primary);
}

.page-gallery__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  margin: 8px 0 20px;
}

.page-gallery__search {
  flex: 1 1 260px;
  max-width: 420px;
}

.page-gallery__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-gallery__chip {
  min-height: 36px;
  padding: 4px 14px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background-color: transparent;
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--glow-aether),
      0 0 0 3px var(--vision-focus-edge);
  }
}

.page-gallery__chip--active,
.page-gallery__chip--active:hover {
  border-color: var(--vision-primary);
  background-color: var(--vision-primary);
  color: var(--vision-on-primary);
}

.page-gallery__paging {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-left: auto;
}

.page-gallery__stats {
  font-family: var(--font-ui);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-muted);
  white-space: nowrap;
}

.page-gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.page-gallery__tile {
  min-width: 0;
}

.page-gallery__link {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--rule-soft);
  background-color: var(--rule-tint);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--motion-base) var(--ease-elpis);
  }

  &:hover img {
    transform: scale(1.03);
  }

  // Visible focus ring: aether ring plus the theme's outer edge.
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px var(--glow-aether),
      0 0 0 4px var(--vision-focus-edge);
  }
}

// Fixed dark gradient under white text (the image below is unknown).
.page-gallery__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 32px 14px 12px;
  background: linear-gradient(to top, rgba(11, 6, 18, 0.88) 0%, rgba(11, 6, 18, 0.6) 55%, rgba(11, 6, 18, 0) 100%);
  color: #FFFFFF;
  font-family: var(--font-ui);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--motion-fast) var(--ease-elpis),
    transform var(--motion-fast) var(--ease-elpis);
  pointer-events: none;
}

.page-gallery__link:hover .page-gallery__caption,
.page-gallery__link:focus-visible .page-gallery__caption {
  opacity: 1;
  transform: none;
}

.page-gallery__caption-title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-gallery__caption-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  line-height: 16px;
}

.page-gallery__caption-author {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-gallery__caption-reactions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.page-gallery__bottom {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (hover: none) {
  .page-gallery__caption {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 599px) {
  .page-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .page-gallery__link {
    aspect-ratio: 1 / 1;
    border-radius: 10px;
  }

  .page-gallery__paging {
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-gallery__chip,
  .page-gallery__link img,
  .page-gallery__caption {
    transition: none;
  }

  .page-gallery__link:hover img {
    transform: none;
  }
}
</style>
