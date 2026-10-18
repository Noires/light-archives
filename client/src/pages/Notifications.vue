<template>
  <q-page class="page-notifications">
    <page-head
      eyebrow="Dein Konto"
      title="Benachrichtigungen"
      lead="Neue Teile, neue Geschichten, Events deiner Treffpunkte und Erinnerungen an einem Ort."
    >
      <template v-if="ready && hasUnread" #actions>
        <q-btn
          flat
          no-caps
          class="elpis-btn elpis-btn--secondary"
          icon="done_all"
          label="Alle als gelesen markieren"
          :disable="busy"
          @click="markAllRead"
        />
      </template>
      <section-tabs
        v-if="ready"
        v-model="filter"
        sync="query"
        query-key="filter"
        aria-label="Filter"
        :tabs="filterTabs"
      />
    </page-head>

    <empty-state
      v-if="!loggedIn"
      icon="notifications_none"
      title="Melde dich an"
      text="Benachrichtigungen gibt es für angemeldete Spielerinnen und Spieler."
      action-label="Login mit Discord"
      @action="login"
    />
    <empty-state
      v-else-if="!socialEnabled"
      icon="verified_user"
      title="Verifiziere deinen Charakter"
      text="Benachrichtigungen stehen nach der Verifizierung zur Verfügung."
      action-label="Zur Verifizierung"
      :action-to="'/verify'"
    />
    <empty-state
      v-else-if="unavailable"
      icon="notifications_paused"
      title="Noch nicht verfügbar"
      text="Benachrichtigungen werden gerade eingerichtet. Schau bald wieder vorbei."
    />

    <div v-else class="page-notifications__layout">
      <section class="page-notifications__list-wrap" aria-labelledby="notifications-list-title">
        <h2 id="notifications-list-title" class="vision-sr-only">
          {{ filter === 'ungelesen' ? 'Ungelesene Benachrichtigungen' : 'Alle Benachrichtigungen' }}
        </h2>
        <div v-if="loading" class="page-notifications__loading" role="status">
          <q-spinner size="28px" />
          <span class="vision-sr-only">Benachrichtigungen werden geladen</span>
        </div>
        <empty-state
          v-else-if="!visibleItems.length"
          icon="notifications_none"
          title="Keine neuen Benachrichtigungen."
          :text="emptyText"
          :action-label="filter === 'ungelesen' ? '' : 'Events entdecken'"
          :action-to="filter === 'ungelesen' ? null : '/events'"
        />
        <ul v-else class="page-notifications__list">
          <li
            v-for="item in visibleItems"
            :key="item.id"
            class="page-notifications__item"
            :class="{ 'page-notifications__item--unread': !item.readAt }"
          >
            <q-icon class="page-notifications__icon" :name="iconFor(item)" size="22px" aria-hidden="true" />
            <div class="page-notifications__text">
              <a
                v-if="isLink(item)"
                :href="hrefFor(item)"
                class="page-notifications__title"
                @click.prevent="open(item)"
              >{{ item.title }}</a>
              <span v-else class="page-notifications__title">{{ item.title }}</span>
              <p v-if="item.body" class="page-notifications__body">{{ item.body }}</p>
              <p class="page-notifications__meta">
                <span v-if="!item.readAt" class="page-notifications__dot" aria-hidden="true"></span>
                <span v-if="!item.readAt" class="vision-sr-only">Ungelesen,</span>
                <time :title="absolute(item)">{{ relative(item) }}</time>
              </p>
            </div>
            <div class="page-notifications__actions">
              <q-btn
                v-if="!item.readAt"
                flat
                round
                dense
                class="page-notifications__icon-btn"
                icon="mark_email_read"
                aria-label="Als gelesen markieren"
                @click="markRead(item)"
              >
                <q-tooltip>Als gelesen markieren</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                class="page-notifications__icon-btn"
                icon="delete_outline"
                aria-label="Löschen"
                @click="remove(item)"
              >
                <q-tooltip>Löschen</q-tooltip>
              </q-btn>
            </div>
          </li>
        </ul>
        <p class="page-notifications__retention">Benachrichtigungen werden nach 90 Tagen automatisch gelöscht.</p>
      </section>

      <notification-preferences-card class="page-notifications__prefs" />
    </div>
  </q-page>
</template>

<script lang="ts">
import type { NotificationDto } from '@app/shared/dto/social/notification.dto';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import NotificationPreferencesCard from 'components/social/NotificationPreferencesCard.vue';
import {
  absoluteTime,
  canUseSocial,
  isInternalLink,
  markUnavailable,
  notificationIcon,
  relativeTime,
  socialState,
  loginWithDiscord,
} from 'components/social/social-state';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

// ER2 social — /benachrichtigungen: list (Alle / Ungelesen) with mark read
// and delete, plus the "Einstellungen" card. Guests get a login prompt;
// without the API endpoint the page says "Noch nicht verfügbar".

type Filter = 'alle' | 'ungelesen';

@Options({
  name: 'PageNotifications',
  components: {
    EmptyState,
    NotificationPreferencesCard,
    PageHead,
    SectionTabs,
  },
  watch: {
    socialEnabled() {
      void (this as PageNotifications).load();
    },
  },
})
export default class PageNotifications extends Vue {
  filter: Filter = 'alle';
  items: NotificationDto[] = [];
  loading = true;
  busy = false;

