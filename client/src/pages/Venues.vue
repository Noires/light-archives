<template>
  <q-page class="page-venues">
    <header class="page-venues__hero">
      <div class="page-venues__hero-text">
        <span class="page-venues__eyebrow">Community</span>
        <h2>Treffpunkte</h2>
        <p class="page-venues__lead">
          Orte für Begegnungen, Rollenspiel und gemeinsame Momente.
        </p>
      </div>
      <div class="page-venues__hero-meta">
        <div class="page-venues__count">
          <span class="page-venues__count-number">{{ venues.length }}</span>
          <span class="page-venues__count-label">Einträge</span>
        </div>
      </div>
    </header>

    <section class="page-venues__content">
      <div class="page-venues__toolbar">
        <div class="page-venues__stats">
          {{ venues.length }} Einträge
        </div>
        <q-pagination
          class="page-venues__pagination"
          :model-value="page"
          :max="maxPage"
          input
          @update:model-value="setPage"
        />
      </div>
      <div v-if="pagedVenues.length > 0" class="page-venues__list">
        <venue-list :venues="pagedVenues" />
      </div>
      <div v-else class="page-venues__empty">
        {{ emptyMessage }}
      </div>
    </section>
  </q-page>
</template>

<script lang="ts">
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import VenueList from 'src/components/venues/VenueList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();

@Options({
	name: 'PageVenues',
	components: {
		VenueList
	},
  async beforeRouteEnter(_, __, next) {
    try {
      const venues = await $api.venues.getVenues();
      next(vm => (vm as PageVenues).setContent(venues));
    } catch (e) {
      console.log(e);
      notifyError(e);
    }
  }
})
export default class PageVenues extends Vue {
	venues: VenueSummaryDto[] = [];
  page = 1;
  readonly perPage = 12;

	setContent(venues: VenueSummaryDto[]) {
		this.venues = venues;
    this.page = 1;
	}

  get pagedVenues() {
    const start = (this.page - 1) * this.perPage;
    return this.venues.slice(start, start + this.perPage);
  }

  get maxPage() {
    return Math.max(1, Math.ceil(this.venues.length / this.perPage));
  }

  get emptyMessage() {
    if (this.venues.length == 0) {
      return 'Es gibt noch keine Treffpunkte auf Elpisgarten.';
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
.page-venues {
  position: relative;
  padding: 28px 18px 42px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 45%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-venues::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-venues h2 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-venues__hero {
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

.page-venues__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-venues__hero-text {
  display: grid;
  gap: 8px;
}

.page-venues__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: 520px;
}

.page-venues__hero-meta {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.page-venues__count {
  display: grid;
  justify-items: end;
  line-height: 1;
}

.page-venues__count-number {
  font-family: $header-font;
  font-size: 2rem;
  color: #20323d;
}

.page-venues__count-label {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-venues__content {
  position: relative;
  z-index: 1;
}

.page-venues__toolbar {
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

.page-venues__stats {
  text-align: right;
  white-space: nowrap;
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-venues__pagination {
  justify-self: end;
}

.page-venues__list {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-venues__list .q-list {
  border: none;
}

.page-venues__empty {
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

@media screen and (max-width: 1100px) {
  .page-venues__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-venues__hero-meta {
    width: 100%;
    justify-items: start;
  }

  .page-venues__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-venues__stats {
    text-align: left;
  }

  .page-venues__pagination {
    justify-self: start;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-venues {
    padding: 20px 14px 36px;
  }

  .page-venues__hero {
    padding: 16px;
  }
}
</style>
