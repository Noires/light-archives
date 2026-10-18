<template>
  <q-header class="shell-bar">
    <div class="shell-bar__inner">
      <router-link to="/" class="shell-bar__logo" aria-label="Elpisgarten, zur Startseite">
        <shell-logo img-class="shell-bar__logo-img" alt="" :width="186" :height="29" />
      </router-link>

      <nav class="shell-bar__nav" aria-label="Hauptnavigation">
        <router-link
          v-for="area in primaryAreas"
          :key="area.key"
          :to="area.to"
          class="shell-bar__nav-item"
          :class="{ 'shell-bar__nav-item--active': isActive(area) }"
          active-class=""
          exact-active-class=""
          :aria-current="isActive(area) ? 'page' : undefined"
        >
          {{ area.label }}
        </router-link>

        <router-link
          :to="wikiArea.to"
          class="shell-bar__nav-item"
          :class="{ 'shell-bar__nav-item--active': isActive(wikiArea) }"
          active-class=""
          exact-active-class=""
          :aria-current="isActive(wikiArea) ? 'page' : undefined"
        >
          {{ wikiArea.label }}
        </router-link>

        <button
          type="button"
          class="shell-bar__nav-item shell-bar__nav-trigger"
          :class="{ 'shell-bar__nav-item--active': isMoreActive }"
          aria-haspopup="menu"
          :aria-expanded="moreMenuOpen ? 'true' : 'false'"
        >
          Mehr
          <q-icon name="expand_more" size="16px" aria-hidden="true" />
          <q-menu
            v-model="moreMenuOpen"
            anchor="bottom left"
            self="top left"
            :offset="[0, 6]"
            class="shell-menu"
          >
            <q-list dense class="shell-menu__list">
              <template v-for="(group, index) in moreGroups" :key="group.key">
                <q-separator v-if="index > 0" class="shell-menu__sep" />
                <q-item-label header class="shell-menu__header">{{ group.label }}</q-item-label>
                <q-item
                  v-for="link in group.links"
                  :key="link.to"
                  clickable
                  v-close-popup
                  :to="link.to"
                  :exact="link.to === '/'"
                  class="shell-menu__item"
                  active-class="shell-menu__item--active"
                >
                  <q-item-section avatar><q-icon :name="link.icon" size="18px" /></q-item-section>
                  <q-item-section>{{ link.label }}</q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-menu>
        </button>
      </nav>

      <div class="shell-bar__spacer" />

      <button
        type="button"
        class="shell-bar__search"
        aria-label="Suchen (Strg K)"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        @click="$emit('open-search')"
      >
        <q-icon name="search" size="18px" aria-hidden="true" />
        <span class="shell-bar__search-label">Suchen…</span>
        <kbd class="shell-bar__kbd">Strg K</kbd>
      </button>

      <q-btn
        v-if="showNotifications"
        flat
        round
        dense
        class="shell-bar__icon-btn shell-bar__notifications"
        :icon="unreadCount > 0 ? 'notifications' : 'notifications_none'"
        :aria-label="notificationsAriaLabel"
      >
        <span v-if="unreadCount > 0" class="shell-bar__badge" aria-hidden="true">{{ unreadBadge }}</span>
        <q-menu
          v-model="notificationsMenuOpen"
          anchor="bottom right"
          self="top right"
          :offset="[0, 6]"
          class="shell-menu shell-notifications-menu"
          @show="refreshUnread(true)"
        >
          <notification-menu @close="notificationsMenuOpen = false" />
        </q-menu>
      </q-btn>

      <q-btn
        flat
        round
        dense
        class="shell-bar__icon-btn shell-bar__theme"
        :icon="themeIcon"
        :aria-label="themeAriaLabel"
        @click="onThemeToggleClick"
      >
        <q-tooltip>{{ themeTooltipLabel }}</q-tooltip>
      </q-btn>

      <button
        type="button"
        class="shell-bar__account"
        :class="{ 'shell-bar__account--guest': !isLoggedIn }"
        aria-haspopup="menu"
        :aria-expanded="accountMenuOpen ? 'true' : 'false'"
        :aria-label="accountAriaLabel"
      >
        <template v-if="character">
          <aetheryte-badge
            class="shell-bar__avatar"
            size="xs"
            shape="round"
            :glyph-corners="false"
            :src="character.avatar"
            alt=""
          />
          <span class="shell-bar__account-text">
            <span class="shell-bar__account-name">{{ character.name }}</span>
            <span v-if="accountStatus" class="shell-bar__account-status">{{ accountStatus }}</span>
          </span>
        </template>
        <template v-else-if="isLoggedIn">
          <q-icon name="account_circle" size="24px" aria-hidden="true" />
          <span class="shell-bar__account-text">
            <span class="shell-bar__account-name">Konto</span>
          </span>
        </template>
        <template v-else>
          <q-icon name="login" size="20px" aria-hidden="true" />
          <span class="shell-bar__account-text">
            <span class="shell-bar__account-name">Anmelden</span>
          </span>
        </template>
        <q-icon class="shell-bar__account-caret" name="expand_more" size="16px" aria-hidden="true" />
        <q-menu
          v-model="accountMenuOpen"
          anchor="bottom right"
          self="top right"
          :offset="[0, 6]"
          class="shell-menu shell-account-menu"
        >
          <div class="shell-account-menu__body" @click="onAccountMenuClick">
            <user-menu />
          </div>
        </q-menu>
      </button>
    </div>
  </q-header>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import AetheryteBadge from 'src/components/aetherium/AetheryteBadge.vue';
