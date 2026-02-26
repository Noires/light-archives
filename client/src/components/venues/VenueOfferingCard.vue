<template>
  <article class="offering-card" :class="{ 'offering-card--no-image': !offering.imageUrl }">
    <div v-if="offering.imageUrl" class="offering-card__media">
      <img
        class="offering-card__image"
        :src="offering.imageUrl"
        :alt="offering.name"
      />
    </div>

    <div class="offering-card__body">
      <header class="offering-card__header">
        <span class="offering-card__name">{{ offering.name }}</span>
        <span v-if="offering.price" class="offering-card__price">{{ offering.price }}</span>
      </header>

      <div v-if="offering.description" class="offering-card__description">
        <html-viewer :content="offering.description" />
      </div>
    </div>
  </article>
</template>

<script lang="ts">
import { VenueOfferingDto } from '@app/shared/dto/venues/venue-offering.dto';
import HtmlViewer from 'src/components/common/HtmlViewer.vue';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  offering = prop<VenueOfferingDto>({ required: true });
}

@Options({
  name: 'VenueOfferingCard',
  components: {
    HtmlViewer,
  },
})
export default class VenueOfferingCard extends Vue.with(Props) {}
</script>

<style lang="scss">
.offering-card {
  --offering-surface: #ffffff;
  --offering-border: rgba(122, 96, 63, 0.2);
  --offering-shadow: 0 6px 14px rgba(36, 28, 18, 0.08);
  --offering-title: #2b2117;
  --offering-text: rgba(60, 45, 30, 0.78);
  --offering-price-bg: rgba(122, 96, 63, 0.12);
  --offering-price-border: rgba(122, 96, 63, 0.24);
  --offering-price-text: #51371d;

  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 12px;
  border: 1px solid var(--offering-border);
  border-radius: 10px;
  background: var(--offering-surface);
  box-shadow: var(--offering-shadow);
  padding: 10px;
  transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

body.body--dark .offering-card {
  --offering-surface: #172534;
  --offering-border: rgba(170, 205, 237, 0.22);
  --offering-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
  --offering-title: rgba(234, 244, 255, 0.96);
  --offering-text: rgba(194, 216, 238, 0.82);
  --offering-price-bg: rgba(170, 205, 237, 0.14);
  --offering-price-border: rgba(170, 205, 237, 0.3);
  --offering-price-text: rgba(223, 239, 255, 0.95);
}

.offering-card:hover {
  transform: translateY(-1px);
  border-color: rgba(122, 96, 63, 0.34);
  box-shadow: 0 9px 18px rgba(36, 28, 18, 0.12);
}

body.body--dark .offering-card:hover {
  border-color: rgba(170, 205, 237, 0.36);
  box-shadow: 0 11px 20px rgba(0, 0, 0, 0.3);
}

.offering-card--no-image {
  grid-template-columns: minmax(0, 1fr);
}

.offering-card__media {
  display: flex;
  align-items: flex-start;
}

.offering-card__image {
  width: 76px;
  height: 76px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  background-image:
    linear-gradient(45deg, rgba(0, 0, 0, 0.03) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0, 0, 0, 0.03) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.03) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.03) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
}

body.body--dark .offering-card__image {
  border-color: rgba(255, 255, 255, 0.14);
}

.offering-card__body {
  min-width: 0;
}

.offering-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;
}

.offering-card__name {
  font-weight: 700;
  color: var(--offering-title);
  line-height: 1.25;
}

.offering-card__price {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--offering-price-text);
  border: 1px solid var(--offering-price-border);
  border-radius: 999px;
  background: var(--offering-price-bg);
  padding: 2px 8px;
}

.offering-card__description {
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--offering-text);
}

.offering-card__description :deep(section) {
  margin: 0;
}

@media screen and (max-width: $breakpoint-sm) {
  .offering-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .offering-card__image {
    width: 100%;
    height: 152px;
  }
}
</style>
