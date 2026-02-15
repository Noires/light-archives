<template>
  <q-page class="page-faq">
    <header class="page-faq__hero">
      <span class="page-faq__eyebrow">Wissenswertes</span>
      <h2>Häufige Fragen</h2>
      <p>
        Hier findest du schnelle Antworten zu Konto, Upload, Inhalten und Datenschutz.
        Wenn etwas fehlt, schau zusätzlich im <router-link to="/rules">Regelwerk</router-link> vorbei.
      </p>
    </header>

    <section class="page-faq__content">
      <div class="page-faq__markdown" v-html="faq"></div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';
import faq from 'src/markdown/faq.md';

export default class PageFaq extends Vue {
  readonly faq = faq;
}
</script>

<style lang="scss">
.page-faq {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-faq::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background:
    radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-faq h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-faq__hero {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  padding: 20px 22px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-faq__hero h2 {
  margin-bottom: 0;
}

.page-faq__hero p {
  margin: 0;
  color: rgba(35, 35, 35, 0.72);
}

.page-faq__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-faq__content {
  position: relative;
  z-index: 1;
  padding: 16px 18px 18px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-faq__markdown h3 {
  font-size: 1.32rem;
  margin-top: 1.55em;
  margin-bottom: 0.5em;
  padding-top: 0.6em;
  border-top: 1px solid rgba(221, 180, 118, 0.35);
}

.page-faq__markdown h3:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.page-faq__markdown h4 {
  margin-top: 1.1em;
  margin-bottom: 0.35em;
  padding: 8px 12px;
  border-left: 3px solid rgba(221, 180, 118, 0.75);
  background: linear-gradient(90deg, rgba(221, 180, 118, 0.2), rgba(221, 180, 118, 0.05));
  font-family: $header-font;
  font-size: 1.02rem;
  line-height: 1.35;
  color: #1f2c38;
}

.page-faq__markdown h3 + h4 {
  margin-top: 0.75em;
}

.page-faq__markdown h4 + p {
  margin-top: 0.45em;
}

.page-faq__markdown p {
  margin-top: 0.3em;
  margin-bottom: 0.9em;
}

.page-faq__markdown ul,
.page-faq__markdown ol {
  margin-bottom: 0.9em;
}

@media (max-width: 700px) {
  .page-faq {
    padding: 20px 14px 36px;
  }

  .page-faq__hero {
    padding: 16px;
  }

  .page-faq__content {
    padding: 12px 14px 14px;
  }

  .page-faq__markdown h4 {
    font-size: 0.96rem;
    padding: 7px 10px;
  }
}
</style>
