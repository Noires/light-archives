<template>
  <div class="offerings-view">
    <template v-if="!offerings || offerings.categories.length === 0">
      <p class="offerings-view__empty-state">Keine Angebote vorhanden.</p>
    </template>

    <template v-else-if="offerings.categories.length === 1">
      <div class="offerings-view__single-category">
        <template v-for="(cat, catIdx) in offerings.categories" :key="catIdx">
          <section class="offerings-view__category-shell">
            <h3 class="offerings-view__category-heading">{{ cat.name }}</h3>

            <template v-if="cat.subcategories && cat.subcategories.length > 0">
              <template v-for="(sub, subIdx) in cat.subcategories" :key="subIdx">
                <section class="offerings-view__subsection">
                  <h4 class="offerings-view__subcategory-heading">{{ sub.name }}</h4>
                  <div class="offerings-view__subsection-content">
                    <div v-if="sub.offerings && sub.offerings.length" class="offerings-view__grid">
                      <venue-offering-card
                        v-for="(offering, offIdx) in sub.offerings"
                        :key="offIdx"
                        :offering="offering"
                      />
                    </div>
                    <p v-else class="offerings-view__empty">Keine Eintraege.</p>
                  </div>
                </section>
              </template>
            </template>

            <template v-if="cat.offerings && cat.offerings.length > 0">
              <section class="offerings-view__subsection">
                <h4
                  v-if="cat.subcategories && cat.subcategories.length > 0"
                  class="offerings-view__subcategory-heading"
                >
                  Weitere Angebote
                </h4>
                <div
                  class="offerings-view__subsection-content"
                  :class="{ 'offerings-view__subsection-content--plain': !cat.subcategories || cat.subcategories.length === 0 }"
                >
                  <div class="offerings-view__grid">
                    <venue-offering-card
                      v-for="(offering, offIdx) in cat.offerings"
                      :key="offIdx"
                      :offering="offering"
                    />
                  </div>
                </div>
              </section>
            </template>

            <template
              v-if="(!cat.subcategories || cat.subcategories.length === 0) && (!cat.offerings || cat.offerings.length === 0)"
            >
              <p class="offerings-view__empty">Keine Eintraege.</p>
            </template>
          </section>
        </template>
      </div>
    </template>

    <template v-else>
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

      <q-tab-panels
        v-model="activeTab"
        animated
        class="offerings-view__tab-panels"
        transition-prev="offerings-switch-prev"
        transition-next="offerings-switch-next"
        :transition-duration="220"
      >
        <q-tab-panel
          v-for="(cat, catIdx) in offerings.categories"
          :key="catIdx"
          :name="String(cat.id ?? cat.name)"
          class="offerings-view__panel"
        >
          <section class="offerings-view__category-shell">
            <h3 class="offerings-view__category-heading">{{ cat.name }}</h3>

            <template v-if="cat.subcategories && cat.subcategories.length > 0">
              <template v-for="(sub, subIdx) in cat.subcategories" :key="subIdx">
                <section class="offerings-view__subsection">
                  <h4 class="offerings-view__subcategory-heading">{{ sub.name }}</h4>
                  <div class="offerings-view__subsection-content">
                    <div v-if="sub.offerings && sub.offerings.length" class="offerings-view__grid">
                      <venue-offering-card
                        v-for="(offering, offIdx) in sub.offerings"
                        :key="offIdx"
                        :offering="offering"
                      />
                    </div>
                    <p v-else class="offerings-view__empty">Keine Eintraege.</p>
                  </div>
                </section>
              </template>
            </template>

            <template v-if="cat.offerings && cat.offerings.length > 0">
              <section class="offerings-view__subsection">
                <h4
                  v-if="cat.subcategories && cat.subcategories.length > 0"
                  class="offerings-view__subcategory-heading"
                >
                  Weitere Angebote
                </h4>
                <div
                  class="offerings-view__subsection-content"
                  :class="{ 'offerings-view__subsection-content--plain': !cat.subcategories || cat.subcategories.length === 0 }"
                >
                  <div class="offerings-view__grid">
                    <venue-offering-card
                      v-for="(offering, offIdx) in cat.offerings"
                      :key="offIdx"
                      :offering="offering"
                    />
                  </div>
                </div>
              </section>
            </template>

            <template
              v-if="(!cat.subcategories || cat.subcategories.length === 0) && (!cat.offerings || cat.offerings.length === 0)"
            >
              <p class="offerings-view__empty">Keine Eintraege.</p>
            </template>
          </section>
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
.offerings-view {
  --offerings-surface: #ffffff;
  --offerings-surface-soft: #faf7f1;
  --offerings-surface-subsection: #f7f2e9;
  --offerings-border: rgba(122, 96, 63, 0.22);
  --offerings-divider: rgba(122, 96, 63, 0.16);
  --offerings-accent: rgba(122, 96, 63, 0.6);
  --offerings-title: #2a2015;
  --offerings-subtitle: rgba(60, 45, 29, 0.72);
  --offerings-muted: rgba(54, 45, 35, 0.64);
  --offerings-shadow: 0 8px 18px rgba(36, 28, 18, 0.08);
}

