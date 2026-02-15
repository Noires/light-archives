<template>
  <q-page class="page-beginner-guide">
    <header class="page-beginner-guide__hero">
      <span class="page-beginner-guide__eyebrow">Wissenswertes</span>
      <h2>Anfängerguide</h2>
      <p>
        Dieser Bereich ist aktuell in Bearbeitung. Bis der Guide vollständig ist, findest du die wichtigsten Infos in
        der <router-link to="/faq">FAQ</router-link> und im <router-link to="/rules">Regelwerk</router-link>.
      </p>
    </header>

    <section class="page-beginner-guide__content">
      <h3>Was kommt als Nächstes?</h3>
      <ul>
        <li>Erste Schritte für neue Rollenspieler auf Elpisgarten</li>
        <li>Profil-Tipps und häufige Stolpersteine</li>
        <li>Empfohlene Startpunkte für Geschichten, Events und Kontakte</li>
      </ul>
    </section>
  </q-page>
</template>

<style lang="scss">
.page-beginner-guide {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-beginner-guide::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background:
    radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-beginner-guide__hero {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  padding: 20px 22px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-beginner-guide__hero h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-beginner-guide__hero p {
  margin: 0;
  color: rgba(35, 35, 35, 0.72);
}

.page-beginner-guide__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-beginner-guide__content {
  position: relative;
  z-index: 1;
  padding: 16px 18px 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-beginner-guide__content h3 {
  margin-top: 0;
}

.page-beginner-guide__content ul {
  margin-bottom: 0;
}
</style>
