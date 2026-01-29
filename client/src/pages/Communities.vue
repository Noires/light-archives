<template>
  <q-page class="page-communities">
    <header class="page-communities__hero">
      <div class="page-communities__hero-text">
        <span class="page-communities__eyebrow">Community</span>
        <h2>Communities</h2>
        <p class="page-communities__lead">
          Finde Gruppen, Netzwerke und gemeinsame Ziele im Elpisgarten.
        </p>
      </div>
      <div class="page-communities__hero-meta">
        <div class="page-communities__count">
          <span class="page-communities__count-number">{{ communities.length }}</span>
          <span class="page-communities__count-label">Einträge</span>
        </div>
      </div>
    </header>

    <section class="page-communities__content">
      <div class="page-communities__toolbar">
        <div class="page-communities__stats">
          {{ communities.length }} Einträge
        </div>
        <q-pagination
          class="page-communities__pagination"
          :model-value="page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
      <div v-if="pagedCommunities.length > 0" class="page-communities__list">
        <community-list :communities="pagedCommunities" />
      </div>
      <div v-else class="page-communities__empty">
        {{ emptyMessage }}
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { CommunitySummaryDto } from '@app/shared/dto/communities/community-summary.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import CommunityList from 'components/communities/CommunityList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageCommunities',
	components: {
		CommunityList
	},
  async beforeRouteEnter(_, __, next) {
    try {
      const communities = await $api.communities.getCommunities();
      next(vm => (vm as PageCommunities).setContent(communities));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageCommunities extends Vue {
	communities: CommunitySummaryDto[] = [];
  page = 1;
  readonly perPage = 12;

	setContent(communities: CommunitySummaryDto[]) {
		this.communities = communities;
    this.page = 1;
	}

  get pagedCommunities() {
    const start = (this.page - 1) * this.perPage;
    return this.communities.slice(start, start + this.perPage);
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.communities.length / this.perPage));
  }

  get emptyMessage() {
    if (this.communities.length == 0) {
      return 'Es gibt noch keine Communities auf Elpisgarten.';
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
.page-communities {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-communities::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-communities h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-communities__hero {
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

.page-communities__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-communities__hero-text {
  display: grid;
  gap: 8px;
}

.page-communities__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-communities__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-communities__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-communities__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-communities__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-communities__content {
  position: relative;
  z-index: 1;
}

.page-communities__toolbar {
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

.page-communities__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-communities__pagination {
  justify-self: end;
}

.page-communities__list {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-communities__list .q-list {
  border: none;
}

.page-communities__empty {
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-communities__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-communities__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-communities__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-communities__stats {
    text-align: left;
  }

  .page-communities__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-communities {
    padding: 20px 14px 36px;
  }

  .page-communities__hero {
    padding: 16px;
  }
}
</style>
