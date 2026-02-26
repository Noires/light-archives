<template>
  <div class="character-appearance">
    <section class="character-appearance__top">
      <section class="character-appearance__details page-edit-character__form-controls">
        <h6>Allgemeines</h6>
        <q-input readonly v-model="character.haircolor" label="Haarfarbe">
          <template #append>
            <div class="character-appearance__color-pair">
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.haircolorShade1 || character.haircolor) }"
                :style="colorDotStyle(character.haircolorShade1 || character.haircolor)"
              />
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.haircolorShade2) }"
                :style="colorDotStyle(character.haircolorShade2)"
              />
            </div>
          </template>
        </q-input>
        <q-input readonly v-model="character.eyecolor" label="Augenfarbe">
          <template #append>
            <div class="character-appearance__color-pair">
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.eyecolorShade1 || character.eyecolor) }"
                :style="colorDotStyle(character.eyecolorShade1 || character.eyecolor)"
              />
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.eyecolorShade2) }"
                :style="colorDotStyle(character.eyecolorShade2)"
              />
            </div>
          </template>
        </q-input>
        <q-input readonly v-model="character.skintone" label="Hautfarbe">
          <template #append>
            <div class="character-appearance__color-pair">
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.skintoneShade1 || character.skintone) }"
                :style="colorDotStyle(character.skintoneShade1 || character.skintone)"
              />
              <span
                class="character-appearance__color-dot"
                :class="{ 'character-appearance__color-dot--unknown': !resolveColor(character.skintoneShade2) }"
                :style="colorDotStyle(character.skintoneShade2)"
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

      <aside class="character-appearance__visual">
        <q-img
          v-if="character.avatar"
          :src="character.avatar"
          class="character-appearance__visual-image"
          fit="cover"
        />
        <div v-else class="character-appearance__visual-placeholder">Kein Profilbild</div>
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

.character-appearance__visual-placeholder {
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
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

.character-appearance__color-dot--unknown {
  background-image:
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.14) 0,
      rgba(0, 0, 0, 0.14) 3px,
      rgba(255, 255, 255, 0.85) 3px,
      rgba(255, 255, 255, 0.85) 6px
    );
}

body.body--dark .character-appearance__visual {
  border-color: rgba(141, 181, 223, 0.3);
  background: rgba(17, 24, 34, 0.8);
}

body.body--dark .character-appearance__visual-placeholder {
  color: rgba(213, 226, 240, 0.62);
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

  .character-appearance__visual-image,
  .character-appearance__visual-placeholder {
    min-height: 280px;
    height: 280px;
  }
}
</style>
