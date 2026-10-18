<!-- ER2 round 2 — editor for the "Was wir spielen" cards of free companies and communities.
  v-model: FocusItemDto[] | null | undefined (max 6 items of {icon, title, text}; items without
  a title are dropped by the server). `icon` is a Material icon name. -->

<template>
  <section class="focus-items-edit">
    <h6 class="focus-items-edit__heading">Was wir spielen</h6>
    <p class="focus-items-edit__intro">
      Bis zu {{ maxItems }} Karten, die zeigen, was ihr gemeinsam spielt – zum Beispiel Raids, Taverne oder Abenteuer-RP.
    </p>
    <div
      v-for="(item, index) in items"
      :key="index"
      class="focus-items-edit__item"
    >
      <div class="focus-items-edit__row">
        <q-select
          class="focus-items-edit__icon"
          :model-value="item.icon"
          @update:model-value="update(index, 'icon', $event)"
          :options="iconOptions"
          label="Symbol"
          emit-value
          map-options
          clearable
        >
          <template v-slot:prepend>
            <q-icon :name="item.icon || 'category'" />
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar><q-icon :name="scope.opt.value" /></q-item-section>
              <q-item-section>{{ scope.opt.label }}</q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-input
          class="focus-items-edit__title"
          :model-value="item.title"
          @update:model-value="update(index, 'title', $event)"
          label="Titel *"
          :maxlength="titleMax"
          :rules="[(v: string) => !!(v && v.trim()) || 'Bitte gib einen Titel ein.']"
        />
        <q-btn
          flat
          round
          icon="delete"
          color="negative"
          :aria-label="`Karte ${index + 1} entfernen`"
          @click="remove(index)"
        />
      </div>
      <q-input
        :model-value="item.text"
        @update:model-value="update(index, 'text', $event)"
        label="Beschreibung"
        type="textarea"
        autogrow
        :maxlength="textMax"
        counter
      />
    </div>
    <q-btn
      v-if="items.length < maxItems"
      outline
      color="secondary"
      icon="add"
      label="Karte hinzufügen"
      @click="add"
    />
  </section>
</template>

<script lang="ts">
import {
  FOCUS_ITEM_TEXT_MAX_LENGTH,
  FOCUS_ITEM_TITLE_MAX_LENGTH,
  FOCUS_ITEMS_MAX,
  FocusItemDto,
} from '@app/shared/validation/profile-fields';
import { Options, Vue, prop } from 'vue-class-component';

class Props {
  modelValue = prop<FocusItemDto[] | null | undefined>({ required: false });
}

@Options({
  emits: ['update:model-value'],
})
export default class FocusItemsEditSection extends Vue.with(Props) {
  readonly maxItems = FOCUS_ITEMS_MAX;
  readonly titleMax = FOCUS_ITEM_TITLE_MAX_LENGTH;
  readonly textMax = FOCUS_ITEM_TEXT_MAX_LENGTH;

  readonly iconOptions = [
    { label: 'Kampf & Raids', value: 'swords' },
    { label: 'Taverne & Geselligkeit', value: 'local_bar' },
    { label: 'Abenteuer', value: 'explore' },
    { label: 'Geschichten & Lore', value: 'auto_stories' },
    { label: 'Handwerk & Sammeln', value: 'construction' },
    { label: 'Handel', value: 'storefront' },
    { label: 'Musik & Auftritte', value: 'music_note' },
    { label: 'Intrige & Politik', value: 'theater_comedy' },
    { label: 'Glaube & Magie', value: 'auto_awesome' },
    { label: 'Gemeinschaft', value: 'groups' },
    { label: 'Events', value: 'celebration' },
    { label: 'Housing', value: 'cottage' },
  ];

  get items(): FocusItemDto[] {
    return this.modelValue || [];
  }

  private emitItems(items: FocusItemDto[]) {
    this.$emit('update:model-value', items);
  }

  update(index: number, field: keyof FocusItemDto, value: string | null) {
    this.emitItems(this.items.map((item, i) => (i === index ? { ...item, [field]: value || '' } : item)));
  }

  add() {
    this.emitItems([...this.items, { icon: '', title: '', text: '' }]);
  }

  remove(index: number) {
    this.emitItems(this.items.filter((_, i) => i !== index));
  }
}
</script>

<style lang="scss" scoped>
.focus-items-edit {
  max-width: 640px;
  margin: 16px 0;
}

.focus-items-edit__intro {
  color: var(--ink-muted, #6b5d44);
  margin-bottom: 8px;
}

.focus-items-edit__item {
  border-left: 3px solid var(--rule-gold, #ba9b5b);
  padding: 4px 0 8px 12px;
  margin-bottom: 16px;
}

.focus-items-edit__row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.focus-items-edit__icon {
  flex: 0 1 220px;
  min-width: 160px;
}

.focus-items-edit__title {
  flex: 1 1 200px;
}

:global(body.body--dark) .focus-items-edit__item {
  border-left-color: var(--rule-arcane, #b8a5ff);
}
</style>
