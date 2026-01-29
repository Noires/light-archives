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
            <router-link v-for="link in siteLinks" :key="link.label" :to="link.to">{{ link.label }}</router-link>
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
              <q-item v-for="link in siteLinks" clickable v-close-popup :key="link.label" :to="link.to">
                <q-item-section>
                  <q-item-label>{{ link.label }}</q-item-label>
                </q-item-section>
              </q-item>
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
import { notifySuccess } from 'src/common/notify';

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

  readonly navbarLinks = [
    { label: 'Über uns', to: '/about' },
    { label: 'Regeln', to: '/rules' },
    { label: 'Wiki', to: '/wiki/Chaos_Archives_Wiki' },
    { label: 'Kontakt', to: '/contact' },
  ];

  readonly siteLinks = [
    { label: 'Charaktere', to: '/profiles' },
    { label: 'Treffpunkte', to: '/venues' },
    { label: 'Anschlagbrett', to: '/noticeboard' },
    { label: 'Communities', to: '/communities' },
    { label: 'Freie Gesellschaften', to: '/free-companies' },
    { label: 'Screenshots', to: '/gallery/screenshot' },
    { label: 'Kunstwerke', to: '/gallery/artwork' },
    { label: 'Geschichten', to: '/stories' },
  ];

  leftDrawerOpen = false;
  rightDrawerOpen = false;

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
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.01786em;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--nav-ink);
  padding: 12px 20px;
  min-width: 300px;
  min-height: var(--nav-height);
  position: relative;
  z-index: +1;
  text-transform: uppercase;
  border-radius: 0;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.1), #333333);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  animation: navReveal 0.55s ease both;
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
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 50px 25px 0 0;
  border-color: #313131 transparent transparent transparent;
}

.layout__char-name:hover::after {
  border-color: #3b3b3b transparent transparent transparent;
}
.layout__char-name:hover {
  transform: translateY(-1px);
  color: #ffffff;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.3), #3b3b3b);
  box-shadow: 0 16px 28px rgba(0, 0, 0, 0.45);
}

.layout__char-name .q-avatar {
  border: 1px solid rgba(221, 180, 118, 0.45);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
}

.layout__char-name .q-icon {
  color: var(--nav-accent, #ddb476);
}

.layout__char-name span {
  font-size: 0.78rem;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
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
  font-weight: bold;
}
.q-drawer .q-item.q-router-link--active,
.q-drawer .q-item--active {
  color: white;
  font-weight: bold;
}
.q-drawer .q-list a {
  border-bottom: none;
}
.q-drawer--left {
  background: $color-dark;
}
.q-drawer .q-item {
  color: $color-primary;
}

.q-menu {
  background: $color-dark;
}

.q-menu .q-item {
  color: $color-primary;
}

.layout__toolbar__header {
  --nav-bg-start: #000000;
  --nav-bg-end: #000000;
  --nav-accent: #ddb476;
  --nav-accent-strong: #ead1a3;
  --nav-ink: #ddb476;
  --nav-height: 46px;
  position: relative;
  overflow: hidden;
  background: #000000;
  border-bottom: 1px solid rgba(221, 180, 118, 0.4);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  font-family: Michroma, sans-serif;
  color: var(--nav-ink);
  min-height: var(--nav-height);
}

.layout__toolbar__header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 1px, transparent 1px, transparent 32px),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0px, rgba(255, 255, 255, 0.04) 1px, transparent 1px, transparent 28px),
    linear-gradient(120deg, rgba(255, 255, 255, 0.06), transparent 40%),
    linear-gradient(0deg, rgba(0, 0, 0, 0.4), transparent 45%);
  opacity: 0.45;
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
  min-height: var(--nav-height);
  padding: 0 4px 0 0;
  background: transparent;
  animation: navReveal 0.65s ease both;
  animation-delay: 0.1s;
}

.layout__nav-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 14px;
  color: var(--nav-ink);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-family: Michroma, sans-serif;
  font-weight: 700;
  font-size: 0.68rem;
  text-decoration: none;
  border-radius: 0;
  clip-path: none;
  background: transparent;
  box-shadow: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, background 0.2s ease;
  position: relative;
  overflow: hidden;
}

.layout__nav-links a:first-child {
  padding-left: 52px;
}

.layout__nav-links a::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 20%, rgba(221, 180, 118, 0.65) 40%, transparent 60%);
  opacity: 0;
  transform: translateX(-120%);
  transition: opacity 0.2s ease;
}

.layout__nav-links a:hover {
  transform: translateY(-1px);
  background: #3b3b3b;
  box-shadow: none;
}

.layout__nav-links a:hover::after {
  opacity: 1;
  animation: navShimmer 0.7s ease forwards;
}

.layout__nav-links .router-link-active {
  color: #ffffff;
  background: #333333;
  box-shadow: none;
}

.layout__toolbar-button-more {
  margin-left: auto;
  padding: 0 12px;
  min-height: var(--nav-height);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.18), rgba(24, 28, 36, 0.88));
  color: var(--nav-ink);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  animation: navReveal 0.7s ease both;
  animation-delay: 0.2s;
}


.layout__toolbar-button-more:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(221, 180, 118, 0.28), rgba(36, 42, 54, 0.9));
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1300px) var(--calendar-width);
  gap: 24px;
  align-items: start;
  margin: 0 auto;
}

.layout__page-container {
  grid-column: 2;
}

.layout__calendar-outer {
  grid-column: 3;
  position: sticky;
  top: 180px;
  width: 100%;
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
    min-width: 0;
    padding: 5px 12px;
    width: auto;
    align-self: flex-start;
  }

  .layout__nav-links {
    flex-basis: auto;
    width: auto;
  }

  .layout__char-name::after {
    display: block;
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
    margin: 0 24px 24px;
  }
}
</style>
