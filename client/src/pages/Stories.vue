<template>
  <q-page class="page-stories">
    <header class="page-stories__hero">
      <div class="page-stories__hero-text">
        <span class="page-stories__eyebrow">Archiv</span>
        <h2>Geschichten</h2>
        <p class="page-stories__lead">
          Tagebücher, Legenden und kurze Szenen aus dem Elpisgarten.
        </p>
      </div>
      <div class="page-stories__hero-meta">
        <div class="page-stories__hero-count">
          <span class="page-stories__hero-count-number">{{ pagination.rowsNumber }}</span>
          <span class="page-stories__hero-count-label">Geschichten</span>
        </div>
        <div class="page-stories__hero-chip">Community · kuratiert</div>
      </div>
    </header>
    <q-table
      class="page-stories__table"
      :columns="columns"
      :rows="stories"
      row-key="id"
      v-model:pagination="pagination"
      grid
      hide-header
      hide-bottom
      @request="onPageRequest"
    >
      <template v-slot:top>
        <section class="page-stories__top">
          <div class="page-stories__result">
            <span class="page-stories__result-text">
              {{ pagination.rowsNumber }} Geschichten
            </span>
          </div>
          <q-pagination
            class="page-stories__pagination"
            :model-value="pagination.page"
            :max="maxPage"
            input
            @update:model-value="setPage"
          />
        </section>
      </template>
      <template v-slot:item="props">
        <div class="page-stories__card">
          <router-link :to="getLink(props.row)" class="page-stories__card-link">
            <div class="page-stories__card-top">
              <span class="page-stories__card-type">
                {{ $display.storyTypes[props.row.type] }}
              </span>
              <div class="page-stories__card-meta">
                <span class="page-stories__card-author">{{ props.row.author }}</span>
                <span class="page-stories__card-time">{{ $display.relativeTime(props.row.createdAt) }}</span>
              </div>
            </div>
            <h3 class="page-stories__card-title">{{ props.row.title }}</h3>
            <p v-if="props.row.excerpt" class="page-stories__card-excerpt">{{ props.row.excerpt }}</p>
            <span class="page-stories__card-action">Lesen</span>
          </router-link>
        </div>
      </template>
      <template v-slot:no-data>
        <div class="page-stories__empty">
          <div class="page-stories__empty-title">Noch keine Geschichten gefunden.</div>
          <div class="page-stories__empty-subtitle">
            Schau später vorbei oder starte mit einer neuen Geschichte.
          </div>
        </div>
      </template>
    </q-table>
  </q-page>
</template>

<script lang="ts">
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageStories',
  components: {

	},
  async beforeRouteEnter(to, _, next) {
    const page = parseInt(to.query.page as string, 10) || 1;
    const rowsPerPage = parseInt(to.query.rowsPerPage as string, 10) || SharedConstants.DEFAULT_ROWS_PER_PAGE;
    const stories = await $api.stories.getStories({
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
    });
    next((vm) => (vm as PageStories).setContent(stories, { page, rowsPerPage }));
  },
})
export default class PageStories extends Vue {
  stories: StorySummaryDto[] = [];
  pagination = {
    page: 1,
    rowsPerPage: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    rowsNumber: 0,
  };

  get columns() {
    return [
      {
        name: 'title',
        field: 'title',
        label: 'Titel',
        align: 'left',
        sortable: false,
      },
      {
        name: 'createdAt',
        field: 'createdAt',
        format: (val: number) => this.$display.relativeTime(val),
        label: 'Verfasst',
        align: 'left',
        classes: 'page-stories__column-createdAt',
        sortable: false,
      },
    ];
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.pagination.rowsNumber / this.pagination.rowsPerPage));
  }

  setContent(stories: PagingResultDto<StorySummaryDto>, pagination: { page: number; rowsPerPage: number }) {
    this.stories = stories.data;
    this.pagination.rowsNumber = stories.total;
    this.pagination.page = pagination.page;
    this.pagination.rowsPerPage = pagination.rowsPerPage;
  }

  getLink(story: StorySummaryDto) {
    return `/story/${story.id}`;
  }

  setPage(newPage: number) {
    this.pagination.page = Math.min(Math.max(newPage, 1), this.maxPage);
    void this.onPageRequest({ pagination: this.pagination });
  }

  async onPageRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
    const { page, rowsPerPage } = props.pagination;
    const filter = {
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
    };

    const stories = await this.$api.stories.getStories(filter);
    this.stories = stories.data;
    this.pagination.rowsNumber = stories.total;
    this.pagination.rowsPerPage = rowsPerPage;
    this.pagination.page = page;

    void this.$router.replace({
      path: '/stories',
      query: {
        page: this.pagination.page,
        rowsPerPage: this.pagination.rowsPerPage,
      },
    });
  }
}
</script>

<style lang="scss">
.page-stories {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-stories::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-stories h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-stories__hero {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding: 20px 22px;
  margin-bottom: 18px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-stories__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-stories__hero-text {
  display: grid;
  gap: 8px;
}

.page-stories__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-stories__hero-meta {
  display: grid;
  gap: 6px;
  align-items: end;
  justify-items: end;
}

.page-stories__hero-count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-stories__hero-count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-stories__hero-count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-stories__hero-chip {
  padding: 6px 12px;
  border-radius: 0;
  background: rgba(221, 180, 118, 0.2);
  color: #6b4c21;
  font-size: 0.8rem;
  font-weight: 600;
}

.page-stories__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-stories__result {
  text-align: right;
}

.page-stories__result-text {
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-stories__pagination {
  justify-self: end;
}

.page-stories__table {
  position: relative;
  z-index: 1;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-stories__table .q-table__top {
  padding: 12px 12px 18px;
}

.page-stories__table .q-table__grid-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 12px;
}

.page-stories__table .q-table__grid-item {
  padding: 0;
}

.page-stories__card {
  height: 100%;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  animation: page-stories-card-rise 360ms ease-out both;
}

.page-stories__card-link {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  min-height: 200px;
  color: inherit;
  text-decoration: none;
}

.page-stories__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-stories__card-type {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 0;
  background: rgba(221, 180, 118, 0.2);
  color: #6b4c21;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-stories__card-title {
  margin: 0;
  font-family: $header-font;
  font-size: 1.05rem;
  line-height: 1.3;
  color: #1f2c38;
}

.page-stories__card-meta {
  display: grid;
  justify-items: end;
  text-align: right;
  gap: 2px;
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.8rem;
}

.page-stories__card-excerpt {
  margin: 0;
  color: rgba(35, 35, 35, 0.72);
  font-size: 0.92rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-stories__card-action {
  margin-top: auto;
  font-weight: 600;
  color: #1f4d64;
  letter-spacing: 0.01em;
}

.page-stories__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-stories__card-link:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(31, 77, 100, 0.3);
  border-radius: 0;
}

.page-stories__empty {
  padding: 28px 16px;
  text-align: center;
  color: rgba(35, 35, 35, 0.7);
}

.page-stories__empty-title {
  font-weight: 600;
  margin-bottom: 6px;
}

.page-stories__empty-subtitle {
  font-size: 0.9rem;
}

@keyframes page-stories-card-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media screen and (max-width: 1100px) {
  .page-stories__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-stories__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-stories__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-stories__result {
    text-align: left;
  }

  .page-stories__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-stories {
    padding: 20px 14px 36px;
  }

  .page-stories__hero {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-stories__card {
    animation: none;
    transition: none;
  }

  .page-stories__card:hover {
    transform: none;
  }
}
</style>
