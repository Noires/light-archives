<template>
  <q-page class="characters-dir">
    <page-head
      :eyebrow="`Charaktere · ${totalAll} Profile auf Light`"
      title="Wer ist unterwegs?"
    >
      <template #actions>
        <q-btn
          v-if="totalAll > 0"
          class="elpis-btn elpis-btn--secondary"
          flat
          no-caps
          icon="casino"
          label="Zufälliger Charakter"
          :loading="randomLoading"
          @click="openRandom"
        />
        <q-btn
          class="elpis-btn elpis-btn--primary"
          unelevated
          no-caps
          icon="person_add"
          label="Charakter anlegen"
          @click="createCharacter"
        />
      </template>
      <directory-area-tabs />
    </page-head>

    <rp-active-strip />

    <section class="characters-dir__toolbar" aria-label="Filter">
      <q-input
        v-model="searchQuery"
        class="characters-dir__search"
        label="Name suchen"
        debounce="250"
        outlined
        dense
        clearable
        @update:model-value="onFilterChange"
      >
        <template #prepend>
          <q-icon name="search" aria-hidden="true" />
        </template>
      </q-input>

      <div class="characters-dir__filters">
        <div class="characters-dir__chip-group" role="group" aria-label="Volk">
          <span class="characters-dir__chip-label" aria-hidden="true">Volk</span>
          <button
            v-for="option in raceOptions"
            :key="option.label"
            type="button"
            class="characters-dir__chip"
            :class="{ 'characters-dir__chip--active': race === option.value }"
            :aria-pressed="race === option.value ? 'true' : 'false'"
            @click="setRace(option.value)"
          >{{ option.label }}</button>
        </div>
        <div v-if="servers.length > 1" class="characters-dir__chip-group" role="group" aria-label="Welt">
          <span class="characters-dir__chip-label" aria-hidden="true">Welt</span>
          <button
            v-for="option in serverOptions"
            :key="option.label"
            type="button"
            class="characters-dir__chip"
            :class="{ 'characters-dir__chip--active': server === option.value }"
            :aria-pressed="server === option.value ? 'true' : 'false'"
            @click="setServer(option.value)"
          >{{ option.label }}</button>
        </div>
        <div class="characters-dir__chip-group" role="group" aria-label="Anfangsbuchstabe">
          <span class="characters-dir__chip-label" aria-hidden="true">A–Z</span>
          <q-select
            v-model="selectedLetter"
            class="characters-dir__letter"
            :options="letterOptions"
            emit-value
            map-options
            outlined
            dense
            options-dense
            aria-label="Anfangsbuchstabe"
            @update:model-value="onFilterChange"
          />
        </div>
      </div>

      <div class="characters-dir__summary" aria-live="polite">
        <span>{{ total }} {{ total === 1 ? 'Profil' : 'Profile' }}{{ hasFilters ? ' gefunden' : '' }}</span>
        <q-btn
          v-if="hasFilters"
          class="elpis-btn elpis-btn--ghost"
          flat
          no-caps
          dense
          label="Filter zurücksetzen"
          @click="resetFilters"
        />
      </div>
    </section>

    <!-- ER2-902: keeps the outline h1 > h2 > h3 (card titles) without a visible label. -->
    <h2 class="vision-sr-only">Charakterliste</h2>
    <ul v-if="profiles.length > 0" class="characters-dir__grid">
      <li v-for="profile in profiles" :key="`${profile.server}-${profile.name}`">
        <directory-card
          class="characters-dir__card"
          :to="getLink(profile)"
          :avatar-src="profile.avatar"
          :avatar-alt="`Porträt von ${profile.name}`"
          :title="profile.name"
          :subtitle="profession(profile)"
          :meta="meta(profile)"
        >
          <template v-if="rpStatus(profile)" #badges>
            <status-badge :type="rpBadge(profile)" :label="rpLabel(profile)" />
          </template>
          <template #tags>
            <status-badge type="server" :label="profile.server" icon="public" />
          </template>
        </directory-card>
      </li>
    </ul>

    <empty-state
      v-else-if="!loading"
      icon="person_search"
      title="Keine Profile gefunden"
      :text="hasFilters ? 'Mit diesen Filtern ist niemand unterwegs. Probier es mit weniger.' : 'Hier hat sich noch niemand eingetragen.'"
      :action-label="hasFilters ? 'Filter zurücksetzen' : ''"
      @action="resetFilters"
    />

    <div v-if="hasMore" class="characters-dir__more">
      <q-btn
        class="elpis-btn elpis-btn--secondary"
        flat
        no-caps
        label="Mehr laden"
        :loading="loading"
        @click="loadMore"
      />
      <span class="characters-dir__more-count">{{ profiles.length }} von {{ total }}</span>
    </div>
  </q-page>
