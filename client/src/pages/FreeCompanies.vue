<template>
  <q-page class="page-free-companies">
    <header class="page-free-companies__hero">
      <div class="page-free-companies__hero-text">
        <span class="page-free-companies__eyebrow">Community</span>
        <h2>Freie Gesellschaften</h2>
        <p class="page-free-companies__lead">
          Entdecke freie Gesellschaften, ihre Ziele und Geschichten.
        </p>
      </div>
      <div class="page-free-companies__hero-meta">
        <div class="page-free-companies__count">
          <span class="page-free-companies__count-number">{{ freeCompanies.length }}</span>
          <span class="page-free-companies__count-label">Einträge</span>
        </div>
      </div>
    </header>

    <section class="page-free-companies__content">
      <div class="page-free-companies__toolbar">
        <div class="page-free-companies__stats">
          {{ freeCompanies.length }} Einträge
        </div>
        <q-pagination
          class="page-free-companies__pagination"
          :model-value="page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
      <div v-if="pagedFreeCompanies.length > 0" class="page-free-companies__list">
        <free-company-name-list :free-companies="pagedFreeCompanies" />
      </div>
      <div v-else class="page-free-companies__empty">
        {{ emptyMessage }}
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import FreeCompanyNameList from 'src/components/free-company/FreeCompanyNameList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageFreeCompanies',
	components: {
		FreeCompanyNameList
	},
  async beforeRouteEnter(_, __, next) {
    try {
      const freeCompanies = await $api.freeCompanies.getFreeCompanies();
      next(vm => (vm as PageFreeCompanies).setContent(freeCompanies));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageFreeCompanies extends Vue {
	freeCompanies: FreeCompanySummaryDto[] = [];
  page = 1;
  readonly perPage = 12;

	setContent(freeCompanies: FreeCompanySummaryDto[]) {
		this.freeCompanies = freeCompanies;
    this.page = 1;
	}

  get pagedFreeCompanies() {
    const start = (this.page - 1) * this.perPage;
    return this.freeCompanies.slice(start, start + this.perPage);
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.freeCompanies.length / this.perPage));
  }

  get emptyMessage() {
    if (this.freeCompanies.length === 0) {
      return 'Hier gibt es keine Freien Gesellschaften... noch!';
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
.page-free-companies {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-free-companies::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-free-companies h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-free-companies__hero {
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

.page-free-companies__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-free-companies__hero-text {
  display: grid;
  gap: 8px;
}

.page-free-companies__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-free-companies__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-free-companies__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-free-companies__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-free-companies__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-free-companies__content {
  position: relative;
  z-index: 1;
}

.page-free-companies__toolbar {
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

.page-free-companies__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-free-companies__pagination {
  justify-self: end;
}

.page-free-companies__list {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-free-companies__list .q-list {
  border: none;
}

.page-free-companies__empty {
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-free-companies__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-free-companies__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-free-companies__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-free-companies__stats {
    text-align: left;
  }

  .page-free-companies__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-free-companies {
    padding: 20px 14px 36px;
  }

  .page-free-companies__hero {
    padding: 16px;
  }
}
</style>
