<template>
  <q-header class="shell-bar">
    <div
      ref="frame"
      class="shell-bar__frame"
      :class="{ 'shell-bar__frame--ignite': igniting, 'shell-bar__frame--glint': glinting }"
      @pointermove="onFramePointerMove"
    >
      <div class="shell-bar__inner">
        <router-link ref="logo" to="/" class="shell-bar__logo" aria-label="Elpisgarten, zur Startseite">
          <shell-logo img-class="shell-bar__logo-img" alt="" :width="186" :height="29" />
          <!-- Decorative motes: fireflies in Zodiark, Elpis petals in Hydaelyn drifting along the bottom of the logo facet. -->
          <span class="shell-bar__fireflies" aria-hidden="true">
            <i
              v-for="(fly, flyIndex) in fireflies"
              :key="flyIndex"
              class="shell-bar__firefly"
              :style="{ '--fx': fly.x + '%', '--fd': fly.d + 's', '--fdelay': fly.delay + 's', '--fdx': fly.dx + 'px', '--fdy': fly.dy + 'px' }"
            ><span class="shell-bar__petal" /></i>
          </span>
        </router-link>

        <nav ref="nav" class="shell-bar__nav" aria-label="Hauptnavigation">
          <template v-for="(area, areaIndex) in navAreas" :key="area.key">
            <!-- APG disclosure navigation: a button with aria-expanded and
                 aria-controls, no menu roles. QMenu closes on Esc and returns
                 focus to the button. -->
            <button
              v-if="area.menu"
              type="button"
              class="shell-bar__nav-item shell-bar__nav-trigger"
              :class="{ 'shell-bar__nav-item--active': isActive(area) }"
              :style="{ '--i': areaIndex }"
              :aria-expanded="openMenuKey === area.key ? 'true' : 'false'"
              :aria-controls="`shell-menu-${area.key}`"
            >
              {{ area.label }}
              <span class="shell-bar__chev" aria-hidden="true" />
              <q-menu
                :model-value="openMenuKey === area.key"
                anchor="bottom left"
                self="top left"
                :offset="[0, 0]"
                transition-show="kiel"
                transition-hide="kiel"
                :transition-duration="260"
                class="shell-menu"
                @update:model-value="setMenuOpen(area.key, $event)"
              >
                <div :id="`shell-menu-${area.key}`" class="shell-menu__facet">
                  <q-list dense class="shell-menu__list">
                    <template v-for="(group, index) in area.menu" :key="group.key">
                      <q-separator v-if="index > 0" class="shell-menu__sep" />
                      <q-item-label v-if="group.label" header class="shell-menu__header">{{ group.label }}</q-item-label>
                      <q-item
                        v-for="(link, linkIndex) in group.links"
                        :key="link.to"
                        :style="{ '--i': menuItemIndex(area, index, linkIndex) }"
                        clickable
                        v-close-popup
                        :to="link.to"
                        exact
                        class="shell-menu__item"
                        active-class="shell-menu__item--active"
                      >
                        <q-item-section avatar><q-icon :name="link.icon" size="18px" /></q-item-section>
                        <q-item-section>{{ link.label }}</q-item-section>
                      </q-item>
                    </template>
                  </q-list>
                </div>
              </q-menu>
            </button>
            <router-link
              v-else
              :to="area.to"
              class="shell-bar__nav-item"
              :class="{ 'shell-bar__nav-item--active': isActive(area) }"
              :style="{ '--i': areaIndex }"
              active-class=""
              exact-active-class=""
              :aria-current="isActive(area) ? 'page' : undefined"
            >
              {{ area.label }}
            </router-link>
          </template>
          <!-- One indicator for the current area: it glides along the seam on
               route changes instead of each item drawing its own. -->
          <span ref="indShaft" class="shell-bar__ind shell-bar__ind--shaft" aria-hidden="true" />
          <span ref="indLine" class="shell-bar__ind shell-bar__ind--line" aria-hidden="true" />
          <span ref="indNode" class="shell-bar__ind shell-bar__ind--node" aria-hidden="true" />
          <span ref="flare" class="shell-bar__flare" aria-hidden="true" />
        </nav>

        <div class="shell-bar__spacer" />

        <button
          type="button"
          class="shell-bar__search"
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K Meta+K"
          @click="$emit('open-search')"
        >
          <q-icon name="search" size="18px" aria-hidden="true" />
          <span class="shell-bar__search-label">Suchen…</span>
          <kbd class="shell-bar__kbd">Strg K</kbd>
        </button>

        <!-- Square full-height cells between hairlines (ER1). -->
        <div class="shell-bar__cells">
          <q-btn
            v-if="showNotifications"
            flat
            dense
            square
            class="shell-bar__cell shell-bar__notifications"
            :icon="unreadCount > 0 ? 'notifications' : 'notifications_none'"
            :aria-label="notificationsAriaLabel"
          >
            <span v-if="unreadCount > 0" class="shell-bar__badge" aria-hidden="true">{{ unreadBadge }}</span>
            <q-menu
              v-model="notificationsMenuOpen"
              anchor="bottom right"
              self="top right"
              :offset="[0, 0]"
              transition-show="kiel"
              transition-hide="kiel"
              :transition-duration="260"
              class="shell-menu shell-notifications-menu"
              @show="refreshUnread(true)"
            >
              <div class="shell-menu__facet">
                <notification-menu @close="notificationsMenuOpen = false" />
              </div>
            </q-menu>
          </q-btn>

          <q-btn
            flat
            dense
            square
            class="shell-bar__cell shell-bar__theme"
            :aria-label="themeAriaLabel"
            @click="onThemeToggleClick($event)"
          >
            <span class="shell-bar__crystal" aria-hidden="true" />
            <q-icon class="shell-bar__crystal-icon" :name="themeIcon" size="14px" aria-hidden="true" />
            <q-tooltip>{{ themeTooltipLabel }}</q-tooltip>
          </q-btn>

          <!-- Below 1024px the nav links leave the top bar; this opens the same
               menu sheet as "Mehr" in the bottom bar. -->
          <q-btn
            flat
            dense
            square
            class="shell-bar__cell shell-bar__menu"
            icon="menu"
            aria-label="Menü öffnen"
            aria-haspopup="dialog"
            @click="openMenu"
          />
        </div>

        <button
          type="button"
          class="shell-bar__account"
          :class="{ 'shell-bar__account--guest': !isLoggedIn }"
          aria-haspopup="menu"
          :aria-expanded="accountMenuOpen ? 'true' : 'false'"
          :aria-label="accountAriaLabel"
        >
          <template v-if="character">
            <span class="shell-bar__avatar-facet">
              <aetheryte-badge
                class="shell-bar__avatar"
                size="xs"
                shape="square"
                :glyph-corners="false"
                :src="character.avatar"
                alt=""
              />
            </span>
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
          <span class="shell-bar__chev shell-bar__account-caret" aria-hidden="true" />
          <q-menu
            v-model="accountMenuOpen"
            anchor="bottom right"
            self="top right"
            :offset="[0, 0]"
            transition-show="kiel"
            transition-hide="kiel"
            :transition-duration="260"
            class="shell-menu shell-account-menu"
          >
            <div class="shell-menu__facet shell-account-menu__body" @click="onAccountMenuClick">
              <user-menu />
            </div>
          </q-menu>
        </button>
      </div>
      <span class="shell-bar__glint" aria-hidden="true" />
      <span v-if="readingRoute" class="shell-bar__read" aria-hidden="true" />
    </div>
  </q-header>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import AetheryteBadge from 'src/components/aetherium/AetheryteBadge.vue';
