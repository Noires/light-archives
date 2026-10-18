<template>
  <q-header>
    <q-toolbar class="layout__toolbar__header mat-aetherglass">
      <div class="layout__filler layout__header-row">
        <div class="layout__char-name cursor-pointer" @click="$emit('toggle-drawer')">
          <template v-if="$store.getters.character">
          <div>
            <aetheryte-badge
              size="md"
              shape="round"
              :src="$store.getters.character.avatar"
              :alt="$store.getters.character?.name || ''"
            />
            <span header>{{ $store.getters.character?.name }}</span>
          </div>
          </template>
          <template v-else>
            <q-icon size="28px" name="account_circle" />
            <span>Eine fremde Gestalt</span>
          </template>
        </div>
        <nav class="layout__nav-links gt-lg">
          <router-link
            class="layout__nav-link"
            to="/"
            active-class=""
            exact-active-class="router-link-active"
          >
            Startseite
          </router-link>
          <div
            v-for="group in navGroups"
            :key="group.key"
            class="layout__nav-dropdown"
            @mouseenter="openMenu(group.key)"
            @mouseleave="scheduleMenuClose(group.key)"
          >
            <button
              type="button"
              class="layout__nav-dropdown-trigger"
              :class="{
                'layout__nav-dropdown-trigger_active': isGroupRouteActive(group.key),
                'layout__nav-dropdown-trigger_open': menuState[group.key],
              }"
              @focus="openMenu(group.key)"
              @click="toggleMenu(group.key)"
            >
              <span>{{ group.label }}</span>
              <q-icon name="expand_more" size="16px" />
            </button>
            <q-menu
              v-model="menuState[group.key]"
              anchor="bottom left"
              self="top left"
              fit
              :offset="[0, 4]"
              class="layout__nav-menu"
              transition-show="jump-down"
              transition-hide="jump-up"
              @mouseenter="openMenu(group.key)"
              @mouseleave="scheduleMenuClose(group.key)"
            >
              <q-list dense>
                <q-item
                  v-for="link in group.links"
                  :key="link.label"
                  class="layout__nav-menu-item"
                  clickable
                  v-close-popup
                  :to="link.to"
                >
                  <q-item-section>
                    <q-item-label class="layout__nav-menu-label">
                      <span>{{ link.label }}</span>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </nav>
        <q-btn
          flat
          round
          dense
          class="layout__theme-toggle"
          :icon="themeIcon"
          :aria-label="themeAriaLabel"
          @click="onThemeToggleClick"
        >
          <q-tooltip>
            {{ themeTooltipLabel }}
          </q-tooltip>
        </q-btn>
        <q-btn-dropdown
          class="layout__toolbar-button-more lt-xl"
          flat
          dense
          no-caps
          dropdown-icon="menu"
          tooltip="Menu"
          aria-label="Menu"
          content-class="layout__mobile-menu"
        >
          <q-list>
            <q-item clickable v-close-popup to="/">
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Startseite</q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-expansion-item
              v-for="group in navGroups"
              :key="group.key"
              dense
              dense-toggle
              :icon="group.icon"
              :label="group.label"
            >
              <q-list dense>
                <q-item v-for="link in group.links" clickable v-close-popup :key="link.label" :to="link.to">
                  <q-item-section>
                    <q-item-label>{{ link.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import AetheryteBadge from 'src/components/aetherium/AetheryteBadge.vue';
import { ThemeMode, getNextThemeMode, getStoredThemeMode, toggleThemeMode } from 'src/common/theme';

// Shell top bar: nameplate (opens the drawer via `toggle-drawer`), desktop
// nav dropdowns, theme toggle and the mobile hamburger menu. Owns its own
// nav-menu and theme state; the only outward signal is `toggle-drawer`.

type NavGroupKey = 'database' | 'roleplay' | 'media' | 'knowledge';

interface NavLink {
  label: string;
  to: string;
}

interface NavGroup {
  key: NavGroupKey;
  label: string;
  icon: string;
  links: NavLink[];
  matchPrefixes: string[];
}

@Options({
  name: 'ShellHeader',
  components: {
    AetheryteBadge,
  },
  emits: ['toggle-drawer'],
})
export default class ShellHeader extends Vue {
  readonly navGroups: NavGroup[] = [
    {
      key: 'database',
      label: 'Datenbank',
      icon: 'storage',
      links: [
        { label: 'Charaktere', to: '/profiles' },
        { label: 'Treffpunkte', to: '/venues' },
        { label: 'Communities', to: '/communities' },
        { label: 'Freie Gesellschaften', to: '/free-companies' },
      ],
      matchPrefixes: ['/profiles', '/venues', '/communities', '/free-companies'],
    },
    {
      key: 'roleplay',
      label: 'Rollenspiel',
      icon: 'theater_comedy',
      links: [
        { label: 'Eventkalender', to: '/calendar' },
        { label: 'Anschlagbrett', to: '/noticeboard' },
        { label: 'Geschichten', to: '/stories' },
      ],
      matchPrefixes: ['/calendar', '/event', '/event-calendar', '/noticeboard', '/stories', '/story'],
    },
    {
      key: 'media',
      label: 'Medien',
      icon: 'photo_library',
      links: [
        { label: 'Screenshots', to: '/gallery/screenshot' },
        { label: 'Kunstwerke', to: '/gallery/artwork' },
      ],
      matchPrefixes: ['/gallery'],
    },
    {
      key: 'knowledge',
      label: 'Wissenswertes',
      icon: 'info',
      links: [
        { label: 'Neueste Änderungen', to: '/changes' },
        { label: 'Regeln', to: '/rules' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Anfängerguide', to: '/beginner-guide' },
        { label: 'Über uns', to: '/about' },
      ],
      matchPrefixes: ['/changes', '/rules', '/faq', '/beginner-guide', '/about'],
    },
  ];

  themeMode: ThemeMode = getStoredThemeMode();
  menuState: Record<NavGroupKey, boolean> = {
    database: false,
    roleplay: false,
    media: false,
    knowledge: false,
  };
  private menuCloseTimers: Partial<Record<NavGroupKey, ReturnType<typeof setTimeout>>> = {};

  toggleMenu(groupKey: NavGroupKey) {
    if (this.menuState[groupKey]) {
      this.menuState[groupKey] = false;
      this.clearMenuCloseTimer(groupKey);
      return;
    }

    this.openMenu(groupKey);
  }

  openMenu(groupKey: NavGroupKey) {
    this.clearMenuCloseTimer(groupKey);
    this.menuState[groupKey] = true;
  }

  scheduleMenuClose(groupKey: NavGroupKey) {
    this.clearMenuCloseTimer(groupKey);
    this.menuCloseTimers[groupKey] = setTimeout(() => {
      this.menuState[groupKey] = false;
      this.menuCloseTimers[groupKey] = undefined;
    }, 120);
  }

  clearMenuCloseTimer(groupKey: NavGroupKey) {
    const timer = this.menuCloseTimers[groupKey];
    if (timer) {
      clearTimeout(timer);
      this.menuCloseTimers[groupKey] = undefined;
    }
  }

  clearAllMenuCloseTimers() {
    for (const group of this.navGroups) {
      this.clearMenuCloseTimer(group.key);
    }
  }

  isGroupRouteActive(groupKey: NavGroupKey) {
    const path = this.$route.path;
    const group = this.navGroups.find(entry => entry.key === groupKey);

    if (!group) {
      return false;
    }

    return group.matchPrefixes.some(prefix => this.matchesRoutePrefix(path, prefix));
  }

  private matchesRoutePrefix(path: string, prefix: string) {
    if (prefix.endsWith('/')) {
      return path.startsWith(prefix);
    }

    return path === prefix || path.startsWith(`${prefix}/`);
  }

  get isEffectiveDarkMode(): boolean {
    return this.$q.dark.isActive;
  }

  get themeIcon(): string {
    if (this.themeMode === 'system') {
      return 'brightness_auto';
    }

    return this.isEffectiveDarkMode ? 'dark_mode' : 'light_mode';
  }

  get themeTooltipLabel(): string {
    const currentThemeLabel = this.themeModeLabel(this.themeMode);
    const nextThemeLabel = this.themeModeLabel(getNextThemeMode(this.themeMode));
    return `Darstellung: ${currentThemeLabel} (aktiv: ${this.isEffectiveDarkMode ? 'dunkel' : 'hell'}). Klick: ${nextThemeLabel}`;
  }

  get themeAriaLabel(): string {
    const nextThemeLabel = this.themeModeLabel(getNextThemeMode(this.themeMode));
    return `Darstellung wechseln. Als Nächstes: ${nextThemeLabel}`;
  }

  onThemeToggleClick() {
    this.themeMode = toggleThemeMode(this.themeMode);
  }

  private themeModeLabel(mode: ThemeMode): string {
    if (mode === 'light') {
      return 'Hell';
    }
    if (mode === 'dark') {
      return 'Dunkel';
    }

    return 'System';
  }

  unmounted() {
    this.clearAllMenuCloseTimers();
  }
}
</script>

<style lang="scss">
// Header-only styles (nameplate, nav links, dropdown menus, theme toggle,
// mobile menu) and the --nav-* palette for both themes. Unscoped on purpose:
// the q-menu / q-btn-dropdown content is teleported out of this component.

.layout__filler {
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__header-row {
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0;
  margin: 0;
  max-width: none;
  position: relative;
  z-index: 1;
  min-height: var(--nav-height);
}

.layout__filler__end {
  color:white;
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__char-name {
  font-family: Michroma, sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--nav-ink);
  padding: 0 24px;
  min-width: 280px;
  min-height: var(--nav-height);
  position: relative;
  z-index: 3;
  isolation: isolate;
  text-transform: uppercase;
  border-radius: 0;
  background: linear-gradient(135deg, var(--nav-char-bg-start) 0%, var(--nav-char-bg-end) 100%);
  box-shadow: 4px 0 12px rgba(43, 36, 24, 0.10); // Hydaelyn — warm soft drop
  transition: background 0.3s ease,
              box-shadow 0.3s ease,
              color 0.3s ease;
  animation: navReveal 0.55s ease both;
  cursor: pointer;
}

body.body--dark .layout__char-name {
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.35); // Zodiark — original dark drop
}

.layout__char-name > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout__char-name::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  transform: translateX(100%);
  width: 32px;
  height: 64px;
  background: var(--nav-char-divider);
  clip-path: polygon(0 0, 100% 0, 0 100%);

  pointer-events: none;
  animation: navRevealDivider 0.55s ease both;
  will-change: background;
}

.layout__char-name:hover::after {
  background: var(--nav-char-divider-hover);
}

.layout__char-name:hover {
  // Inherit theme-aware ink — pearl gets dark warm, deep gets luminous cream.
  // `--nav-ink` flips correctly across both themes (Aetherium-aligned).
  color: var(--nav-ink);
  background: linear-gradient(135deg, var(--nav-char-bg-hover-start) 0%, var(--nav-char-bg-hover-end) 100%);
  box-shadow: 6px 0 18px rgba(43, 36, 24, 0.18);
}

body.body--dark .layout__char-name:hover {
  box-shadow: 6px 0 24px rgba(0, 0, 0, 0.45);
}

// AetheryteBadge owns its own gold rule and shadow chrome; the legacy
// `.q-avatar` rules here are obsolete now that ELPIS-202 is in place. The
// nav-aware tokens still drive the inner ring on hover via the badge's own
// :hover handler — no per-layout overrides are needed.

.layout__char-name .q-icon {
  color: var(--nav-accent);
  font-size: 1.8rem;
}

.layout__char-name span {
  font-size: 0.85rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.q-header {
  background-color: transparent;
  border-radius: 0px;
}

body {
  // Hydaelyn nav palette — calibrated to read on `.mat-aetherglass` pearl
  // surface (ELPIS-101). The legacy gold-on-near-black values that lived
  // here would have been invisible on pearl; rule/ink tokens replace them.
  --nav-bg-start: transparent; // legacy fallback only — Aetherglass provides bg
  --nav-bg-end: transparent;
  --nav-accent: var(--rule-gold);
  --nav-accent-strong: var(--rule-gold);
  --nav-ink: var(--surface-ink);
  --nav-border-bottom: transparent; // Aetherglass inner rule replaces the bottom border
  --nav-overlay-glow-left: rgba(186, 155, 91, 0.10);
  --nav-overlay-glow-right: rgba(127, 230, 226, 0.06);
  --nav-overlay-shade: transparent; // pearl shouldn't darken downward
  --nav-char-bg-start: rgba(186, 155, 91, 0.14);
  --nav-char-bg-end: rgba(245, 239, 226, 0.55);
  --nav-char-bg-hover-start: rgba(186, 155, 91, 0.22);
  --nav-char-bg-hover-end: rgba(251, 246, 234, 0.85);
  --nav-char-divider: rgba(186, 155, 91, 0.22);
  --nav-char-divider-hover: rgba(186, 155, 91, 0.36);
  --nav-char-avatar-border: var(--rule-gold);
  --nav-char-avatar-border-hover: var(--rule-gold);
  --nav-link-color: var(--surface-ink);
  --nav-link-underline: var(--rule-gold);
  --nav-link-hover-bg: rgba(186, 155, 91, 0.10);
  --nav-link-active-bg: rgba(186, 155, 91, 0.16);
  --nav-link-active-border: var(--rule-gold);
  --nav-link-open-bg: rgba(186, 155, 91, 0.18);
  --nav-menu-border: rgba(186, 155, 91, 0.28);
  --nav-menu-border-top: var(--rule-gold);
  --nav-menu-bg-start: rgba(251, 246, 234, 0.98);
  --nav-menu-bg-end: rgba(245, 239, 226, 0.98);
  --nav-menu-item-color: var(--surface-ink);
  --nav-menu-item-indicator: var(--rule-gold);
  --nav-menu-item-hover-bg: rgba(186, 155, 91, 0.12);
  --nav-action-bg: rgba(186, 155, 91, 0.10);
  --nav-action-border: rgba(186, 155, 91, 0.28);
  --nav-action-hover-bg: rgba(186, 155, 91, 0.18);
  --nav-action-hover-border: var(--rule-gold);
  --nav-action-sheen: rgba(186, 155, 91, 0.14);
  --nav-height: 64px;
}

body.body--dark {
  // Zodiark nav palette — retuned around Aetherium's arcane violet
  // (`--rule-arcane`) instead of the legacy cool-blue chrome. Reads on the
  // deep-purple Aetherglass surface, matches the Zodiark theme identity.
  --nav-bg-start: transparent;
  --nav-bg-end: transparent;
  --nav-accent: var(--rule-arcane);
  --nav-accent-strong: var(--rule-arcane);
  --nav-ink: var(--ink-luminous);
  --nav-border-bottom: transparent;
  --nav-overlay-glow-left: rgba(167, 139, 196, 0.16);
  --nav-overlay-glow-right: rgba(127, 230, 226, 0.10);
  --nav-overlay-shade: transparent;
  --nav-char-bg-start: rgba(167, 139, 196, 0.20);
  --nav-char-bg-end: rgba(31, 17, 48, 0.85);
  --nav-char-bg-hover-start: rgba(167, 139, 196, 0.30);
  --nav-char-bg-hover-end: rgba(38, 22, 60, 0.92);
  --nav-char-divider: rgba(31, 17, 48, 0.85);
  --nav-char-divider-hover: rgba(38, 22, 60, 0.92);
  --nav-char-avatar-border: var(--rule-arcane);
  --nav-char-avatar-border-hover: var(--rule-arcane);
  --nav-link-color: var(--ink-luminous);
  --nav-link-underline: var(--rule-arcane);
  --nav-link-hover-bg: rgba(167, 139, 196, 0.18);
  --nav-link-active-bg: rgba(167, 139, 196, 0.26);
  --nav-link-active-border: var(--rule-arcane);
  --nav-link-open-bg: rgba(167, 139, 196, 0.28);
  --nav-menu-border: rgba(167, 139, 196, 0.34);
  --nav-menu-border-top: var(--rule-arcane);
  --nav-menu-bg-start: rgba(31, 17, 48, 0.98);
  --nav-menu-bg-end: rgba(20, 11, 32, 0.98);
  --nav-menu-item-color: var(--ink-luminous);
  --nav-menu-item-indicator: var(--rule-arcane);
  --nav-menu-item-hover-bg: rgba(167, 139, 196, 0.22);
  --nav-action-bg: rgba(167, 139, 196, 0.14);
  --nav-action-border: rgba(167, 139, 196, 0.34);
  --nav-action-hover-bg: rgba(167, 139, 196, 0.24);
  --nav-action-hover-border: var(--rule-arcane);
  --nav-action-sheen: rgba(167, 139, 196, 0.20);
}

// ELPIS-101 — header surface is now `.mat-aetherglass`, which provides:
//   • background-color (pearl @ 88% / deep @ 78%)
//   • backdrop-filter blur + saturate
//   • inner gold/arcane rule (inset 0 0 0 2px)
//   • top light-leak highlight (inset 0 1px 0 white@0.6)
//   • soft external shadow
// Only the header-specific geometry stays: full-bleed edges (no rounded
// corners), font-family, ink colour, min-height, and the layered overlay
// `::before` for radial glints.
.layout__toolbar__header {
  position: relative;
  overflow: hidden;
  font-family: Michroma, sans-serif;
  color: var(--nav-ink);
  min-height: var(--nav-height);
}

// Higher-specificity override (.layout__toolbar__header.mat-aetherglass = 0,2,0)
// guarantees full-bleed edges regardless of CSS source ordering.
.layout__toolbar__header.mat-aetherglass {
  border-radius: 0;
}

// Zodiark wedge gradient retuned away from the legacy cool-blue rgba toward
// the arcane-violet accent so it harmonizes with the rest of the dark palette.
body.body--dark .layout__char-name::after {
  background: linear-gradient(135deg, rgba(167, 139, 196, 0.18) 0%, var(--nav-char-bg-end) 100%);
}

body.body--dark .layout__char-name:hover::after {
  background: linear-gradient(135deg, rgba(184, 159, 213, 0.22) 0%, var(--nav-char-bg-hover-end) 100%);
}

.layout__toolbar__header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, var(--nav-overlay-glow-left) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, var(--nav-overlay-glow-right) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, var(--nav-overlay-shade) 100%);
  opacity: 0.6;
  pointer-events: none;
  animation: none;
}

.layout__nav-links {
  text-align: center;
  display: flex;
  flex: 1;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  position: relative;
  z-index: 1;
  min-height: var(--nav-height);
  padding: 0 4px 0 0;
  background: transparent;
  animation: navReveal 0.65s ease both;
  animation-delay: 0.1s;
}

.layout__nav-links a,
.layout__nav-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 20px;
  color: var(--nav-link-color);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: Michroma, sans-serif;
  font-weight: 600;
  font-size: 0.7rem;
  text-decoration: none;
  border-radius: 0;
  clip-path: none;
  background: transparent;
  box-shadow: none;
  transition: all 0.3s ease;
  position: relative;
  z-index: 0;
  overflow: hidden;
  border-bottom: 3px solid transparent;
  cursor: pointer;
}

