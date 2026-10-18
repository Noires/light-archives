<template>
  <section class="page-index">
    <template v-if="issue">
      <mounted-teleport to="#header-date">{{ $display.formatDateEorzean(issue.publishedAt) }}</mounted-teleport>
      <template v-for="(article, idx) in issue.articles" :key="article.id">
        <aside v-if="idx > 0" class="page-index__divider" aria-hidden="true"></aside>
        <article-view :article="article" />
      </template>
    </template>
    <template v-else>
      Es gibt noch keine Ausgaben.
    </template>
  </section>
</template>

<script lang="ts">
import { NewsIssueDto } from '@app/shared/dto/news/news-issue.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ArticleView from 'src/components/article/ArticleView.vue';
import MountedTeleport from 'src/components/common/MountedTeleport.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

async function load(): Promise<NewsIssueDto|null> {
  try {
    return await $api.news.getLatestIssue();
  } catch (e) {
    console.log(e);
    notifyError('Cannot retrieve main page');
    throw e;
  }
}

@Options({
  name: 'PageIndex',
  components: {
    ArticleView,
    MountedTeleport,
  },
  async beforeRouteEnter(_, __, next) {
    const content = await load();
    next(vm => (vm as PageIndex).setContent(content));
  }
})
export default class PageIndex extends Vue {
  issue: NewsIssueDto|null = null;

  setContent(content: NewsIssueDto|null) {
    this.issue = content;
  }
}
</script>

<style lang="scss">
.page-index {
  display: flex;
  margin-right: -20px;
}

// ELPIS-706 — Vertical quill/triskelion divider between adjacent articles.
// The divider is a zero-width flex item that paints into the preceding
// article's 20 px right-margin gutter via two absolutely-positioned pseudos:
// ::before is a vertical gold rule, ::after stamps the triskelion glyph on
// top of it. The same triskelion path the TriskelionDivider primitive uses,
// inlined as a URL-encoded SVG. On mobile (≤ 768 px) the article flex flips
// to column and the divider rotates to a horizontal rule with the glyph
// centered on it.
.page-index__divider {
  flex: 0 0 0;
  width: 0;
  align-self: stretch;
  position: relative;
  margin-right: 20px;
}

.page-index__divider::before {
  content: '';
  position: absolute;
  top: 6%;
  bottom: 6%;
  left: -10px;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    var(--rule-gold) 14%,
    var(--rule-gold) 86%,
    transparent 100%
  );
  opacity: 0.6;
}

.page-index__divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -10px;
  width: 26px;
  height: 26px;
  transform: translate(-50%, -50%);
  background-color: var(--surface-pearl);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-16 -16 32 32' fill='none' stroke='%23BA9B5B' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'><g><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><g transform='rotate(120)'><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><g transform='rotate(240)'><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><circle cx='0' cy='0' r='0.9' fill='%23BA9B5B' stroke='none' opacity='0.7'/></svg>");
  background-size: 22px 22px;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 50%;
}

@media screen and (max-width: 768px) {
  .page-index {
    flex-direction: column;
    margin-right: 0;
  }

  .page-index__divider {
    flex: 0 0 auto;
    width: auto;
    height: 0;
    margin-right: 0;
    margin: 12px 0 24px;
    align-self: stretch;
  }

  .page-index__divider::before {
    top: 50%;
    bottom: auto;
    left: 6%;
    right: 6%;
    width: auto;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--rule-gold) 14%,
      var(--rule-gold) 86%,
      transparent 100%
    );
    transform: translateY(-50%);
  }

  .page-index__divider::after {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

body.body--dark {
  .page-index__divider::before {
    background: linear-gradient(
      to bottom,
      transparent 0%,
      var(--rule-arcane) 14%,
      var(--rule-arcane) 86%,
      transparent 100%
    );
  }

  .page-index__divider::after {
    background-color: var(--surface-deep);
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-16 -16 32 32' fill='none' stroke='%23B8A5FF' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'><g><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><g transform='rotate(120)'><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><g transform='rotate(240)'><path d='M0 -3 Q -3 -10 -8 -10 Q -12 -8 -10 -4'/></g><circle cx='0' cy='0' r='0.9' fill='%23B8A5FF' stroke='none' opacity='0.7'/></svg>");
    background-size: 22px 22px;
    background-repeat: no-repeat;
    background-position: center;
  }

  @media screen and (max-width: 768px) {
    .page-index__divider::before {
      background: linear-gradient(
        to right,
        transparent 0%,
        var(--rule-arcane) 14%,
        var(--rule-arcane) 86%,
        transparent 100%
      );
    }
  }
}
</style>
