<template>
  <div class="nb-view" :class="{ 'nb-view--preview': preview }" :style="{ '--nb-type': typeColor }">
    <article class="nb-view__sheet mat-parchment" :aria-labelledby="titleId">
      <p class="nb-view__eyebrow">
        <span class="nb-view__type">[{{ typeLabel }}]</span>
        <span v-if="locationLabel"> · {{ locationLabel }}</span>
        <span v-if="noticeboardItem.postedToDiscord" class="nb-view__discord-pill">
          <q-icon name="forum" size="14px" aria-hidden="true" /> Auf Discord geteilt
        </span>
      </p>
      <component :is="preview ? 'h2' : 'h1'" :id="titleId" class="nb-view__title">{{ noticeboardItem.title || 'Ohne Titel' }}</component>
      <p v-if="noticeboardItem.author" class="nb-view__subline">
        Ausgehängt von {{ noticeboardItem.author }}<template v-if="locationLabel"> in {{ locationLabel }}</template>
      </p>

      <ul class="nb-view__meta">
        <li v-if="noticeboardItem.author">
          <q-icon name="person" size="16px" aria-hidden="true" />
          <router-link :to="authorLink">{{ noticeboardItem.author }}</router-link>
        </li>
        <li v-if="noticeboardItem.createdAt">
          <q-icon name="event" size="16px" aria-hidden="true" />
          <time :datetime="isoDate">{{ date }}</time>
        </li>
        <li v-if="noticeboardItem.venueName">
          <q-icon name="storefront" size="16px" aria-hidden="true" />
          <router-link :to="venueLink">{{ noticeboardItem.venueName }}</router-link>
        </li>
      </ul>

      <figure v-if="noticeboardItem.imageUrl" class="nb-view__figure">
        <img :src="noticeboardItem.imageUrl" :alt="noticeboardItem.imageCaption || ''" />
        <figcaption v-if="noticeboardItem.imageCaption">{{ noticeboardItem.imageCaption }}</figcaption>
      </figure>

      <section class="nb-view__body" :class="{ 'nb-view__body--drop-cap': hasDropCap }">
        <html-viewer class="nb-view__content" :content="noticeboardItem.content || ''" />
      </section>

      <triskelion-divider class="nb-view__divider" />

      <aside v-if="noticeboardItem.author" class="nb-view__contact" aria-labelledby="nb-view-contact">
        <h2 id="nb-view-contact" class="nb-view__contact-title">Interesse geweckt?</h2>
        <p class="nb-view__contact-text">
          Wende dich an {{ noticeboardItem.author }}, im Spiel oder über das Profil.
        </p>
        <div class="nb-view__contact-actions">
          <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps icon="person" :label="`Profil von ${firstName}`" :to="authorLink" />
          <q-btn
            v-if="noticeboardItem.venueName"
            class="elpis-btn elpis-btn--ghost"
            flat
            no-caps
            icon="storefront"
            :label="noticeboardItem.venueName"
            :to="venueLink"
          />
        </div>
      </aside>
    </article>

    <aside class="nb-view__rail" aria-label="Weitere Informationen">
      <!-- Discord preview only for the author (and in the editor preview); readers do not need it. -->
      <section v-if="preview || noticeboardItem.mine" aria-labelledby="nb-view-discord">
        <h2 id="nb-view-discord" class="nb-view__rail-label">So sieht es auf Discord aus</h2>
        <discord-embed-preview
          :color="embed.color"
          :author-name="embed.authorName"
          :title="embed.title"
          :description="embed.description"
          :fields="embed.fields"
          :footer="embed.footer"
          :timestamp="embed.timestamp"
          :caption="preview ? 'Nur beim Erstellen mit „Auf Discord posten“.' : ''"
        />
      </section>
      <slot name="rail" />
    </aside>
  </div>
</template>

<script lang="ts">
import { NoticeboardItemDto } from '@app/shared/dto/noticeboard/noticeboard-item.dto';
import { Options, prop, Vue } from 'vue-class-component';
import TriskelionDivider from '../aetherium/TriskelionDivider.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import DiscordEmbedPreview from '../vision/DiscordEmbedPreview.vue';
import { buildNoticeboardEmbed, NoticeboardEmbed } from './discord-message';
import { noticeboardTypeColor } from './noticeboard-types';

// ER2-606 — noticeboard item on parchment: "[Typ] · Ort" eyebrow, title, IM
// Fell subline, meta row, optional image with caption, prose with drop cap,
// Triskelion and contact box. The rail shows the Discord embed exactly as
// the Steward bot builds it (also in the editor preview) plus a `rail` slot
// for the page's related notices. Image and the Discord flag are optional
// fields a newer API may add.

type NoticeboardItemViewData = NoticeboardItemDto & {
  imageUrl?: string;
  imageCaption?: string;
  postedToDiscord?: boolean;
};

const DROP_CAP_WORD_THRESHOLD = 80;

let viewCounter = 0;

class Props {
  noticeboardItem = prop<NoticeboardItemViewData>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });
}

@Options({
  name: 'NoticeboardItemView',
  components: {
    DiscordEmbedPreview,
    HtmlViewer,
    TriskelionDivider,
  },
})
export default class NoticeboardItemView extends Vue.with(Props) {
  readonly titleId = `nb-view-title-${++viewCounter}`;

