<template>
  <q-page class="info-page">
    <page-head
      eyebrow="Über Elpisgarten"
      title="Gemeinsam Rollenspiel gestalten"
      lead="Elpisgarten ist ein Rollenspielportal für die deutschsprachige Rollenspielcommunity in Final Fantasy XIV, basierend auf Chaos Archives."
    >
      <nav class="info-page__links" aria-label="Weitere Infos">
        <router-link to="/faq">FAQ</router-link>
        <router-link to="/rules">Regelwerk</router-link>
        <router-link to="/contact">Kontakt</router-link>
      </nav>
    </page-head>

    <section class="info-grid">
      <article class="info-panel">
        <h2 class="info-panel__title">Team</h2>
        <p>Dieser Bereich ist aktuell in Bearbeitung.</p>
      </article>

      <article class="info-panel">
        <h2 class="info-panel__title">Credits</h2>
        <p>
          Wir dürfen die Codebasis von
          <a href="https://chaosarchives.org/" target="_blank" rel="noopener noreferrer">
            Chaos Archives <q-icon class="external-link-icon" name="launch" aria-hidden="true" />
          </a>
          mit freundlicher Erlaubnis nutzen. Ein besonderer Dank geht an die Entwicklerin Maia Everett.
        </p>
      </article>

      <article class="info-panel">
        <h2 class="info-panel__title">Nützliche Links</h2>
        <ul class="info-list">
          <li>
            <a href="https://discord.gg/wFT8DGkr3J" target="_blank" rel="noopener noreferrer">
              Projekt "Elpis" <q-icon name="discord" aria-hidden="true" />
            </a>
            <p>Unser offizieller Discordserver.</p>
          </li>
        </ul>
      </article>

      <article v-if="statistics" class="info-panel info-panel--full">
        <h2 class="info-panel__title">Statistiken</h2>
        <div class="info-grid">
          <section>
            <h3 class="info-panel__subtitle">Charaktere nach Volk</h3>
            <q-markup-table flat dense class="info-table">
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
            <h3 class="info-panel__subtitle">Charaktere nach Welt</h3>
            <q-markup-table flat dense class="info-table">
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
            <h3 class="info-panel__subtitle">Miqo'te Goldtatzen-Stämme</h3>
            <q-markup-table flat dense class="info-table">
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
import PageHead from 'src/components/vision/PageHead.vue';

const $api = useApi();

async function load(): Promise<StatisticsDto> {
  return $api.statistics.getStatistics();
}

@Options({
  name: 'PageAbout',
  components: { PageHead },
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
