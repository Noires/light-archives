<template>
  <ul class="album-grid">
    <li v-for="album in albums" :key="album.id" class="album-grid__item">
      <router-link :to="`/album/${album.id}`" class="album-grid__card">
        <span class="album-grid__cover" aria-hidden="true">
          <img v-if="album.coverThumbUrl || album.coverUrl" :src="album.coverThumbUrl || album.coverUrl || ''" alt="" loading="lazy" decoding="async" />
          <q-icon v-else name="photo_album" size="40px" />
        </span>
        <span class="album-grid__body">
          <component :is="headingTag" class="album-grid__title">{{ album.title }}</component>
          <span class="album-grid__meta">
            {{ album.imageCount === 1 ? '1 Bild' : `${album.imageCount} Bilder` }}<template v-if="showOwner"> · {{ album.owner }}</template>
          </span>
        </span>
      </router-link>
    </li>
  </ul>
</template>

<script lang="ts">
import type { AlbumSummaryDto } from '@app/shared/dto/albums/album.dto';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — album tiles (cover, title, image count, optional owner).

class Props {
  albums = prop<AlbumSummaryDto[]>({ required: true });
  showOwner = prop<boolean>({ default: true });
  headingTag = prop<string>({ default: 'h3' });
}

@Options({ name: 'AlbumGrid' })
export default class AlbumGrid extends Vue.with(Props) {}
</script>

<style lang="scss" scoped>
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.album-grid__item {
  min-width: 0;
}

.album-grid__card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background: var(--vision-card);
  color: var(--ink-primary);
  text-decoration: none;
  transition: border-color var(--motion-fast) var(--ease-elpis), transform var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--glow-aether), 0 0 0 4px var(--vision-focus-edge);
  }
}

.album-grid__cover {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
  background: var(--rule-tint);
  color: var(--ink-muted);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.album-grid__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px 12px;
}

.album-grid__title {
  margin: 0;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: var(--type-scale-2);
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-grid__meta {
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

@media (prefers-reduced-motion: reduce) {
  .album-grid__card {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
