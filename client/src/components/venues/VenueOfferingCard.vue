<template>
  <div class="offering-card">
    <img
      v-if="offering.imageUrl"
      class="offering-card__image"
      :src="offering.imageUrl"
      :alt="offering.name"
    />
    <div class="offering-card__body">
      <div class="offering-card__header">
        <span class="offering-card__name">{{ offering.name }}</span>
        <span v-if="offering.price" class="offering-card__price">{{ offering.price }}</span>
      </div>
      <div v-if="offering.description" class="offering-card__description">
        <html-viewer :content="offering.description" />
      </div>
    </div>
  </div>
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
  display: flex;
  gap: 12px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  padding: 10px;
  border-radius: 4px;
}

body.body--dark .offering-card {
  border-color: rgba(141, 181, 223, 0.32);
  background: rgba(17, 24, 34, 0.92);
}

.offering-card__image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  background-color: rgba(255, 255, 255, 0.9);
  background-image:
    linear-gradient(45deg, rgba(0, 0, 0, 0.03) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(0, 0, 0, 0.03) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.03) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.03) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  border-radius: 3px;
  flex-shrink: 0;
}

.offering-card__body {
  flex: 1;
  min-width: 0;
}

.offering-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.offering-card__name {
  font-weight: 600;
  font-size: 0.95rem;
}

.offering-card__price {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.65);
  white-space: nowrap;
  flex-shrink: 0;
}

body.body--dark .offering-card__price {
  color: rgba(213, 226, 240, 0.65);
}

.offering-card__description {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.75);
  line-height: 1.4;
}

.offering-card__description :deep(section) {
  margin: 0;
}

body.body--dark .offering-card__description {
  color: rgba(213, 226, 240, 0.75);
}
</style>