import UserMenu from 'src/components/sidebar/UserMenu.vue';
import NotificationMenu from 'src/components/social/NotificationMenu.vue';
import { canUseSocial, markUnavailable, resetSocialState, socialState } from 'src/components/social/social-state';
import ShellLogo from './ShellLogo.vue';
import {
  MORE_GROUPS,
  PRIMARY_AREAS,
  ShellNavArea,
  ShellNavGroup,
  WIKI_AREA,
  WIKI_LINKS,
  isAreaActive,
  isLinkActive,
} from './nav';
import { shellTheme, themeAriaLabel, themeIcon, themeTooltip, toggleShellTheme } from './theme-state';

// ER2-201 — compact top bar: logo, seven primary areas (Wiki links to the
// /wiki index), "Mehr", search pill,
// notifications slot, theme toggle and the account pill (UserMenu in a
// q-menu). Emits `open-search` for the command palette. The nav model lives
// in ./nav.ts. Unscoped styles: the q-menu content is teleported.
//
// ER2 social: the bell polls the unread count every 60 s and on route
// change while the tab is visible (logged-in, verified accounts only). It
// disappears for guests and when the API has no notifications endpoint.

const UNREAD_POLL_MS = 60000;
const UNREAD_MIN_GAP_MS = 5000;

@Options({
  name: 'ShellHeader',
  components: {
    AetheryteBadge,
    NotificationMenu,
    ShellLogo,
    UserMenu,
  },
  emits: ['open-search'],
  watch: {
    '$route.fullPath'() {
      const self = this as ShellHeader;
      self.accountMenuOpen = false;
      self.moreMenuOpen = false;
      self.notificationsMenuOpen = false;
      self.refreshUnread();
    },
    socialEnabled(enabled: boolean) {
      const self = this as ShellHeader;
      resetSocialState();
      self.stopPolling();
      if (enabled) {
        self.startPolling();
      }
    },
  },
})
export default class ShellHeader extends Vue {
  readonly primaryAreas = PRIMARY_AREAS;
  readonly wikiArea = WIKI_AREA;
  // ER2-609 follow-up: Wiki is a plain link to /wiki now; the former
  // "Wissenswertes" pages move into the Mehr menu.
  readonly moreGroups: ShellNavGroup[] = [
    ...MORE_GROUPS,
    { key: 'knowledge', label: 'Wissenswertes', links: WIKI_LINKS.filter((link) => link.to !== '/wiki') },
  ];

