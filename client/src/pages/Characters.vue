<template>
  <q-page class="page-characters">
    <header class="page-characters__hero">
      <div class="page-characters__hero-text">
        <span class="page-characters__eyebrow">Archiv</span>
        <h2>Die Bevölkerung Hydaelyns</h2>
        <p class="page-characters__lead">
          Entdecke Charakterprofile und ihre Geschichten.
        </p>
      </div>
      <div class="page-characters__hero-meta">
        <div class="page-characters__count">
          <span class="page-characters__count-number">{{ pagination.rowsNumber }}</span>
          <span class="page-characters__count-label">Profile</span>
        </div>
      </div>
    </header>

    <q-table
      class="page-characters__table"
      :columns="columns"
      :rows="profiles"
      :row-key="row => `${row.server}-${row.name}`"
      v-model:pagination="pagination"
      grid
      hide-header
      hide-bottom
      @request="onPageRequest"
    >
      <template v-slot:top>
        <div class="page-characters__toolbar">
          <div class="page-characters__stats">
            {{ pagination.rowsNumber }} Profile
          </div>
          <q-pagination
            class="page-characters__pagination"
            :model-value="pagination.page"
            :max="maxPage"
            input
            @update:model-value="setPage"
          />
        </div>
      </template>
      <template v-slot:item="props">
        <div class="page-characters__card">
          <router-link :to="getLink(props.row)" class="page-characters__card-link">
            <q-avatar round size="56px" class="page-characters__card-avatar">
              <img :src="props.row.avatar" />
            </q-avatar>
            <div class="page-characters__card-body">
              <div class="page-characters__card-name">{{ props.row.name }}</div>
              <div class="page-characters__card-meta">
                {{ $display.races[props.row.race] }} - {{ props.row.server }}
              </div>
              <div v-if="props.row.profession" class="page-characters__card-profession">
                {{ props.row.profession }}
              </div>
            </div>
          </router-link>
        </div>
      </template>
      <template v-slot:no-data>
        <div class="page-characters__empty">
          Keine Profile gefunden.
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { CharacterProfileFilterDto } from '@app/shared/dto/characters/character-profile-filter.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
  name: 'PageCharacters',
  components: {
  },
  async beforeRouteEnter(to, __, next) {
    const page = parseInt(to.query.page as string, 10) || 1;
    const rowsPerPage = parseInt(to.query.rowsPerPage as string, 10) || SharedConstants.DEFAULT_ROWS_PER_PAGE;

    const filter: CharacterProfileFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    };

    const profiles = await $api.characters.getCharacterProfiles(filter);
    next((vm) => (vm as PageCharacters).setContent(profiles, { page, rowsPerPage }));
  }
})
export default class PageCharacters extends Vue {
  profiles: CharacterSummaryDto[] = [];
  pagination = {
    page: 1,
    rowsPerPage: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    rowsNumber: 0,
  };

  get columns() {
    return [
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        align: 'left',
        sortable: false,
      }
    ];
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.pagination.rowsNumber / this.pagination.rowsPerPage));
  }

  setContent(profiles: PagingResultDto<CharacterSummaryDto>,
      pagination: { page: number; rowsPerPage: number }) {
    this.profiles = profiles.data;
    this.pagination.page = pagination.page;
    this.pagination.rowsPerPage = pagination.rowsPerPage;
    this.pagination.rowsNumber = profiles.total;
  }

  getLink(profile: CharacterSummaryDto) {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

  setPage(newPage: number) {
    this.pagination.page = Math.min(Math.max(newPage, 1), this.maxPage);
    this.refresh();
  }

	refresh() {
		void this.onPageRequest({ pagination: this.pagination });
	}

  async onPageRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
    const { page, rowsPerPage } = props.pagination;
    const filter: CharacterProfileFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
    };

    const profiles = await this.$api.characters.getCharacterProfiles(filter);
    this.profiles = profiles.data;
    this.pagination.rowsNumber = profiles.total;
    this.pagination.rowsPerPage = rowsPerPage;
    this.pagination.page = page;

    const queryParams: { [ k: string] : string|number } = {
      page: this.pagination.page,
      rowsPerPage: this.pagination.rowsPerPage
    };

    void this.$router.replace({
      path: '/profiles',
      query: queryParams,
    })
  }
}
</script>

<style lang="scss">
.page-characters {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-characters::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-characters h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-characters__hero {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-characters__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-characters__hero-text {
  display: grid;
  gap: 8px;
}

.page-characters__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-characters__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-characters__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-characters__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-characters__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-characters__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-characters__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-characters__pagination {
  justify-self: end;
}

.page-characters__table {
  position: relative;
  z-index: 1;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-characters__table .q-table__top {
  padding: 0;
}

.page-characters__table .q-table__grid-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  padding: 12px;
}

.page-characters__table .q-table__grid-item {
  padding: 0;
}

.page-characters__card {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.page-characters__card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-characters__card-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.page-characters__card-avatar {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.page-characters__card-name {
  font-weight: 700;
  color: #1f2c38;
}

.page-characters__card-meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.85rem;
}

.page-characters__card-profession {
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.9rem;
}

.page-characters__empty {
  margin: 12px;
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-characters__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-characters__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-characters__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-characters__stats {
    text-align: left;
  }

  .page-characters__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-characters {
    padding: 20px 14px 36px;
  }

  .page-characters__hero {
    padding: 16px;
  }

  .page-characters__table .q-table__grid-content {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-characters__card {
    transition: none;
  }

  .page-characters__card:hover {
    transform: none;
  }
}
</style>