.layout__nav-links > :first-child {
  padding-left: 48px;
  margin-left: 0;
}

.layout__nav-links a::after,
.layout__nav-dropdown-trigger::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0%;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--nav-link-underline), transparent);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.layout__nav-links a:hover,
.layout__nav-dropdown-trigger:hover {
  // Theme-aware ink — pearl wants dark warm, deep wants luminous cream.
  color: var(--nav-ink);
  background: var(--nav-link-hover-bg);
}

.layout__nav-links a:hover::after,
.layout__nav-dropdown-trigger:hover::after {
  width: 100%;
}

.layout__nav-links .router-link-active,
.layout__nav-dropdown-trigger_active {
  color: var(--nav-ink);
  background: var(--nav-link-active-bg);
  border-bottom-color: var(--nav-link-active-border);
}

.layout__nav-dropdown {
  position: relative;
  display: flex;
  align-items: stretch;
  height: 100%;
}

.layout__nav-dropdown-trigger {
  border: 0;
  outline: 0;
}

.layout__nav-link,
.layout__nav-dropdown-trigger {
  min-width: 176px;
}

.layout__nav-dropdown-trigger .q-icon {
  margin-left: 6px;
  transition: transform 0.2s ease;
}

.layout__nav-dropdown-trigger_open {
  color: var(--nav-ink);
  background: var(--nav-link-open-bg);
}

