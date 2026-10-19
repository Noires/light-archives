<template>
  <article class="nb-card" :style="{ '--nb-type': typeColor }">
    <div class="nb-card__top">
      <span class="nb-card__type">[{{ typeLabel }}]</span>
      <span class="nb-card__top-end">
        <span v-if="item.pinned && !canPin" class="nb-card__pinned">
          <q-icon name="push_pin" size="14px" aria-hidden="true" /> Angeheftet
        </span>
        <time class="nb-card__time" :datetime="isoDate">{{ $display.relativeTime(item.createdAt) }}</time>
        <button
          v-if="canPin"
          type="button"
          class="nb-card__pin"
          :class="{ 'nb-card__pin--active': !!item.pinned }"
          :aria-pressed="item.pinned ? 'true' : 'false'"
          :aria-label="item.pinned ? `„${item.title}“ lösen` : `„${item.title}“ anheften`"
          :title="item.pinned ? 'Lösen' : 'Anheften'"
          :aria-disabled="pinBusy ? 'true' : undefined"
          :data-nb-pin="item.id"
          @click="pinBusy || $emit('toggle-pin', item)"
        >
          <q-icon name="push_pin" size="18px" aria-hidden="true" />
        </button>
      </span>
    </div>
    <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="nb-card__image" loading="lazy" />
    <h3 class="nb-card__title">
      <router-link :to="`/noticeboard/${item.id}`" class="nb-card__link">{{ item.title }}</router-link>
    </h3>
    <p v-if="item.excerpt" class="nb-card__excerpt">{{ item.excerpt }}</p>
    <ul class="nb-card__meta">
      <li>
        <q-icon name="place" size="14px" aria-hidden="true" />
        {{ $display.noticeboardLocations[item.location] || item.location }}
      </li>
      <li v-if="item.venueName">
        <q-icon name="storefront" size="14px" aria-hidden="true" />
        {{ item.venueName }}
      </li>
    </ul>
    <footer class="nb-card__footer">
      <span class="nb-card__author">{{ item.author }}</span>
      <span v-if="postedToDiscord" class="nb-card__discord">
        <q-icon name="forum" size="14px" aria-hidden="true" /> auf Discord
      </span>
    </footer>
  </article>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { isPostedToDiscord, NoticeboardCardItem, noticeboardTypeColor } from './noticeboard-types';

// ER2-605 — masonry note card: 4 px top bar and "[Typ]" in the type colour,
// time, optional image and excerpt, location, author, "auf Discord" when the
// API says the notice was posted there. Image, excerpt, the Discord flag and
// `pinned` are optional (ER2 round 2) and render only when present. With
// `canPin` (moderators) the card shows a pin toggle and emits `toggle-pin`;
// the page does the request.

class Props {
  item = prop<NoticeboardCardItem>({ required: true });
  canPin = prop<boolean>({ default: false });
  pinBusy = prop<boolean>({ default: false });
}

@Options({
  name: 'NoticeboardCard',
  emits: ['toggle-pin'],
})
export default class NoticeboardCard extends Vue.with(Props) {
  get postedToDiscord(): boolean {
    return isPostedToDiscord(this.item);
  }

  get typeLabel(): string {
    return this.$display.noticeboardTypes[this.item.type] || 'Aushang';
  }

  get typeColor(): string {
    return noticeboardTypeColor(this.item.type);
  }

  get isoDate(): string {
    return new Date(this.item.createdAt).toISOString();
  }
}
</script>

<style lang="scss" scoped>
.nb-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px 14px;
  border: 1px solid var(--rule-soft);
  border-top: 4px solid var(--nb-type);
  border-radius: 6px 6px 10px 10px;
  background: var(--vision-card);
  color: var(--ink-primary);
  font-family: var(--font-ui);
  break-inside: avoid;
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(43, 36, 24, 0.1);
  }
}

body.body--dark .nb-card:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
}

.nb-card__top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: var(--type-scale-0);
}

.nb-card__type {
  font-weight: 700;
  letter-spacing: 0.04em;
  // Mixed with primary ink so the label passes AA; browsers without
  // color-mix keep the plain ink.
  color: var(--ink-primary);
  color: color-mix(in srgb, var(--nb-type) 72%, var(--ink-primary));
}

.nb-card__time {
  color: var(--ink-muted);
}

.nb-card__top-end {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.nb-card__pinned {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: var(--ink-link);
}

// Sits above the stretched title link.
.nb-card__pin {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: -6px -6px -6px 0;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis);

  .q-icon {
    transform: rotate(45deg);
  }

  &:hover {
    background: var(--rule-tint);
    color: var(--ink-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }

  // aria-disabled instead of disabled: the button keeps keyboard focus
  // while the request runs (the card moves between lists).
  &[aria-disabled='true'] {
    cursor: progress;
    opacity: 0.6;
  }
}

.nb-card__pin--active {
  border-color: var(--rule-strong);
  color: var(--ink-link);

  .q-icon {
    transform: none;
  }
}

.nb-card__image {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  border-radius: 6px;
}

.nb-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: var(--ls-display);
  overflow-wrap: anywhere;
}

.nb-card__link {
  color: inherit;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: -4px 0 0;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;

    &::after {
      box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
    }
  }
}

.nb-card__excerpt {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--ink-muted);
}

.nb-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--type-scale-1);
  color: var(--ink-muted);

  li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.nb-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--rule-soft);
  font-size: var(--type-scale-1);
}

.nb-card__author {
  font-weight: 600;
}

.nb-card__discord {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--type-scale-0);
  color: var(--ink-link);
}

@media (prefers-reduced-motion: reduce) {
  .nb-card,
  .nb-card__pin {
    transition: none;

    &:hover {
      transform: none;
    }
  }
}
</style>
