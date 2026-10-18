<template>
  <q-layout view="hHh Lpr fff">
    <!-- ER2-109 — first focusable element; jumps past the header. -->
    <a class="layout__skip-link" href="#inhalt" @click="onSkipLinkClick">Zum Inhalt springen</a>

    <shell-header @open-search="openPalette" />

    <q-page-container>
      <shell-hero v-if="isHome" />

      <div class="layout__page-shell">
        <!-- Skip-link target. Not a <main>: every q-page already renders the
             page's <main> landmark inside this container. -->
        <div id="inhalt" class="layout__page-container" tabindex="-1">
          <router-view />
        </div>
      </div>
    </q-page-container>

    <shell-footer />

    <!-- ER2-205: bottom bar and "Mehr" sheet below 1024px -->
    <shell-mobile-nav @open-search="openPalette" />

    <!-- ER2-206: command palette, loaded on first open -->
    <command-palette v-if="paletteLoaded" v-model="paletteOpen" />

    <!-- ER2-208: single hover-card host for bindHoverCards() containers -->
    <hover-card />
  </q-layout>
</template>

<script lang="ts">
import { defineAsyncComponent } from 'vue';
import { Vue, Options } from 'vue-class-component';
import ShellHeader from './shell/ShellHeader.vue';
import ShellHero from './shell/ShellHero.vue';
import ShellFooter from './shell/ShellFooter.vue';
import ShellMobileNav from './shell/ShellMobileNav.vue';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { persistTelemetryConsent } from 'src/common/telemetry-consent-actions';
import { isSentryConfigured } from 'src/common/sentry';

// App shell. Mounted once by the single '/' parent route (see
// router/routes.ts). Owns the command palette state, the single-column page shell
// and the telemetry consent prompt. ER2-203 removed the calendar widget from
// the shell; components/eventbar/CalendarSidebarWidget.vue stays for the home
// hub (ER2-302). The visible chrome lives
// in ./shell/*: ShellHeader (top bar, nav model in nav.ts), ShellHero,
// ShellFooter and ShellMobileNav (bottom bar + "Mehr" sheet below 1024px).

@Options({
  components: {
    ShellHeader,
    ShellHero,
    ShellFooter,
    ShellMobileNav,
    CommandPalette: defineAsyncComponent(() => import('components/vision/CommandPalette.vue')),
    HoverCard: defineAsyncComponent(() => import('components/vision/HoverCard.vue')),
  },
})
export default class MainLayout extends Vue {
  telemetryConsentDialogShown = false;
  paletteLoaded = false;
  paletteOpen = false;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  mounted() {
    this.keydownHandler = (event: KeyboardEvent) => this.onGlobalKeydown(event);
    window.addEventListener('keydown', this.keydownHandler);
    void this.promptTelemetryConsentIfRequired();
  }

  beforeUnmount() {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
    }
  }

  // ER2-206 — Ctrl+K / Cmd+K toggles the palette everywhere. Editors that
  // bind the shortcut themselves (and call preventDefault) keep it.
  onGlobalKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.altKey || event.shiftKey) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.paletteOpen) {
        this.paletteOpen = false;
      } else {
        this.openPalette();
      }
    }
  }

  openPalette() {
    this.paletteLoaded = true;
    this.paletteOpen = true;
  }

  // ER2-109 — Move focus programmatically instead of following the #inhalt hash, so the
  // router never sees a hash navigation and keyboard focus really lands in main.
  onSkipLinkClick(event: Event) {
    const main = document.getElementById('inhalt');
    if (!main) {
      return;
    }
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
  }

  // ER2-202 — the logo hero renders on the home page only.
  get isHome(): boolean {
    return this.$route.path === '/';
  }

  async switchCharacter() {
    const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;

    this.$q
      .dialog({
        component: SwitchCharacterDialog,
      })
      .onOk((character: SessionCharacterDto) => {
        if (character.verified) {
          void this.$router.push('/');
        } else {
          void this.$router.push('/verify');
        }
      });
  }

  logOut() {
    this.$store.commit('setUser', null);
    this.$api.setAccessToken(null);
    notifySuccess('Du hast dich ausgeloggt.');
    void this.$router.push('/');
  }

  async promptTelemetryConsentIfRequired() {
    if (this.telemetryConsentDialogShown || !isSentryConfigured()) {
      return;
    }

    if (!this.$store.getters.shouldPromptTelemetryConsent) {
      return;
    }

    this.telemetryConsentDialogShown = true;
    await this.openTelemetryConsentDialog(false);
  }

  async openTelemetryConsentDialog(settingsMode: boolean) {
    const TelemetryConsentDialog = (await import('components/common/TelemetryConsentDialog.vue')).default;

    this.$q.dialog({
      component: TelemetryConsentDialog,
      componentProps: {
        settingsMode,
      },
    }).onOk((status: TelemetryConsentStatus) => {
      void this.applyTelemetryConsent(status);
    });
  }

  async applyTelemetryConsent(status: TelemetryConsentStatus) {
    try {
      await persistTelemetryConsent(this.$api, this.$store, status);

      if (status === TelemetryConsentStatus.GRANTED) {
        notifySuccess('Freiwillige Fehlerdiagnose wurde aktiviert.');
      } else {
        notifySuccess('Freiwillige Fehlerdiagnose bleibt deaktiviert.');
      }
    } catch (e) {
      notifyError(e);
      this.telemetryConsentDialogShown = false;
    }
  }
}
</script>

