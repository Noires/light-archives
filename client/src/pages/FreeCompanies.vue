<template>
  <q-page class="fc-dir">
    <page-head
      :eyebrow="`Charaktere · ${freeCompanies.length} Freie Gesellschaften`"
      title="Freie Gesellschaften"
      lead="Gruppen, ihre Ziele und ihr Sitz auf Light."
    >
      <template v-if="$store.getters.characterId" #actions>
        <q-btn
          class="elpis-btn elpis-btn--secondary"
          flat
          no-caps
          icon="shield"
          label="Meine Freie Gesellschaft"
          to="/my-free-company"
        />
      </template>
      <directory-area-tabs />
    </page-head>

    <section class="fc-dir__toolbar" aria-label="Filter">
      <q-input
        v-model="searchQuery"
        class="fc-dir__search"
        label="Name oder Ziel suchen"
        debounce="200"
        outlined
        dense
        clearable
        @update:model-value="onFilterChange"
      >
        <template #prepend>
          <q-icon name="search" aria-hidden="true" />
        </template>
      </q-input>
      <div class="fc-dir__chips">
        <div v-if="servers.length > 1" class="fc-dir__chip-group" role="group" aria-label="Welt">
          <span class="fc-dir__chip-label" aria-hidden="true">Welt</span>
          <button
            v-for="option in serverOptions"
            :key="option.label"
            type="button"
            class="fc-dir__chip"
            :class="{ 'fc-dir__chip--active': serverFilter === option.value }"
            :aria-pressed="serverFilter === option.value ? 'true' : 'false'"
            @click="setServer(option.value)"
          >{{ option.label }}</button>
        </div>
        <button
          v-if="hasRecruitingData"
          type="button"
          class="fc-dir__chip"
          :class="{ 'fc-dir__chip--active': recruitingOnly }"
          :aria-pressed="recruitingOnly ? 'true' : 'false'"
          @click="toggleRecruiting"
        >Nimmt Mitglieder auf</button>
      </div>
      <p class="fc-dir__summary" aria-live="polite">{{ filteredCount }} von {{ freeCompanies.length }}</p>
    </section>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Liste der Freien Gesellschaften</h2>
    <ul v-if="shownFreeCompanies.length > 0" class="fc-dir__grid">
      <li v-for="fc in shownFreeCompanies" :key="`${fc.name}_${fc.server}`" class="fc-dir__item">
        <directory-card
          class="fc-dir__card"
          :to="getLink(fc)"
          avatar-shape="crest"
          placeholder-icon="shield"
          :avatar-alt="`Wappen von ${fc.name}`"
          :title="fc.name"
          :meta="`Sitz · ${fc.server} [Light]`"
        >
          <template v-if="fc.crest && fc.crest.length" #avatar>
            <free-company-crest :images="fc.crest" :size="64" />
          </template>
          <template v-if="fc.recruiting" #badges>
            <status-badge type="open" label="Nimmt Mitglieder auf" />
          </template>
          <p v-if="fc.goal" class="fc-dir__goal">{{ fc.goal }}</p>
        </directory-card>
      </li>
    </ul>
    <empty-state
      v-else
      icon="shield"
      :title="freeCompanies.length === 0 ? 'Noch keine Freien Gesellschaften' : 'Keine Treffer'"
      :text="freeCompanies.length === 0 ? 'Sobald eine Freie Gesellschaft beansprucht wird, erscheint sie hier.' : 'Für diese Filter gibt es keine Freie Gesellschaft.'"
      :action-label="freeCompanies.length === 0 ? '' : 'Filter zurücksetzen'"
      @action="resetFilters"
    />

    <div v-if="hasMore" class="fc-dir__more">
      <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps label="Mehr laden" @click="shownCount += perPage" />
      <span class="fc-dir__more-count">{{ shownFreeCompanies.length }} von {{ filteredCount }}</span>
    </div>
  </q-page>
</template>

<script lang="ts">
import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import DirectoryAreaTabs from 'components/character/DirectoryAreaTabs.vue';
import DirectoryCard from 'components/vision/DirectoryCard.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import StatusBadge from 'components/vision/StatusBadge.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import FreeCompanyCrest from 'src/components/free-company/FreeCompanyCrest.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

