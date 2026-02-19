<template>
  <div
    class="adult-only-selector"
    :class="`adult-only-selector--${variant}`"
    role="radiogroup"
    aria-label="18+ selection"
  >
    <q-btn
      no-caps
      unelevated
      dense
      class="adult-only-selector__option"
      :class="{
        'adult-only-selector__option_active': !modelValue,
        'adult-only-selector__option_active-no': !modelValue,
      }"
      :icon="noIcon"
      :label="noLabel"
      @click="setValue(false)"
    />
    <q-btn
      no-caps
      unelevated
      dense
      class="adult-only-selector__option"
      :class="{
        'adult-only-selector__option_active': modelValue,
        'adult-only-selector__option_active-yes': modelValue,
      }"
      :icon="yesIcon"
      :label="yesLabel"
      @click="setValue(true)"
    />
  </div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  modelValue = prop<boolean>({
    default: false,
  });

  noLabel = prop<string>({
    default: 'Nein',
  });

  yesLabel = prop<string>({
    default: 'Ja',
  });

  noIcon = prop<string>({
    default: 'no_adult_content',
  });

  yesIcon = prop<string>({
    default: '18_up_rating',
  });

  variant = prop<string>({
    default: 'soft',
  });
}

@Options({
  name: 'AdultOnlySelector',
  emits: ['update:modelValue'],
})
export default class AdultOnlySelector extends Vue.with(Props) {
  setValue(value: boolean) {
    this.$emit('update:modelValue', value);
  }
}
</script>

<style lang="scss">
.adult-only-selector {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px;
  --adult-selector-soft-border: rgba(221, 180, 118, 0.32);
  --adult-selector-soft-bg: rgba(250, 246, 239, 0.95);
  --adult-selector-glass-border: rgba(120, 120, 120, 0.24);
  --adult-selector-glass-bg: rgba(255, 255, 255, 0.68);
  --adult-selector-minimal-border: rgba(120, 120, 120, 0.18);
  --adult-selector-minimal-bg: #fff;
  --adult-selector-option-color: rgba(40, 40, 40, 0.72);
  --adult-selector-hover-border: rgba(221, 180, 118, 0.45);
  --adult-selector-hover-bg: rgba(221, 180, 118, 0.14);
  --adult-selector-active-color: #1f2c38;
  --adult-selector-active-no-border: rgba(96, 140, 193, 0.52);
  --adult-selector-active-no-bg: rgba(90, 138, 196, 0.18);
  --adult-selector-active-yes-border: rgba(227, 181, 109, 0.62);
  --adult-selector-active-yes-bg: rgba(227, 181, 109, 0.26);
  --adult-selector-active-icon: #4d5560;
  --adult-selector-active-yes-icon: #8a5a13;
}

body.body--dark .adult-only-selector {
  --adult-selector-soft-border: rgba(141, 181, 223, 0.36);
  --adult-selector-soft-bg: rgba(16, 24, 35, 0.94);
  --adult-selector-glass-border: rgba(141, 181, 223, 0.3);
  --adult-selector-glass-bg: rgba(18, 27, 40, 0.76);
  --adult-selector-minimal-border: rgba(141, 181, 223, 0.26);
  --adult-selector-minimal-bg: rgba(12, 20, 31, 0.94);
  --adult-selector-option-color: rgba(213, 226, 240, 0.8);
  --adult-selector-hover-border: rgba(141, 181, 223, 0.46);
  --adult-selector-hover-bg: rgba(141, 181, 223, 0.2);
  --adult-selector-active-color: rgba(226, 237, 248, 0.98);
  --adult-selector-active-no-border: rgba(141, 181, 223, 0.58);
  --adult-selector-active-no-bg: rgba(90, 125, 166, 0.34);
  --adult-selector-active-yes-border: rgba(141, 181, 223, 0.6);
  --adult-selector-active-yes-bg: rgba(141, 181, 223, 0.28);
  --adult-selector-active-icon: rgba(213, 226, 240, 0.86);
  --adult-selector-active-yes-icon: rgba(226, 237, 248, 0.96);
}

.adult-only-selector--soft {
  border: 1px solid var(--adult-selector-soft-border);
  background: var(--adult-selector-soft-bg);
}

.adult-only-selector--glass {
  border: 1px solid var(--adult-selector-glass-border);
  background: var(--adult-selector-glass-bg);
  backdrop-filter: blur(6px);
}

.adult-only-selector--minimal {
  border: 1px solid var(--adult-selector-minimal-border);
  background: var(--adult-selector-minimal-bg);
}

.adult-only-selector__option {
  min-height: 30px;
  padding: 0 10px;
  color: var(--adult-selector-option-color);
  border: 1px solid transparent;
  background: transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.adult-only-selector__option:hover {
  border-color: var(--adult-selector-hover-border);
  background: var(--adult-selector-hover-bg);
}

.adult-only-selector__option_active {
  color: var(--adult-selector-active-color);
}

.adult-only-selector__option_active-no {
  border-color: var(--adult-selector-active-no-border);
  background: var(--adult-selector-active-no-bg);
}

.adult-only-selector__option_active-yes {
  border-color: var(--adult-selector-active-yes-border);
  background: var(--adult-selector-active-yes-bg);
}

.adult-only-selector__option_active .q-icon {
  color: var(--adult-selector-active-icon);
}

.adult-only-selector__option_active-yes .q-icon {
  color: var(--adult-selector-active-yes-icon);
}
</style>
