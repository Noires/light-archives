<template>
  <section v-if="cards.length" class="focus-items" :aria-labelledby="headingId">
    <h2 :id="headingId" class="focus-items__heading">{{ title }}</h2>
    <ul class="focus-items__grid">
      <li v-for="(item, index) in cards" :key="`${index}-${item.title}`" class="focus-items__card">
        <span class="focus-items__icon" aria-hidden="true">
          <q-icon :name="item.icon || 'category'" size="22px" />
        </span>
        <h3 class="focus-items__title">{{ item.title }}</h3>
        <p v-if="item.text" class="focus-items__text">{{ item.text }}</p>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import type { FocusItem } from '@app/shared/validation/profile-fields';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — "Was wir spielen": focus cards (icon, title, text) of a free
// company or community. Renders nothing without items (older API).

let counter = 0;

class Props {
  items = prop<FocusItem[] | null | undefined>({ default: null });
  title = prop<string>({ default: 'Was wir spielen' });
}

@Options({ name: 'FocusItems' })
export default class FocusItems extends Vue.with(Props) {
  readonly headingId = `focus-items-${++counter}`;

  get cards(): FocusItem[] {
    return Array.isArray(this.items) ? this.items.filter((item) => item && item.title) : [];
  }
}
</script>

<style lang="scss" scoped>
.focus-items__heading {
  text-align: left;
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.focus-items__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.focus-items__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.focus-items__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: var(--rule-tint);
  color: var(--ink-link);
}

.focus-items__title {
  text-align: left;
  margin: 4px 0 0;
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: 16px;
  line-height: 1.35;
  letter-spacing: 0;
  color: var(--ink-primary);
  overflow-wrap: anywhere;
}

.focus-items__text {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-muted);
  overflow-wrap: anywhere;
}
</style>