</template>

<script lang="ts">
import { CharacterProfileFilterDto } from '@app/shared/dto/characters/character-profile-filter.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ServerDto } from '@app/shared/dto/servers/server-dto';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { Race } from '@app/shared/enums/race.enum';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import DirectoryAreaTabs from 'components/character/DirectoryAreaTabs.vue';
import RpActiveStrip from 'components/character/RpActiveStrip.vue';
import { isEmptyFieldValue } from 'components/character/empty-field';
import { stripWikilinks } from 'components/character/profile-sections';
import { activeRpStatus, RP_STATUS_BADGES, RP_STATUS_LABELS } from 'components/character/rp-status';
import DirectoryCard from 'components/vision/DirectoryCard.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import PageHead from 'components/vision/PageHead.vue';
import StatusBadge from 'components/vision/StatusBadge.vue';
import type { StatusBadgeType } from 'components/vision/types';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { LocationQuery } from 'vue-router';

const $api = useApi();

const PER_PAGE = 24;

interface Filters {
  searchQuery: string;
  race: Race | null;
  server: number | null;
  letter: string | null;
}

function filtersFromQuery(query: LocationQuery): Filters {
  const race = query.race && Object.values(Race).includes(query.race as Race) ? query.race as Race : null;
  const letter = query.letter && /^[A-Z]$/.test(query.letter as string) ? query.letter as string : null;
  return {
    searchQuery: (query.searchQuery as string) || '',
    race,
    server: parseInt(query.server as string || '', 10) || null,
    letter,
  };
}

function toApiFilter(filters: Filters, offset: number): CharacterProfileFilterDto {
  const filter: CharacterProfileFilterDto = {
    offset,
    limit: PER_PAGE,
    searchQuery: filters.searchQuery,
  };
  if (filters.server) {
    filter.server = filters.server;
  }
  if (filters.race) {
    filter.race = filters.race;
  }
  if (filters.letter) {
    filter.letter = filters.letter;
  }
  return filter;
}

@Options({
  name: 'PageCharacters',
  components: {
    DirectoryAreaTabs,
    DirectoryCard,
    EmptyState,
    PageHead,
    RpActiveStrip,
    StatusBadge,
  },
  async beforeRouteEnter(to, __, next) {
    const filters = filtersFromQuery(to.query);
    const [ servers, profiles, all ] = await Promise.all([
      $api.servers.getServers(),
      $api.characters.getCharacterProfiles(toApiFilter(filters, 0)),
      $api.characters.getCharacterProfiles({ offset: 0, limit: 1 }),
    ]);
    next((vm) => (vm as PageCharacters).setContent(servers, profiles, all.total, filters));
  }
})
export default class PageCharacters extends Vue {
  profiles: CharacterSummaryDto[] = [];
  total = 0;
  totalAll = 0;
  loading = false;
  randomLoading = false;
  requestId = 0;

  searchQuery = '';
  race: Race | null = null;
  server: number | null = null;
  selectedLetter: string | null = null;
  servers: ServerDto[] = [];

  get raceOptions(): { label: string; value: Race | null }[] {
    return [
      { label: 'Alle', value: null },
      ...Object.values(Race).map((race) => ({ value: race, label: this.$display.races[race] })),
    ];
  }

  get serverOptions(): { label: string; value: number | null }[] {
    return [
      { label: 'Alle', value: null },
      ...this.servers.map((server) => ({ value: server.id, label: server.name })),
    ];
  }