.layout__nav-dropdown-trigger_open .q-icon {
  transform: rotate(180deg);
}

.layout__nav-menu {
  min-width: 300px;
  border: 1px solid var(--nav-menu-border);
  border-top: 2px solid var(--nav-menu-border-top);
  border-radius: 8px;
  padding: 8px;
  background: linear-gradient(135deg, var(--nav-menu-bg-start) 0%, var(--nav-menu-bg-end) 100%);
  // Hydaelyn — softer warm drop. Zodiark override below restores the deep shadow.
  box-shadow: 0 8px 32px rgba(43, 36, 24, 0.18);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

body.body--dark .layout__nav-menu {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.layout__nav-menu .q-list {
  padding: 0;
}

.layout__nav-menu .layout__nav-menu-item {
  color: var(--nav-menu-item-color);
  border-radius: 6px;
  padding: 12px 16px;
  margin: 2px 0;
  min-height: 38px;
  letter-spacing: 0.07em;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.layout__nav-badge {
  margin: 0 8px 0 6px;
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.layout__nav-menu-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.layout__nav-menu-badge {
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.layout__nav-menu .layout__nav-menu-item::before {
  content: '';
  display: inline-block;
  flex: 0 0 3px;
  align-self: center;
  width: 3px;
  height: 0;
  margin-right: 10px;
  border-radius: 99px;
  background: var(--nav-menu-item-indicator);
  transition: height 0.2s ease;
}

.layout__nav-menu .layout__nav-menu-item:hover,
.layout__nav-menu .q-router-link--active {
  // Inherit theme-aware ink — pure white on pearl was invisible.
  // Background/translate provide the hover feedback; colour stays at
  // `--nav-menu-item-color` (`--surface-ink` light / `--ink-luminous` dark).
  background: var(--nav-menu-item-hover-bg);
  transform: translateX(4px);
}

.layout__nav-menu .layout__nav-menu-item:hover::before,
.layout__nav-menu .q-router-link--active::before {
  height: 20px;
}

.layout__mobile-menu {
  min-width: 300px;
  border: 1px solid var(--nav-menu-border);
  border-top: 2px solid var(--nav-menu-border-top);
  border-radius: 8px;
  background: linear-gradient(180deg, var(--nav-menu-bg-start) 0%, var(--nav-menu-bg-end) 100%);
  box-shadow: 0 8px 32px rgba(43, 36, 24, 0.18);
  backdrop-filter: blur(10px);
  overflow: hidden;
  padding: 8px;
}

body.body--dark .layout__mobile-menu {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

.layout__mobile-menu .q-list {
  padding: 0;
}

.layout__mobile-menu .q-item {
  color: var(--nav-menu-item-color);
  transition: background-color 0.25s ease, color 0.25s ease, transform 0.2s ease;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 2px 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.72rem;
  font-weight: 600;
}

.layout__mobile-menu .q-item:hover,
.layout__mobile-menu .q-router-link--active {
  color: var(--nav-menu-item-color);
  background: var(--nav-menu-item-hover-bg);
  transform: translateX(4px);
}

.layout__mobile-menu .q-separator {
  background: var(--nav-menu-border);
  margin: 6px 0;
}

.layout__mobile-menu .q-item__section--avatar .q-icon,
.layout__mobile-menu .q-expansion-item__toggle-icon,
.layout__mobile-menu .text-primary {
  color: var(--nav-menu-item-indicator) !important;
}

.layout__toolbar-button-more {
  margin-left: 0;
  margin-right: 0;
  padding: 0 20px;
  height: 100%;
  min-height: var(--nav-height);
  border-radius: 0;
  background: var(--nav-action-bg);
  color: var(--nav-ink);
  border-left: 1px solid var(--nav-action-border);
  box-shadow: none;
  transition: all 0.3s ease;
  animation: navReveal 0.7s ease both;
  animation-delay: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.layout__theme-toggle {
  margin-left: auto;
  align-self: stretch;
  min-height: var(--nav-height);
  width: 52px;
  border-left: 1px solid var(--nav-action-border);
  border-radius: 0;
  color: var(--nav-ink);
  background: var(--nav-action-bg);
  box-shadow: none;
  transition: all 0.25s ease;
  position: relative;
  z-index: 1;
}

.layout__theme-toggle:hover {
  background: var(--nav-action-hover-bg);
  border-left-color: var(--nav-action-hover-border);
  color: var(--nav-ink);
}

.layout__theme-toggle .q-icon {
  font-size: 1.25rem;
}

.layout__toolbar-button-more::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--nav-action-sheen) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.layout__toolbar-button-more:hover {
  background: var(--nav-action-hover-bg);
  border-left-color: var(--nav-action-hover-border);
  color: var(--nav-ink);
}

.layout__toolbar-button-more:hover::before {
  opacity: 1;
}

.layout__toolbar-button-more .q-icon {
  font-size: 1.4rem;
  transition: transform 0.3s ease;
}

.layout__toolbar-button-more:hover .q-icon {
  transform: rotate(90deg);
}

.layout__toolbar-button-more .q-btn__content {
  padding: 0;
}

@keyframes navReveal {
  0% {
    opacity: 0;
    transform: translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes navRevealDivider {
  0% {
    opacity: 0;
    transform: translateX(100%) translateY(-8px);
  }
  100% {
    opacity: 1;
    transform: translateX(100%) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .layout__char-name,
  .layout__nav-links,
  .layout__theme-toggle,
  .layout__toolbar-button-more,
  .layout__toolbar__header::before,
  .layout__nav-links a::after {
    animation: none !important;
    transition: none !important;
  }
}

@media screen and (max-width: 1380px) {
  .layout__header-row {
    flex-direction: row;
    align-items: stretch;
  }

  .layout__char-name {
    min-width: 220px;
    padding: 0 16px;
    width: auto;
    align-self: stretch;
  }

  .layout__char-name span {
    max-width: 160px;
    font-size: 0.75rem;
  }

  .layout__nav-links {
    flex-basis: auto;
    width: auto;
  }

  .layout__char-name::after {
    display: block;
    border-width: 64px 24px 0 0;
  }

  .layout__toolbar-button-more {
    padding: 0 16px;
  }
}

@media screen and (max-width: 600px) {
  .layout__char-name {
    min-width: 180px;
    padding: 0 12px;
    gap: 8px;
  }

  .layout__char-name span {
    max-width: 120px;
    font-size: 0.7rem;
  }

  .layout__char-name .aetheryte-badge {
    width: 36px;
    height: 36px;
  }

  .layout__char-name .q-icon {
    font-size: 1.5rem;
  }

  .layout__char-name::after {
    border-width: 56px 18px 0 0;
  }

  .layout__toolbar-button-more {
    padding: 0 14px;
  }

  .layout__theme-toggle {
    width: 46px;
  }

  .layout__toolbar-button-more .q-icon {
    font-size: 1.3rem;
  }

  .layout__toolbar__header {
    --nav-height: 56px;
  }
}

@media screen and (min-width: 1381px) {
  .layout__char-name {
    padding: 14px 24px;
    padding: 12px 24px;
  }

  .layout__char-name span {
    max-width: 320px;
  }
}

@media screen and (max-width: 1024px) {
  .layout__header-row {
    flex-direction: row;
  }

  .layout__char-name {
    min-height: 46px;
    padding: 6px 12px;
  }

  .layout__char-name::after {
    display: block;
  }

  .layout__theme-toggle {
    width: 48px;
  }
}
</style>
