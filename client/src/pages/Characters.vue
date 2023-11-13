<template>
  <q-page class="page-characters">
    <h2>Die Bevölkerung Hydaelyns</h2>
    <q-table
      class="page-characters__table striped-list paged-link-table"
      :columns="columns"
      :rows="profiles"
      row-key="name"
      v-model:pagination="pagination"
			wrap-cells
      @request="onPageRequest"
    >
      <template v-slot:top>
        <q-form class="page-characters__filter">
          <q-input clearable standout
            class="page-characters__filter-search"
            v-model="searchQuery"
            label="Suche"
						debounce="200"
            @update:model-value="refresh"
          />
          <label class="page-characters__filter-race">
            <span class="page-characters__race-label">Volk:</span>
            <q-select standout
              class="page-characters__race-select"
              v-model="race"
              :display-value="$display.races[race]"
              emit-value
              map-options
              :options="raceOptions"
            	@update:model-value="refresh"
            />
          </label>
          <label class="page-characters__filter-server">
            <span class="page-characters__server-label">Server:</span>
            <q-select standout
              class="page-characters__server-select"
              v-model="server"
              :display-value="servers[server]"
              emit-value
              map-options
              :options="serverOptions"
            	@update:model-value="refresh"
            />
          </label>
        </q-form>
      </template>
      <template v-slot:header-cell-avatar="props">
        <q-th :props="props" auto-width />
      </template>
      <template v-slot:body-cell-avatar="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <q-avatar round>
              <img :src="props.row.avatar" />
            </q-avatar>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <span class="page-characters__column-name">{{props.row.name}}</span>
            <template v-if="props.row.occupation">
              <br /><span class="page-characters__column-occupation">{{props.row.occupation}}</span>
            </template>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-race="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <span class="page-characters__column-race">{{$display.races[props.row.race]}}</span>
          </router-link>
        </q-td>
      </template>
      <template v-slot:body-cell-server="props">
        <q-td :props="props">
          <router-link :to="getLink(props.row)">
            <span class="page-characters__column-server">{{props.row.server}}</span>
          </router-link>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { CharacterProfileFilterDto } from '@app/shared/dto/characters/character-profile-filter.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ServerDto } from '@app/shared/dto/servers/server-dto';
import { Race } from '@app/shared/enums/race.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
  name: 'PageCharacters',
  components: {
  },
  async beforeRouteEnter(to, __, next) {
    const searchQuery = to.query.searchQuery as string || '';
    const server = parseInt(to.query.server as string || '');
    const race = to.query.race && Object.values(Race).includes(to.query.race as Race) ? to.query.race as Race : null;
    const page = parseInt(to.query.page as string, 10) || 1;
    const rowsPerPage = parseInt(to.query.rowsPerPage as string, 10) || SharedConstants.DEFAULT_ROWS_PER_PAGE;

    const filter: CharacterProfileFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
      searchQuery,
    };

    const servers = await $api.servers.getServers();
    if (server) {
      filter.server = server;
    }
    if (race) {
      filter.race = race;
    }
    
    const profiles = await $api.characters.getCharacterProfiles(filter);
    next((vm) => (vm as PageCharacters).setContent(servers, profiles, searchQuery, race, { page, rowsPerPage }));
  }
})
export default class PageCharacters extends Vue {
  profiles: CharacterSummaryDto[] = [];
  pagination = {
    page: 1,
    rowsPerPage: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    rowsNumber: 0,
  };

  searchQuery = '';
  race: Race | null = null;
  server: number | null = null;
  servers:ServerDto[] = [];

  get columns() {
    return [
      {
        name: 'avatar',
        field: 'avatar',
        label: '',
        align: 'left',
        sortable: false,
      },
      {
        name: 'name',
        field: 'name',
        label: 'Name',
        align: 'left',
        sortable: false,
      },
      {
        name: 'race',
        field: 'race',
        format: (val: Race) => this.$display.races[val],
        label: 'Volk',
        align: 'left',
        sortable: false,
      },
      {
        name: 'server',
        field: 'server',
        format: (val: number) => this.serverOptions[val],
        label: 'Server',
        align: 'left',
        sortable: false,
      }
    ];
  }

  get raceOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(Race).map((race) => ({ value: race, label: this.$display.races[race] })),
    ];
  }

  get serverOptions() {
    return [
      { label: '(Alle)', value: null},
      ...this.servers.map(server => ({ value: server.id, label: server.name}))
    ]
  }

  setContent(servers: ServerDto[], profiles: PagingResultDto<CharacterSummaryDto>, searchQuery: string, race: Race | null,
      pagination: { page: number; rowsPerPage: number }) {
    this.servers = servers;
    this.profiles = profiles.data;
    this.searchQuery = searchQuery;
    this.race = race;
    this.pagination.page = pagination.page;
    this.pagination.rowsPerPage = pagination.rowsPerPage;
    this.pagination.rowsNumber = profiles.total;
  }

  getLink(profile: CharacterSummaryDto) {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

	refresh() {
		void this.onPageRequest({ pagination: this.pagination });
	}

  async onPageRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
    const { page, rowsPerPage } = props.pagination;
    const filter: CharacterProfileFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
      searchQuery: this.searchQuery,
    };

    if (this.race) {
      filter.race = this.race;
    }

    if (this.server) {
      filter.server = this.server;
    }

    const profiles = await this.$api.characters.getCharacterProfiles(filter);
    this.profiles = profiles.data;
    this.pagination.rowsNumber = profiles.total;
    this.pagination.rowsPerPage = rowsPerPage;
    this.pagination.page = page;

    const queryParams: { [ k: string] : string|number } = {
      page: this.pagination.page,
      rowsPerPage: this.pagination.rowsPerPage
    };

    if (this.searchQuery) {
      queryParams.searchQuery = this.searchQuery;
    }

    if (this.server) {
      queryParams.server = this.server;
    }

    if (this.race) {
      queryParams.race = this.race;
    }


    void this.$router.replace({
      path: '/profiles',
      query: queryParams,
    })
  }
}
</script>

<style lang="scss">
.page-characters__filter {
  display: flex;
  flex-basis: 0;
  flex-grow: 1;
	flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0px;
}

.page-characters__filter-search {
  width: 300px;
  flex-grow: 1;
  padding-right: 8px;
}

.page-characters__filter-race {
  display: flex;
  align-items: center;
  padding-right: 8px;
}

.page-characters__filter-server {
  display: flex;
  align-items: center;
}

.page-characters__server-label {
  padding-right: 8px;
}

.page-characters__race-label {
  padding-right: 8px;
}

.page-characters__race-select {
  width: 110px;
}

.page-characters__column-name {
  font-size: $body-font-size;
}

.page-characters__column-race, .page-characters__column-occupation {
  color: #808080;
}
</style>