  moreMenuOpen = false;
  accountMenuOpen = false;
  notificationsMenuOpen = false;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastUnreadFetch = 0;
  private readonly onVisibilityChange = () => {
    if (document.hidden) {
      this.stopTimer();
    } else if (this.socialEnabled) {
      this.startPolling();
    }
  };

  get socialEnabled(): boolean {
    return canUseSocial(this.$store.getters.realRole);
  }

  get showNotifications(): boolean {
    return this.socialEnabled && !socialState.unavailable.notifications;
  }

  get unreadCount(): number {
    return socialState.unreadCount;
  }

  get unreadBadge(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  get notificationsAriaLabel(): string {
    if (this.unreadCount === 1) {
      return 'Benachrichtigungen, 1 ungelesen';
    }
    return this.unreadCount > 0 ? `Benachrichtigungen, ${this.unreadCount} ungelesen` : 'Benachrichtigungen';
  }

  mounted() {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (this.socialEnabled) {
      this.startPolling();
    }
  }

  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stopPolling();
  }

  startPolling() {
    this.stopTimer();
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }
    this.refreshUnread(true);
    this.pollTimer = setInterval(() => this.refreshUnread(true), UNREAD_POLL_MS);
  }

  private stopTimer() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  stopPolling() {
    this.stopTimer();
  }

  refreshUnread(force = false) {
    if (!this.showNotifications || (typeof document !== 'undefined' && document.hidden)) {
      return;
    }
    const now = Date.now();
    if (!force && now - this.lastUnreadFetch < UNREAD_MIN_GAP_MS) {
      return;
    }
    this.lastUnreadFetch = now;
    this.$api.notifications.getUnreadCount()
      .then((result) => {
        socialState.unreadCount = Math.max(0, result?.count || 0);
      })
      .catch((e) => {
        if (markUnavailable('notifications', e)) {
          this.stopTimer();
        }
      });
  }

  get character() {
    return this.$store.getters.character;
  }

  get isLoggedIn(): boolean {
    return !!this.$store.getters.role;
  }

  // Placeholder until RP presence (ER2-806) exists; renders nothing when empty.
  get accountStatus(): string {
    return '';
  }

  get accountAriaLabel(): string {
    if (this.character) {
      return `Kontomenü für ${this.character.name}`;
    }
    return this.isLoggedIn ? 'Kontomenü' : 'Anmelden';
  }

  isActive(area: ShellNavArea): boolean {
    return isAreaActive(area, this.$route.path);
  }

  get isMoreActive(): boolean {
    const path = this.$route.path;
    if (path === '/' || PRIMARY_AREAS.some((area) => isAreaActive(area, path)) || isAreaActive(WIKI_AREA, path)) {
      return false;
    }
    return MORE_GROUPS.some((group) => group.links.some((link) => isLinkActive(link, path)));
  }

  onAccountMenuClick(event: MouseEvent) {
    // UserMenu items have no v-close-popup; close once an item was chosen.
    const target = event.target as HTMLElement | null;
    if (target?.closest('.q-item')) {
      this.accountMenuOpen = false;
    }
  }

  get themeIcon(): string {
    return themeIcon(shellTheme.mode, this.$q.dark.isActive);
  }

  get themeTooltipLabel(): string {
    return themeTooltip(shellTheme.mode, this.$q.dark.isActive);
  }

  get themeAriaLabel(): string {
    return themeAriaLabel(shellTheme.mode);
  }

  onThemeToggleClick() {
    toggleShellTheme();
  }
}
</script>

<style lang="scss">
// Top bar and its menus. Unscoped on purpose: q-menu content is teleported
// out of this component. Colours are Aetherium roles only, so Hydaelyn and
// Zodiark need no overrides beyond the shadow.

body {
  --nav-height: 68px;
}

