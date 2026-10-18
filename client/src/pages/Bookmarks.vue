<template>
  <q-page class="page-bookmarks">
    <page-head
      eyebrow="Dein Konto"
      title="Gemerkt"
      lead="Treffpunkte, Charaktere, Events und Geschichten, die du dir vorgemerkt hast."
    >
      <section-tabs
        v-if="ready"
        v-model="tab"
        sync="query"
        aria-label="Art"
        :tabs="tabs"
      />
    </page-head>

    <empty-state
      v-if="!loggedIn"
      icon="bookmark_border"
      title="Melde dich an"
      text="Deine Merkliste gibt es für angemeldete Spielerinnen und Spieler."
      action-label="Login mit Discord"
      @action="login"
    />
    <empty-state
      v-else-if="!socialEnabled"
      icon="verified_user"
      title="Verifiziere deinen Charakter"
      text="Die Merkliste steht nach der Verifizierung zur Verfügung."
      action-label="Zur Verifizierung"
      :action-to="'/verify'"
    />
    <empty-state
      v-else-if="unavailable"
      icon="bookmark_border"
      title="Noch nicht verfügbar"
      text="Die Merkliste wird gerade eingerichtet. Schau bald wieder vorbei."
    />
    <div v-else-if="loading" class="page-bookmarks__loading" role="status">
      <q-spinner size="28px" />
      <span class="vision-sr-only">Merkliste wird geladen</span>
    </div>
    <empty-state
      v-else-if="!visibleItems.length"
      icon="bookmark_border"
      :title="emptyTitle"
      text="Mit „Merken“ auf Treffpunkten, Charakteren, Events und Geschichten landen sie hier."
      :action-label="emptyAction.label"
      :action-to="emptyAction.to"
    />
    <ul v-else class="page-bookmarks__grid">
      <li v-for="item in visibleItems" :key="keyOf(item)">
        <directory-card
          :to="linkOf(item)"
          :title="titleOf(item)"
          :subtitle="item.available ? item.subtitle || '' : ''"
          :meta="metaOf(item)"
          :banner-src="item.targetType !== 'character' ? item.imageUrl || '' : ''"
          :avatar-src="item.targetType === 'character' ? item.imageUrl || '' : ''"
          :avatar-alt="''"
          :placeholder-icon="iconOf(item)"
        >
          <template #footer>
            <q-btn
              flat
              no-caps
              class="elpis-btn elpis-btn--ghost"
              icon="bookmark_remove"
              label="Entfernen"
              :aria-label="`${titleOf(item)} entfernen`"
              @click="remove(item)"
            />
          </template>
        </directory-card>
      </li>
    </ul>
  </q-page>
</template>

<script lang="ts">
import type { BookmarkDto, BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import DirectoryCard from 'components/vision/DirectoryCard.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import {
  canUseSocial,
  isInternalLink,
  loginWithDiscord,
  markUnavailable,
  relativeTime,
  setBookmarked,
  socialState,
} from 'components/social/social-state';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

// ER2 social — /gemerkt: the user's bookmarks as directory cards, filtered by
// type (Alle / Treffpunkte / Charaktere / Events / Geschichten), each with
// "Entfernen". Deleted or hidden targets stay listed as "Nicht mehr
// verfügbar" so they can be removed. Guests get a login prompt.

type Tab = 'alle' | BookmarkTargetType;

const TYPE_LABELS: Record<BookmarkTargetType, string> = {
  venue: 'Treffpunkt',
  character: 'Charakter',
  event: 'Event',
  story: 'Geschichte',
};

const TYPE_ICONS: Record<BookmarkTargetType, string> = {
  venue: 'storefront',
  character: 'person',
  event: 'event',
  story: 'auto_stories',
};

const TAB_DEFS: { key: Tab; label: string; icon: string; to: string }[] = [
  { key: 'alle', label: 'Alle', icon: 'bookmarks', to: '/' },
  { key: 'venue', label: 'Treffpunkte', icon: 'storefront', to: '/venues' },
  { key: 'character', label: 'Charaktere', icon: 'person', to: '/profiles' },
  { key: 'event', label: 'Events', icon: 'event', to: '/events' },
  { key: 'story', label: 'Geschichten', icon: 'auto_stories', to: '/stories' },
];

