<template>
  <q-page class="info-page">
    <page-head
      eyebrow="Über Elpisgarten"
      title="Kontakt"
      lead="Fragen, Ideen oder etwas funktioniert nicht? So erreichst du das Team hinter Elpisgarten."
    >
      <nav class="info-page__links" aria-label="Weitere Infos">
        <router-link to="/faq">FAQ</router-link>
        <router-link to="/about">Über uns</router-link>
      </nav>
    </page-head>

    <section class="info-grid">
      <article class="info-panel">
        <h2 class="info-panel__title"><q-icon name="discord" aria-hidden="true" /> Discord</h2>
        <p>
          Unser offizieller Discordserver „Projekt Elpis“ ist der schnellste Weg zu uns: für Fragen zum Portal,
          Feedback, Vorschläge und Hinweise auf Inhalte, die gegen das
          <router-link to="/rules">Regelwerk</router-link> verstoßen.
        </p>
        <a class="info-action" href="https://discord.gg/wFT8DGkr3J" target="_blank" rel="noopener noreferrer">
          Projekt Elpis beitreten <q-icon class="external-link-icon" name="launch" aria-hidden="true" />
        </a>
      </article>

      <article class="info-panel">
        <h2 class="info-panel__title"><q-icon name="bug_report" aria-hidden="true" /> Fehler melden</h2>
        <p>
          Elpisgarten ist Open Source. Fehler kannst du direkt auf GitHub als Issue melden; dafür brauchst du ein
          GitHub-Konto. Beschreib kurz, was du gemacht hast, was passiert ist und was du erwartet hättest, und nenn
          Seite, Gerät und Browser.
        </p>
        <a
          class="info-action"
          href="https://github.com/Noires/light-archives/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Issue auf GitHub öffnen <q-icon class="external-link-icon" name="launch" aria-hidden="true" />
        </a>
        <p class="info-note">Ohne GitHub-Konto? Melde den Fehler einfach auf Discord.</p>
      </article>
    </section>
  </q-page>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import PageHead from 'src/components/vision/PageHead.vue';

@Options({
  name: 'PageContact',
  components: { PageHead },
})
export default class PageContact extends Vue {}
</script>
