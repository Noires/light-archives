<template>
  <q-page class="info-page">
    <page-head
      eyebrow="Wissenswertes"
      title="Häufige Fragen"
      lead="Schnelle Antworten zu Konto, Upload, Inhalten und Datenschutz."
    >
      <nav class="info-page__links" aria-label="Weitere Infos">
        <router-link to="/rules">Regelwerk</router-link>
        <router-link to="/contact">Kontakt</router-link>
      </nav>
    </page-head>

    <section class="info-panel">
      <div class="info-prose info-prose--faq" v-html="faq"></div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import PageHead from 'src/components/vision/PageHead.vue';
import faq from 'src/markdown/faq.md';

@Options({
  name: 'PageFaq',
  components: { PageHead },
})
export default class PageFaq extends Vue {
  readonly faq = faq;
}
</script>
