<template>
  <q-footer elevated class="mat-vellum">
    <q-toolbar class="layout__toolbar__footer column">
      <triskelion-divider class="layout__footer-ornament" />
      <div class="layout__footer text-body justify-center text-center">
        Final Fantasy XIV © 2010&ndash;2026 Square Enix Co., Ltd. Alle Rechte vorbehalten. Elpisgarten ist eine
        Fanseite und steht nicht mit Square Enix in Verbindung.<br />
        Alle Rechte der Texte und Bilder © 2021–2026 liegen bei ihren jeweiligen Eigentümern.
        <router-link to="/privacy-statement">(Datenschutzerklärung) </router-link>
        <router-link to="/impressum">(Impressum)</router-link>
      </div>
    </q-toolbar>
  </q-footer>
</template>

<script lang="ts">
import { Vue, Options } from 'vue-class-component';
import TriskelionDivider from 'src/components/aetherium/TriskelionDivider.vue';

// Page footer with the legal notice.

@Options({
  name: 'ShellFooter',
  components: {
    TriskelionDivider,
  },
})
export default class ShellFooter extends Vue {}
</script>

<style lang="scss">
// Global q-toolbar reset (also hits the header toolbar and any page toolbar).
// It must load before `.layout__toolbar__footer` below, which re-adds padding.

.q-toolbar {
  padding: 0;
}

// ELPIS-105 — Vellum (Hydaelyn) / Obsidian (Zodiark) is now the page-chrome
// surface for the footer; toolbar inside stays transparent so the parent
// material is visible. Column flow lets the triskelion ornament sit above
// the legal text.
.layout__toolbar__footer {
  background: transparent;
  color: var(--app-footer-text);
  padding: 18px 16px;
  gap: 14px;
  min-height: 0;
}

.layout__footer-ornament {
  margin-bottom: 4px;
  align-self: stretch;
}

// `.q-footer.mat-vellum` keeps the footer edge-to-edge (no rounded corners)
// and softens the elevated drop-shadow on the Hydaelyn warm palette. On
// Zodiark we override Vellum's lift surface with the Obsidian gradient so
// the footer reads as continuous page chrome, not a dark card.
.q-footer {
  color: var(--app-footer-text);
}

.q-footer.mat-vellum {
  border-radius: 0;
  border-top: 1px solid var(--rule-gold-soft);
  box-shadow: 0 -2px 10px rgba(43, 36, 24, 0.08);
}

body.body--dark .q-footer.mat-vellum {
  background-color: var(--surface-obsidian);
  background-image: linear-gradient(
    135deg,
    var(--surface-obsidian) 0%,
    var(--surface-deep) 100%
  );
  border-top-color: var(--rule-arcane-soft);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.45);
}

.layout__footer {
  flex-grow: 1;
}

// Local colour on purpose: the footer is page chrome (Vellum / Obsidian),
// not page content, so the global link colour must not leak in. Underlined
// so the links do not rely on colour alone inside the legal text.
.layout__footer a,
.layout__footer a:visited {
  color: var(--app-footer-link);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.layout__footer a:hover {
  color: var(--app-footer-link-hover);
}
</style>