const PER_PAGE = 24;

@Options({
  name: 'PageFreeCompanies',
  components: {
    DirectoryAreaTabs,
    DirectoryCard,
    EmptyState,
    FreeCompanyCrest,
    PageHead,
    StatusBadge,
  },
  async beforeRouteEnter(_, __, next) {
    try {
      const freeCompanies = await $api.freeCompanies.getFreeCompanies();
      next(vm => (vm as PageFreeCompanies).setContent(freeCompanies));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageFreeCompanies extends Vue {
  readonly perPage = PER_PAGE;

  freeCompanies: FreeCompanySummaryDto[] = [];
  searchQuery = '';
  serverFilter = '';
  recruitingOnly = false;
  shownCount = PER_PAGE;

  setContent(freeCompanies: FreeCompanySummaryDto[]) {
    this.freeCompanies = freeCompanies;
    this.shownCount = PER_PAGE;
  }

  get servers(): string[] {
    return Array.from(new Set(this.freeCompanies.map((fc) => fc.server))).sort();
  }

  get serverOptions(): { label: string; value: string }[] {
    return [
      { label: 'Alle', value: '' },
      ...this.servers.map((server) => ({ label: server, value: server })),
    ];
  }

  /** The recruiting flag is optional (ER2-810); production does not send it yet. */
  get hasRecruitingData(): boolean {
    return this.freeCompanies.some((fc) => fc.recruiting === true);
  }

  get filteredFreeCompanies(): FreeCompanySummaryDto[] {
    const query = (this.searchQuery || '').trim().toLowerCase();
    return this.freeCompanies.filter((fc) => {
      if (this.serverFilter && fc.server !== this.serverFilter) {
        return false;
      }
      if (this.recruitingOnly && !fc.recruiting) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${fc.name} ${fc.goal || ''} ${fc.server}`.toLowerCase().includes(query);
    });
  }

  get filteredCount(): number {
    return this.filteredFreeCompanies.length;
  }

  get shownFreeCompanies(): FreeCompanySummaryDto[] {
    return this.filteredFreeCompanies.slice(0, this.shownCount);
  }

  get hasMore(): boolean {
    return this.filteredCount > this.shownCount;
  }

  getLink(fc: FreeCompanySummaryDto): string {
    return `/fc/${fc.server}/${fc.name.replace(/ /g, '_')}`;
  }

  setServer(server: string) {
    this.serverFilter = server;
    this.onFilterChange();
  }

  toggleRecruiting() {
    this.recruitingOnly = !this.recruitingOnly;
    this.onFilterChange();
  }

  resetFilters() {
    this.searchQuery = '';
    this.serverFilter = '';
    this.recruitingOnly = false;
    this.onFilterChange();
  }

  onFilterChange() {
    this.shownCount = PER_PAGE;
  }
}
</script>

<style lang="scss" scoped>
.fc-dir {
  padding-top: 0;
}

.fc-dir__toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.fc-dir__search {
  max-width: 480px;
}

.fc-dir__chips,
.fc-dir__chip-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.fc-dir__chips {
  gap: 10px 16px;
}

.fc-dir__chip-label {
  min-width: 44px;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.fc-dir__chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  background-color: transparent;
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-weight: 500;
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);

  &:hover {
    background-color: var(--rule-tint);
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 2px var(--glow-aether),
      0 0 0 3px var(--vision-focus-edge);
  }
}

.fc-dir__chip--active,
.fc-dir__chip--active:hover {
  background-color: var(--vision-primary);
  border-color: var(--vision-primary);
  color: var(--vision-on-primary);
  font-weight: 600;
}

.fc-dir__summary {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.fc-dir__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fc-dir__item {
  position: relative;
  display: flex;
  min-width: 0;
}

.fc-dir__card {
  flex: 1 1 auto;
}

.fc-dir__goal {
  margin: 0;
  color: var(--ink-primary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fc-dir__more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
}

.fc-dir__more-count {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}
</style>
