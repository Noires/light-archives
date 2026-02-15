<template>
  <q-layout view="hHh Lpr fff">
    <q-header>
      <q-toolbar class="layout__toolbar__header">
        <div class="layout__filler layout__header-row">
          <div class="layout__char-name cursor-pointer" @click="toggleLeftDrawer"> 
            <template v-if="$store.getters.character">
            <div>
              <q-avatar round>
                <img :src="$store.getters.character.avatar" />
              </q-avatar>
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
                content-class="layout__nav-menu"
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
          <q-btn-dropdown
            class="layout__toolbar-button-more lt-xl"
            flat
            dense
            no-caps
            dropdown-icon="menu"
            tooltip="Menu"
            aria-label="Menu"
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

    <q-drawer overlay v-model="leftDrawerOpen" side="left" :class="DRAWER_BG" :width="DRAWER_WIDTH">
      <q-list dense dark>
        <q-item>
          <q-item-section>
            <site-search-field />
          </q-item-section>
        </q-item>
      </q-list>
      <user-menu />
    </q-drawer>

    <q-page-container>
      <q-toolbar-title class="layout__toolbar-title">
          <router-link to="/">
            <picture>
              <source
                srcset="
                  ~/assets/logo_1x.webp,
                  ~/assets/logo_2x.webp 2x,
                  ~/assets/logo_3x.webp 3x,
                  ~/assets/logo_4x.webp 4x
                "
                type="image/webp"
              />
              <source
                srcset="~/assets/logo_2x.png 2x, ~/assets/logo_3x.png 3x, ~/assets/logo_4x.png 4x"
              />
              <img class="layout__logo" src="~/assets/logo_1x.png" />
            </picture>
          </router-link>
        </q-toolbar-title>

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

    <q-footer elevated>
      <q-toolbar class="layout__toolbar__footer">
        <div class="layout__footer text-body justify-center text-center">
          Final Fantasy XIV © 2010&ndash;2023 Square Enix Co., Ltd. Alle Rechte vorbehalten. Elpisgarten ist eine
          Fanseite und steht nicht mit Square Enix in Verbindung.<br />
          Alle Rechte der Texte und Bilder © 2022–2023 liegen bei ihren jeweiligen Eigentümern.
          <router-link to="/privacy-statement">(Datenschutzerklärung)</router-link>
        </div>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import CalendarSidebarWidget from '../components/eventbar/CalendarSidebarWidget.vue';
import UserMenu from '../components/sidebar/UserMenu.vue';
import InlineSvg from 'vue-inline-svg';
import SiteSearchField from 'src/components/search/SiteSearchField.vue';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { persistTelemetryConsent } from 'src/common/telemetry-consent-actions';
import { isSentryConfigured } from 'src/common/sentry';

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
  components: {
    CalendarSidebarWidget,
    UserMenu,
    InlineSvg,
    SiteSearchField,
  },
})
export default class MainLayout extends Vue {
  readonly DRAWER_BG = 'layout__drawer';
  readonly DRAWER_WIDTH = 250;

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

  leftDrawerOpen = false;
  rightDrawerOpen = false;
  telemetryConsentDialogShown = false;
  menuState: Record<NavGroupKey, boolean> = {
    database: false,
    roleplay: false,
    media: false,
    knowledge: false,
  };
  private menuCloseTimers: Partial<Record<NavGroupKey, ReturnType<typeof setTimeout>>> = {};

  mounted() {
    void this.promptTelemetryConsentIfRequired();
  }

  toggleLeftDrawer() {
    this.leftDrawerOpen = !this.leftDrawerOpen;
  }

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

  unmounted() {
    this.clearAllMenuCloseTimers();
  }
}
</script>

<style lang="scss">
$max-layout-width: auto;
$color-primary: #ddb476;
$color-semi-dark: #333;
$color-dark: #1b1b1b;

.q-layout {
  /* box-shadow: rgba(black, 0.2) 8px 0px 4px, rgba(black, 0.2) -8px 0 4px; */
  outline: 1px solid #505050;
}

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
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.12) 0%, rgba(51, 51, 51, 0.9) 100%);
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);
  transition: background 0.3s ease,
              box-shadow 0.3s ease,
              color 0.3s ease;
  animation: navReveal 0.55s ease both;
  cursor: pointer;
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
  background: rgb(50,50,48);
  clip-path: polygon(0 0, 100% 0, 0 100%);

  pointer-events: none;
  animation: navRevealDivider 0.55s ease both;
  will-change: background;
}

