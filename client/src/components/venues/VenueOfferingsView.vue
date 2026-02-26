<template>
  <div class="offerings-view">
    <template v-if="!offerings || offerings.categories.length === 0">
      <p>Keine Angebote vorhanden.</p>
    </template>
    <template v-else-if="offerings.categories.length === 1">
      <!-- Single top-level category: no tabs, show category heading + content -->
      <div class="offerings-view__single-category">
        <template v-for="(cat, catIdx) in offerings.categories" :key="catIdx">
          <h3 class="offerings-view__category-heading">{{ cat.name }}</h3>
          <template v-if="cat.subcategories && cat.subcategories.length > 0">
            <template v-for="(sub, subIdx) in cat.subcategories" :key="subIdx">
              <h4 class="offerings-view__subcategory-heading">{{ sub.name }}</h4>
              <div v-if="sub.offerings && sub.offerings.length" class="offerings-view__grid">
                <venue-offering-card
                  v-for="(offering, offIdx) in sub.offerings"
                  :key="offIdx"
                  :offering="offering"
                />
              </div>
              <p v-else class="offerings-view__empty">Keine Einträge.</p>
            </template>
          </template>
          <!-- Direct offerings in this category -->
          <template v-if="cat.offerings && cat.offerings.length > 0">
            <div class="offerings-view__grid">
              <venue-offering-card
                v-for="(offering, offIdx) in cat.offerings"
                :key="offIdx"
                :offering="offering"
              />
            </div>
          </template>
          <template v-if="(!cat.subcategories || cat.subcategories.length === 0) && (!cat.offerings || cat.offerings.length === 0)">
            <p class="offerings-view__empty">Keine Einträge.</p>
          </template>
        </template>
      </div>
    </template>
    <template v-else>
      <!-- Multiple top-level categories: use tabs -->
      <q-tabs
        v-model="activeTab"
        dense
        align="left"
        class="offerings-view__tabs"
      >
        <q-tab
          v-for="(cat, catIdx) in offerings.categories"
          :key="catIdx"
          :name="String(cat.id ?? cat.name)"
          :label="cat.name"
        />
      </q-tabs>
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel
          v-for="(cat, catIdx) in offerings.categories"
          :key="catIdx"
          :name="String(cat.id ?? cat.name)"
          class="offerings-view__panel"
        >
          <h3 class="offerings-view__category-heading">{{ cat.name }}</h3>
          <template v-if="cat.subcategories && cat.subcategories.length > 0">
            <template v-for="(sub, subIdx) in cat.subcategories" :key="subIdx">
              <h4 class="offerings-view__subcategory-heading">{{ sub.name }}</h4>
              <div v-if="sub.offerings && sub.offerings.length" class="offerings-view__grid">
                <venue-offering-card
                  v-for="(offering, offIdx) in sub.offerings"
                  :key="offIdx"
                  :offering="offering"
                />
              </div>
              <p v-else class="offerings-view__empty">Keine Einträge.</p>
            </template>
          </template>
          <!-- Direct offerings in this category -->
          <template v-if="cat.offerings && cat.offerings.length > 0">
            <div class="offerings-view__grid">
              <venue-offering-card
                v-for="(offering, offIdx) in cat.offerings"
                :key="offIdx"
                :offering="offering"
              />
            </div>
          </template>
          <template v-if="(!cat.subcategories || cat.subcategories.length === 0) && (!cat.offerings || cat.offerings.length === 0)">
            <p class="offerings-view__empty">Keine Einträge.</p>
          </template>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </div>
</template>

<script lang="ts">
import { VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { Options, prop, Vue } from 'vue-class-component';
import VenueOfferingCard from './VenueOfferingCard.vue';

class Props {
  offerings = prop<VenueOfferingsDto | null>({ default: null });
}

@Options({
  name: 'VenueOfferingsView',
  components: { VenueOfferingCard },
  watch: {
    offerings: {
      immediate: true,
      handler(this: VenueOfferingsView) {
        this.initActiveTab();
      },
    },
  },
})
export default class VenueOfferingsView extends Vue.with(Props) {
  activeTab = '';

  initActiveTab() {
    if (this.offerings && this.offerings.categories.length > 0) {
      const first = this.offerings.categories[0];
      this.activeTab = String(first.id ?? first.name);
    }
  }
}
</script>

<style lang="scss">
.offerings-view__tabs {
  margin-bottom: 0;
}

.offerings-view__panel {
  padding: 16px 0;
}

.offerings-view__category-heading {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 700;
}

.offerings-view__subcategory-heading {
  margin: 16px 0 10px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(35, 35, 35, 0.6);
}

body.body--dark .offerings-view__subcategory-heading {
  color: rgba(213, 226, 240, 0.6);
}

.offerings-view__subcategory-heading:first-child {
  margin-top: 0;
}

.offerings-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.offerings-view__empty {
  color: rgba(35, 35, 35, 0.55);
  font-style: italic;
}

body.body--dark .offerings-view__empty {
  color: rgba(213, 226, 240, 0.55);
}

.offerings-view__single-category {
  padding: 4px 0;
}
</style>
