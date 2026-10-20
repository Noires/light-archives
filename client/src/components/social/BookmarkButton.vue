<template>
  <q-btn
    v-if="visible && variant === 'icon'"
    round
    dense
    unelevated
    class="bookmark-btn bookmark-btn--icon"
    :class="{ 'bookmark-btn--active': bookmarked }"
    :icon="bookmarked ? 'bookmark' : 'bookmark_border'"
    :aria-pressed="bookmarked ? 'true' : 'false'"
    :aria-label="bookmarked ? 'Gemerkt' : 'Merken'"
    @click.stop.prevent="toggle"
  >
    <q-tooltip>{{ bookmarked ? 'Gemerkt, zum Entfernen klicken' : 'Merken' }}</q-tooltip>
  </q-btn>
  <q-btn
    v-else-if="visible"
    flat
    no-caps
    class="elpis-btn bookmark-btn"
    :class="[variant === 'on-media' ? 'bookmark-btn--on-media' : 'elpis-btn--secondary', { 'bookmark-btn--active': bookmarked }]"
    :icon="bookmarked ? 'bookmark' : 'bookmark_border'"
    :label="bookmarked ? 'Gemerkt' : 'Merken'"
    :aria-pressed="bookmarked ? 'true' : 'false'"
    @click.stop.prevent="toggle"
  />
</template>

<script lang="ts">
import type { BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { bookmarkKey, canUseSocial, ensureBookmarkKeys, markUnavailable, setBookmarked, socialState } from './social-state';

// ER2 social — "Merken"/"Gemerkt" toggle for venues, characters, events and
// stories. All buttons share one GET /bookmarks per session (social-state),
// so directory grids do not ask per card. Hidden for guests, unverified
// accounts and when the API has no bookmarks endpoint. Click events do not
// propagate, so it can sit on top of a card link.
//
//   <bookmark-button target-type="venue" :target-id="venue.id" />
//   <bookmark-button target-type="venue" :target-id="venue.id" variant="icon" />

class Props {
  targetType = prop<BookmarkTargetType>({ required: true });
  targetId = prop<number>({ required: true });
  /** secondary: outlined button; on-media: glass button on hero banners; icon: round icon button on images */
  variant = prop<'secondary' | 'on-media' | 'icon'>({ default: 'secondary' });
}

@Options({
  name: 'BookmarkButton',
  watch: {
    enabled(value: boolean) {
      if (value) {
        void ensureBookmarkKeys((this as BookmarkButton).$api);
      }
    },
  },
})
export default class BookmarkButton extends Vue.with(Props) {
  busy = false;

  get enabled(): boolean {
    return canUseSocial(this.$store.getters.realRole) && !socialState.unavailable.bookmarks && !!this.targetId;
  }

  get visible(): boolean {
    return this.enabled && !!socialState.bookmarkKeys;
  }

  get bookmarked(): boolean {
    return !!socialState.bookmarkKeys?.has(bookmarkKey(this.targetType, this.targetId));
  }

  created() {
    if (this.enabled) {
      void ensureBookmarkKeys(this.$api);
    }
  }

  async toggle() {
    if (this.busy) {
      return;
    }
    const was = this.bookmarked;
    setBookmarked(this.targetType, this.targetId, !was);
    this.busy = true;
    try {
      if (was) {
        await this.$api.bookmarks.removeBookmark(this.targetType, this.targetId);
      } else {
        await this.$api.bookmarks.addBookmark(this.targetType, this.targetId);
      }
    } catch (e) {
      setBookmarked(this.targetType, this.targetId, was);
      if (!markUnavailable('bookmarks', e)) {
        notifyError('Das hat nicht geklappt. Bitte versuche es erneut.');
      }
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss" scoped>
// Round icon on images (venue cards): own card-coloured surface, so the icon
// keeps its contrast on any photo or gradient.
.q-btn.bookmark-btn--icon {
  width: 36px;
  height: 36px;
  color: var(--ink-primary);
  background-color: var(--vision-card);
  border: 1px solid var(--rule-soft);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: background-color var(--motion-fast) var(--ease-elpis), color var(--motion-fast) var(--ease-elpis);

  &.bookmark-btn--active {
    color: var(--ink-link);
  }

  &:hover {
    background-color: var(--surface-raised);
  }

  :deep(.q-focus-helper) {
    display: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

// Secondary on media (hero banners): fixed light ink on the dark scrim.
.q-btn.bookmark-btn--on-media {
  border: 1px solid rgba(255, 255, 255, 0.32);
  background-color: rgba(255, 255, 255, 0.14);
  color: #FFFFFF;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:not(.disabled):hover {
    background-color: rgba(255, 255, 255, 0.24);
  }

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background-color: rgba(13, 17, 24, 0.6);
  }
}
</style>