<style lang="scss">
// Layout-level styles only: q-layout outline, the single-column page shell
// and q-page padding. Global q-drawer styles for page drawers come from
// ./shell/drawer-styles.scss. Header, hero and footer styles live with
// their components in ./shell/.
@import './shell/drawer-styles.scss';

$max-layout-width: auto;
$color-primary: #ddb476;
$color-semi-dark: #333;
$color-dark: #1b1b1b;

.q-layout {
  /* box-shadow: rgba(black, 0.2) 8px 0px 4px, rgba(black, 0.2) -8px 0 4px; */
  outline: 1px solid var(--layout-outline, #505050);
}

body.body--dark {
  --layout-outline: #2b3645;
}

@media screen and (min-width: 1024px) {
  body {
    overflow-y: scroll;
  }
}

// Flex filler still used by CharacterProfile / FreeCompanyProfile headers.
.layout__filler {
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__create-content-list {
  padding-left: 12px;
  background: #016097;
}

// ER2-109 — skip link: off-screen until focused, then pinned top-left above
// the header. No transition, so reduced motion needs no extra handling.
.layout__skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 7000;
  padding: 10px 16px;
  border-radius: 8px;
  background: var(--surface-raised);
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-weight: 600;
  text-decoration: underline;
  transform: translateY(-200%);
}

.layout__skip-link:focus,
.layout__skip-link:focus-visible {
  transform: none;
  outline: none;
  box-shadow:
    0 0 0 2px var(--glow-aether),
    0 0 0 3px var(--vision-focus-edge);
}

.layout__page-container:focus {
  outline: none;
}

.layout__page-container {
  width: 100%;
  background: var(--app-page-surface);
  color: var(--app-page-text);
  border: 1px solid var(--app-page-border, transparent);
  border-radius: 30px;
  min-width: 0;
}

.layout__page-shell {
  // ER2-203 — one centred column on every route (no calendar column).
  --page-shell-max: 1200px;
  width: 100%;
  max-width: calc(var(--page-shell-max) + 2 * var(--page-shell-gutter, 24px));
  margin: 0 auto;
  padding: var(--page-shell-top, 24px) var(--page-shell-gutter, 24px) 0;
  // viewport-fit=cover (index.template.html): keep clear of the notch in landscape.
  padding-left: max(var(--page-shell-gutter, 24px), env(safe-area-inset-left, 0px));
  padding-right: max(var(--page-shell-gutter, 24px), env(safe-area-inset-right, 0px));
}

@media screen and (max-width: $breakpoint-xs) {
  .layout__page-shell {
    --page-shell-gutter: 8px;
  }
}

.q-page {
  padding: 24px 24px 48px 24px;
  margin-top: 0;
}

@media screen and (max-width: $breakpoint-sm) {
  .q-page {
    padding: 18px 18px 36px 18px;
  }
}

@media screen and (max-width: $breakpoint-xs) {
  .q-page {
    padding: 12px 12px 24px 12px;
  }
}

@media screen and (min-width: $max-layout-width) {
  .q-layout,
  .q-header {
    max-width: $max-layout-width;
    margin: auto;
  }

  .q-drawer--left {
    left: calc((100% - #{$max-layout-width}) / 2);
  }
}
</style>
