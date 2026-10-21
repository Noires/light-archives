<template>
  <q-page class="info-page">
    <page-head eyebrow="Wissenswertes" title="Anfängerguide" lead="Dieser Bereich ist aktuell in Bearbeitung.">
      <nav class="info-page__links" aria-label="Weitere Infos">
        <router-link to="/faq">FAQ</router-link>
        <router-link to="/rules">Regelwerk</router-link>
      </nav>
    </page-head>

    <section class="info-panel">
      <h2 class="info-panel__title">Was kommt als Nächstes?</h2>
      <ul>
        <li>Erste Schritte für neue Rollenspieler auf Elpisgarten</li>
        <li>Profil-Tipps und häufige Stolpersteine</li>
        <li>Empfohlene Startpunkte für Geschichten, Events und Kontakte</li>
      </ul>
      <p class="info-note">
        Bis der Guide vollständig ist, findest du die wichtigsten Infos in der FAQ und im Regelwerk.
      </p>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import PageHead from 'src/components/vision/PageHead.vue';

@Options({
  name: 'PageBeginnerGuide',
  components: { PageHead },
})
export default class PageBeginnerGuide extends Vue {}
</script>
