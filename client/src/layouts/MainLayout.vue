<template>
  <q-layout view="hHh Lpr fff">
    <q-header>
      <q-toolbar class="layout__toolbar__header">
        <div class="layout__filler">
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
          <nav class="layout__nav-links gt-sm">
            <router-link v-for="link in siteLinks" :key="link.label" :to="link.to">{{ link.label }}</router-link>
          </nav>
          <q-btn-dropdown
            class="layout__toolbar-button-more lt-md"
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

    <q-drawer overlay v-model="leftDrawerOpen" show-if-above side="left" :class="DRAWER_BG" :width="DRAWER_WIDTH">
      <q-list dense dark>
        <q-item>
          <q-item-section>
            <site-search-field />
          </q-item-section>
        </q-item>
      </q-list>
      <q-separator dark />
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

      <div class="layout__page-container">
        <router-view />
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
import EventList from '../components/eventbar/EventList.vue';
import UserMenu from '../components/sidebar/UserMenu.vue';
import InlineSvg from 'vue-inline-svg';
import SiteSearchField from 'src/components/search/SiteSearchField.vue';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { notifySuccess } from 'src/common/notify';

@Options({
  components: {
    EventList,
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

.layout__filler__end {
  color:white;
  flex-basis: 0;
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
}

.layout__char-name {
  font-size: 1rem;
  display: flex;
  align-items: center;
  font-family: Michroma, sans-serif;
  font-weight: bold;
  letter-spacing: 0.01786em;
  color: $color-primary;
  padding: 0 12px;
  min-width: 300px;
  position: relative;
  z-index: +1;
  background-color: $color-semi-dark;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    transform: translateX(100%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 50px 25px 0 0;
    border-color: $color-semi-dark transparent transparent transparent;
  }
}

.layout__char-name :hover {
  font-weight: bold;
}

.q-avatar:hover {
  font-weight: bold;
}

.layout__char-name span {
  padding-left: 6px;
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

.layout__toolbar-button-more {
  padding-left: 4px;
  padding-right: 4px;
  margin-left: auto;
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
  background-color: $color-semi-dark;
  font-family: Montserrat, sans-serif;
  color: white;
}

.layout__toolbar__footer {
  background: black;
  color: white;
}

.layout__nav-links {
  text-align: center;
  font-size: 16px;
  display: flex;
  flex: 1;
  position: relative;
  background-color: $color-dark;
  min-height: 50px;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    transform: translateX(100%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 50px 25px 0 0;
    border-color: $color-semi-dark transparent transparent transparent;
  }
}

.layout__nav-links a {
  display: flex;
  align-items: center;
  padding: 6px 30px 6px 30px;
  color: $color-primary;
  transition: all 0.3s ease;
  font-family: Montserrat, sans-serif;
  font-size: small;
  &:first-child {
    padding-left: 50px;
  }
}

.layout__nav-links a:hover {
  background: rgba(255, 255, 255, 0.15);
}

.layout__nav-links .router-link-active {
  color: white;
  background: rgba(255, 255, 255, 0.15);
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
  max-width: 1300px;
  margin: auto;
  background: #fdfdffee;
  border-radius: 30px 30px 0px 0px;
}

.q-page {
  padding: 24px 24px 48px 24px;
  margin-top: 30px;
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
  .layout__filler {
    flex-direction: column;
  }
  .layout__char-name::after,
  .layout__nav-links::after {
    display: none;
  }

  .layout__char-name {
    padding: 5px 12px;
  }

  .layout__nav-links {
    margin-right: 0;
    justify-content: center;
    a:first-child {
      padding-left: 30px;
    }
  }
}

@media screen and (max-width: 1024px) {
  .layout__filler {
    flex-direction:row;
  }
}
</style>
