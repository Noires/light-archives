<template>
  <q-page class="page-album">
    <breadcrumbs :items="crumbs" />

    <div v-if="loading" class="page-album__loading"><q-spinner size="32px" /></div>

    <empty-state
      v-else-if="!album"
      icon="photo_album"
      title="Album nicht gefunden"
      text="Dieses Album gibt es nicht (mehr), oder Alben werden vom Server noch nicht unterstützt."
      action-label="Zur Galerie"
      action-to="/gallery/screenshot"
    />

    <template v-else>
      <page-head :eyebrow="eyebrow" :title="album.title">
        <template v-if="album.mine" #actions>
          <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps icon="edit" label="Album bearbeiten" @click="onEditClick" />
          <q-btn class="elpis-btn elpis-btn--ghost" flat no-caps icon="delete_outline" label="Löschen" @click="onDeleteClick" />
        </template>
        <p class="page-album__owner">
          Ein Album von <router-link :to="ownerLink">{{ album.owner }}</router-link>
          <span aria-hidden="true"> · </span>
          <span>aktualisiert {{ $display.relativeTime(album.updatedAt) }}</span>
        </p>
        <p v-if="album.description" class="page-album__description">{{ album.description }}</p>
      </page-head>

      <h2 class="vision-sr-only">Bilder</h2>
      <ul v-if="album.images.length" class="page-album__grid">
        <li v-for="(image, index) in album.images" :key="image.id" class="page-album__tile">
          <a
            class="page-album__link"
            :href="`/image/${image.id}`"
            :aria-label="image.title || 'Bild ohne Titel'"
            @click.prevent="openLightbox(index)"
          >
            <img :src="image.thumbUrl || image.url" alt="" loading="lazy" decoding="async" />
            <span class="page-album__caption" aria-hidden="true">{{ image.title || 'Ohne Titel' }}</span>
          </a>
        </li>
      </ul>
      <empty-state
        v-else
        icon="photo_library"
        title="Noch keine Bilder in diesem Album"
        :text="album.mine ? 'Wähle über „Album bearbeiten“ Bilder aus.' : ''"
        :action-label="album.mine ? 'Bilder auswählen' : ''"
        :variant="album.mine ? 'owner' : 'visitor'"
        @action="onEditClick"
      />
    </template>
  </q-page>
</template>

<script lang="ts">
import type { AlbumDto } from '@app/shared/dto/albums/album.dto';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import type { BreadcrumbItem } from 'components/vision/types';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

// ER2 round 2 — /album/:id: title, description, owner, image grid, Lightbox.
// The owner edits (title, description, images, cover) and deletes it.

@Options({
  name: 'PageAlbum',
  components: { Breadcrumbs, EmptyState, PageHead },
  watch: {
    '$route.params.id'() {
      if ((this as PageAlbum).$route.path.startsWith('/album/')) {
        void (this as PageAlbum).load();
      }
    },
  },
})
export default class PageAlbum extends Vue {
  album: AlbumDto | null = null;
  loading = true;

  get crumbs(): BreadcrumbItem[] {
    return [
      { label: 'Galerie', to: '/gallery/screenshot' },
      { label: 'Alben', to: '/gallery/alben' },
      { label: this.album?.title || 'Album' },
    ];
  }

  get eyebrow(): string {
    const count = this.album?.imageCount ?? this.album?.images.length ?? 0;
    return `Album · ${count} ${count === 1 ? 'Bild' : 'Bilder'}`;
  }

  get ownerLink(): string {
    return this.album ? `/${this.album.ownerServer}/${this.album.owner.replace(/ /g, '_')}` : '/';
  }

  mounted() {
    void this.load();
  }

  async load() {
    const id = parseInt(this.$route.params.id as string, 10);
    this.loading = true;

    try {
      this.album = id ? await this.$api.albums.getAlbum(id) : null;
      if (this.album) {
        document.title = `${this.album.title} — Album — Elpisgarten`;
      }
    } catch {
      this.album = null;
    } finally {
      this.loading = false;
    }
  }

  async openLightbox(index: number) {
    if (!this.album) {
      return;
    }

    const Lightbox = (await import('components/vision/Lightbox.vue')).default;
    this.$q.dialog({
      component: Lightbox,
      componentProps: { images: this.album.images, initialIndex: index },
    });
  }

  async onEditClick() {
    if (!this.album) {
      return;
    }

    const AlbumEditDialog = (await import('components/images/AlbumEditDialog.vue')).default;
    this.$q
      .dialog({
        component: AlbumEditDialog,
        componentProps: { album: this.album, characterId: this.album.ownerId },
      })
      .onOk(() => void this.load());
  }

  onDeleteClick() {
    if (!this.album) {
      return;
    }

    const album = this.album;
    this.$q
      .dialog({
        title: 'Album löschen',
        message: `Möchtest du das Album „${album.title}“ wirklich löschen? Die Bilder selbst bleiben erhalten.`,
        ok: { label: 'Löschen', color: 'negative', flat: true, noCaps: true },
        cancel: { label: 'Abbrechen', flat: true, noCaps: true },
      })
      .onOk(async () => {
        try {
          await this.$api.albums.deleteAlbum(album.id);
          notifySuccess('Album gelöscht.');
          void this.$router.replace('/gallery/alben');
        } catch (e) {
          notifyError(e);
        }
      });
  }
}
</script>

<style lang="scss" scoped>
.page-album {
  color: var(--ink-primary);
}

.page-album__loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.page-album__owner {
  margin: 4px 0 0;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);

  a {
    color: var(--ink-link);
  }
}

.page-album__description {
  max-width: 70ch;
  margin: 8px 0 0;
  font-family: var(--font-body, var(--font-section));
  font-size: var(--type-scale-2);
  line-height: var(--lh-body, 1.6);
  white-space: pre-line;
}

.page-album__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.page-album__tile {
  min-width: 0;
}

.page-album__link {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background: var(--rule-tint);

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

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--glow-aether), 0 0 0 4px var(--vision-focus-edge);
  }
}

// Fixed dark gradient under white text (the image below is unknown).
.page-album__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 28px 12px 10px;
  overflow: hidden;
  background: linear-gradient(to top, rgba(11, 6, 18, 0.88), rgba(11, 6, 18, 0));
  color: #FFFFFF;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--motion-fast) var(--ease-elpis);
}

.page-album__link:hover .page-album__caption,
.page-album__link:focus-visible .page-album__caption {
  opacity: 1;
}

@media (hover: none) {
  .page-album__caption {
    opacity: 1;
  }
}

@media (max-width: 599px) {
  .page-album__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-album__link img,
  .page-album__caption {
    transition: none;
  }

  .page-album__link:hover img {
    transform: none;
  }
}
</style>