  get loggedIn(): boolean {
    return !!this.$store.getters.realRole;
  }

  get socialEnabled(): boolean {
    return canUseSocial(this.$store.getters.realRole);
  }

  get unavailable(): boolean {
    return socialState.unavailable.notifications;
  }

  get ready(): boolean {
    return this.socialEnabled && !this.unavailable;
  }

  get unreadItems(): NotificationDto[] {
    return this.items.filter((item) => !item.readAt);
  }

  get hasUnread(): boolean {
    return this.unreadItems.length > 0;
  }

  get visibleItems(): NotificationDto[] {
    return this.filter === 'ungelesen' ? this.unreadItems : this.items;
  }

  get filterTabs(): SectionTab[] {
    return [
      { key: 'alle', label: 'Alle', count: this.items.length },
      { key: 'ungelesen', label: 'Ungelesen', count: this.unreadItems.length },
    ];
  }

  get emptyText(): string {
    return this.filter === 'ungelesen'
      ? 'Du hast alles gelesen.'
      : 'Folge Charakteren, Treffpunkten, Autorinnen und Autoren oder Reihen, dann erfährst du hier von Neuem.';
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
      this.items = await this.$api.notifications.getNotifications({ limit: 100 });
      socialState.unreadCount = this.unreadItems.length;
    } catch (e) {
      markUnavailable('notifications', e);
      this.items = [];
    } finally {
      this.loading = false;
    }
  }

  iconFor(item: NotificationDto): string {
    return notificationIcon(item.type);
  }

  relative(item: NotificationDto): string {
    return relativeTime(item.createdAt);
  }

  absolute(item: NotificationDto): string {
    return absoluteTime(item.createdAt);
  }

  isLink(item: NotificationDto): boolean {
    return isInternalLink(item.link);
  }

  hrefFor(item: NotificationDto): string {
    return isInternalLink(item.link) ? this.$router.resolve(item.link).href : '#';
  }

  login() {
    loginWithDiscord(this.$api);
  }

  async markRead(item: NotificationDto) {
    if (item.readAt || !item.id) {
      return;
    }
    item.readAt = Date.now();
    socialState.unreadCount = Math.max(0, socialState.unreadCount - 1);
    try {
      await this.$api.notifications.markRead(item.id);
    } catch (e) {
      item.readAt = null;
      socialState.unreadCount += 1;
      notifyError('Die Benachrichtigung konnte nicht als gelesen markiert werden.');
    }
  }

  open(item: NotificationDto) {
    void this.markRead(item);
    if (isInternalLink(item.link)) {
      void this.$router.push(item.link);
    }
  }

  async remove(item: NotificationDto) {
    if (!item.id) {
      return;
    }
    const index = this.items.indexOf(item);
    this.items = this.items.filter((other) => other !== item);
    if (!item.readAt) {
      socialState.unreadCount = Math.max(0, socialState.unreadCount - 1);
    }
    try {
      await this.$api.notifications.deleteNotification(item.id);
    } catch (e) {
      const items = [ ...this.items ];
      items.splice(Math.max(0, index), 0, item);
      this.items = items;
      if (!item.readAt) {
        socialState.unreadCount += 1;
      }
      notifyError('Die Benachrichtigung konnte nicht gelöscht werden.');
    }
  }

  async markAllRead() {
    this.busy = true;
    try {
      await this.$api.notifications.markAllRead();
      const now = Date.now();
      this.items.forEach((item) => {
        item.readAt = item.readAt || now;
      });
      socialState.unreadCount = 0;
    } catch (e) {
      notifyError('Das hat nicht geklappt. Bitte versuche es erneut.');
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.page-notifications {
  color: var(--ink-primary);
}

.page-notifications__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
  margin-top: 20px;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.page-notifications__loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  color: var(--ink-muted);
}

.page-notifications__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background: var(--vision-card);
  overflow: hidden;
}

.page-notifications__item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  font-family: var(--font-ui);

  & + & {
    border-top: 1px solid var(--rule-soft);
  }
}

.page-notifications__item--unread {
  background: var(--rule-tint);
}

.page-notifications__icon {
  flex: none;
  margin-top: 2px;
  color: var(--ink-muted);
}

.page-notifications__item--unread .page-notifications__icon {
  color: var(--ink-link);
}

.page-notifications__text {
  flex: 1;
  min-width: 0;
}

.page-notifications__title {
  display: inline;
  font: 500 15px/22px var(--font-ui);
  color: var(--ink-primary);
  text-decoration: none;
  overflow-wrap: anywhere;
}

a.page-notifications__title {
  &:hover {
    color: var(--ink-link);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    border-radius: 4px;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-notifications__item--unread .page-notifications__title {
  font-weight: 600;
}

.page-notifications__body {
  margin: 2px 0 0;
  font: 400 14px/20px var(--font-ui);
  color: var(--ink-muted);
}

.page-notifications__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font: 400 12px/16px var(--font-ui);
  color: var(--ink-muted);
}

.page-notifications__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vision-now);
}

.page-notifications__actions {
  display: flex;
  flex: none;
  gap: 2px;
}

.page-notifications__icon-btn.q-btn {
  color: var(--ink-muted);

  &:hover {
    color: var(--ink-primary);
  }
}

.page-notifications__retention {
  margin: 10px 2px 0;
  font: 400 13px/18px var(--font-ui);
  color: var(--ink-muted);
}
</style>
