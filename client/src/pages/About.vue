<template>
  <q-page class="page-about">
    <header class="page-about__hero">
      <span class="page-about__eyebrow">Über Elpisgarten</span>
      <h2>Gemeinsam Rollenspiel gestalten</h2>
      <p class="page-about__lead">
        Elpisgarten ist ein Rollenspielportal für die deutschsprachige Rollenspielcommunity in Final Fantasy XIV, basierend auf
        <a href="https://chaosarchives.org/" target="_blank" rel="noopener noreferrer">
          Chaos Archives <q-icon class="external-link-icon" name="launch" />
        </a>.
      </p>
      <div class="page-about__hero-links">
        <router-link to="/faq">FAQ ansehen</router-link>
        <router-link to="/rules">Regelwerk lesen</router-link>
      </div>
    </header>

    <section class="page-about__grid">
      <article class="page-about__panel">
        <h3>Team</h3>
        <p>Dieser Bereich ist aktuell in Bearbeitung.</p>
      </article>

      <article class="page-about__panel">
        <h3>Credits</h3>
        <p>
          Wir dürfen die Codebasis von
          <a href="https://chaosarchives.org/" target="_blank" rel="noopener noreferrer">
            Chaos Archives
          </a>
          mit freundlicher Erlaubnis nutzen. Ein besonderer Dank geht an die Entwicklerin Maia Everett.
        </p>
      </article>

      <article class="page-about__panel">
        <h3>Nützliche Links</h3>
        <ul class="page-about__link-list">
          <li>
            <a href="https://discord.gg/wFT8DGkr3J" target="_blank" rel="noopener noreferrer">
              Projekt "Elpis" <q-icon name="discord" />
            </a>
            <p>Unser offizieller Discordserver.</p>
          </li>
        </ul>
      </article>

      <article v-if="statistics" class="page-about__panel page-about__panel--full">
        <h3>Statistiken</h3>
        <div class="page-about__stats-grid">
          <section>
            <h4>Charaktere nach Volk</h4>
            <q-markup-table class="striped-list page-about__table">
              <thead>
                <tr>
                  <th class="text-left">Volk</th>
                  <th class="text-right">Anzahl</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statistics.races" :key="row.race">
                  <td>{{ $display.races[row.race] }}</td>
                  <td class="text-right">{{ row.count }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </section>

          <section>
            <h4>Charaktere nach Welt</h4>
            <q-markup-table class="striped-list page-about__table">
              <thead>
                <tr>
                  <th class="text-left">Welt</th>
                  <th class="text-right">Anzahl</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statistics.servers" :key="row.name">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ row.count }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </section>

          <section>
            <h4>Miqo'te Goldtatzen-Stämme</h4>
            <q-markup-table class="striped-list page-about__table">
              <thead>
                <tr>
                  <th class="text-left">Stamm</th>
                  <th class="text-right">Anzahl</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statistics.seekerTribes" :key="row.name">
                  <td>{{ row.name }}</td>
                  <td class="text-right">{{ row.count }}</td>
                </tr>
              </tbody>
            </q-markup-table>
          </section>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script lang="ts">
import { StatisticsDto } from '@app/shared/dto/statistics/statistics.dto';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

async function load(): Promise<StatisticsDto> {
  return $api.statistics.getStatistics();
}

@Options({
  name: 'PageAbout',
  async beforeRouteEnter(_, __, next) {
    const statistics = await load();
    next(vm => (vm as PageAbout).setContent(statistics));
  },
})
export default class PageAbout extends Vue {
  statistics: StatisticsDto | null = null;

  setContent(statistics: StatisticsDto) {
    this.statistics = statistics;
  }
}
</script>

<style lang="scss">
.page-about {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-about::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background:
    radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-about h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-about__hero {
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

.page-about__hero h2 {
  margin-bottom: 0;
}

.page-about__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-about__lead {
  margin: 0;
  width: 100%;
  color: rgba(35, 35, 35, 0.72);
}

.page-about__lead a {
  white-space: nowrap;
}

.page-about__hero-links {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.95rem;
  font-weight: 600;
}

.page-about__hero-links a {
  color: #355e76;
}

.page-about__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.page-about__panel {
  padding: 18px 20px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
}

.page-about__panel h3 {
  font-size: 1.3rem;
  margin: 0 0 10px;
}

.page-about__panel h4 {
  font-size: 1.05rem;
  font-family: $form-header-font;
  margin: 0 0 8px;
}

.page-about__panel p {
  margin: 0;
}

.page-about__panel--full {
  grid-column: 1 / -1;
}

.page-about__link-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.page-about__link-list li + li {
  margin-top: 10px;
}

.page-about__link-list p {
  margin-top: 4px;
  color: #454545;
}

.page-about__stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.page-about__table {
  border-radius: 0;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(221, 180, 118, 0.22);
}

.page-about__table th {
  background: #f0f0f0;
  font-family: $form-header-font;
}

@media (max-width: 1100px) {
  .page-about__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .page-about__stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .page-about {
    padding: 20px 14px 36px;
  }

  .page-about__hero {
    padding: 16px;
  }

  .page-about__hero-links {
    gap: 10px;
  }

  .page-about__grid {
    grid-template-columns: 1fr;
  }
}
</style>
