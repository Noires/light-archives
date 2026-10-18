<template>
  <picture v-if="$q.dark.isActive">
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
    <img :class="imgClass" src="~/assets/logo_dark_1x_.png" :alt="alt" :width="width" :height="height" />
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
    <img :class="imgClass" src="~/assets/logo_1x.png" :alt="alt" :width="width" :height="height" />
  </picture>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

// Theme-aware Elpisgarten logo (Hydaelyn / Zodiark artwork). Used by the
// home hero and, small, by the top bar.

class Props {
  imgClass = prop<string>({ default: '' });
  alt = prop<string>({ default: 'Elpisgarten' });
  width = prop<number | undefined>({ default: undefined });
  height = prop<number | undefined>({ default: undefined });
}

@Options({
  name: 'ShellLogo',
})
export default class ShellLogo extends Vue.with(Props) {}
</script>
