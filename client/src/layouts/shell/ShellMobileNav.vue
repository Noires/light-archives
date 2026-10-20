<template>
  <nav class="shell-mobile-bar" aria-label="Hauptnavigation (mobil)">
    <router-link
      v-for="target in linkTargets"
      :key="target.key"
      :to="target.to"
      class="shell-mobile-bar__item"
      :class="{ 'shell-mobile-bar__item--active': target.active }"
      active-class=""
      exact-active-class=""
      :aria-current="target.active ? 'page' : undefined"
    >
      <q-icon :name="target.icon" size="22px" aria-hidden="true" />
      <span class="shell-mobile-bar__label">{{ target.label }}</span>
    </router-link>
    <button
      type="button"
      class="shell-mobile-bar__item"
      aria-haspopup="dialog"
      @click="$emit('open-search')"
    >
      <q-icon name="search" size="22px" aria-hidden="true" />
      <span class="shell-mobile-bar__label">Suche</span>
    </button>
    <button
      type="button"
      class="shell-mobile-bar__item"
      :class="{ 'shell-mobile-bar__item--active': sheetOpen }"
      aria-haspopup="dialog"
      :aria-expanded="sheetOpen ? 'true' : 'false'"
      @click="sheetOpen = true"
    >
      <q-icon name="menu" size="22px" aria-hidden="true" />
      <span class="shell-mobile-bar__label">Mehr</span>
    </button>
  </nav>

  <!-- QDialog renders role="dialog" + aria-modal on its root, traps focus,
       closes on Esc and refocuses the "Mehr" button on close. -->
  <q-dialog v-model="sheetOpen" position="bottom" class="shell-sheet-dialog" aria-labelledby="shell-sheet-title">
    <div class="shell-sheet">
      <div class="shell-sheet__head">
        <h2 id="shell-sheet-title" class="shell-sheet__title">Menü</h2>
        <q-btn
          flat
          round
          dense
          class="shell-sheet__icon-btn"
          :icon="themeIcon"
          :aria-label="themeAriaLabel"
          @click="toggleTheme"
        />
        <q-btn v-close-popup flat round dense class="shell-sheet__icon-btn" icon="close" aria-label="Schließen" />
      </div>

      <div class="shell-sheet__body">
        <section class="shell-sheet__section" aria-labelledby="shell-sheet-areas">
          <h3 id="shell-sheet-areas" class="shell-sheet__label">Bereiche</h3>
          <template v-for="area in sheetAreas" :key="area.key">
            <template v-if="area.menu">
              <button
                type="button"
                class="shell-sheet__row shell-sheet__toggle"
                :class="{ 'shell-sheet__toggle--current': isActive(area) }"
                :aria-expanded="expandedKey === area.key ? 'true' : 'false'"
                :aria-controls="`shell-sheet-sub-${area.key}`"
                @click="toggleArea(area.key)"
              >
                <q-icon :name="area.icon" size="20px" aria-hidden="true" />
                <span class="shell-sheet__row-label">{{ area.label }}</span>
                <q-icon
                  name="expand_more"
                  size="20px"
                  class="shell-sheet__chevron"
                  :class="{ 'shell-sheet__chevron--open': expandedKey === area.key }"
                  aria-hidden="true"
                />
              </button>
              <div v-show="expandedKey === area.key" :id="`shell-sheet-sub-${area.key}`" class="shell-sheet__sub">
                <template v-for="group in area.menu" :key="group.key">
                  <div v-if="group.label" class="shell-sheet__sublabel">{{ group.label }}</div>
                  <router-link
                    v-for="link in group.links"
                    :key="link.to"
                    :to="link.to"
                    class="shell-sheet__row"
                    active-class=""
                    exact-active-class="shell-sheet__row--active"
                  >
                    <q-icon :name="link.icon" size="20px" aria-hidden="true" />
                    <span>{{ link.label }}</span>
                  </router-link>
                </template>
              </div>
            </template>
            <router-link
              v-else
              :to="area.to"
              class="shell-sheet__row"
              :class="{ 'shell-sheet__row--active': isActive(area) }"
              active-class=""
              exact-active-class=""
              :aria-current="isActive(area) ? 'page' : undefined"
            >
              <q-icon :name="area.icon" size="20px" aria-hidden="true" />
              <span>{{ area.label }}</span>
            </router-link>
          </template>
        </section>

        <section v-if="showSocial" class="shell-sheet__section" aria-labelledby="shell-sheet-notifications">
          <h3 id="shell-sheet-notifications" class="shell-sheet__label">Für dich</h3>
          <router-link
            v-if="showNotifications"
            to="/benachrichtigungen"
            class="shell-sheet__row"
            active-class="shell-sheet__row--active"
            :aria-label="notificationsAriaLabel"
          >
            <q-icon :name="unreadCount > 0 ? 'notifications' : 'notifications_none'" size="20px" aria-hidden="true" />
            <span class="shell-sheet__row-label">Benachrichtigungen</span>
            <span v-if="unreadCount > 0" class="shell-sheet__count" aria-hidden="true">{{ unreadBadge }}</span>
          </router-link>
          <router-link
            v-if="showBookmarks"
            to="/gemerkt"
            class="shell-sheet__row"
            active-class="shell-sheet__row--active"
          >
            <q-icon name="bookmark_border" size="20px" aria-hidden="true" />
            <span class="shell-sheet__row-label">Gemerkt</span>
          </router-link>
        </section>
      </div>
    </div>
  </q-dialog>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { PRIMARY_AREAS, ShellNavArea, WIKI_AREA, isAreaActive } from './nav';