body.body--dark .offerings-view {
  --offerings-surface: #14202c;
  --offerings-surface-soft: #1a2734;
  --offerings-surface-subsection: #1d2d3c;
  --offerings-border: rgba(170, 205, 237, 0.24);
  --offerings-divider: rgba(170, 205, 237, 0.2);
  --offerings-accent: rgba(170, 205, 237, 0.74);
  --offerings-title: rgba(234, 244, 255, 0.96);
  --offerings-subtitle: rgba(194, 216, 238, 0.82);
  --offerings-muted: rgba(194, 216, 238, 0.64);
  --offerings-shadow: 0 10px 22px rgba(0, 0, 0, 0.24);
}

.offerings-view__tabs {
  margin-bottom: 10px;
  padding: 4px;
  border: 1px solid var(--offerings-border);
  border-radius: 10px;
  background: var(--offerings-surface-soft);
}

.offerings-view__tabs :deep(.q-tab) {
  min-height: 36px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.offerings-view__tabs :deep(.q-tab--active) {
  background: var(--offerings-surface);
}

.offerings-view__tab-panels {
  position: relative;
  overflow: hidden;
  contain: layout paint;
  overscroll-behavior: contain;
}

.offerings-view__tab-panels :deep(.q-panel),
.offerings-view__tab-panels :deep(.q-panel.scroll) {
  overflow: hidden !important;
}

.offerings-view__tab-panels :deep(.q-panel > div),
.offerings-view__tab-panels :deep(.q-tab-panel) {
  overflow: hidden;
}

.offerings-view__panel {
  padding: 0;
  will-change: opacity, transform;
}

.offerings-view__category-shell {
  border: 1px solid var(--offerings-border);
  border-radius: 12px;
  background: var(--offerings-surface);
  box-shadow: var(--offerings-shadow);
  padding: 16px;
}

.offerings-view__category-heading {
  margin: 0 0 14px;
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--offerings-title);
  line-height: 1.25;
}

.offerings-view__subsection {
  border: 1px solid var(--offerings-divider);
  border-radius: 10px;
  background: var(--offerings-surface-subsection);
  padding: 12px;
}

.offerings-view__subsection + .offerings-view__subsection {
  margin-top: 12px;
}

.offerings-view__subcategory-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--offerings-subtitle);
}

.offerings-view__subcategory-heading::before {
  content: '';
  width: 4px;
  height: 0.95em;
  border-radius: 999px;
  background: var(--offerings-accent);
}

.offerings-view__subsection-content {
  margin-left: 8px;
  padding-left: 12px;
  border-left: 1px dashed var(--offerings-divider);
}

.offerings-view__subsection-content--plain {
  margin-left: 0;
  padding-left: 0;
  border-left: 0;
}

.offerings-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.offerings-view__empty-state,
.offerings-view__empty {
  margin: 0;
  color: var(--offerings-muted);
  font-style: italic;
}

.offerings-view__empty-state {
  border: 1px dashed var(--offerings-divider);
  border-radius: 10px;
  background: var(--offerings-surface-soft);
  padding: 12px 14px;
}

.offerings-view__single-category {
  padding: 2px 0;
}

.q-transition--offerings-switch-next-enter-active,
.q-transition--offerings-switch-next-leave-active,
.q-transition--offerings-switch-prev-enter-active,
.q-transition--offerings-switch-prev-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.q-transition--offerings-switch-next-leave-active,
.q-transition--offerings-switch-prev-leave-active {
  position: absolute;
  inset: 0;
  width: 100%;
  pointer-events: none;
}

.q-transition--offerings-switch-next-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.q-transition--offerings-switch-next-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.q-transition--offerings-switch-prev-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.q-transition--offerings-switch-prev-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (prefers-reduced-motion: reduce) {
  .q-transition--offerings-switch-next-enter-active,
  .q-transition--offerings-switch-next-leave-active,
  .q-transition--offerings-switch-prev-enter-active,
  .q-transition--offerings-switch-prev-leave-active {
    transition: none;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .offerings-view__category-shell {
    padding: 12px;
    border-radius: 10px;
  }

  .offerings-view__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .offerings-view__subsection {
    padding: 10px;
  }

  .offerings-view__subsection-content {
    margin-left: 4px;
    padding-left: 8px;
  }
}
</style>