.layout__char-name:hover::after {
  background:  rgba(59, 59, 59, 0.95) 100%;
}

.layout__char-name:hover {
  color: #ffffff;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.2) 0%, rgba(59, 59, 59, 0.95) 100%);
  box-shadow: 6px 0 24px rgba(0, 0, 0, 0.4);
}

.layout__char-name .q-avatar {
  border: 2px solid rgba(221, 180, 118, 0.4);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.layout__char-name:hover .q-avatar {
  border-color: rgba(221, 180, 118, 0.6);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.layout__char-name .q-icon {
  color: var(--nav-accent, #ddb476);
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

.layout__toolbar-title {
  flex-basis: inherit;
  flex-grow: 0;
}

.layout__toolbar-title a {
  color: inherit;
  text-decoration: inherit;
  border-bottom: none;
}

.q-toolbar__title {
  font-family: Michroma, sans-serif;
  font-weight: bold;
  padding-top: 50px;
  padding-bottom: 50px;
  padding-left: 8px;
  padding-right: 8px;
  max-width: 1300px;
  margin: auto;
  text-align: left;
}

.layout__toolbar-title svg {
  width: 400px;
  max-width: 100%;
}

.layout__toolbar-title g {
  fill: #f8f8f8 !important;
}

.layout__toolbar-title:hover g {
  fill: #e8e8e8 !important;
}

.layout__logo {
  filter: brightness(1.05);
  width: 540px;
  max-width: 100%;
  transition: all 0.3s ease;
}

.layout__logo:hover {
  filter: brightness(1.125);
}

.q-toolbar {
  padding: 0;
}

.q-header {
  background-color: transparent;
  border-radius: 0px;
}

.q-drawer .q-item__label--header {
  font-family: Michroma, sans-serif;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(221, 180, 118, 0.7);
  padding: 16px 20px 8px;
}

.q-drawer .q-item.q-router-link--active,
.q-drawer .q-item--active {
  color: #ffffff;
  font-weight: 600;
  background: rgba(221, 180, 118, 0.15);
  border-left: 3px solid #ddb476;
}

.q-drawer .q-list a {
  border-bottom: none;
}

.q-drawer--left {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(15, 15, 15, 0.98) 100%);
  border-right: 1px solid rgba(221, 180, 118, 0.25);
  backdrop-filter: blur(12px);
}

.q-drawer--left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(180deg, rgba(221, 180, 118, 0.08) 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.q-drawer__backdrop {
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
}

.q-drawer .q-list {
  position: relative;
  z-index: 1;
}

.q-drawer .q-item:first-child {
  background: transparent;
}

.q-drawer .q-item:first-child:hover {
  background: transparent;
  transform: none;
}

.q-drawer .q-field {
  margin: 0;
}

.q-drawer .q-field__control {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(221, 180, 118, 0.25);
  border-radius: 8px;
  transition: all 0.3s ease;
  height: 48px;
  min-height: 48px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.q-drawer .q-field__control:before {
  display: none;
}

.q-drawer .q-field__control:after {
  display: none;
}

.q-drawer .q-field__control:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(221, 180, 118, 0.35);
}

.q-drawer .q-field--focused .q-field__control {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(221, 180, 118, 0.5);
}

.q-drawer .q-field__label {
  color: rgba(232, 212, 176, 0.6);
}

.q-drawer .q-field__native {
  color: rgba(232, 212, 176, 0.95);
}

.q-drawer .q-field__append {
  color: rgba(232, 212, 176, 0.7);
}

.q-drawer .q-item {
  color: rgba(232, 212, 176, 0.9);
  transition: all 0.3s ease;
  padding: 14px 5px;
  margin: 4px 8px;
  border-radius: 6px;
}

.q-drawer .q-item:hover {
  color: #ffffff;
  background: rgba(221, 180, 118, 0.1);
  transform: translateX(4px);
}

.q-menu {
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border: 1px solid rgba(221, 180, 118, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 8px;
  backdrop-filter: blur(10px);
}

.q-menu .q-item {
  color: rgba(232, 212, 176, 0.9);
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 12px 16px;
  margin: 2px 0;
}

.q-menu .q-item:hover {
  color: #ffffff;
  background: rgba(221, 180, 118, 0.15);
  transform: translateX(4px);
}

.layout__toolbar__header {
  --nav-bg-start: #1a1a1a;
  --nav-bg-end: #0f0f0f;
  --nav-accent: #ddb476;
  --nav-accent-strong: #ead1a3;
  --nav-ink: #e8d4b0;
  --nav-height: 64px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--nav-bg-start) 0%, var(--nav-bg-end) 100%);
  border-bottom: 2px solid rgba(221, 180, 118, 0.3);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), 0 8px 48px rgba(0, 0, 0, 0.4);
  font-family: Michroma, sans-serif;
  color: var(--nav-ink);
  min-height: var(--nav-height);
  backdrop-filter: blur(10px);
}

.layout__toolbar__header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 50%, rgba(221, 180, 118, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(159, 132, 189, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.2) 100%);
  opacity: 0.6;
  pointer-events: none;
  animation: none;
}

.layout__toolbar__footer {
  background: black;
  color: white;
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
  color: rgba(232, 212, 176, 0.9);
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
  background: linear-gradient(90deg, transparent, rgba(221, 180, 118, 0.8), transparent);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.layout__nav-links a:hover,
.layout__nav-dropdown-trigger:hover {
  color: #ffffff;
  background: rgba(221, 180, 118, 0.08);
}

.layout__nav-links a:hover::after,
.layout__nav-dropdown-trigger:hover::after {
  width: 100%;
}

.layout__nav-links .router-link-active,
.layout__nav-dropdown-trigger_active {
  color: #ffffff;
  background: rgba(221, 180, 118, 0.12);
  border-bottom-color: rgba(221, 180, 118, 0.8);
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
  color: #ffffff;
  background: rgba(221, 180, 118, 0.14);
}

.layout__nav-dropdown-trigger_open .q-icon {
  transform: rotate(180deg);
}

.layout__nav-menu {
  min-width: 300px;
  border: 1px solid rgba(221, 180, 118, 0.28);
  border-top: 2px solid rgba(221, 180, 118, 0.7);
  border-radius: 0;
  background:
    linear-gradient(180deg, rgba(39, 33, 24, 0.98) 0%, rgba(19, 16, 12, 0.98) 100%);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.layout__nav-menu .q-list {
  padding: 8px 0;
}

.layout__nav-menu-item {
  color: rgba(232, 212, 176, 0.9);
  min-height: 38px;
  letter-spacing: 0.07em;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease;
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

.layout__nav-menu-item::before {
  content: '';
  width: 3px;
  height: 0;
  margin-right: 10px;
  border-radius: 99px;
  background: rgba(221, 180, 118, 0.9);
  transition: height 0.2s ease;
}

.layout__nav-menu-item:hover,
.layout__nav-menu .q-router-link--active {
  color: #ffffff;
  background: rgba(221, 180, 118, 0.12);
}

.layout__nav-menu-item:hover::before,
.layout__nav-menu .q-router-link--active::before {
  height: 20px;
}

.layout__toolbar-button-more {
  margin-left: auto;
  margin-right: 0;
  padding: 0 20px;
  height: 100%;
  min-height: var(--nav-height);
  border-radius: 0;
  background: rgba(221, 180, 118, 0.08);
  color: var(--nav-ink);
  border-left: 1px solid rgba(221, 180, 118, 0.2);
  box-shadow: none;
  transition: all 0.3s ease;
  animation: navReveal 0.7s ease both;
  animation-delay: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.layout__toolbar-button-more::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.1) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.layout__toolbar-button-more:hover {
  background: rgba(221, 180, 118, 0.12);
  border-left-color: rgba(221, 180, 118, 0.4);
  color: #ffffff;
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

@keyframes navShimmer {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}

@keyframes navGridShift {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(32px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .layout__char-name,
  .layout__nav-links,
  .layout__toolbar-button-more,
  .layout__toolbar__header::before,
  .layout__nav-links a::after {
    animation: none !important;
    transition: none !important;
  }
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
  background: #fdfdffee;
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

.q-footer {
  background: #ebebeb;
  color: black;
}

.layout__footer {
  flex-grow: 1;
}

.layout__footer a {
  color: #777;
}

.layout__footer a:hover {
  color: #bbb;
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

  .layout__char-name .q-avatar {
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

