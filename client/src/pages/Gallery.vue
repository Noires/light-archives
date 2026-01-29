<template>

  <q-page class="page-gallery">

    <header class="page-gallery__hero">

      <div class="page-gallery__hero-text">

        <span class="page-gallery__eyebrow">Galerie</span>

        <h2>{{ title }}</h2>

        <p class="page-gallery__lead">{{ description }}</p>

      </div>

      <div class="page-gallery__hero-meta">

        <div class="page-gallery__count">

          <span class="page-gallery__count-number">{{ total }}</span>

          <span class="page-gallery__count-label">Bilder</span>

        </div>

      </div>

    </header>



    <div class="page-gallery__toolbar">

      <q-input

        class="page-gallery__search-query"

        label="Suche"

        debounce="200"

        :model-value="searchQuery"

        filled

        dense

        clearable

        @update:model-value="setSearchQuery"

      />

      <div class="page-gallery__stats">

        {{ first }}-{{ last }} von {{ total }}

      </div>

      <q-pagination

        class="page-gallery__pagination"

        :model-value="page"

        :max="maxPage"

        input

        @update:model-value="setPage"

      />

    </div>



    <thumb-gallery :images="images" />

    <div v-if="images.length === 0" class="page-gallery__empty">

      Keine Bilder gefunden.

    </div>

  </q-page>

</template>



<script lang="ts">
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { createMetaMixin } from 'quasar';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteLocationNormalized } from 'vue-router';

const $api = useApi();
const $router = useRouter();

interface PageData {
  category: ImageCategory;
  page: number;
  searchQuery: string;
  images: PagingResultDto<ImageSummaryDto>;
}

async function load(to: RouteLocationNormalized): Promise<PageData> {
  const category = to.params.category as ImageCategory;
  const page = Math.max(1, parseInt(to.query.page as string)) || 1;
  const searchQuery = (to.query.searchQuery as string) || '';

  if (!Object.values(ImageCategory).includes(category) || category == ImageCategory.UNLISTED) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    return {
      category,
      searchQuery,
      page,
      images: await $api.images.getImages({
        category,
        searchQuery,
        offset: (page - 1) * SharedConstants.DEFAULT_ROWS_PER_PAGE,
        limit: SharedConstants.DEFAULT_ROWS_PER_PAGE,
      }),
    };
  } catch (e) {
    notifyError(e);
    throw e;
  }
}

@Options({
  name: 'PageGallery',
  components: {
    ThumbGallery,
  },
  async beforeRouteEnter(to, _, next) {
    const data = await load(to);
    next((vm) => (vm as PageGallery).setContent(data));
  },
  async beforeRouteUpdate(to) {
    const data = await load(to);
    (this as PageGallery).setContent(data);
  },
  mixins: [
    createMetaMixin(function (this: PageGallery) {
      return {
        title: `${this.title} - Elpisgarten`,
      };
    }),
  ],
})
export default class PageGallery extends Vue {
  category = ImageCategory.UNLISTED;
  images = [] as ImageSummaryDto[];
  total = 0;
  page = 1;
  searchQuery = '';

  setContent({ category, page, images, searchQuery }: PageData) {
    this.category = category;
    this.page = page;
    this.searchQuery = searchQuery;
    this.total = images.total;
    this.images = images.data;
    document.title = `${this.title} - Elpisgarten`;
  }

  get title() {
    return this.$display.imageCategories[this.category];
  }

  get description() {
    switch (this.category) {
      case ImageCategory.ARTWORK:
        return 'Illustrationen, Konzeptkunst und Charakterdesigns aus der Community.';
      case ImageCategory.SCREENSHOT:
        return 'Screenshots, Szenen und Momente aus dem Spiel.';
      default:
        return 'Bilder aus der Community.';
    }
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.total / SharedConstants.DEFAULT_ROWS_PER_PAGE));
  }

  get first() {
    if (this.total === 0) {
      return 0;
    }
    return (this.page - 1) * SharedConstants.DEFAULT_ROWS_PER_PAGE + 1;
  }

  get last() {
    if (this.total === 0) {
      return 0;
    }
    return Math.max(this.first, this.first + this.images.length - 1);
  }

  setPage(newPage: number) {
    if (newPage >= 1 && newPage <= this.maxPage) {
      this.page = newPage;
      this.refresh();
    }
  }

  setSearchQuery(newSearchQuery: string) {
    this.searchQuery = newSearchQuery;
    this.refresh();
  }

  refresh() {
		const queryParams: { [ k: string] : string|number } = {
			page: this.page,
    };

		if (this.searchQuery) {
			queryParams.searchQuery = this.searchQuery;
		}

    void this.$router.replace({
      path: window.location.pathname,
      query: queryParams
		});
  }
}
</script>

<style lang="scss">
.page-gallery {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-gallery::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-gallery h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-gallery__hero {
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

.page-gallery__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-gallery__hero-text {
  display: grid;
  gap: 8px;
}

.page-gallery__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-gallery__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-gallery__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-gallery__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-gallery__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-gallery__toolbar {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-gallery__search-query .q-field__control {
  background: #f6f1e8;
  border-radius: 0;
}

.page-gallery__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-gallery__pagination {
  justify-self: end;
}

.page-gallery__empty {
  margin-top: 18px;
  color: rgba(35, 35, 35, 0.7);
}

@media screen and (max-width: 1100px) {
  .page-gallery__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-gallery__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-gallery__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-gallery__stats {
    text-align: left;
  }

  .page-gallery__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-gallery {
    padding: 20px 14px 36px;
  }

  .page-gallery__hero {
    padding: 16px;
  }
}
</style>