import { shellTheme, themeAriaLabel, themeIcon, toggleShellTheme } from './theme-state';
import { shellMenu } from './menu-state';
import { canUseSocial, socialState } from 'src/components/social/social-state';

// ER2-205 — below 1024px: fixed bottom bar (Start, Events, Charaktere,
// Suche, Mehr) and the "Mehr" bottom sheet: all areas (those with subpages
// expand in place, the current one starts open), the
// theme toggle and (ER2 social) links to notifications with the unread count
// and to bookmarks. ShellHeader polls the count; this reads the shared state. Account actions stay in
// the top bar's account pill. Emits `open-search` for the command palette.


@Options({
  name: 'ShellMobileNav',
  emits: ['open-search'],
  watch: {
    '$route.fullPath'() {
      (this as ShellMobileNav).sheetOpen = false;
    },
    sheetOpen(open: boolean) {
      const self = this as ShellMobileNav;
      if (open) {
        self.expandedKey = self.sheetAreas.find((area) => area.menu && self.isActive(area))?.key ?? null;
      }
    },
  },
})
export default class ShellMobileNav extends Vue {
  /** Area whose subpages are shown in the sheet (one at a time). */
  expandedKey: string | null = null;

  get sheetOpen(): boolean {
    return shellMenu.open;
  }

  set sheetOpen(value: boolean) {
    shellMenu.open = value;
  }

  get socialEnabled(): boolean {
    return canUseSocial(this.$store.getters.realRole);
  }

  get showNotifications(): boolean {
    return this.socialEnabled && !socialState.unavailable.notifications;
  }

  get showBookmarks(): boolean {
    return this.socialEnabled && !socialState.unavailable.bookmarks;
  }

  get showSocial(): boolean {
    return this.showNotifications || this.showBookmarks;
  }

  get unreadCount(): number {
    return socialState.unreadCount;
  }

  get unreadBadge(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  get notificationsAriaLabel(): string {
    return this.unreadCount > 0 ? `Benachrichtigungen, ${this.unreadCount} ungelesen` : 'Benachrichtigungen';
  }

  get linkTargets() {
    const path = this.$route.path;
    const byKey = (key: string) => PRIMARY_AREAS.find((area) => area.key === key)!;
    const events = byKey('events');
    const characters = byKey('characters');
    return [
      { key: 'start', label: 'Start', icon: 'home', to: '/', active: path === '/' },
      { key: events.key, label: events.label, icon: events.icon, to: events.to, active: isAreaActive(events, path) },
      {
        key: characters.key,
        label: characters.label,
        icon: characters.icon,
        to: characters.to,
        active: isAreaActive(characters, path),
      },
    ];
  }

  get sheetAreas(): ShellNavArea[] {
    // All areas, also those in the bottom bar: the sheet is also opened from the
    // top-bar menu button, where it must work as the complete navigation.
    return [...PRIMARY_AREAS, WIKI_AREA];
  }

  isActive(area: ShellNavArea): boolean {
    return isAreaActive(area, this.$route.path);
  }

  toggleArea(key: string) {
    this.expandedKey = this.expandedKey === key ? null : key;
  }

  get themeIcon(): string {
    return themeIcon(shellTheme.mode, this.$q.dark.isActive);
  }

  get themeAriaLabel(): string {
    return themeAriaLabel(shellTheme.mode);
  }

  toggleTheme() {
    toggleShellTheme();
  }
}
</script>

<style lang="scss">
// Unscoped: the sheet is teleported. Hidden from 1024px up.

.shell-mobile-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: none;
  align-items: stretch;
  height: calc(var(--shell-mobile-bar-height) + env(safe-area-inset-bottom, 0px));
  padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
  color: var(--ink-muted);
  background: var(--surface-glass);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  border-top: 1px solid var(--rule-soft);
  box-shadow: 0 -4px 18px rgba(43, 36, 24, 0.08);
}

