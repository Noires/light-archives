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
        <h2 id="shell-sheet-title" class="shell-sheet__title">Mehr</h2>
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
          <div class="shell-sheet__grid">
            <router-link
              v-for="area in sheetAreas"
              :key="area.key"
              :to="area.to"
              class="shell-sheet__tile"
              :class="{ 'shell-sheet__tile--active': isActive(area) }"
              active-class=""
              exact-active-class=""
            >
              <q-icon :name="area.icon" size="22px" aria-hidden="true" />
              <span>{{ area.label }}</span>
            </router-link>
          </div>
        </section>

        <section class="shell-sheet__section" aria-labelledby="shell-sheet-wiki">
          <h3 id="shell-sheet-wiki" class="shell-sheet__label">Wiki &amp; Wissenswertes</h3>
          <router-link
            v-for="link in wikiLinks"
            :key="link.to"
            :to="link.to"
            class="shell-sheet__row"
            active-class="shell-sheet__row--active"
          >
            <q-icon :name="link.icon" size="20px" aria-hidden="true" />
            <span>{{ link.label }}</span>
          </router-link>
        </section>

        <section
          v-for="group in moreGroups"
          :key="group.key"
          class="shell-sheet__section"
          :aria-labelledby="`shell-sheet-${group.key}`"
        >
          <h3 :id="`shell-sheet-${group.key}`" class="shell-sheet__label">{{ group.label }}</h3>
          <router-link
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            class="shell-sheet__row"
            :active-class="link.to === '/' ? '' : 'shell-sheet__row--active'"
            exact-active-class="shell-sheet__row--active"
          >
            <q-icon :name="link.icon" size="20px" aria-hidden="true" />
            <span>{{ link.label }}</span>
          </router-link>
        </section>

        <section class="shell-sheet__section" aria-labelledby="shell-sheet-notifications">
          <h3 id="shell-sheet-notifications" class="shell-sheet__label">Benachrichtigungen</h3>
          <slot name="notifications">
            <p class="shell-sheet__empty">Keine neuen Benachrichtigungen.</p>
          </slot>
        </section>
      </div>
    </div>
  </q-dialog>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { MORE_GROUPS, PRIMARY_AREAS, ShellNavArea, WIKI_AREA, WIKI_LINKS, isAreaActive } from './nav';
import { shellTheme, themeAriaLabel, themeIcon, toggleShellTheme } from './theme-state';

// ER2-205 — below 1024px: fixed bottom bar (Start, Events, Charaktere,
// Suche, Mehr) and the "Mehr" bottom sheet with every other nav link, the
// theme toggle and the notifications placeholder. Account actions stay in
// the top bar's account pill. Emits `open-search` for the command palette.

const BAR_KEYS = ['events', 'characters'];

@Options({
  name: 'ShellMobileNav',
  emits: ['open-search'],
  watch: {
    '$route.fullPath'() {
      (this as ShellMobileNav).sheetOpen = false;
    },
  },
})
export default class ShellMobileNav extends Vue {
  readonly wikiLinks = WIKI_LINKS;
  readonly moreGroups = MORE_GROUPS;

  sheetOpen = false;

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
    return [...PRIMARY_AREAS.filter((area) => !BAR_KEYS.includes(area.key)), WIKI_AREA];
  }

  isActive(area: ShellNavArea): boolean {
    return isAreaActive(area, this.$route.path);
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

.shell-sheet__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 0 4px 4px;
}

.shell-sheet__tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 72px;
  padding: 12px;
  font: 600 14px/20px var(--font-ui);
  color: var(--ink-primary);
  text-decoration: none;
  background: var(--rule-tint);
  border: 1px solid var(--rule-soft);
  border-radius: 10px;

  .q-icon {
    color: var(--ink-muted);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.shell-sheet__tile--active {
  border-color: var(--rule-strong);
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

.shell-sheet__empty {
  margin: 0;
  padding: 4px 8px 8px;
  font: 400 14px/20px var(--font-ui);
  color: var(--ink-muted);
}
</style>