@Options({
  name: 'PageBookmarks',
  components: {
    DirectoryCard,
    EmptyState,
    PageHead,
    SectionTabs,
  },
  watch: {
    socialEnabled() {
      void (this as PageBookmarks).load();
    },
  },
})
export default class PageBookmarks extends Vue {
  tab: Tab = 'alle';
  items: BookmarkDto[] = [];
  loading = true;

  get loggedIn(): boolean {
    return !!this.$store.getters.realRole;
  }

  get socialEnabled(): boolean {
    return canUseSocial(this.$store.getters.realRole);
  }

  get unavailable(): boolean {
    return socialState.unavailable.bookmarks;
  }

  get ready(): boolean {
    return this.socialEnabled && !this.unavailable;
  }

  get tabs(): SectionTab[] {
    return TAB_DEFS.map((def) => {
      const count = def.key === 'alle' ? this.items.length : this.items.filter((item) => item.targetType === def.key).length;
      return { key: def.key, label: def.label, icon: def.icon, count, dimmed: def.key !== 'alle' && count === 0 };
    });
  }

  get visibleItems(): BookmarkDto[] {
    return this.tab === 'alle' ? this.items : this.items.filter((item) => item.targetType === this.tab);
  }

  get emptyTitle(): string {
    const def = TAB_DEFS.find((tab) => tab.key === this.tab);
    return this.tab === 'alle' || !def ? 'Noch nichts gemerkt' : `Keine ${def.label} gemerkt`;
  }

  get emptyAction(): { label: string; to: string | null } {
    const def = TAB_DEFS.find((tab) => tab.key === this.tab);
    if (!def || def.key === 'alle') {
      return { label: 'Treffpunkte entdecken', to: '/venues' };
    }
    return { label: `${def.label} entdecken`, to: def.to };
  }

  created() {
    void this.load();
  }

  async load() {
    if (!this.socialEnabled) {
      this.loading = false;
      return;
    }
    this.loading = true;
    try {
      this.items = await this.$api.bookmarks.getMyBookmarks();
      socialState.bookmarkKeys = new Set(
        this.items
          .filter((item) => item.targetType && item.targetId)
          .map((item) => this.keyOf(item)),
      );
    } catch (e) {
      markUnavailable('bookmarks', e);
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  keyOf(item: BookmarkDto): string {
    return `${item.targetType || ''}:${item.targetId || 0}`;
  }

  titleOf(item: BookmarkDto): string {
    return item.available && item.title ? item.title : 'Nicht mehr verfügbar';
  }

  linkOf(item: BookmarkDto): string | null {
    return item.available && isInternalLink(item.link) ? item.link : null;
  }

  iconOf(item: BookmarkDto): string {
    return item.targetType ? TYPE_ICONS[item.targetType] : 'bookmark';
  }

  metaOf(item: BookmarkDto): string {
    const type = item.targetType ? TYPE_LABELS[item.targetType] : '';
    const when = item.createdAt ? `gemerkt ${relativeTime(item.createdAt)}` : '';
    return [ type, when ].filter(Boolean).join(' · ');
  }

  login() {
    loginWithDiscord(this.$api);
  }

  async remove(item: BookmarkDto) {
    if (!item.targetType || !item.targetId) {
      return;
    }
    const previous = this.items;
    this.items = this.items.filter((other) => other !== item);
    setBookmarked(item.targetType, item.targetId, false);
    try {
      await this.$api.bookmarks.removeBookmark(item.targetType, item.targetId);
    } catch (e) {
      this.items = previous;
      setBookmarked(item.targetType, item.targetId, true);
      notifyError('Das hat nicht geklappt. Bitte versuche es erneut.');
    }
  }
}
</script>

<style lang="scss" scoped>
.page-bookmarks {
  color: var(--ink-primary);
}

.page-bookmarks__loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  color: var(--ink-muted);
}

.page-bookmarks__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}
</style>
