<template>
  <div class="character-appearance">
    <section
      class="character-appearance__top"
      :class="{ 'character-appearance__top--without-visual': !hasAppearanceImage }"
    >
      <section class="character-appearance__details page-edit-character__form-controls">
        <h6>Allgemeines</h6>
        <q-input
          readonly
          v-model="character.haircolor"
          label="Haarfarbe"
          class="character-appearance__color-field"
          :input-style="colorFieldInputStyle(character.haircolor)"
        >
          <template #append>
            <div v-if="hairSelectedColors.length" class="character-appearance__color-pair">
              <span
                v-for="(color, index) in hairSelectedColors"
                :key="`hair-${index}`"
                class="character-appearance__color-dot"
                :style="colorDotStyle(color)"
              />
            </div>
          </template>
        </q-input>
        <q-input
          readonly
          v-model="character.eyecolor"
          label="Augenfarbe"
          class="character-appearance__color-field"
          :input-style="colorFieldInputStyle(character.eyecolor)"
        >
          <template #append>
            <div v-if="eyeSelectedColors.length" class="character-appearance__color-pair">
              <span
                v-for="(color, index) in eyeSelectedColors"
                :key="`eye-${index}`"
                class="character-appearance__color-dot"
                :style="colorDotStyle(color)"
              />
            </div>
          </template>
        </q-input>
        <q-input
          readonly
          v-model="character.skintone"
          label="Hautfarbe"
          class="character-appearance__color-field"
          :input-style="colorFieldInputStyle(character.skintone)"
        >
          <template #append>
            <div v-if="skinSelectedColors.length" class="character-appearance__color-pair">
              <span
                v-for="(color, index) in skinSelectedColors"
                :key="`skin-${index}`"
                class="character-appearance__color-dot"
                :style="colorDotStyle(color)"
              />
            </div>
          </template>
        </q-input>
        <q-input readonly v-model="character.build" label="Statur / Körperbau" />
        <q-input readonly v-model="character.height" label="Größe" />
        <q-input readonly v-model="character.weight" label="Gewicht" />
        <q-input readonly v-model="character.apparentage" label="Optisches Alter" />
        <q-input readonly v-model="character.voice" label="Stimme" />
        <q-input readonly v-model="character.specialfeatures" label="Besonderheiten" />
      </section>

      <aside v-if="hasAppearanceImage" class="character-appearance__visual">
        <q-img :src="appearanceImageUrl" class="character-appearance__visual-image" fit="cover" />
      </aside>
    </section>

    <h6>Erscheinungsbild</h6>
    <html-viewer :content="character.appearance" />

    <h6>Äther</h6>
    <html-viewer :content="character.aether" />
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { Options, prop, Vue } from 'vue-class-component';
import HtmlViewer from '../common/HtmlViewer.vue';

class Props {
  character = prop<CharacterProfileDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  components: {
    HtmlViewer,
  },
})
export default class CharacterAppearance extends Vue.with(Props) {
  private textMeasureElement: HTMLSpanElement | null = null;

  get hairSelectedColors() {
    return this.getSelectedColors(this.character.haircolorShade1, this.character.haircolorShade2);
  }

  get eyeSelectedColors() {
    return this.getSelectedColors(this.character.eyecolorShade1, this.character.eyecolorShade2);
  }

  get skinSelectedColors() {
    return this.getSelectedColors(this.character.skintoneShade1, this.character.skintoneShade2);
  }

  get appearanceImageUrl(): string {
    const character = this.character as CharacterProfileDto & {
      appearanceImage?: { url?: string } | null;
    };
    const url = character.appearanceImage?.url;
    return typeof url === 'string' ? url : '';
  }

  get hasAppearanceImage() {
    return !!this.appearanceImageUrl;
  }

