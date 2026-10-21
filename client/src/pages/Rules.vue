<template>
  <q-page class="info-page">
    <page-head
      eyebrow="Wissenswertes"
      title="Regelwerk"
      lead="Diese Regeln sorgen für ein respektvolles, sicheres und rollenspielnahes Miteinander auf Elpisgarten. Lies dir die Punkte bitte sorgfältig durch."
    >
      <nav class="info-page__links" aria-label="Weitere Infos">
        <router-link to="/faq">FAQ</router-link>
        <router-link to="/contact">Kontakt</router-link>
      </nav>
    </page-head>

    <section class="info-panel">
      <div class="info-prose info-prose--rules" v-html="rules"></div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import PageHead from 'src/components/vision/PageHead.vue';
import rules from 'src/markdown/rules.md';

@Options({
  name: 'PageRules',
  components: { PageHead },
})
export default class PageRules extends Vue {
  readonly rules = rules;
}
</script>