body.body--dark .shell-mobile-bar {
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.35);
}

body {
  --shell-mobile-bar-height: 60px;
}

.shell-mobile-bar__item {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  min-height: 48px;
  padding: 6px 2px;
  font-family: var(--font-ui);
  color: var(--ink-muted);
  text-decoration: none;
  background: transparent;
  border: 0;
  border-bottom: none;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-elpis);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 28%;
    right: 28%;
    height: 2px;
    border-radius: 0 0 2px 2px;
    background: transparent;
  }

  &:hover {
    color: var(--ink-primary);
  }

  &:focus-visible {
    outline: none;
    color: var(--ink-primary);
    box-shadow: inset 0 0 0 2px var(--glow-aether);
    border-radius: 8px;
  }
}

.shell-mobile-bar__item--active {
  color: var(--ink-primary);

  &::before {
    background: var(--rule-strong);
  }
}

.shell-mobile-bar__label {
  max-width: 100%;
  overflow: hidden;
  font: 600 11px/14px var(--font-ui);
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media screen and (max-width: 1023px) {
  .shell-mobile-bar {
    display: flex;
  }

  // Keep the footer and page end clear of the fixed bar.
  .q-layout {
    padding-bottom: calc(var(--shell-mobile-bar-height) + env(safe-area-inset-bottom, 0px));
  }
}

// Sheet

.q-dialog__inner--minimized > div.shell-sheet {
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 48px);
}

.shell-sheet-dialog .q-dialog__inner--bottom {
  padding: 0;
}

.shell-sheet {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-ui);
  color: var(--ink-primary);
  background: var(--surface-raised);
  border: 1px solid var(--rule-soft);
  border-bottom: 0;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -12px 40px rgba(43, 36, 24, 0.2);
}

body.body--dark .shell-sheet {
  box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.55);
}

.shell-sheet__head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 12px 8px 20px;
  border-bottom: 1px solid var(--rule-soft);
}

.shell-sheet__title {
  text-align: left;
  flex: 1;
  margin: 0;
  font: 600 16px/24px var(--font-ui);
  letter-spacing: 0;
  color: var(--ink-primary);
}

.shell-sheet__icon-btn.q-btn {
  color: var(--ink-muted);
}

.shell-sheet__body {
  overflow-y: auto;
  padding: 8px 12px calc(16px + env(safe-area-inset-bottom, 0px));
  overscroll-behavior: contain;
}

.shell-sheet__section + .shell-sheet__section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--rule-soft);
}

.shell-sheet__label {
  margin: 0;
  padding: 8px 8px 6px;
  font: 600 11px/16px var(--font-ui);
  letter-spacing: var(--ls-eyebrow, 0.08em);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.shell-sheet__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 8px;
  font: 500 15px/20px var(--font-ui);
  color: var(--ink-primary);
  text-decoration: none;
  border-bottom: none;
  border-radius: 8px;

  .q-icon {
    color: var(--ink-muted);
  }

  &:hover {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--glow-aether);
  }
}

.shell-sheet__row--active {
  background: var(--rule-tint);
  box-shadow: inset 2px 0 0 var(--rule-strong);
}

.shell-sheet__toggle {
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.shell-sheet__toggle--current {
  font-weight: 600;
}

.shell-sheet__chevron {
  transition: transform var(--motion-fast) var(--ease-elpis);
}

.shell-sheet__chevron--open {
  transform: rotate(180deg);
}

.shell-sheet__sub {
  margin: 0 0 4px 18px;
  padding-left: 8px;
  border-left: 1px solid var(--rule-soft);
}

.shell-sheet__sublabel {
  padding: 8px 8px 2px;
  font: 600 11px/16px var(--font-ui);
  letter-spacing: var(--ls-eyebrow, 0.08em);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.shell-sheet__row-label {
  flex: 1;
  min-width: 0;
}

.shell-sheet__count {
  flex: none;
  min-width: 22px;
  padding: 0 7px;
  font: 700 12px/22px var(--font-ui);
  color: var(--vision-on-now);
  text-align: center;
  background: var(--vision-now);
  border-radius: 999px;
}

.shell-sheet__empty {
  margin: 0;
  padding: 4px 8px 8px;
  font: 400 14px/20px var(--font-ui);
  color: var(--ink-muted);
}
</style>
