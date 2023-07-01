<template>
    <q-page class="page-violations">
          <h2>Gemeldete Verstöße</h2>
          <q-table
                class="page-violations__table striped-list paged-link-table"
                :columns="columns"
                :rows="violations"
                row-key="name"
                v-model:pagination="pagination"
                wrap-cells
                @request="onPageRequest"
            >
            <template v-slot:top>
            <q-form class="page-violations__filter">
            <q-input
                class="page-violations__filter-search"
                v-model="searchQuery"
                label="Suche"
                            debounce="200"
                @update:model-value="refresh"
            />
            <label class="page-violations__filter-open">
                <span class="page-violations__open-label">Status:</span>
                <q-select
                class="page-violations__open-select"
                v-model="open"
                emit-value
                map-options
                :options="statusOptions"
                    @update:model-value="refresh"
                />
            </label>
            </q-form>
        </template>
            <template v-slot:body-cell-pageId="props">
                <q-td :props="props">
                <q-btn @click="getLink(props.row)">
                    <span class="page-violations__column-open">LINK</span>
                </q-btn>
                </q-td>
            </template>
            <template v-slot:body-cell-open="props">
                <q-td :props="props">
                    <span class="page-violations__column-open">{{props.row.open === true ? "Geschlossen" : "Offen"}}</span>
                </q-td>
            </template>
            <template v-slot:body-cell-createdAt="props">
                <q-td :props="props">
                    <span class="page-violations__column-createdAt">{{$display.formatDate(props.row.createdAt)}}</span>
                </q-td>
            </template>
            </q-table>
      </q-page>	
</template>

<script lang="ts">
import SharedConstants from '@app/shared/SharedConstants';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ViolationSummaryFilterDto } from '@app/shared/dto/violations/violation-summary-filter.dto';
import { ViolationSummaryDto } from '@app/shared/dto/violations/violation-summary.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageVenues',
    async beforeRouteEnter(to, __, next) {
    const searchQuery = to.query.searchQuery as string || '';
    const open = to.query.open && to.query.open as string === 'true' || to.query.open as string === 'false' ? to.query.open as string : null;
    const page = parseInt(to.query.page as string, 10) || 1;
    const rowsPerPage = parseInt(to.query.rowsPerPage as string, 10) || SharedConstants.DEFAULT_ROWS_PER_PAGE;

    const filter: ViolationSummaryFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
      searchQuery,
    };

    if (open) {
      filter.open = open;
    }

    const violations = await $api.violations.getViolationList(filter);
    next((vm) => (vm as PageViolations).setContent(violations, searchQuery, open, { page, rowsPerPage }));
  },
})
export default class PageViolations extends Vue {
	violations: ViolationSummaryDto[] = [];
    pagination = {
        page: 1,
        rowsPerPage: SharedConstants.DEFAULT_ROWS_PER_PAGE,
        rowsNumber: 0,
    };

    searchQuery = '';
    open: string | null = null;

    get columns() {
    return [
      {
        name: 'pageType',
        field: 'pageType',
        label: 'Seitentyp',
        align: 'center',
        sortable: false,
      },
      {
        name: 'pageId',
        field: 'pageId',
        label: 'Seitenlink',
        align: 'center',
        sortable: false,
      },
      {
        name: 'reason',
        field: 'reason',
        label: 'Grund',
        align: 'center',
        sortable: false,
      },
      {
        name: 'open',
        field: 'open',
        label: 'Status',
        align: 'center',
        sortable: false,
      },
      {
        name: 'createdAt',
        field: 'createdAt',
        label: 'Erstellt am',
        align: 'center',
        sortable: false,
      }
    ];
  }

  get statusOptions() {
    return [
      { label: '(Alle)', value: null }, 
      { label: 'Offen', value: 'true' }, 
      { label: 'Geschlossen', value: 'false' }
    ];
  }

  setContent(violations: PagingResultDto<ViolationSummaryDto>, searchQuery: string, open: string | null,
      pagination: { page: number; rowsPerPage: number }) {
    this.violations = violations.data;
    this.searchQuery = searchQuery;
    this.open = open;
    this.pagination.page = pagination.page;
    this.pagination.rowsPerPage = pagination.rowsPerPage;
    this.pagination.rowsNumber = violations.total;
  }

  async getLink(violation: ViolationSummaryDto) {
    const characterId = this.$store.getters.characterId!;

    if (violation.pageType === PageType.STORY)
    {
      await this.$router.push(`story/${violation.pageId}`);   
    }
    else if (violation.pageType === PageType.NOTICEBOARD_ITEM)
    {
      await this.$router.push(`noticeboard/${violation.pageId}`);   
    }
    else if (violation.pageType === PageType.IMAGE)
    {
      await this.$router.push(`image/${violation.pageId}`);   
    }
    else if (violation.pageType === PageType.COMMUNITY)
    {
      const community = await this.$api.communities.getCommunity(violation.pageId,characterId);
      await this.$router.push(`community/${community.name}`);
    }
    else if (violation.pageType === PageType.EVENT)
    {
      await this.$router.push('');   
    }
    else if (violation.pageType === PageType.FREE_COMPANY)
    {
      await this.$router.push('');   
    }
    else if (violation.pageType === PageType.PROFILE)
    {
      await this.$router.push('');   
    }
    else if (violation.pageType === PageType.VENUE)
    {
      await this.$router.push('');   
    }
    else if (violation.pageType === PageType.WIKI_PAGE)
    {
      await this.$router.push('');   
    }
  }

	refresh() {
		void this.onPageRequest({ pagination: this.pagination });
	}

  async onPageRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
    const { page, rowsPerPage } = props.pagination;
    const filter: ViolationSummaryFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
      searchQuery: this.searchQuery,
    };

    if (this.open) {
      filter.open = this.open;
    }

    const violations = await this.$api.violations.getViolationList(filter);
    this.violations = violations.data;
    this.pagination.rowsNumber = violations.total;
    this.pagination.rowsPerPage = rowsPerPage;
    this.pagination.page = page;

    const queryParams: { [ k: string] : string|number } = {
      page: this.pagination.page,
      rowsPerPage: this.pagination.rowsPerPage
    };

    if (this.searchQuery) {
      queryParams.searchQuery = this.searchQuery;
    }

    if (this.open) {
      queryParams.open = this.open;
    }

    void this.$router.replace({
      path: '/violations',
      query: queryParams,
    })
  }
}

</script>

<style lang="scss">
.page-violations__filter {
  display: flex;
  flex-basis: 0;
  flex-grow: 1;
	flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

.page-violations__filter-search {
  width: 300px;
}

.page-violations__filter-open {
  display: flex;
  align-items: center;
}

.page-violations__open-label {
  padding-right: 8px;
}

.page-violations__open-select {
  width: 110px;
}

</style>