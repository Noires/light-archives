<template>
  <button
    type="button"
    class="reading-settings__trigger"
    :aria-expanded="open ? 'true' : 'false'"
    aria-haspopup="dialog"
    aria-label="Aa, Leseeinstellungen"
    title="Leseeinstellungen"
  >
    <span aria-hidden="true"><span class="reading-settings__a-small">A</span>a</span>
    <q-menu
      v-model="open"
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      class="reading-settings__menu"
    >
      <div class="reading-settings__panel" role="dialog" aria-label="Leseeinstellungen">
        <p class="reading-settings__label">Schriftgröße</p>
        <div class="reading-settings__row" role="group" aria-label="Schriftgröße">
          <!-- Names start with the visible glyphs (WCAG 2.5.3, voice control). -->
          <button
            type="button"
            class="reading-settings__option reading-settings__option--down"
            :disabled="sizeIndex <= 0"
            aria-label="A−, Schrift kleiner"
            @click="stepSize(-1)"
          >A−</button>
          <button
            type="button"
            class="reading-settings__option"
            :aria-pressed="fontSize === defaultSize ? 'true' : 'false'"
            aria-label="A, Standardgröße"
            @click="setSize(defaultSize)"
          >A</button>
          <button
            type="button"
            class="reading-settings__option reading-settings__option--up"
            :disabled="sizeIndex >= sizes.length - 1"
            aria-label="A+, Schrift größer"
            @click="stepSize(1)"
          >A+</button>
        </div>

        <p class="reading-settings__label">Lesefläche</p>
        <div class="reading-settings__surfaces" role="radiogroup" aria-label="Lesefläche">
          <button
            v-for="option in surfaceOptions"
            :key="option.value"
            type="button"
            role="radio"
            class="reading-settings__surface"
            :class="{ 'reading-settings__surface--active': effectiveSurface === option.value }"
            :aria-checked="effectiveSurface === option.value ? 'true' : 'false'"
            @click="$emit('update:surface', option.value)"
          >
            <q-icon :name="option.icon" size="16px" aria-hidden="true" />
            {{ option.label }}
          </button>
        </div>
      </div>
    </q-menu>
  </button>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { READER_DEFAULT_FONT_SIZE, READER_FONT_SIZES, ReaderSurface } from './reader-storage';

// Reading settings behind one quiet "Aa" button in the story byline (like
// e-readers): font size steps and the Pergament/Nacht surface. The page
// persists both settings; this component only emits.

class Props {
  fontSize = prop<number>({ default: READER_DEFAULT_FONT_SIZE });
  surface = prop<ReaderSurface | null>({ default: null });
}

@Options({
  name: 'StoryReadingSettings',
  emits: [ 'update:fontSize', 'update:surface' ],
})
export default class StoryReadingSettings extends Vue.with(Props) {
  readonly sizes = READER_FONT_SIZES;
  readonly defaultSize = READER_DEFAULT_FONT_SIZE;
  readonly surfaceOptions = [
    { value: 'pergament' as ReaderSurface, label: 'Pergament', icon: 'light_mode' },
    { value: 'nacht' as ReaderSurface, label: 'Nacht', icon: 'dark_mode' },
  ];

  open = false;

  get effectiveSurface(): ReaderSurface {
    return this.surface || (this.$q.dark.isActive ? 'nacht' : 'pergament');
  }

  get sizeIndex(): number {
    const index = this.sizes.indexOf(this.fontSize);
    return index === -1 ? this.sizes.indexOf(this.defaultSize) : index;
  }

  stepSize(delta: number) {
    const next = this.sizes[Math.min(this.sizes.length - 1, Math.max(0, this.sizeIndex + delta))];
    this.setSize(next);
  }

  setSize(size: number) {
    this.$emit('update:fontSize', size);
  }
}
</script>

<style lang="scss">
// Unscoped: the q-menu panel is teleported.
.reading-settings__trigger {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  padding: 0;
  font: 500 1.2rem/1 var(--font-body);
  color: var(--ink-muted);
  background: transparent;
  border: 1px solid var(--rule-soft);
  border-radius: 0;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-elpis), border-color var(--motion-fast) var(--ease-elpis), background-color var(--motion-fast) var(--ease-elpis);

  &:hover,
  &[aria-expanded='true'] {
    color: var(--ink-primary);
    background: var(--rule-tint);
    border-color: var(--rule-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -4px;
  }
}

.reading-settings__a-small {
  font-size: 0.78em;
}

.reading-settings__menu.q-menu {
  min-width: 232px;
  padding: 0;
  background: var(--surface-raised);
  border: 1px solid var(--rule-soft);
  border-top: 2px solid var(--rule-strong);
  border-radius: 0;
  box-shadow: 0 12px 28px rgba(43, 36, 24, 0.18);
}

body.body--dark .reading-settings__menu.q-menu {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
}

.reading-settings__panel {
  display: grid;
  gap: 8px;
  padding: 14px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
}

.reading-settings__label {
  margin: 0;
  font: 600 11px/16px var(--font-ui);
  letter-spacing: var(--ls-eyebrow, 0.08em);
  text-transform: uppercase;
  color: var(--ink-muted);

  & + .reading-settings__row,
  & + .reading-settings__surfaces {
    margin-bottom: 6px;
  }
}

.reading-settings__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: 1px solid var(--rule-soft);
}

.reading-settings__option,
.reading-settings__surface {
  min-height: 38px;
  padding: 0 10px;
  font: 600 14px/1 var(--font-ui);
  color: var(--ink-primary);
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rule-tint);
  }

  &:focus-visible {
    outline: 2px solid var(--glow-aether);
    outline-offset: -3px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
}

.reading-settings__option + .reading-settings__option {
  border-left: 1px solid var(--rule-soft);
}

.reading-settings__option--down {
  font-size: 12px;
}

.reading-settings__option--up {
  font-size: 17px;
}

.reading-settings__option[aria-pressed='true'] {
  background: var(--rule-tint);
  box-shadow: inset 0 -2px 0 var(--rule-strong);
}

.reading-settings__surfaces {
  display: grid;
  gap: 2px;
}

.reading-settings__surface {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  text-align: left;
}

.reading-settings__surface--active {
  background: var(--rule-tint);
  box-shadow: inset 3px 0 0 var(--rule-strong);
}
</style>
