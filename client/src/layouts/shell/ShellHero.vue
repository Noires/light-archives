<template>
  <q-toolbar-title class="layout__toolbar-title">
    <router-link to="/">
      <picture v-if="isEffectiveDarkMode">
        <source
          srcset="
            ~/assets/logo_dark_1x_.webp,
            ~/assets/logo_dark_2x.webp 2x,
            ~/assets/logo_dark_3x.webp 3x,
            ~/assets/logo_dark_4x.webp 4x
          "
          type="image/webp"
        />
        <source
          srcset="~/assets/logo_dark_2x.png 2x, ~/assets/logo_dark_3x.png 3x, ~/assets/logo_dark_4x.png 4x"
        />
        <img class="layout__logo" src="~/assets/logo_dark_1x_.png" />
      </picture>
      <picture v-else>
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
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';

// Logo block above the page content (theme-aware picture sources).

@Options({
  name: 'ShellHero',
})
export default class ShellHero extends Vue {
  get isEffectiveDarkMode(): boolean {
    return this.$q.dark.isActive;
  }
}
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
</style>