import UserMenu from 'src/components/sidebar/UserMenu.vue';
import NotificationMenu from 'src/components/social/NotificationMenu.vue';
import { canUseSocial, ensureBookmarkKeys, markUnavailable, resetSocialState, socialState } from 'src/components/social/social-state';
import ShellLogo from './ShellLogo.vue';
import { PRIMARY_AREAS, ShellNavArea, WIKI_AREA, isAreaActive } from './nav';
import { openShellMenu } from './menu-state';
import { isReadingRoute, prefersReducedMotion, shouldIgnite, startThemeWipe } from './seam-motion';
import { shellTheme, themeAriaLabel, themeIcon, themeTooltip, toggleShellTheme } from './theme-state';

// ER2-201 — compact top bar: logo, seven primary areas (Wiki links to the
// /wiki index; Gruppen, Treffpunkte, Galerie and Wiki open a dropdown of
// their subpages), search pill, notifications slot, theme toggle and the account pill (UserMenu in a
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
      self.openMenuKey = null;
      self.notificationsMenuOpen = false;
      self.refreshUnread();
      void self.$nextTick(() => self.positionIndicator(true));
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
  openMenu(): void {
    openShellMenu();
  }

  readonly navAreas: ShellNavArea[] = [...PRIMARY_AREAS, WIKI_AREA];

  /** Key of the area whose dropdown is open (one at a time). */
  openMenuKey: string | null = null;
  accountMenuOpen = false;
  notificationsMenuOpen = false;

  /** Fireflies under the logo: start (% of the facet), period, delay and drift. */
  readonly fireflies = [
    { x: 6, d: 7.4, delay: 0, dx: 8, dy: -12 },
    { x: 21, d: 9.1, delay: 2.3, dx: -6, dy: -16 },
    { x: 37, d: 6.6, delay: 4.1, dx: 10, dy: -10 },
    { x: 52, d: 8.3, delay: 1.2, dx: -9, dy: -14 },
    { x: 66, d: 7.8, delay: 5.6, dx: 7, dy: -18 },
    { x: 80, d: 9.6, delay: 3.2, dx: -7, dy: -11 },
    { x: 92, d: 6.9, delay: 6.8, dx: 5, dy: -15 },
  ];

  /** First visit in the session: entrance sequence, then one seam glint. */
  igniting = false;
  glinting = false;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private navObserver: ResizeObserver | null = null;
  private motionTimers: ReturnType<typeof setTimeout>[] = [];
  private indicatorX: number | null = null;
  private highlightFrame = 0;
  private finePointer = false;
  private lastUnreadFetch = 0;
  private visibilityListener: (() => void) | null = null;

  onVisibilityChange() {
    if (document.hidden) {
      this.stopTimer();
    } else if (this.socialEnabled) {
      this.startPolling();
    }
  }

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
    this.visibilityListener = () => this.onVisibilityChange();
    document.addEventListener('visibilitychange', this.visibilityListener);
    if (this.socialEnabled) {
      this.startPolling();
    }
    this.finePointer = !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    this.positionIndicator(false);
    void document.fonts?.ready.then(() => this.positionIndicator(false));
    if (typeof ResizeObserver !== 'undefined') {
      this.navObserver = new ResizeObserver(() => this.positionIndicator(false));
      this.navObserver.observe(this.$refs.nav as HTMLElement);
    }
    if (shouldIgnite()) {
      this.ignite();
    }
  }

  beforeUnmount() {
    if (this.visibilityListener) {
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }
    this.stopPolling();
    this.navObserver?.disconnect();
    this.motionTimers.forEach((timer) => clearTimeout(timer));
    cancelAnimationFrame(this.highlightFrame);
  }

  get readingRoute(): boolean {
    return isReadingRoute(this.$route.path);
  }

  /** Running index of a dropdown entry across its groups (stagger delay). */
  menuItemIndex(area: ShellNavArea, groupIndex: number, linkIndex: number): number {
    return (area.menu || []).slice(0, groupIndex).reduce((sum, group) => sum + group.links.length, 0) + linkIndex;
  }

  private activeNavItem(): HTMLElement | null {
    return (this.$refs.nav as HTMLElement | undefined)?.querySelector<HTMLElement>('.shell-bar__nav-item--active') ?? null;
  }

  /** Moves the seam indicator to the current area; glides when `animate`. */
  positionIndicator(animate: boolean) {
    const parts = [this.$refs.indShaft, this.$refs.indLine, this.$refs.indNode] as (HTMLElement | undefined)[];
    if (parts.some((part) => !part)) {
      return;
    }
    const els = parts as HTMLElement[];
    const [shaft, line, node] = els;
    const item = this.activeNavItem();
    const hidden = !item || item.offsetWidth === 0;
    els.forEach((part) => {
      part.style.transition = animate ? '' : 'none';
      part.classList.toggle('shell-bar__ind--off', hidden);
    });
    if (!item || hidden) {
      this.indicatorX = null;
      return;
    }
    const x = item.offsetLeft;
    const width = item.offsetWidth;
    line.style.transform = `translateX(${x}px) scaleX(${width / 100})`;
    shaft.style.transform = `translateX(${x}px) scaleX(${width / 100})`;
    node.style.transform = `translateX(${x + width / 2}px)`;
    const moved = this.indicatorX !== null && this.indicatorX !== x;
    this.indicatorX = x;
    if (!animate) {
      void line.offsetWidth;
      els.forEach((part) => { part.style.transition = ''; });
    } else if (moved) {
      this.later(() => this.flare(), 300);
    }
  }

  private later(fn: () => void, ms: number) {
    this.motionTimers.push(setTimeout(fn, ms));
  }

  /** Small rhombus ring at the node: the end of a glide or of the glint. */
  flare() {
    const flare = this.$refs.flare as HTMLElement | undefined;
    const item = this.activeNavItem();
    if (!flare || !item || prefersReducedMotion()) {
      return;
    }
    flare.style.left = `${item.offsetLeft + item.offsetWidth / 2}px`;
    flare.classList.remove('shell-bar__flare--on');
    void flare.offsetWidth;
    flare.classList.add('shell-bar__flare--on');
  }

  /** Entrance once per session: wedge, areas, node landing, then the glint. */
  ignite() {
    this.igniting = true;
    this.later(() => this.glint(), 760);
    this.later(() => { this.igniting = false; }, 1700);
  }

  glint() {
    const frame = this.$refs.frame as HTMLElement | undefined;
    const logo = (this.$refs.logo as { $el?: HTMLElement } | undefined)?.$el;
    const nav = this.$refs.nav as HTMLElement | undefined;
    if (!frame || !logo || !nav) {
      return;
    }
    const item = this.activeNavItem();
    const target = item ? nav.offsetLeft + item.offsetLeft + item.offsetWidth / 2 : nav.offsetLeft + nav.offsetWidth;
    // The glint is 240px wide with its bright core at about 65%.
    frame.style.setProperty('--glint-from', `${logo.offsetLeft + logo.offsetWidth - 150}px`);
    frame.style.setProperty('--glint-to', `${target - 156}px`);
    this.glinting = true;
    this.later(() => this.flare(), 820);
    this.later(() => { this.glinting = false; }, 950);
  }

  /** Facet highlight: pointer position inside search, cells and nameplate. */
  onFramePointerMove(event: PointerEvent) {
    if (!this.finePointer) {
      return;
    }
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('.shell-bar__search, .shell-bar__cell, .shell-bar__account');
    if (!target) {
      return;
    }
    const { clientX, clientY } = event;
    cancelAnimationFrame(this.highlightFrame);
    this.highlightFrame = requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${clientX - rect.left}px`);
      target.style.setProperty('--my', `${clientY - rect.top}px`);
    });
  }

  startPolling() {
    this.stopTimer();
    // Also probes the bookmarks endpoint once, so "Gemerkt" links hide on APIs without it.
    void ensureBookmarkKeys(this.$api);
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

  setMenuOpen(key: string, open: boolean) {
    if (open) {
      this.openMenuKey = key;
    } else if (this.openMenuKey === key) {
      this.openMenuKey = null;
    }
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

  onThemeToggleClick(event: MouseEvent) {
    const origin = (event.currentTarget as HTMLElement | null)?.querySelector('.shell-bar__crystal');
    startThemeWipe(origin, () => toggleShellTheme());
  }
}
</script>

<style lang="scss">
// Top bar "Kristallkiel" (Penpot: Vision › M · TopBar-Konzept) and its
// menus. ER1 edges (wedge, square cells, underline growing from the centre,
// uppercase areas) on the ER2 structure. Unscoped on purpose: q-menu content
// is teleported. Colours are Aetherium roles only, so Hydaelyn and Zodiark
// need no overrides beyond the shadows.
@import './facet.scss';

body {
  --nav-height: 68px;
}

// The q-header box keeps a fixed height so Quasar's layout offset never
// changes; the visible frame inside it condenses on scroll.
.q-header.shell-bar {
  height: var(--nav-height);
  color: var(--ink-primary);
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  pointer-events: none;
}

.shell-bar__frame {
  position: relative;
  height: var(--nav-height);
  overflow: hidden;
  background: var(--surface-glass);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  // The aether seam.
  border-bottom: 1px solid var(--rule-soft);
  box-shadow: 0 4px 18px rgba(43, 36, 24, 0.08);
  pointer-events: auto;
}

body.body--dark .shell-bar__frame {
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

.shell-bar__inner {
  display: flex;
  align-items: stretch;
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  // viewport-fit=cover (index.template.html): keep clear of the notch in landscape.
  padding-right: env(safe-area-inset-right, 0px);
  font-family: var(--font-ui);
}

// Logo facet with the ER1 wedge; ::before carries the tint to the viewport
// edge when the bar is wider than 1440px.
.shell-bar__logo {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 0 10px 0 max(24px, env(safe-area-inset-left, 0px));
  margin-right: 26px;
  border-bottom: none;
  text-decoration: none;
  isolation: isolate;
  --wedge: 22px;

  // ER1 character-block gradient as one continuous layer: it fades in from
  // the viewport edge (bars wider than 1440px), peaks at the logo and runs
  // on under the wedge, whose diagonal is cut from this same layer. A light
  // top shade keeps the ER1 diagonal feel; a warm glow sits along the bottom
  // under the fireflies.
  &::before {
    content: '';
    position: absolute;
    z-index: -1;
    top: 0;
    bottom: 0;
    left: -50vw;
    right: calc(var(--wedge) * -1);
    clip-path: polygon(0 0, 100% 0, calc(100% - var(--wedge)) 100%, 0 100%);
    background:
      radial-gradient(180px 46px at calc(50vw + 70px) 110%, color-mix(in srgb, var(--vision-primary) 30%, transparent), transparent 70%),
      linear-gradient(to bottom, color-mix(in srgb, var(--rule-strong) 8%, transparent), transparent 75%),
      linear-gradient(
        to right,
        transparent 0,
        color-mix(in srgb, var(--rule-strong) 10%, transparent) calc(50vw - 240px),
        color-mix(in srgb, var(--rule-strong) 22%, transparent) 50vw,
        var(--rule-tint) 100%
      );
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 100%;
    width: var(--wedge);
    // Only the hairline along the wedge's diagonal; the fill is ::before.
    background: linear-gradient(to bottom right, transparent calc(50% - 1px), var(--rule-soft) 0 50%, transparent 0);
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -6px;
  }
}

// Fireflies (Zodiark) / Elpis petals (Hydaelyn, see below): small motes in
// the logo facet. Fireflies drift up from the bottom edge. Ambient and endless, so they stop entirely under reduced
// motion (WCAG 2.2.2 / 2.3.3); only transform and opacity animate.
.shell-bar__fireflies {
  position: absolute;
  left: 18px;
  right: 6px;
  bottom: 0;
  height: 24px;
  overflow: hidden;
  pointer-events: none;
}

.shell-bar__firefly {
  position: absolute;
  bottom: 2px;
  left: var(--fx);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--vision-primary);
  box-shadow: 0 0 5px 1px color-mix(in srgb, var(--vision-primary) 75%, transparent);
  opacity: 0;
  animation: kiel-firefly var(--fd) var(--ease-tide) var(--fdelay) infinite;
}

body.body--dark .shell-bar__firefly {
  box-shadow: 0 0 6px 2px color-mix(in srgb, var(--vision-primary) 60%, transparent);
}

@keyframes kiel-firefly {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.6);
  }

  18% {
    opacity: 0.9;
  }

  40% {
    opacity: 0.35;
    transform: translate(var(--fdx), calc(var(--fdy) * 0.45)) scale(1);
  }

  62% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(calc(var(--fdx) * -0.4), var(--fdy)) scale(0.7);
  }
}

@media (prefers-reduced-motion: reduce) {
  body.body--dark .shell-bar__fireflies {
    display: none;
  }
}

// Elpis petals (Hydaelyn): the day counterpart to the fireflies, fitting the
// garden in "Elpisgarten". Elpis flowers are purest white and turn
// "sun-bright" around joy, so the petals are translucent white with a warm
// sunlit edge and a faint glow. Two layers per petal (leaf technique): the
// outer element (the firefly <i>) falls slowly and drifts, the inner
// .shell-bar__petal sways gently like a pendulum around a pivot above it;
// even petals are mirrored, and size and opacity vary for depth. The fall
// loops continuously; under reduced motion three petals rest on the edge.
.shell-bar__petal {
  display: none;
}

body:not(.body--dark) {
  .shell-bar__fireflies {
    top: 0;
    height: auto;
    perspective: 140px;
  }

  // Static frame (reduced motion): three petals resting on the bottom edge.
  .shell-bar__firefly {
    top: auto;
    bottom: 3px;
    width: 8px;
    height: 6px;
    border-radius: 0;
    background: none;
    box-shadow: none;
    opacity: 0;
    animation: none;
  }

  .shell-bar__firefly:nth-child(2),
  .shell-bar__firefly:nth-child(4),
  .shell-bar__firefly:nth-child(6) {
    opacity: 0.6;
  }

  .shell-bar__petal {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 85% 10% 85% 10%;
    background: radial-gradient(
      ellipse at 35% 35%,
      rgba(255, 255, 255, 0.92) 0 38%,
      rgba(255, 249, 236, 0.7) 64%,
      color-mix(in srgb, var(--vision-primary) 40%, transparent) 100%
    );
    box-shadow:
      0 0 5px 1px rgba(255, 255, 255, 0.4),
      0 0 0 0.5px color-mix(in srgb, var(--rule-strong) 22%, transparent);
    transform: rotate(var(--rest, -24deg));
    transform-origin: 50% -100%;
  }

  .shell-bar__firefly:nth-child(4) .shell-bar__petal {
    --rest: 38deg;
  }

  .shell-bar__firefly:nth-child(6) .shell-bar__petal {
    --rest: -62deg;
  }

  // Depth: two smaller, fainter "far" petals; one is very slightly blurred.
  .shell-bar__firefly:nth-child(3),
  .shell-bar__firefly:nth-child(7) {
    --petal-peak: 0.38;
    width: 6px;
    height: 4px;
  }

  .shell-bar__firefly:nth-child(7) .shell-bar__petal {
    filter: blur(0.5px);
  }

  @media (prefers-reduced-motion: no-preference) {
    .shell-bar__firefly {
      top: -10px;
      bottom: auto;
      animation: kiel-petal-fall calc(var(--fd) * 1.3) cubic-bezier(0.37, 0, 0.63, 1) var(--fdelay) infinite both;
    }

    .shell-bar__petal {
      animation: kiel-petal-sway calc(var(--fd) * 0.32) ease-in-out infinite alternate;
    }

    .shell-bar__firefly:nth-child(even) .shell-bar__petal {
      animation-name: kiel-petal-sway-flip;
    }
  }
}

@keyframes kiel-petal-fall {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }

  14%,
  80% {
    opacity: var(--petal-peak, 0.62);
  }

  100% {
    opacity: 0;
    transform: translate(calc(var(--fdx) * 3), 80px);
  }
}

@keyframes kiel-petal-sway {
  from {
    transform: rotate(-30deg) rotateX(14deg);
  }

  to {
    transform: rotate(30deg) rotateX(-16deg);
  }
}

@keyframes kiel-petal-sway-flip {
  from {
    transform: scale(-1, 1) rotate(30deg) rotateY(0deg);
  }

  to {
    transform: scale(-1, 1) rotate(-30deg) rotateY(120deg);
  }
}
.shell-bar__logo-img {
  display: block;
  width: 150px;
  height: auto;
  max-height: 29px;
}

.shell-bar__nav {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
}

.shell-bar__nav-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 9px;
  font: 600 12px/20px var(--font-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  white-space: nowrap;
  text-decoration: none;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-elpis), background-color var(--motion-fast) var(--ease-elpis);

  // Underline on the seam, grows from the centre.
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: var(--rule-soft);
    transform: scaleX(0);
    transition: transform var(--motion-fast) var(--ease-elpis), background-color var(--motion-fast) var(--ease-elpis);
  }

  // Aether node sitting on the seam.
  &::before {
    @include rhombus(7px, var(--rule-strong));
    bottom: -4px;
    left: calc(50% - 3.5px);
    z-index: 1;
    transform: rotate(45deg) scale(0);
    transition: transform var(--motion-fast) var(--ease-elpis);
  }

  &:hover {
    color: var(--ink-primary);

    &::after {
      transform: scaleX(1);
    }
  }

  // Inner ring: no radius, stays inside the bar.
  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -10px;
    color: var(--ink-primary);
  }
}

// The current area's underline, node and light shaft are one shared
// indicator (.shell-bar__ind) that glides between areas; an open dropdown
// still marks its own trigger.
.shell-bar__nav-item--active {
  color: var(--ink-primary);

  &:hover::after {
    transform: scaleX(0);
  }
}

.shell-bar__nav-trigger[aria-expanded='true'] {
  color: var(--ink-primary);
  background-color: var(--rule-tint);

  &::after,
  &:hover::after {
    background: var(--rule-strong);
    box-shadow: 0 1px 6px var(--glow-aether);
    transform: scaleX(1);
  }

  &::before {
    transform: rotate(45deg) scale(1);
  }

  .shell-bar__chev {
    @include chevron-open;
  }
}

.shell-bar__chev {
  @include chevron(7px);
}

.shell-bar__spacer {
  flex: 1;
  min-width: 0;
}

// Search slot: keel-cut facet instead of a pill.
.shell-bar__search {
  @include facet(7px);
  display: inline-flex;
  align-self: center;
  align-items: center;
  gap: 8px;
  // Gives way (down to 120px) before a long account name squeezes the nav.
  flex: 0 1 160px;
  min-width: 120px;
  height: 36px;
  margin-right: 14px;
  padding: 0 6px 0 12px;
  font: 400 13px/20px var(--font-ui);
  color: var(--ink-muted);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    @include facet(7px, var(--rule-strong));
    color: var(--ink-primary);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--glow-aether);
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
  padding: 0 6px;
  font: 600 9.5px/18px var(--font-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  background: var(--surface-raised);
  border: 1px solid var(--rule-soft);
  border-radius: 0;
}

// Cells: bell, crystal and (below 1024px) the menu button.
.shell-bar__cells {
  display: flex;
  align-items: stretch;
  flex: none;
}

.shell-bar__cell.q-btn {
  width: 50px;
  min-width: 50px;
  height: 100%;
  min-height: 0;
  padding: 0;
  color: var(--ink-muted);
  border-left: 1px solid var(--rule-soft);
  border-radius: 0;

  .q-focus-helper {
    border-radius: 0;
  }

  &:hover {
    color: var(--ink-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -10px;
  }
}

.shell-bar__notifications.q-btn {
  position: relative;
}

// Unread badge: --vision-now with --vision-on-now (6.4:1 Hydaelyn, AA Zodiark).
.shell-bar__badge {
  @include facet-clip(3px);
  position: absolute;
  top: 14px;
  left: calc(50% + 2px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font: 700 10px/16px var(--font-ui);
  color: var(--vision-on-now);
  text-align: center;
  background: var(--vision-now);
  pointer-events: none;
}

// Theme toggle: prism rhombus, turns a further 45deg in Zodiark.
.shell-bar__theme.q-btn .q-btn__content {
  position: relative;
}

.shell-bar__crystal {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 19px;
  height: 19px;
  margin: -9.5px 0 0 -9.5px;
  background: var(--crystal-prism);
  border: 1px solid var(--rule-strong);
  transform: rotate(45deg);
  transition: transform var(--motion-slow) var(--ease-aether);
}

body.body--dark .shell-bar__crystal {
  transform: rotate(90deg);
}

.shell-bar__crystal-icon {
  position: relative;
  color: var(--vision-on-primary);
}

.shell-notifications-menu.q-menu .shell-menu__facet {
  padding: 4px;
}

// Account: a nameplate cell, not a pill.
.shell-bar__account {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: none;
  max-width: 220px;
  height: 100%;
  padding: 0 14px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
  text-align: left;
  background: transparent;
  border: 0;
  border-left: 1px solid var(--rule-soft);
  border-radius: 0;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-elpis);

  &:hover,
  &[aria-expanded='true'] {
    background: var(--rule-tint);
  }

  &[aria-expanded='true'] .shell-bar__chev {
    @include chevron-open;
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -10px;
  }

  > .q-icon,
  > .shell-bar__chev {
    color: var(--ink-muted);
  }
}

// 1px --rule-strong frame around the keel-cut avatar.
.shell-bar__avatar-facet {
  @include facet-clip(8px);
  display: inline-flex;
  flex: none;
  padding: 1px;
  background: var(--rule-strong);
}

.shell-bar__avatar.aetheryte-badge {
  @include facet-clip(7px);
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 0;
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
  font: 600 10px/14px var(--font-ui);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

// Menus (area dropdowns, notifications, account). The q-menu only casts the
// shadow (a filter survives the facet clip); .shell-menu__facet is the panel,
// hanging flush from the seam with the ER1 top rule.

.shell-menu.q-menu {
  min-width: 260px;
  padding: 0;
  overflow: visible;
  color: var(--ink-primary);
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  filter: drop-shadow(0 12px 22px rgba(43, 36, 24, 0.18));
}

body.body--dark .shell-menu.q-menu {
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.55));
}

// Facet unfold: QMenu transition "kiel" (transition-show/-hide). The panel
// opens downwards out of the seam and closes the same way back.
.q-transition--kiel-enter-active,
.q-transition--kiel-leave-active {
  transition: clip-path var(--motion-base) var(--ease-elpis), opacity var(--motion-fast) linear;
}

.q-transition--kiel-leave-active {
  transition-duration: var(--motion-fast), var(--motion-fast);
}

.q-transition--kiel-enter-from,
.q-transition--kiel-leave-to {
  clip-path: inset(0 0 100% 0);
}

.q-transition--kiel-enter-to,
.q-transition--kiel-leave-from {
  clip-path: inset(0 -40px -60px -40px);
}

// Entries follow 30ms apart (--i is their running index).
.shell-menu .shell-menu__item.q-item {
  animation: kiel-rise var(--motion-base) var(--ease-elpis) calc(var(--i, 0) * 30ms + 80ms) both;
}

.shell-menu__facet {
  @include facet-clip(0px, 16px);
  padding: 12px 8px 14px;
  // Hairline along the cut edge (clip-path drops the border there).
  background:
    linear-gradient(135deg, transparent calc(50% - 0.75px), var(--rule-soft) 0 calc(50% + 0.75px), transparent 0) bottom right / 16px 16px no-repeat,
    var(--surface-raised);
  background-origin: border-box;
  border: 1px solid var(--rule-soft);
  border-top: 2px solid var(--rule-strong);
}

.shell-menu__list {
  padding: 0;
}

.shell-menu__header.q-item__label--header {
  padding: 8px 12px 4px;
  font: 400 9px/16px Michroma, var(--font-ui);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.shell-menu__item.q-item {
  position: relative;
  min-height: 38px;
  padding: 6px 12px;
  border-radius: 0;
  font: 500 14px/20px var(--font-ui);
  color: var(--ink-primary);
  transition: background-color var(--motion-fast) var(--ease-elpis);

  // Marker grows from the centre; the row slides 4px (ER1).
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 6px;
    width: 3px;
    height: 18px;
    margin-top: -9px;
    background: var(--rule-strong);
    transform: scaleY(0);
    transition: transform var(--motion-fast) var(--ease-elpis);
  }

  > .q-item__section {
    transition: transform var(--motion-fast) var(--ease-elpis);
  }

  .q-item__section--avatar {
    min-width: 30px;
    color: var(--ink-muted);
  }

  .q-focus-helper {
    border-radius: 0;
  }

  &:hover,
  &.shell-menu__item--active {
    background: var(--rule-tint);

    &::before {
      transform: scaleY(1);
    }

    > .q-item__section {
      transform: translateX(4px);
    }
  }
}

.shell-menu__item--active.q-item {
  font-weight: 600;
}

.shell-menu__sep.q-separator {
  position: relative;
  margin: 8px 8px;
  overflow: visible;
  background: var(--rule-soft);

  &::after {
    @include rhombus(6px, var(--rule-strong));
    top: -2.5px;
    left: calc(50% - 3px);
  }
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
  border-radius: 0;
  font: 500 14px/20px var(--font-ui);
  color: var(--ink-primary);
}

.shell-account-menu .user-menu .q-item.q-router-link--active {
  background: var(--rule-tint);
  box-shadow: inset 3px 0 0 var(--rule-strong);
}

.shell-account-menu .user-menu .q-separator {
  margin: 6px 4px;
  background: var(--rule-soft);
}

.shell-account-menu .user-menu .q-item.user-menu__discord-login {
  margin: 4px !important;
  color: #ffffff;
}

// ===== Motion choreography (seam-motion.ts) =====

// Seam glide: one indicator for the current area, moved with transforms.
.shell-bar__ind {
  position: absolute;
  left: 0;
  z-index: 1;
  pointer-events: none;
  transition: transform 320ms var(--ease-elpis), opacity var(--motion-fast) linear;
}

.shell-bar__ind--shaft {
  top: 0;
  bottom: 0;
  width: 100px;
  transform-origin: 0 50%;
  background: linear-gradient(to top, var(--rule-tint), transparent);
}

.shell-bar__ind--line {
  bottom: 0;
  width: 100px;
  height: 2px;
  transform-origin: 0 50%;
  background: var(--rule-strong);
  box-shadow: 0 1px 6px var(--glow-aether);
}

.shell-bar__ind--node {
  bottom: -4px;
  z-index: 2;
  width: 0;
  height: 7px;

  &::before {
    @include rhombus(7px, var(--rule-strong));
    left: -3.5px;
  }
}

.shell-bar__ind--off {
  opacity: 0;
}

// Ring that flares at the node when a glide or the glint arrives.
.shell-bar__flare {
  position: absolute;
  bottom: -9px;
  z-index: 2;
  width: 17px;
  height: 17px;
  margin-left: -8.5px;
  border: 1px solid var(--glow-aether);
  opacity: 0;
  transform: rotate(45deg) scale(0.4);
  pointer-events: none;
}

.shell-bar__flare--on {
  animation: kiel-flare 520ms var(--ease-elpis);
}

// Aether glint: one light pulse along the seam at the end of the ignition.
.shell-bar__glint {
  position: absolute;
  left: 0;
  bottom: -2px;
  z-index: 2;
  width: 240px;
  height: 3px;
  opacity: 0;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, var(--glow-aether) 55%, var(--surface-raised) 72%, transparent);
  filter: drop-shadow(0 0 6px var(--glow-aether));
}

.shell-bar__frame--glint .shell-bar__glint {
  animation: kiel-glint 900ms var(--ease-tide) forwards;
}

// Wedge ignition: first visit in a session (never under reduced motion).
.shell-bar__frame--ignite {
  .shell-bar__logo::after {
    transform-origin: 0 50%;
    animation: kiel-grow 260ms var(--ease-elpis) 120ms both;
  }

  .shell-bar__logo-img {
    animation: kiel-fade 320ms var(--ease-elpis) both;
  }

  .shell-bar__nav-item {
    animation: kiel-drop 340ms var(--ease-elpis) calc(220ms + var(--i, 0) * 35ms) both;
  }

  .shell-bar__ind--line {
    animation: kiel-fade 300ms var(--ease-elpis) 560ms both;
  }

  .shell-bar__ind--shaft {
    animation: kiel-fade 300ms linear 560ms both;
  }

  .shell-bar__ind--node::before {
    animation: kiel-land 360ms var(--ease-aether) 640ms both;
  }

  .shell-bar__search,
  .shell-bar__cells,
  .shell-bar__account {
    animation: kiel-fade 300ms linear 420ms both;
  }
}

// Facet highlight: a faint aether light follows a fine pointer.
.shell-bar__search,
.shell-bar__cell.q-btn,
.shell-bar__account {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(circle 46px at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--glow-aether) 38%, transparent), transparent 70%);
    transition: opacity var(--motion-base) var(--ease-elpis);
  }
}

@media (hover: hover) and (pointer: fine) {
  .shell-bar__search:hover::after,
  .shell-bar__cell.q-btn:hover::after,
  .shell-bar__account:hover::after {
    opacity: 1;
  }
}

// Reading seam: on long-form pages the seam fills with reading progress.
.shell-bar__read {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  opacity: 0.7;
  background: var(--rule-strong);
  transform: scaleX(0);
  transform-origin: 0 50%;
  pointer-events: none;
}

@supports (animation-timeline: scroll()) {
  .shell-bar__read {
    animation: kiel-read linear both;
    animation-timeline: scroll(root block);
  }
}

// Prism wipe: the new theme opens as a rhombus from the crystal
// (startThemeWipe sets --wipe-x / --wipe-y and the class).
html.shell-theme-wipe::view-transition-old(root),
html.shell-theme-wipe::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

html.shell-theme-wipe::view-transition-new(root) {
  animation: kiel-prism-wipe 720ms var(--ease-elpis) both;
}

@keyframes kiel-prism-wipe {
  from {
    clip-path: polygon(var(--wipe-x) var(--wipe-y), var(--wipe-x) var(--wipe-y), var(--wipe-x) var(--wipe-y), var(--wipe-x) var(--wipe-y));
  }

  to {
    clip-path: polygon(var(--wipe-x) calc(var(--wipe-y) - 300vmax), calc(var(--wipe-x) + 300vmax) var(--wipe-y), var(--wipe-x) calc(var(--wipe-y) + 300vmax), calc(var(--wipe-x) - 300vmax) var(--wipe-y));
  }
}

// Keyframes shared with ShellMobileNav (unscoped, so they are global).
@keyframes kiel-fade {
  from {
    opacity: 0;
  }
}

@keyframes kiel-rise {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
}

@keyframes kiel-drop {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
}

@keyframes kiel-grow {
  from {
    transform: scaleX(0);
  }
}

@keyframes kiel-land {
  from {
    opacity: 0;
    transform: rotate(45deg) translate(-10px, -10px) scale(0.3);
  }
}

@keyframes kiel-flare {
  0% {
    opacity: 0.9;
    transform: rotate(45deg) scale(0.4);
  }

  100% {
    opacity: 0;
    transform: rotate(45deg) scale(1.9);
  }
}

@keyframes kiel-glint {
  0% {
    opacity: 0;
    transform: translateX(var(--glint-from, 0px));
  }

  12%,
  88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(var(--glint-to, 0px));
  }
}

@keyframes kiel-read {
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shell-bar__ind {
    transition: none;
  }

  .shell-menu .shell-menu__item.q-item {
    animation-name: kiel-fade;
    animation-delay: 0ms;
  }

  .q-transition--kiel-enter-from,
  .q-transition--kiel-leave-to {
    clip-path: none;
    opacity: 0;
  }

  html.shell-theme-wipe::view-transition-new(root) {
    animation: kiel-fade 200ms linear both;
  }
}

// Condensing on scroll (≥1024px): 68 → 52px over the first 150px. Scroll
// timelines only where supported (Firefox: flag) and without reduced motion;
// everywhere else the bar stays static. --nav-height stays 68px, so sticky
// offsets elsewhere are unaffected.
@supports (animation-timeline: scroll()) {
  @media screen and (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
    .shell-bar__frame {
      animation: shell-condense linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 150px;
    }

    .shell-bar__logo-img {
      animation: shell-condense-logo linear both;
      animation-timeline: scroll(root block);
      animation-range: 0 150px;
    }
  }
}

@keyframes shell-condense {
  to {
    height: 52px;
  }
}

@keyframes shell-condense-logo {
  to {
    width: 128px;
  }
}

// Breakpoints: full bar from 1440px; up to 1439px a compact bar; below
// 1024px the nav moves to the mobile bars.

// Compact bar up to 1439px: eight areas (four with chevrons) need the room.
@media screen and (max-width: 1439px) {
  .shell-bar__logo {
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    margin-right: 24px;
  }

  .shell-bar__logo-img {
    width: 132px;
  }

  .shell-bar__nav-item {
    gap: 5px;
    padding: 0 7px;
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .shell-bar__search {
    flex: none;
    width: 40px;
    min-width: 0;
    padding: 0;
    justify-content: center;
  }

  // Icon-only search: the label stays as the accessible name (visually hidden),
  // so the name always matches the visible text (WCAG 2.5.3).
  .shell-bar__search-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .shell-bar__kbd,
  .shell-bar__account-text,
  .shell-bar__account-caret {
    display: none;
  }

  .shell-bar__account {
    padding: 0 10px;
  }

  .shell-bar__account--guest {
    padding: 0 13px;
  }

  .shell-bar__cell.q-btn {
    width: 46px;
    min-width: 46px;
  }
}

.shell-bar__menu.q-btn {
  display: none;
}

@media screen and (max-width: 1023px) {
  .shell-bar__nav {
    display: none;
  }

  .shell-bar__menu.q-btn {
    display: inline-flex;
  }

  .shell-bar__search {
    flex: 1 1 auto;
    width: auto;
    max-width: 260px;
    margin-left: auto;
    margin-right: 12px;
    padding: 0 6px 0 12px;
    justify-content: flex-start;
  }

  // Undo the visually-hidden label from the 1439px step: the wide search
  // field shows "Suchen…" again.
  .shell-bar__search-label {
    position: static;
    display: block;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
  }

  // ER2-205: notifications and theme move into the mobile "Mehr" sheet.
  .shell-bar__notifications.q-btn,
  .shell-bar__theme.q-btn {
    display: none;
  }
}

@media screen and (max-width: 599px) {
  body {
    --nav-height: 56px;
  }

  .shell-bar__logo {
    padding-left: max(14px, env(safe-area-inset-left, 0px));
    margin-right: 22px;

    --wedge: 18px;
  }

  .shell-bar__logo-img {
    width: 120px;
  }

  .shell-bar__firefly:nth-child(n + 5) {
    display: none;
  }

  .shell-bar__search {
    margin-right: 10px;
  }
}
</style>