  get typeLabel(): string {
    return this.$display.noticeboardTypes[this.noticeboardItem.type] || 'Aushang';
  }

  get typeColor(): string {
    return noticeboardTypeColor(this.noticeboardItem.type);
  }

  get locationLabel(): string {
    return this.$display.noticeboardLocations[this.noticeboardItem.location] || '';
  }

  get date(): string {
    return this.$display.formatDate(this.noticeboardItem.createdAt);
  }

  get isoDate(): string {
    return this.noticeboardItem.createdAt ? new Date(this.noticeboardItem.createdAt).toISOString() : '';
  }

  get firstName(): string {
    return (this.noticeboardItem.author || '').split(' ')[0];
  }

  get authorLink(): string {
    const server = this.noticeboardItem.authorServer || '';
    const character = this.noticeboardItem.author?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get venueLink(): string {
    if (this.noticeboardItem.venueId) {
      return `/venue/${this.noticeboardItem.venueId}`;
    }

    if (!this.noticeboardItem.venueServer || !this.noticeboardItem.venueName) {
      return '/venues';
    }

    return `/venue/${this.noticeboardItem.venueServer}/${this.noticeboardItem.venueName.replace(/ /g, '_')}`;
  }

  get hasDropCap(): boolean {
    const words = (this.noticeboardItem.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    return words >= DROP_CAP_WORD_THRESHOLD;
  }

  get embed(): NoticeboardEmbed {
    const character = this.$store.getters.character;
    const fallback = character ? { name: character.name, server: character.server } : null;
    return buildNoticeboardEmbed(this.noticeboardItem, window.location.origin, fallback);
  }
}
</script>

<style lang="scss" scoped>
.nb-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 36px;
  align-items: start;
}

.nb-view:has(> .nb-view__rail:empty) {
  grid-template-columns: minmax(0, 820px);
  justify-content: center;
}

.nb-view__rail:empty {
  display: none;
}

.nb-view__sheet.mat-parchment {
  padding: 36px 44px 32px;
  border-top: 4px solid var(--nb-type);
}

.nb-view__eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  margin: 0 0 10px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.nb-view__type {
  color: var(--ink-primary);
  color: color-mix(in srgb, var(--nb-type) 72%, var(--ink-primary));
}

.nb-view__discord-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(88, 101, 242, 0.14);
  border: 1px solid rgba(88, 101, 242, 0.45);
  color: var(--ink-primary);
  letter-spacing: 0.02em;
  text-transform: none;
}

.nb-view__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 3.6vw, 2.6rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: var(--ls-display);
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

.nb-view__subline {
  margin: 10px 0 0;
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 1.2rem;
  color: var(--ink-muted);
}

.nb-view__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin: 18px 0 0;
  padding: 12px 0;
  border-top: 1px solid var(--rule-soft);
  border-bottom: 1px solid var(--rule-soft);
  list-style: none;
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  color: var(--ink-muted);

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  a {
    color: var(--ink-link);
    font-weight: 600;
  }
}

.nb-view__figure {
  margin: 24px 0 0;

  img {
    display: block;
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    border-radius: 6px;
  }

  figcaption {
    margin-top: 6px;
    font-family: var(--font-lore);
    font-style: italic;
    font-size: var(--type-scale-1);
    color: var(--ink-muted);
  }
}

.nb-view__body {
  margin-top: 24px;
}

.nb-view__content {
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--ink-primary);
}

.nb-view__body--drop-cap .nb-view__content > :deep(p:first-of-type::first-letter) {
  float: left;
  font-family: var(--font-ornament);
  font-size: 4em;
  line-height: 0.9;
  margin: 0.06em 0.12em 0 0;
  color: var(--rule-gold);
  font-weight: 500;
}

body.body--dark .nb-view__body--drop-cap .nb-view__content > :deep(p:first-of-type::first-letter) {
  color: var(--glow-aether-d);
}

.nb-view__divider {
  margin: 28px auto 20px;
}

.nb-view__contact {
  padding: 18px 20px;
  border: 1px dashed var(--rule-strong);
  border-radius: 10px;
  background: var(--rule-tint);
  font-family: var(--font-ui);
}

.nb-view__contact-title {
  text-align: left;
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  font-weight: 600;
  color: var(--ink-primary);
}

.nb-view__contact-text {
  margin: 0 0 12px;
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
}

.nb-view__contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nb-view__rail {
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: sticky;
  top: calc(var(--nav-height, 68px) + 24px);
}

.nb-view__rail-label {
  text-align: left;
  margin: 0 0 10px;
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  font-weight: 700;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  line-height: 1.4;
}

@media screen and (max-width: 1023px) {
  .nb-view {
    grid-template-columns: minmax(0, 1fr);
  }

  .nb-view__rail {
    position: static;
  }
}

@media screen and (max-width: 600px) {
  .nb-view__sheet.mat-parchment {
    padding: 22px 18px;
  }

  .nb-view__body--drop-cap .nb-view__content > :deep(p:first-of-type::first-letter) {
    font-size: 3em;
  }
}
</style>
