<template>
  <progress
    class="elpis-scroll-progress"
    max="1"
    :value="progress"
    aria-label="Lesefortschritt"
  >{{ percentLabel }}</progress>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

// ELPIS-705 — News scroll progress indicator. Mirrors the client app's
// ScrollProgressRule (ELPIS-503) — same listener + paint contract. Mounted on
// the dedicated single-article page so the bar tracks read state through
// long-form articles.
@Options({
  name: 'ScrollProgressRule',
})
export default class ScrollProgressRule extends Vue {
  progress = 0;

  private rafId: number | null = null;
  private boundOnScroll: (() => void) | null = null;

  mounted() {
    this.boundOnScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.boundOnScroll, { passive: true });
    window.addEventListener('resize', this.boundOnScroll, { passive: true });
    this.compute();
  }

  beforeUnmount() {
    if (this.boundOnScroll) {
      window.removeEventListener('scroll', this.boundOnScroll);
      window.removeEventListener('resize', this.boundOnScroll);
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  get percentLabel(): string {
    return `${Math.round(this.progress * 100)}%`;
  }

  private onScroll() {
    if (this.rafId !== null) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.compute();
      this.rafId = null;
    });
  }

  private compute() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      this.progress = 0;
      return;
    }
    const ratio = scrollTop / docHeight;
    this.progress = ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
  }
}
</script>
