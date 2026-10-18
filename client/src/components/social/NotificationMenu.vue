<template>
  <div class="notification-menu">
    <div class="notification-menu__head">
      <h2 class="notification-menu__title">Benachrichtigungen</h2>
      <q-btn
        v-if="hasUnread"
        flat
        dense
        no-caps
        class="elpis-btn elpis-btn--ghost notification-menu__action"
        label="Alle als gelesen markieren"
        :disable="busy"
        @click="markAllRead"
      />
    </div>

    <div v-if="loading" class="notification-menu__loading" role="status">
      <q-spinner size="20px" />
      <span class="vision-sr-only">Benachrichtigungen werden geladen</span>
    </div>
    <p v-else-if="!items.length" class="notification-menu__empty">Keine neuen Benachrichtigungen.</p>
    <ul v-else class="notification-menu__list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="notification-menu__item"
          :class="{ 'notification-menu__item--unread': !item.readAt }"
          @click="open(item)"
        >
          <q-icon class="notification-menu__icon" :name="iconFor(item)" size="20px" aria-hidden="true" />
          <span class="notification-menu__text">
            <span class="notification-menu__item-title">{{ item.title }}</span>
            <span v-if="item.body" class="notification-menu__body">{{ item.body }}</span>
            <time class="notification-menu__time" :datetime="isoTime(item)" :title="absolute(item)">{{ relative(item) }}</time>
          </span>
          <span v-if="!item.readAt" class="notification-menu__dot">
            <span class="vision-sr-only">Ungelesen</span>
          </span>
        </button>
      </li>
    </ul>

    <div class="notification-menu__foot">
      <router-link to="/benachrichtigungen" class="notification-menu__all" @click="$emit('close')">
        Alle anzeigen
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import type { NotificationDto } from '@app/shared/dto/social/notification.dto';
import { DateTime } from 'luxon';
import { Options, Vue } from 'vue-class-component';
import { absoluteTime, isInternalLink, markUnavailable, notificationIcon, relativeTime, socialState } from './social-state';

// ER2 social — content of the top-bar bell menu: the last 10 notifications
// (icon by type, title, relative time, unread dot), "Alle als gelesen
// markieren" and "Alle anzeigen". Rendered inside a q-menu, so it mounts on
// every open and reloads then. Emits `close` after navigating.

@Options({
  name: 'NotificationMenu',
  emits: [ 'close' ],
})
export default class NotificationMenu extends Vue {
  items: NotificationDto[] = [];
  loading = true;
  busy = false;

  get hasUnread(): boolean {
    return this.items.some((item) => !item.readAt) || socialState.unreadCount > 0;
  }

  created() {
    void this.load();
  }

  async load() {
    try {
      this.items = await this.$api.notifications.getNotifications({ limit: 10 });
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

  isoTime(item: NotificationDto): string | undefined {
    return item.createdAt ? DateTime.fromMillis(item.createdAt).toISO() || undefined : undefined;
  }

  open(item: NotificationDto) {
    if (!item.readAt && item.id) {
      item.readAt = Date.now();
      socialState.unreadCount = Math.max(0, socialState.unreadCount - 1);
      this.$api.notifications.markRead(item.id).catch(() => {
        // Not fatal: the item stays unread on the server.
      });
    }
    this.$emit('close');
    if (isInternalLink(item.link)) {
      void this.$router.push(item.link);
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
      markUnavailable('notifications', e);
    } finally {
      this.busy = false;
    }
  }
}
</script>

<style lang="scss">
// Unscoped: rendered inside a teleported q-menu (see ShellHeader).
.notification-menu {
  width: min(360px, calc(100vw - 32px));
  font-family: var(--font-ui);
  color: var(--ink-primary);
}

.notification-menu__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 6px 6px 10px;
}

.notification-menu__title {
  margin: 0;
  font: 600 14px/20px var(--font-ui);
  letter-spacing: 0;
  text-align: left;
  color: var(--ink-primary);
}

.q-btn.notification-menu__action {
  font-size: 13px;
  min-height: 28px;
  padding: 0 8px;
}

.notification-menu__loading {
  display: flex;
  justify-content: center;
  padding: 18px 0;
  color: var(--ink-muted);
}

.notification-menu__empty {
  margin: 0;
  padding: 12px 10px 14px;
  font: 400 13px/20px var(--font-ui);
  color: var(--ink-muted);
}

.notification-menu__list {
  max-height: min(420px, calc(100vh - 200px));
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.notification-menu__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--glow-aether);
  }
}

.notification-menu__icon {
  flex: none;
  margin-top: 2px;
  color: var(--ink-muted);
}

.notification-menu__item--unread .notification-menu__icon {
  color: var(--ink-link);
}

.notification-menu__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.notification-menu__item-title {
  font: 500 14px/20px var(--font-ui);
  overflow-wrap: anywhere;
}

.notification-menu__item--unread .notification-menu__item-title {
  font-weight: 600;
}

.notification-menu__body {
  display: -webkit-box;
  overflow: hidden;
  font: 400 13px/18px var(--font-ui);
  color: var(--ink-muted);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-menu__time {
  font: 400 12px/16px var(--font-ui);
  color: var(--ink-muted);
}

.notification-menu__dot {
  flex: none;
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 50%;
  background: var(--vision-now);
}

.notification-menu__foot {
  display: flex;
  justify-content: center;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px solid var(--rule-soft);
}

.notification-menu__all {
  padding: 6px 10px;
  font: 600 13px/20px var(--font-ui);
  color: var(--ink-link);
  text-decoration: none;
  border-radius: 6px;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}
</style>
