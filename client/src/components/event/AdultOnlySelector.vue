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
}

.adult-only-selector--soft {
  border: 1px solid rgba(221, 180, 118, 0.32);
  background: rgba(250, 246, 239, 0.95);
}

.adult-only-selector--glass {
  border: 1px solid rgba(120, 120, 120, 0.24);
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(6px);
}

.adult-only-selector--minimal {
  border: 1px solid rgba(120, 120, 120, 0.18);
  background: #fff;
}

.adult-only-selector__option {
  min-height: 30px;
  padding: 0 10px;
  color: rgba(40, 40, 40, 0.72);
  border: 1px solid transparent;
  background: transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.adult-only-selector__option:hover {
  border-color: rgba(221, 180, 118, 0.45);
  background: rgba(221, 180, 118, 0.14);
}

.adult-only-selector__option_active {
  color: #1f2c38;
}

.adult-only-selector__option_active-no {
  border-color: rgba(96, 140, 193, 0.52);
  background: rgba(90, 138, 196, 0.18);
}

.adult-only-selector__option_active-yes {
  border-color: rgba(227, 181, 109, 0.62);
  background: rgba(227, 181, 109, 0.26);
}

.adult-only-selector__option_active .q-icon {
  color: #4d5560;
}

.adult-only-selector__option_active-yes .q-icon {
  color: #8a5a13;
}
</style>
