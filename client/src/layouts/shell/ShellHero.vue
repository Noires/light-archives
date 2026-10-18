<template>
  <q-toolbar-title class="layout__toolbar-title">
    <router-link to="/">
      <shell-logo img-class="layout__logo" />
    </router-link>
  </q-toolbar-title>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import ShellLogo from './ShellLogo.vue';

// Logo block above the page content (theme-aware picture sources). Rendered
// on the home page only (ER2-202); the top bar carries the small logo.

@Options({
  name: 'ShellHero',
  components: {
    ShellLogo,
  },
})
export default class ShellHero extends Vue {}
</script>

<style lang="scss">
.layout__toolbar-title {
  flex-basis: inherit;
  flex-grow: 0;
}

.layout__toolbar-title a {
  color: inherit;
  text-decoration: inherit;
  border-bottom: none;
}

// Scoped to the hero so other q-toolbar-title uses do not inherit the 50px
// hero padding.
.layout__toolbar-title.q-toolbar__title {
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
</style>