.q-header.shell-bar {
  color: var(--ink-primary);
  background: var(--surface-glass);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  border-bottom: 1px solid var(--rule-soft);
  box-shadow: 0 4px 18px rgba(43, 36, 24, 0.08);
  border-radius: 0;
}

body.body--dark .q-header.shell-bar {
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

.shell-bar__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  height: var(--nav-height);
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
  // viewport-fit=cover (index.template.html): keep clear of the notch in landscape.
  padding-left: max(24px, env(safe-area-inset-left, 0px));
  padding-right: max(24px, env(safe-area-inset-right, 0px));
  font-family: var(--font-ui);
}

.shell-bar__logo {
  display: inline-flex;
  align-items: center;
  flex: none;
  border-radius: 6px;
  border-bottom: none;
  text-decoration: none;
}

.shell-bar__logo-img {
  display: block;
  width: 186px;
  height: auto;
  max-height: 29px;
}

.shell-bar__nav {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  gap: 2px;
  min-width: 0;
}

.shell-bar__nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 10px;
  font: 600 14px/20px var(--font-ui);
  color: var(--ink-muted);
  white-space: nowrap;
  text-decoration: none;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-elpis);

  &::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 16px;
    height: 2px;
    border-radius: 2px;
    background: transparent;
    transition: background-color var(--motion-fast) var(--ease-elpis);
  }

  &:hover {
    color: var(--ink-primary);

    &::after {
      background: var(--rule-soft);
    }
  }

  &:focus-visible {
    outline: none;
    color: var(--ink-primary);
    box-shadow: inset 0 0 0 2px var(--glow-aether);
    border-radius: 6px;
  }

  .q-icon {
    color: inherit;
  }
}

.shell-bar__nav-item--active,
.shell-bar__nav-item--active:hover {
  color: var(--ink-primary);

  &::after {
    background: var(--rule-strong);
  }
}

.shell-bar__nav-trigger::after {
  right: 26px;
}

.shell-bar__spacer {
  flex: 1;
  min-width: 0;
}

.shell-bar__search {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  width: 220px;
  height: 36px;
  padding: 0 6px 0 12px;
  font: 400 14px/20px var(--font-ui);
  color: var(--ink-muted);
  text-align: left;
  background: var(--rule-tint);
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--ease-elpis), background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.shell-bar__search-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.shell-bar__kbd {
  flex: none;
  padding: 1px 6px;
  font: 500 11px/18px var(--font-ui);
  color: var(--ink-muted);
  background: var(--surface-raised);
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
}

.shell-bar__icon-btn.q-btn {
  flex: none;
  color: var(--ink-muted);

  &:hover {
    color: var(--ink-primary);
  }
}

.shell-bar__notifications.q-btn {
  position: relative;
}

// Unread badge: --vision-now with --vision-on-now (6.4:1 Hydaelyn, AA Zodiark).
.shell-bar__badge {
  position: absolute;
  top: 0;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font: 700 11px/18px var(--font-ui);
  color: var(--vision-on-now);
  text-align: center;
  background: var(--vision-now);
  border: 2px solid var(--surface-raised);
  border-radius: 999px;
  box-sizing: content-box;
  pointer-events: none;
}

.shell-notifications-menu.q-menu {
  padding: 4px;
}

.shell-bar__account {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: none;
  max-width: 240px;
  height: 40px;
  padding: 0 8px 0 4px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
  text-align: left;
  background: transparent;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--ease-elpis), background-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background: var(--rule-tint);
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }

  > .q-icon {
    color: var(--ink-muted);
  }
}

.shell-bar__account--guest {
  padding-left: 12px;
}

.shell-bar__avatar {
  flex: none;
  width: 30px;
  height: 30px;
}