  get letterOptions(): { label: string; value: string | null }[] {
    return [
      { label: 'Alle', value: null },
      ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({ label: letter, value: letter })),
    ];
  }

  get filters(): Filters {
    return {
      searchQuery: this.searchQuery || '',
      race: this.race,
      server: this.server,
      letter: this.selectedLetter,
    };
  }

  get hasFilters(): boolean {
    return !!(this.searchQuery || this.race || this.server || this.selectedLetter);
  }

  get hasMore(): boolean {
    return this.profiles.length < this.total;
  }

  setContent(servers: ServerDto[], profiles: PagingResultDto<CharacterSummaryDto>, totalAll: number, filters: Filters) {
    this.servers = servers;
    this.profiles = profiles.data;
    this.total = profiles.total;
    this.totalAll = totalAll;
    this.searchQuery = filters.searchQuery;
    this.race = filters.race;
    this.server = filters.server;
    this.selectedLetter = filters.letter;
  }

  getLink(profile: { name: string; server: string }): string {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

  profession(profile: CharacterSummaryDto): string {
    return profile.profession && !isEmptyFieldValue(profile.profession) ? stripWikilinks(profile.profession) : '';
  }

  meta(profile: CharacterSummaryDto): string {
    return [
      this.$display.races[profile.race],
      profile.tribe ? this.$display.tribes[profile.tribe] : '',
    ].filter((part) => !!part).join(' · ');
  }

  rpStatus(profile: CharacterSummaryDto): RpStatus | null {
    return activeRpStatus(profile);
  }

  rpBadge(profile: CharacterSummaryDto): StatusBadgeType {
    const status = activeRpStatus(profile);
    return status ? RP_STATUS_BADGES[status] : 'rp-ooc';
  }

  rpLabel(profile: CharacterSummaryDto): string {
    const status = activeRpStatus(profile);
    return status ? RP_STATUS_LABELS[status] : '';
  }

  setRace(race: Race | null) {
    this.race = race;
    this.onFilterChange();
  }

  setServer(server: number | null) {
    this.server = server;
    this.onFilterChange();
  }

  resetFilters() {
    this.searchQuery = '';
    this.race = null;
    this.server = null;
    this.selectedLetter = null;
    this.onFilterChange();
  }

  onFilterChange() {
    void this.fetch(false);
    this.writeQuery();
  }

  loadMore() {
    void this.fetch(true);
  }

  async fetch(append: boolean) {
    const requestId = ++this.requestId;
    this.loading = true;
    try {
      const result = await this.$api.characters.getCharacterProfiles(
        toApiFilter(this.filters, append ? this.profiles.length : 0),
      );
      if (requestId !== this.requestId) {
        return;
      }
      this.profiles = append ? [ ...this.profiles, ...result.data ] : result.data;
      this.total = result.total;
    } catch (e) {
      notifyError(e);
    } finally {
      if (requestId === this.requestId) {
        this.loading = false;
      }
    }
  }

  writeQuery() {
    const query: Record<string, string> = {};
    if (this.searchQuery) {
      query.searchQuery = this.searchQuery;
    }
    if (this.server) {
      query.server = String(this.server);
    }
    if (this.race) {
      query.race = this.race;
    }
    if (this.selectedLetter) {
      query.letter = this.selectedLetter;
    }
    void this.$router.replace({ path: '/profiles', query });
  }

  /** No random endpoint: pick a random offset in the unfiltered list. */
  async openRandom() {
    this.randomLoading = true;
    try {
      const offset = Math.floor(Math.random() * this.totalAll);
      const result = await this.$api.characters.getCharacterProfiles({ offset, limit: 1 });
      if (result.data.length > 0) {
        void this.$router.push(this.getLink(result.data[0]));
      }
    } catch (e) {
      notifyError(e);
    } finally {
      this.randomLoading = false;
    }
  }

  /** Adding a character goes through the character dialog; guests sign in first. */
  async createCharacter() {
    if (!this.$store.state.user) {
      window.location.href = this.$api.user.getDiscordLoginUrl(window.location.origin);
      return;
    }
    const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;
    this.$q.dialog({ component: SwitchCharacterDialog }).onOk((character: SessionCharacterDto) => {
      void this.$router.push(character.verified ? this.getLink(character) : '/verify');
    });
  }
}
</script>

<style lang="scss" scoped>
.characters-dir {
  padding-top: 0;
}

.characters-dir__toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 24px;
}

.characters-dir__search {
  max-width: 480px;
}

.characters-dir__filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.characters-dir__chip-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.characters-dir__chip-label {
  min-width: 44px;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.characters-dir__chip {
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
    border-color var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis);

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

.characters-dir__chip--active,
.characters-dir__chip--active:hover {
  background-color: var(--vision-primary);
  border-color: var(--vision-primary);
  color: var(--vision-on-primary);
  font-weight: 600;
}

.characters-dir__letter {
  width: 110px;
}

.characters-dir__summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.characters-dir__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;

  > li {
    display: flex;
    min-width: 0;
  }
}

.characters-dir__card {
  flex: 1 1 auto;
}

.characters-dir__more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
}

.characters-dir__more-count {
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}
</style>
