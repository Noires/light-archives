<template>
  <section class="page-my-articles">
    <h2 class="with-subtitle">Meine Artikel</h2>
    <div class="subtitle">for {{ $store.getters.character?.newsPseudonym || $store.getters.character?.name }}</div>
    <section class="page-my-articles__content">
      <p class="text-right">
        <q-btn color="secondary" label="Neuen Artikel einreichen" icon="add" to="/create-article" />
      </p>
      <article-list :articles="articles" />
    </section>
  </section>
</template>

<script lang="ts">
import { NewsArticleDto } from '@app/shared/dto/news/news-article.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ArticleList from 'src/components/article/ArticleList.vue';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();
const $router = useRouter();
const $store = useStore();

async function load(): Promise<NewsArticleDto[]> {
  try {
    return await $api.news.getMyArticles($store.getters.characterId!);
  } catch (e) {
    notifyError(e);
    void $router.replace('/');
    throw e;
  }
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
  articles: NewsArticleDto[] = [];

  setContent(articles: NewsArticleDto[]) {
    this.articles = articles;
  }
}
</script>

<style lang="scss">
.page-my-articles__content {
  max-width: 700px;
  margin: auto;
}
</style>
