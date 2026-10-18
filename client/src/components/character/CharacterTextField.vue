<template>
  <div
    v-if="visible"
    class="character-text-field"
    :class="{ 'character-text-field--empty': empty }"
  >
    <div class="character-text-field__label">{{ label }}</div>
    <div class="character-text-field__value">
      <span v-if="empty" class="character-text-field__placeholder">{{ emptyLabel }}</span>
      <link-field v-else :content="value" />
      <slot name="append" />
    </div>
  </div>
</template>

<script lang="ts">
// ER2-010 / ER2-112 — readonly character field: label above value, the value
// rendered through LinkField so [[Name]] / [[Name|Label]] become links.
// Replaces the readonly q-input, which showed wikilinks as raw text.
// Empty or placeholder values ("(FOLGT)") are hidden for visitors; the owner
// sees them as "Noch leer".
import { Options, prop, Vue } from 'vue-class-component';
import LinkField from '../common/LinkField.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';

class Props {
  label = prop<string>({
    required: true,
  });

  value = prop<string | null>({
    required: false,
    default: '',
  });

  owner = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'CharacterTextField',
  components: {
    LinkField,
  },
})
export default class CharacterTextField extends Vue.with(Props) {
  readonly emptyLabel = EMPTY_FIELD_LABEL;

  get empty(): boolean {
    return isEmptyFieldValue(this.value);
  }

  get visible(): boolean {
    return this.owner || !this.empty;
  }
}
</script>

<style lang="scss">
// Mirrors the ELPIS-207 readonly field look (raised surface, soft rule,
// stronger rule on hover) with theme-neutral role tokens.
.character-text-field {
  margin-bottom: 8px;
  padding: 6px 12px 8px;
  border: 1px solid var(--rule-soft);
  border-radius: 4px;
  background-color: var(--surface-raised);
  transition: border-color var(--motion-fast) var(--ease-elpis);
}

.character-text-field:hover {
  border-color: var(--rule-strong);
}

.character-text-field__label {
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-muted);
}

.character-text-field__value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  color: var(--ink-primary);
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.character-text-field__value > span:first-child {
  flex: 0 1 auto;
  min-width: 0;
}

.character-text-field__placeholder {
  color: var(--ink-muted);
  font-style: italic;
}
</style>
