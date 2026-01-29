<template>
  <q-page class="page-noticeboard">
    <header class="page-noticeboard__hero">
      <div class="page-noticeboard__hero-text">
        <span class="page-noticeboard__eyebrow">Community</span>
        <h2>Anschlagbrett</h2>
        <p class="page-noticeboard__lead">
          Neueste Aushänge, Gesuche und Hinweise aus der Community.
        </p>
      </div>
      <div class="page-noticeboard__hero-meta">
        <div class="page-noticeboard__count">
          <span class="page-noticeboard__count-number">{{ noticeboardItems.length }}</span>
          <span class="page-noticeboard__count-label">Einträge</span>
        </div>
      </div>
    </header>

    <section class="page-noticeboard__content">
      <div class="page-noticeboard__toolbar">
        <div class="page-noticeboard__stats">
          {{ noticeboardItems.length }} Einträge
        </div>
        <q-pagination
          class="page-noticeboard__pagination"
          :model-value="page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
      <div v-if="pagedNoticeboardItems.length > 0" class="page-noticeboard__list">
        <noticeboard-item-list :noticeboard-items="pagedNoticeboardItems" />
      </div>
      <div v-else class="page-noticeboard__empty">
        {{ emptyMessage }}
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import NoticeboardItemList from 'components/noticeboard/NoticeboardItemList.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageNoticeboard',
	components: {
		NoticeboardItemList
	},
  async beforeRouteEnter(_, __, next) {
    try {
      const noticeboardItems = await $api.noticeboard.getNoticeboardItems({});
      next(vm => (vm as PageNoticeboard).setContent(noticeboardItems));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageNoticeboard extends Vue {
	noticeboardItems: NoticeboardItemSummaryDto[] = [];
  page = 1;
  readonly perPage = 12;

	setContent(noticeboardItems: NoticeboardItemSummaryDto[]) {
		this.noticeboardItems = noticeboardItems;
    this.page = 1;
	}

  get pagedNoticeboardItems() {
    const start = (this.page - 1) * this.perPage;
    return this.noticeboardItems.slice(start, start + this.perPage);
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.noticeboardItems.length / this.perPage));
  }

  get emptyMessage() {
    if (this.noticeboardItems.length == 0) {
      return 'Es gibt noch keine Aushänge auf Elpisgarten.';
    }
    return 'Keine Einträge gefunden.';
  }

  setPage(newPage: number) {
    const clamped = Math.min(Math.max(newPage, 1), this.maxPage);
    this.page = clamped;
  }
}
</script>

<style lang="scss">
.page-noticeboard {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-noticeboard::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-noticeboard h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-noticeboard__hero {
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

.page-noticeboard__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-noticeboard__hero-text {
  display: grid;
  gap: 8px;
}

.page-noticeboard__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-noticeboard__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-noticeboard__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-noticeboard__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-noticeboard__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-noticeboard__content {
  position: relative;
  z-index: 1;
}

.page-noticeboard__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  margin-bottom: 18px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-noticeboard__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-noticeboard__pagination {
  justify-self: end;
}

.page-noticeboard__list {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-noticeboard__list .q-list {
  border: none;
}

.page-noticeboard__empty {
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-noticeboard__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-noticeboard__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-noticeboard__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-noticeboard__stats {
    text-align: left;
  }

  .page-noticeboard__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-noticeboard {
    padding: 20px 14px 36px;
  }

  .page-noticeboard__hero {
    padding: 16px;
  }
}
</style>