  resolveColor(rawColor?: string | null): string | null {
    const value = (rawColor || '').trim();
    if (!value) {
      return null;
    }

    const hexMatch = value.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/);
    if (hexMatch) {
      return hexMatch[0];
    }

    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', value)) {
      return value;
    }

    return null;
  }

  colorDotStyle(rawColor?: string | null) {
    const resolved = this.resolveColor(rawColor);
    if (!resolved) {
      return undefined;
    }

    return {
      backgroundColor: resolved,
    };
  }

  private getSelectedColors(...rawColors: Array<string | null | undefined>) {
    return rawColors
      .map((rawColor) => this.resolveColor(rawColor))
      .filter((color): color is string => !!color);
  }

  beforeUnmount() {
    if (this.textMeasureElement?.parentElement) {
      this.textMeasureElement.parentElement.removeChild(this.textMeasureElement);
    }

    this.textMeasureElement = null;
  }

  private getTextWidthPx(text: string): number {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return text.length * 8;
    }

    if (!this.textMeasureElement) {
      const element = document.createElement('span');
      element.style.position = 'absolute';
      element.style.visibility = 'hidden';
      element.style.pointerEvents = 'none';
      element.style.whiteSpace = 'pre';
      element.style.left = '-10000px';
      element.style.top = '-10000px';
      document.body.appendChild(element);
      this.textMeasureElement = element;
    }

    const sampleInput = document.querySelector<HTMLElement>('.character-appearance__color-field .q-field__native');
    const sampleStyle = sampleInput ? window.getComputedStyle(sampleInput) : window.getComputedStyle(document.body);
    this.textMeasureElement.style.font = sampleStyle.font;
    this.textMeasureElement.style.letterSpacing = sampleStyle.letterSpacing;
    this.textMeasureElement.style.textTransform = sampleStyle.textTransform;
    this.textMeasureElement.textContent = text || ' ';

    return this.textMeasureElement.getBoundingClientRect().width;
  }

  colorFieldInputStyle(rawText?: string | null) {
    const text = rawText || '';
    const measuredWidth = this.getTextWidthPx(text);
    const width = Math.max(56, Math.ceil(measuredWidth + 10));

    return {
      width: `${width}px`,
      maxWidth: '100%',
    };
  }
}
</script>

<style lang="scss">
.character-appearance__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 36%);
  gap: 16px;
  align-items: start;
  margin-bottom: 20px;
}

.character-appearance__top--without-visual {
  grid-template-columns: minmax(0, 1fr);
}

.character-appearance__details {
  max-width: none;
}

.character-appearance__visual {
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  overflow: hidden;
  min-height: 420px;
  background: rgba(246, 241, 232, 0.8);
}

.character-appearance__visual-image {
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.character-appearance__color-dot {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
}

.character-appearance__color-pair {
  display: inline-flex;
  gap: 6px;
}

.character-appearance__color-field .q-field__control-container {
  flex: 0 1 auto;
  min-width: 0;
}

.character-appearance__color-field .q-field__control {
  justify-content: flex-start;
}

.character-appearance__color-field .q-field__control-container.col {
  flex: 0 1 auto;
}

.character-appearance__color-field .q-field__native,
.character-appearance__color-field .q-field__input {
  width: auto;
  min-width: 6ch;
}

.character-appearance__color-field .q-field__append {
  padding-left: 8px;
}

body.body--dark .character-appearance__visual {
  border-color: rgba(141, 181, 223, 0.3);
  background: rgba(17, 24, 34, 0.8);
}

body.body--dark .character-appearance__color-dot {
  border-color: rgba(213, 226, 240, 0.44);
  box-shadow: 0 0 0 2px rgba(10, 15, 24, 0.86);
}

@media screen and (max-width: $breakpoint-md) {
  .character-appearance__top {
    grid-template-columns: minmax(0, 1fr);
  }

  .character-appearance__visual {
    min-height: 280px;
  }

  .character-appearance__visual-image {
    min-height: 280px;
    height: 280px;
  }
}
</style>
