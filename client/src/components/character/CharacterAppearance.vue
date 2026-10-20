<template>
  <div class="character-appearance">
    <section
      class="character-appearance__top"
      :class="{ 'character-appearance__top--without-visual': !hasAppearanceImage }"
    >
      <section class="character-appearance__details page-edit-character__form-controls">
        <template v-if="showGeneral">
          <h6 aria-level="2">Allgemeines</h6>
          <character-text-field
            v-for="field in colorFields"
            :key="field.label"
            :label="field.label"
            :value="field.value"
            :owner="owner"
          >
            <template #append>
              <span v-if="field.colors.length" class="character-appearance__color-pair">
                <span
                  v-for="(color, index) in field.colors"
                  :key="`${field.label}-${index}`"
                  class="character-appearance__color-dot"
                  :style="colorDotStyle(color)"
                />
              </span>
            </template>
          </character-text-field>
          <character-text-field
            v-for="field in generalFields"
            :key="field.label"
            :label="field.label"
            :value="field.value"
            :owner="owner"
          />
        </template>
      </section>

      <aside v-if="hasAppearanceImage" class="character-appearance__visual">
        <q-img :src="appearanceImageUrl" alt="Erscheinungsbild" class="character-appearance__visual-image" fit="cover" />
      </aside>
    </section>

    <template v-if="owner || !isEmpty(character.appearance)">
      <h6 aria-level="2">Erscheinungsbild</h6>
      <p v-if="isEmpty(character.appearance)" class="character-appearance__empty">{{ emptyLabel }}</p>
      <html-viewer v-else :content="character.appearance" />
    </template>

    <template v-if="owner || !isEmpty(character.aether)">
      <h6 aria-level="2">Äther</h6>
      <p v-if="isEmpty(character.aether)" class="character-appearance__empty">{{ emptyLabel }}</p>
      <html-viewer v-else :content="character.aether" />
    </template>
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { Options, prop, Vue } from 'vue-class-component';
import HtmlViewer from '../common/HtmlViewer.vue';
import CharacterTextField from './CharacterTextField.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';

type AppearanceField = { label: string; value?: string };
type ColorField = AppearanceField & { colors: string[] };

class Props {
  character = prop<CharacterProfileDto>({
    required: true,
  });

  preview = prop<boolean>({ type: Boolean,
    default: false,
  });
}

@Options({
  components: {
    CharacterTextField,
    HtmlViewer,
  },
})
export default class CharacterAppearance extends Vue.with(Props) {
  readonly emptyLabel = EMPTY_FIELD_LABEL;

  get owner(): boolean {
    return this.preview || !!this.character.mine;
  }

  get colorFields(): ColorField[] {
    const c = this.character;
    return [
      { label: 'Haarfarbe', value: c.haircolor, colors: this.hairSelectedColors },
      { label: 'Augenfarbe', value: c.eyecolor, colors: this.eyeSelectedColors },
      { label: 'Hautfarbe', value: c.skintone, colors: this.skinSelectedColors },
    ];
  }

  get generalFields(): AppearanceField[] {
    const c = this.character;
    return [
      { label: 'Statur / Körperbau', value: c.build },
      { label: 'Größe', value: c.height },
      { label: 'Gewicht', value: c.weight },
      { label: 'Optisches Alter', value: c.apparentage },
      { label: 'Stimme', value: c.voice },
      { label: 'Besonderheiten', value: c.specialfeatures },
    ];
  }

  get showGeneral(): boolean {
    return this.owner || [...this.colorFields, ...this.generalFields].some((field) => !isEmptyFieldValue(field.value));
  }

  isEmpty(value?: string): boolean {
    return isEmptyFieldValue(value);
  }

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

.character-appearance__empty {
  color: var(--ink-muted);
  font-style: italic;
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
