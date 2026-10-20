<template>
  <section class="page-my-articles">
    <h2 class="with-subtitle">Meine Artikel</h2>
    <div class="subtitle">for {{ $store.getters.character?.newsPseudonym || $store.getters.character?.name }}</div>
    <section class="page-my-articles__content">
      <p class="text-right">
        <q-btn color="secondary" label="Neuen Artikel einreichen" icon="add" to="/create-article" />
      </p>
      <nav class="page-my-articles__filters" role="tablist" aria-label="Status filtern">
        <button
          v-for="filter in filterOptions"
          :key="filter.value || 'all'"
          type="button"
          role="tab"
          :aria-selected="activeFilter === filter.value"
          class="page-my-articles__chip"
          :class="{ 'page-my-articles__chip--active': activeFilter === filter.value }"
          @click="setFilter(filter.value)"
        >
          <span class="page-my-articles__chip-label">{{ filter.label }}</span>
          <span class="page-my-articles__chip-count">{{ countFor(filter.value) }}</span>
        </button>
      </nav>
      <article-list :articles="filteredArticles" />
      <p v-if="!filteredArticles.length" class="page-my-articles__empty">
        Keine Artikel in diesem Status.
      </p>
    </section>
  </section>
</template>

<script lang="ts">
import { NewsArticleDto } from '@app/shared/dto/news/news-article.dto';
import { NewsStatus } from '@app/shared/enums/news-status.enum';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ArticleList from 'src/components/article/ArticleList.vue';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();
const $router = useRouter();
const $store = useStore();

// Session-scoped storage so the chip selection survives navigation but resets
// on a fresh login. localStorage would persist across sessions which is
// surprising for a per-character workflow.
const FILTER_STORAGE_KEY = 'harborwatch.myArticles.filter';

type StatusFilter = NewsStatus | null;

const FILTER_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: null, label: 'Alle' },
  { value: NewsStatus.DRAFT, label: 'Entwurf' },
  { value: NewsStatus.SUBMITTED, label: 'Eingereicht' },
  { value: NewsStatus.PUBLISHED, label: 'Veröffentlicht' },
];

async function load(): Promise<NewsArticleDto[]> {
  try {
    return await $api.news.getMyArticles($store.getters.characterId!);
  } catch (e) {
    notifyError(e);
    void $router.replace('/');
    throw e;
  }
}

function readStoredFilter(): StatusFilter {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(FILTER_STORAGE_KEY);
  if (!raw) return null;
  if (raw === NewsStatus.DRAFT || raw === NewsStatus.SUBMITTED || raw === NewsStatus.PUBLISHED) {
    return raw;
  }
  return null;
}

@Options({
  name: 'PageMyArticles',
  components: {
    ArticleList,
  },
  async beforeRouteEnter(_, __, next) {
    const articles = await load();
    next((vm) => (vm as PageMyArticles).setContent(articles));
  },
})
export default class PageMyArticles extends Vue {
  readonly filterOptions = FILTER_OPTIONS;

  articles: NewsArticleDto[] = [];
  activeFilter: StatusFilter = readStoredFilter();

  setContent(articles: NewsArticleDto[]) {
    this.articles = articles;
  }

  setFilter(value: StatusFilter) {
    this.activeFilter = value;
    if (typeof window !== 'undefined') {
      if (value === null) {
        window.sessionStorage.removeItem(FILTER_STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(FILTER_STORAGE_KEY, value);
      }
    }
  }

  countFor(value: StatusFilter): number {
    if (value === null) return this.articles.length;
    return this.articles.filter((a) => a.status === value).length;
  }

  get filteredArticles(): NewsArticleDto[] {
    if (this.activeFilter === null) return this.articles;
    return this.articles.filter((a) => a.status === this.activeFilter);
  }
}
</script>

<style lang="scss">
.page-my-articles__content {
  max-width: 700px;
  margin: auto;
}

.page-my-articles__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 18px;
}

.page-my-articles__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  color: var(--surface-ink);
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis),
    color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.page-my-articles__chip:hover {
  border-color: var(--rule-gold);
  background-color: rgba(186, 155, 91, 0.12);
}

.page-my-articles__chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(186, 155, 91, 0.32);
}

.page-my-articles__chip--active {
  background-color: rgba(186, 155, 91, 0.22);
  border-color: var(--rule-gold);
  color: var(--rule-gold);
  box-shadow:
    inset 0 0 0 1px var(--rule-gold-soft),
    0 2px 8px rgba(186, 155, 91, 0.16);
}

.page-my-articles__chip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  padding: 0 6px;
  height: 18px;
  border-radius: 999px;
  background-color: rgba(186, 155, 91, 0.18);
  color: var(--surface-ink);
  font-feature-settings: 'tnum' 1, 'lnum' 1;
  font-variant-numeric: tabular-nums lining-nums;
  letter-spacing: 0;
  font-size: 11px;
}

.page-my-articles__chip--active .page-my-articles__chip-count {
  background-color: var(--rule-gold);
  color: var(--surface-pearl);
}

.page-my-articles__empty {
  margin: 18px 0 0;
  text-align: center;
  font-family: var(--font-section);
  font-style: italic;
  color: var(--ink-muted);
}

body.body--dark {
  .page-my-articles__chip {
    background: var(--surface-lift);
    color: var(--ink-luminous);
    border-color: var(--rule-arcane-soft);
  }

  .page-my-articles__chip:hover {
    border-color: var(--rule-arcane);
    background-color: rgba(158, 196, 243, 0.16);
  }

  .page-my-articles__chip:focus-visible {
    box-shadow: 0 0 0 3px rgba(183, 211, 243, 0.4);
  }

  .page-my-articles__chip--active {
    background-color: rgba(158, 196, 243, 0.22);
    border-color: var(--rule-arcane);
    color: var(--glow-aether-d);
    box-shadow:
      inset 0 0 0 1px var(--rule-arcane-soft),
      0 2px 8px rgba(183, 211, 243, 0.18);
  }

  .page-my-articles__chip-count {
    background-color: rgba(158, 196, 243, 0.22);
    color: var(--ink-luminous);
  }

  .page-my-articles__chip--active .page-my-articles__chip-count {
    background-color: var(--rule-arcane);
    color: var(--ink-luminous);
  }

  .page-my-articles__empty {
    color: rgba(217, 225, 234, 0.74);
  }
}
</style>
