<template>
  <q-page class="communities-dir">
    <page-head
      :eyebrow="`Charaktere · ${communities.length} Communities`"
      title="Communities"
      lead="Gruppen, Netzwerke und gemeinsame Ziele im Elpisgarten."
    >
      <template v-if="$store.getters.characterId" #actions>
        <q-btn
          class="elpis-btn elpis-btn--secondary"
          flat
          no-caps
          label="Meine Communities"
          to="/my-communities"
        />
        <q-btn
          class="elpis-btn elpis-btn--primary"
          unelevated
          no-caps
          icon="add"
          label="Community gründen"
          to="/create-community"
        />
      </template>
      <directory-area-tabs />
    </page-head>

    <section class="communities-dir__toolbar" aria-label="Filter">
      <q-input
        v-model="searchQuery"
        class="communities-dir__search"
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
      <div v-if="hasRecruitingData" class="communities-dir__chips">
        <button
          type="button"
          class="communities-dir__chip"
          :class="{ 'communities-dir__chip--active': recruitingOnly }"
          :aria-pressed="recruitingOnly ? 'true' : 'false'"
          @click="toggleRecruiting"
        >Nimmt Mitglieder auf</button>
      </div>
      <p class="communities-dir__summary" aria-live="polite">{{ filteredCount }} von {{ communities.length }}</p>
    </section>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Liste der Communities</h2>
    <ul v-if="shownCommunities.length > 0" class="communities-dir__grid">
      <li v-for="community in shownCommunities" :key="community.id" class="communities-dir__item">
        <directory-card
          class="communities-dir__card"
          :to="getLink(community)"
          avatar-shape="crest"
          placeholder-icon="groups"
          :title="community.name"
          meta="Community · Light"
        >
          <template v-if="community.recruiting" #badges>
            <status-badge type="open" label="Nimmt Mitglieder auf" />
          </template>
          <p v-if="community.goal" class="communities-dir__goal">{{ community.goal }}</p>
        </directory-card>
      </li>
    </ul>
    <empty-state
      v-else
      icon="groups"
      :title="communities.length === 0 ? 'Noch keine Communities' : 'Keine Treffer'"
      :text="communities.length === 0 ? 'Gründe die erste Community auf Elpisgarten.' : 'Für diese Filter gibt es keine Community.'"
      :action-label="communities.length === 0 ? ($store.getters.characterId ? 'Community gründen' : '') : 'Filter zurücksetzen'"
      :action-to="communities.length === 0 ? '/create-community' : null"
      @action="onEmptyAction"
    />

    <div v-if="hasMore" class="communities-dir__more">
      <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps label="Mehr laden" @click="shownCount += perPage" />
      <span class="communities-dir__more-count">{{ shownCommunities.length }} von {{ filteredCount }}</span>
    </div>
  </q-page>
</template>

<script lang="ts">
import { CommunitySummaryDto } from '@app/shared/dto/communities/community-summary.dto';
import DirectoryAreaTabs from 'components/character/DirectoryAreaTabs.vue';
import DirectoryCard from 'components/vision/DirectoryCard.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import StatusBadge from 'components/vision/StatusBadge.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

const PER_PAGE = 24;

@Options({
  name: 'PageCommunities',
  components: {
    DirectoryAreaTabs,
    DirectoryCard,
    EmptyState,
    PageHead,
    StatusBadge,
  },
  async beforeRouteEnter(_, __, next) {
    try {
      const communities = await $api.communities.getCommunities();
      next(vm => (vm as PageCommunities).setContent(communities));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageCommunities extends Vue {
  readonly perPage = PER_PAGE;

  communities: CommunitySummaryDto[] = [];
  searchQuery = '';
  recruitingOnly = false;
  shownCount = PER_PAGE;

  setContent(communities: CommunitySummaryDto[]) {
    this.communities = communities;
    this.shownCount = PER_PAGE;
  }

  /** The recruiting flag is optional (ER2-810); production does not send it yet. */
  get hasRecruitingData(): boolean {
    return this.communities.some((community) => community.recruiting === true);
  }

  get filteredCommunities(): CommunitySummaryDto[] {
    const query = (this.searchQuery || '').trim().toLowerCase();
    return this.communities.filter((community) => {
      if (this.recruitingOnly && !community.recruiting) {
        return false;
      }
      if (!query) {
        return true;
      }
      return `${community.name} ${community.goal || ''}`.toLowerCase().includes(query);
    });
  }

  get filteredCount(): number {
    return this.filteredCommunities.length;
  }

  get shownCommunities(): CommunitySummaryDto[] {
    return this.filteredCommunities.slice(0, this.shownCount);
  }

  get hasMore(): boolean {
    return this.filteredCount > this.shownCount;
  }

  getLink(community: CommunitySummaryDto): string {
    return `/community/${community.name.replace(/ /g, '_')}`;
  }

  toggleRecruiting() {
    this.recruitingOnly = !this.recruitingOnly;
    this.onFilterChange();
  }

  onEmptyAction() {
    if (this.communities.length > 0) {
      this.searchQuery = '';
      this.recruitingOnly = false;
      this.onFilterChange();
    }
  }

  onFilterChange() {
    this.shownCount = PER_PAGE;
  }
}
</script>

<style lang="scss" scoped>
.communities-dir {
  padding-top: 0;
}

.communities-dir__toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.communities-dir__search {
  max-width: 480px;
}

.communities-dir__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.communities-dir__chip {
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

.communities-dir__chip--active,
.communities-dir__chip--active:hover {
  background-color: var(--vision-primary);
  border-color: var(--vision-primary);
  color: var(--vision-on-primary);
  font-weight: 600;
}

.communities-dir__summary {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.communities-dir__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.communities-dir__item {
  display: flex;
  min-width: 0;
}

.communities-dir__card {
  flex: 1 1 auto;
}

.communities-dir__goal {
  margin: 0;
  color: var(--ink-primary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.communities-dir__more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
}

.communities-dir__more-count {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}
</style>
