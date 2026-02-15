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
      </div>
    </header>
    <section class="page-stories__content">
      <div class="page-stories__toolbar">
        <q-input
          class="page-stories__search"
          v-model="searchQuery"
          label="Suche"
          debounce="200"
          filled
          dense
          clearable
          @update:model-value="onFilterChange"
        />
        <q-select
          class="page-stories__type-select"
          v-model="type"
          label="Typ"
          emit-value
          map-options
          :options="typeOptions"
          filled
          dense
          @update:model-value="onFilterChange"
        />
        <q-select
          class="page-stories__tag-select"
          v-model="tag"
          label="Schlagworte"
          :options="tagOptions"
          use-input
          emit-value
          map-options
          filled
          dense
          @filter="onTagFilter"
          @update:model-value="onFilterChange"
        />
        <div class="page-stories__stats">
          {{ pagination.rowsNumber }} gefundene Geschichten
        </div>
        <q-pagination
          class="page-stories__pagination"
          :model-value="pagination.page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
      <div class="page-stories__list">
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
                Passe die Filter an oder starte mit einer neuen Geschichte.
              </div>
            </div>
          </template>
        </q-table>
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { StoryFilterDto } from '@app/shared/dto/stories/story-filter.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { StoryType } from '@app/shared/enums/story-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageStories',
  components: {

	},
  async beforeRouteEnter(to, _, next) {
		const tag = to.query.tag as string || '';
		const type = to.query.type as StoryType || null;
		const filter: StoryFilterDto = {
      limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    };

		if (tag) {
			filter.tag = tag;
		}

		if (type) {
			filter.type = type;
		}

    const [ stories, tags] = await Promise.all([
			$api.stories.getStories(filter),
			$api.stories.getTags(),
		]);
    next((vm) => {
			(vm as PageStories).tag = tag;
			(vm as PageStories).type = type;
			(vm as PageStories).setContent(stories, tags);
		});
  },
})
export default class PageStories extends Vue {
  stories: StorySummaryDto[] = [];
  pagination = {
    page: 1,
    rowsPerPage: SharedConstants.DEFAULT_ROWS_PER_PAGE,
    rowsNumber: 0,
  };

  searchQuery = '';
  tag = '';
  type: StoryType|null = null;
	tagOptions: {label: string, value: string}[] = [];
	allTagOptions: {label: string, value: string}[] = [];

  get typeOptions() {
    return [
      { label: '(Alle)', value: null },
      ...Object.values(StoryType).map((type) => ({ value: type, label: this.$display.storyTypes[type] })),
    ];
  }

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

  setContent(stories: PagingResultDto<StorySummaryDto>, tags: string[]) {
		this.allTagOptions = [
			{
				label: '(Alle)',
				value: '',
			},
			...tags.map(tag => ({
				label: tag,
				value: tag
			}))
		];

    this.stories = stories.data;
    this.pagination.rowsNumber = stories.total;
  }

  getLink(story: StorySummaryDto) {
    return `/story/${story.id}`;
  }

	onTagFilter(value: string, update: () => void) {
    value = value.trim();

    if (!value) {
			this.tagOptions = this.allTagOptions;
    } else {
			this.tagOptions = [ this.allTagOptions[0], ...this.allTagOptions.filter(tag => tag.value.toLowerCase().includes(value.toLowerCase())) ];
		}

		update();
	}

  onFilterChange() {
    this.pagination.page = 1;
    this.refresh();
  }

	refresh() {
		void this.onPageRequest({ pagination: this.pagination });
	}

  setPage(newPage: number) {
    this.pagination.page = Math.min(Math.max(newPage, 1), this.maxPage);
    this.refresh();
  }

  async onPageRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
    const { page, rowsPerPage } = props.pagination;
    const filter: StoryFilterDto = {
      offset: (page - 1) * rowsPerPage,
      limit: rowsPerPage,
      searchQuery: this.searchQuery,
    };

    if (this.tag) {
      filter.tag = this.tag;
    }

    if (this.type) {
      filter.type = this.type;
    }

    const stories = await this.$api.stories.getStories(filter);
    this.stories = stories.data;
    this.pagination.rowsNumber = stories.total;
    this.pagination.rowsPerPage = rowsPerPage;
    this.pagination.page = page;
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

.page-stories__content {
  position: relative;
  z-index: 1;
}

.page-stories__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(160px, 0.6fr) minmax(200px, 0.8fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-stories__search .q-field__control,
.page-stories__type-select .q-field__control,
.page-stories__tag-select .q-field__control {
  background: #f6f1e8;
  border-radius: 0;
}

.page-stories__search .q-field__native,
.page-stories__search .q-field__label,
.page-stories__type-select .q-field__native,
.page-stories__type-select .q-field__label,
.page-stories__tag-select .q-field__native,
.page-stories__tag-select .q-field__label {
  font-size: 0.9rem;
}

.page-stories__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-stories__pagination {
  justify-self: end;
}

.page-stories__list {
  padding: 12px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-stories__table {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  box-shadow: none;
}

.page-stories__table .q-table__grid-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 0;
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

  .page-stories__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-stories__stats {
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
