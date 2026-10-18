<template>
  <q-layout view="hHh Lpr fff">
    <shell-header @toggle-drawer="toggleLeftDrawer" />

    <shell-drawer v-model="leftDrawerOpen" />

    <q-page-container>
      <shell-hero />

      <div class="layout__page-shell">
        <div class="layout__page-container">
          <router-view />
        </div>
        <calendar-sidebar-widget
          v-if="showCalendarWidget"
          class="layout__calendar-outer"
        />
      </div>
    </q-page-container>

    <shell-footer />
  </q-layout>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
// CalendarSidebarWidget is imported before the shell parts so its CSS keeps
// loading ahead of the layout rules, as it did before the split.
import CalendarSidebarWidget from '../components/eventbar/CalendarSidebarWidget.vue';
import ShellHeader from './shell/ShellHeader.vue';
import ShellDrawer from './shell/ShellDrawer.vue';
import ShellHero from './shell/ShellHero.vue';
import ShellFooter from './shell/ShellFooter.vue';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { persistTelemetryConsent } from 'src/common/telemetry-consent-actions';
import { isSentryConfigured } from 'src/common/sentry';

// App shell. Mounted once by the single '/' parent route (see
// router/routes.ts). Owns the drawer open state, the page-shell grid with the
// calendar widget, and the telemetry consent prompt. The visible chrome lives
// in ./shell/*: ShellHeader, ShellDrawer, ShellHero, ShellFooter.

@Options({
  components: {
    CalendarSidebarWidget,
    ShellHeader,
    ShellDrawer,
    ShellHero,
    ShellFooter,
  },
})
export default class MainLayout extends Vue {
  leftDrawerOpen = false;
  rightDrawerOpen = false;
  telemetryConsentDialogShown = false;

  mounted() {
    void this.promptTelemetryConsentIfRequired();
  }

  toggleLeftDrawer() {
    this.leftDrawerOpen = !this.leftDrawerOpen;
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

  get showCalendarWidget() {
    const path = this.$route.path;
    return !path.startsWith('/calendar');
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
// Layout-level styles only: q-layout outline, page-shell grid, calendar
// widget column and q-page padding. Header, drawer, hero and footer styles
// live with their components in ./shell/.
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

.layout__create-content-list {
  padding-left: 12px;
  background: #016097;
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
  --calendar-width: 320px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr minmax(0, 1300px) var(--calendar-width) 1fr;
  gap: 24px;
  align-items: start;
  margin: 0 auto;
}

.layout__page-container {
  grid-column: 2;
}

.layout__calendar-outer {
  --calendar-sticky-top: 180px;
  grid-column: 3;
  position: sticky;
  top: var(--calendar-sticky-top);
  width: 100%;
  max-height: calc(100vh - var(--calendar-sticky-top) - 16px);
  overflow: hidden;
  z-index: 5;
  align-self: start;
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

@media screen and (max-width: 1200px) {
  .layout__page-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .layout__page-container {
    grid-column: 1;
  }

  .layout__calendar-outer {
    grid-column: 1;
    position: static;
    width: auto;
    max-height: none;
    overflow: visible;
    margin: 0 24px 24px;
  }
}
</style>