.shell-bar__account-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shell-bar__account-name,
.shell-bar__account-status {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.shell-bar__account-name {
  font: 600 13px/18px var(--font-ui);
}

.shell-bar__account-status {
  font: 400 11px/14px var(--font-ui);
  color: var(--ink-muted);
}

// Menus (Wiki, Mehr, notifications, account)

.shell-menu.q-menu {
  min-width: 240px;
  padding: 6px;
  color: var(--ink-primary);
  background: var(--surface-raised);
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(43, 36, 24, 0.18);
}

body.body--dark .shell-menu.q-menu {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
}

.shell-menu__list {
  padding: 0;
}

.shell-menu__header.q-item__label--header {
  padding: 8px 10px 4px;
  font: 600 11px/16px var(--font-ui);
  letter-spacing: var(--ls-eyebrow, 0.08em);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.shell-menu__item.q-item {
  min-height: 38px;
  padding: 6px 10px;
  border-radius: 8px;
  font: 500 14px/20px var(--font-ui);
  color: var(--ink-primary);

  .q-item__section--avatar {
    min-width: 30px;
    color: var(--ink-muted);
  }
}

.shell-menu__item--active.q-item {
  background: var(--rule-tint);
  box-shadow: inset 2px 0 0 var(--rule-strong);
}

.shell-menu__sep.q-separator {
  margin: 6px 4px;
  background: var(--rule-soft);
}

.shell-menu__panel {
  padding: 10px 12px;
  min-width: 260px;
}

.shell-menu__empty {
  margin: 0;
  font: 400 13px/20px var(--font-ui);
  color: var(--ink-muted);
}

// Account menu: re-hosts components/sidebar/UserMenu.vue. Its q-list is
// `dark` (built for the old drawer), so re-ink it with Aetherium roles.
.shell-account-menu.q-menu {
  min-width: 260px;
  max-height: calc(100vh - 96px);
}

.shell-account-menu .user-menu.q-list {
  color: var(--ink-primary);
  padding: 0;
}

.shell-account-menu .user-menu .q-item {
  min-height: 38px;
  padding: 6px 10px;
  border-radius: 8px;
  font: 500 14px/20px var(--font-ui);
  color: var(--ink-primary);
}

.shell-account-menu .user-menu .q-item.q-router-link--active {
  background: var(--rule-tint);
}

.shell-account-menu .user-menu .q-separator {
  margin: 6px 4px;
  background: var(--rule-soft);
}

.shell-account-menu .user-menu .q-item.user-menu__discord-login {
  margin: 4px !important;
  color: #ffffff;
}

// Breakpoints: full bar from 1280px; 1024–1279px compacts the search pill
// and the account pill; below 1024px the nav moves to the mobile bars.

@media screen and (max-width: 1279px) {
  .shell-bar__inner {
    gap: 10px;
    padding: 0 16px;
  }

  .shell-bar__logo-img {
    width: 150px;
  }

  .shell-bar__nav-item {
    padding: 0 7px;
    font-size: 13px;

    &::after {
      left: 7px;
      right: 7px;
    }
  }

  .shell-bar__nav-trigger::after {
    right: 23px;
  }

  .shell-bar__search {
    width: 40px;
    padding: 0;
    justify-content: center;
  }

  .shell-bar__search-label,
  .shell-bar__kbd,
  .shell-bar__account-text,
  .shell-bar__account-caret {
    display: none;
  }

  .shell-bar__account {
    padding: 0 4px;
  }

  .shell-bar__account--guest {
    padding: 0 9px;
  }
}

@media screen and (max-width: 1023px) {
  .shell-bar__nav {
    display: none;
  }

  .shell-bar__search {
    flex: 1 1 auto;
    width: auto;
    max-width: 260px;
    padding: 0 6px 0 12px;
    justify-content: flex-start;
  }

  .shell-bar__search-label {
    display: block;
  }

  // ER2-205: notifications and theme move into the mobile "Mehr" sheet.
  .shell-bar__notifications,
  .shell-bar__theme {
    display: none;
  }

  .shell-bar__search {
    margin-left: auto;
  }
}

@media screen and (max-width: 599px) {
  body {
    --nav-height: 56px;
  }

  .shell-bar__inner {
    padding: 0 12px;
  }

  .shell-bar__logo-img {
    width: 120px;
  }
}
</style>
