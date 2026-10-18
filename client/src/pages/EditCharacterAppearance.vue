<template>
<template v-if="character.id">
      <div class="page-edit-character__header">
        <h2>Aussehen bearbeiten</h2>
        <q-btn outline color="secondary" @click="onWikiImportClick" icon="download" label="Wiki Import" />
      </div>
      <q-form @submit="onSubmit">
        <template v-if="!preview">
          <section class="page-edit-character__top-grid">
          <section class="page-edit-character__form-controls">
            <h6>Allgemeines</h6>
            <q-input
              @update:model-value="onChange"
              v-model="character.haircolor"
              label="Haarfarbe"
              class="page-edit-character__color-field"
              :input-style="colorFieldInputStyle(character.haircolor)"
            >
              <template #append>
                <div class="page-edit-character__color-pair">
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.haircolorShade1 }" :style="colorButtonStyle(character.haircolorShade1)" aria-label="Farbe wählen: Haarfarbe, Ton 1">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.haircolorShade1)"
                          format-model="hex"
                          @update:model-value="onColorPicked('haircolorShade1', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.haircolorShade1"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Haarfarbe, Ton 1"
                      @click="onColorCleared('haircolorShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.haircolorShade2 }" :style="colorButtonStyle(character.haircolorShade2)" aria-label="Farbe wählen: Haarfarbe, Ton 2">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.haircolorShade2)"
                          format-model="hex"
                          @update:model-value="onColorPicked('haircolorShade2', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.haircolorShade2"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Haarfarbe, Ton 2"
                      @click="onColorCleared('haircolorShade2')"
                    />
                  </div>
                </div>
              </template>
            </q-input>
            <q-input
              @update:model-value="onChange"
              v-model="character.eyecolor"
              label="Augenfarbe"
              class="page-edit-character__color-field"
              :input-style="colorFieldInputStyle(character.eyecolor)"
            >
              <template #append>
                <div class="page-edit-character__color-pair">
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.eyecolorShade1 }" :style="colorButtonStyle(character.eyecolorShade1)" aria-label="Farbe wählen: Augenfarbe, Ton 1">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.eyecolorShade1)"
                          format-model="hex"
                          @update:model-value="onColorPicked('eyecolorShade1', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.eyecolorShade1"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Augenfarbe, Ton 1"
                      @click="onColorCleared('eyecolorShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.eyecolorShade2 }" :style="colorButtonStyle(character.eyecolorShade2)" aria-label="Farbe wählen: Augenfarbe, Ton 2">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.eyecolorShade2)"
                          format-model="hex"
                          @update:model-value="onColorPicked('eyecolorShade2', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.eyecolorShade2"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Augenfarbe, Ton 2"
                      @click="onColorCleared('eyecolorShade2')"
                    />
                  </div>
                </div>
              </template>
            </q-input>
            <q-input
              @update:model-value="onChange"
              v-model="character.skintone"
              label="Hautfarbe"
              class="page-edit-character__color-field"
              :input-style="colorFieldInputStyle(character.skintone)"
            >
              <template #append>
                <div class="page-edit-character__color-pair">
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.skintoneShade1 }" :style="colorButtonStyle(character.skintoneShade1)" aria-label="Farbe wählen: Hautton, Ton 1">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.skintoneShade1)"
                          format-model="hex"
                          @update:model-value="onColorPicked('skintoneShade1', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.skintoneShade1"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Hautton, Ton 1"
                      @click="onColorCleared('skintoneShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :class="{ 'page-edit-character__color-picker-btn--empty': !character.skintoneShade2 }" :style="colorButtonStyle(character.skintoneShade2)" aria-label="Farbe wählen: Hautton, Ton 2">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
                          class="crystal-color-picker"
                          :model-value="pickerColor(character.skintoneShade2)"
                          format-model="hex"
                          @update:model-value="onColorPicked('skintoneShade2', $event)"
                        />
                      </q-popup-proxy>
                    </q-btn>
                    <q-btn
                      v-if="character.skintoneShade2"
                      dense
                      flat
                      round
                      icon="close"
                      size="xs"
                      class="page-edit-character__color-clear-btn"
                      aria-label="Farbe entfernen: Hautton, Ton 2"
                      @click="onColorCleared('skintoneShade2')"
                    />
                  </div>
                </div>
              </template>
            </q-input>
            <q-input @update:model-value="onChange" v-model="character.build" label="Statur / Körperbau" />
            <q-input @update:model-value="onChange" v-model="character.height" label="Größe" />
            <q-input @update:model-value="onChange" v-model="character.weight" label="Gewicht" />
            <q-input @update:model-value="onChange" v-model="character.apparentage" label="Optisches Alter" />
            <q-input @update:model-value="onChange" v-model="character.voice" label="Stimme" />
            <q-input @update:model-value="onChange" v-model="character.specialfeatures" label="Besonderheiten" />
          </section>
          <section class="page-edit-character__appearance-image-section">
            <h6>Charakterbild</h6>
            <p class="text-caption">
              Optionales großes Bild für den Aussehen-Bereich. Du kannst ein vorhandenes Bild auswählen
              oder wie gewohnt per Dialog hochladen und zuschneiden.
            </p>
            <div class="page-edit-character__appearance-media">
              <q-img
                v-if="character.appearanceImage"
                class="page-edit-character__appearance-image"
                :src="character.appearanceImage.url"
                fit="cover"
              />
              <div v-else class="page-edit-character__appearance-image-placeholder">Kein Charakterbild</div>
            </div>
            <div class="text-right">
              <q-btn
                v-if="character.appearanceImage"
                flat
                label="Entfernen"
                icon="remove"
                color="negative"
                @click="onAppearanceImageRemoveClick"
              />&nbsp;
              <q-btn flat label="Auswählen" icon="collections" color="secondary" @click="onAppearanceImageSelectClick" />&nbsp;
              <q-btn flat label="Hochladen" icon="upload" color="secondary" @click="onAppearanceImageUploadClick" />
            </div>
          </section>
          </section>
          <h6>Erscheinungsbild</h6>
          <html-editor @update:model-value="onChange" v-model="character.appearance" />
          <h6>Äther</h6>
          <html-editor @update:model-value="onChange" v-model="character.aether" />
        </template>
        <section v-else class="page-edit-character__preview">
          <character-appearance :character="character" :preview="true" />
        </section>
        <div class="page-edit-character__button-bar">
          <q-btn-toggle v-model="preview" :options="previewOptions" toggle-color="secondary" />
          <div class="page-edit-character__revert-submit">
            <q-btn label="Zurücksetzen" color="secondary" @click="onRevertClick" />&nbsp;
            <q-btn label="Änderungen speichern" type="submit" color="primary" v-elpis-save-pulse="savePulseTrigger" />
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card class="mat-aetherglass elevation-3 revert-confirm-dialog">
        <q-card-section class="row items-center">
          <span class="q-ml-sm">Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Bearbeitung fortsetzen" color="secondary" v-close-popup />
          <q-btn flat label="Zurücksetzen" color="negative" v-close-popup @click="onConfirmRevert" />
        </q-card-actions>
      </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { BannerDto } from '@app/shared/dto/characters/banner.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { CharacterRefreshResultDto } from '@app/shared/dto/characters/character-refresh-result.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CarrdEditSection from 'src/components/common/CarrdEditSection.vue';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import HtmlEditor from '../components/common/HtmlEditor.vue';
import { ref } from 'vue';
import { Dialog } from 'quasar';
import CharacterAppearance from 'src/components/character/CharacterAppearance.vue';
import type { ParsedCharacterData } from 'src/common/wiki-import';

const $api = useApi();
type CharacterColorField =
  | 'haircolorShade1'
  | 'haircolorShade2'
  | 'eyecolorShade1'
  | 'eyecolorShade2'
  | 'skintoneShade1'
  | 'skintoneShade2';

async function load(params: RouteParams): Promise<CharacterProfileDto> {
  const id = parseInt(params.id as string, 10);

  const $store = useStore();
  const character = $store.state.user!.characters.get(id)!;

  try {
    return await $api.characters.getCharacterProfile(character.name, character.server);
  } catch (e) {
    notifyError(e);
    throw e;
  }
}

@Options({
  components: {
    HtmlEditor,
    CharacterAppearance,
    BannerEditSection,
    CarrdEditSection,
  },
  async beforeRouteEnter(to, _, next) {
    const character = await load(to.params);
    next((vm) => (vm as PageEditProfile).setContent(character));
  },
  beforeRouteLeave(to, from, next) {
    if ((this as PageEditProfile).isDirty) {
      Dialog.create({
        title: 'Warnung',
        message: 'Ungespeicherte Änderungen gehen verloren. Möchtest du fortfahren?',
        ok: {
          push: true,
          label: 'Ok'
        },
        cancel: {
          push: true,
          color: 'secondary',
          label: 'Abbrechen'
        }
      }).onOk(() => {
        next();
      }).onCancel(() => {
        next(false);
      }).onDismiss(() => {
        next(false);
      });
    }
    else
    {
      next();
    }
  },
  emits: ['updateCharacter']
})
export default class PageEditProfile extends Vue {
  readonly SharedConstants = SharedConstants;
  readonly APPEARANCE_IMAGE_ASPECT_RATIO = 2 / 3;
  private textMeasureElement: HTMLSpanElement | null = null;

  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  character = new CharacterProfileDto();
  characterBackup = new CharacterProfileDto();
  preview = false;
  saving = false;
  confirmRevert = false;
  drawer = ref(false);
  miniState = true;
  isDirty = false;
  savePulseTrigger = 0;

  setContent(character: CharacterProfileDto) {
    this.characterBackup = character;
    this.character = new CharacterProfileDto(this.characterBackup);
  }

  async onRefreshClick() {
    const RefreshCharacterDialog = (await import('src/components/character/RefreshCharacterDialog.vue')).default;

    this.$q
      .dialog({
        component: RefreshCharacterDialog,
        componentProps: {
          characterId: this.character.id,
          characterName: this.character.name,
        },
      })
      .onOk((characterData: CharacterRefreshResultDto) => {
        const { name, race, server, avatar } = characterData;
        Object.assign(this.character, { name, race, server, avatar });
      });
  }

  async onWikiImportClick() {
    const WikiImportDialog = (await import('src/components/character/WikiImportDialog.vue')).default;

    this.$q
      .dialog({
        component: WikiImportDialog,
        componentProps: {
          targetSection: 'appearance',
        },
      })
      .onOk((importedData: ParsedCharacterData) => {
        Object.assign(this.character, importedData);
        this.onChange();
      });
  }

  onChange() {
    this.isDirty = true;
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

  pickerColor(rawColor?: string | null): string {
    return this.resolveColor(rawColor) || '#7a7a7a';
  }

  colorButtonStyle(rawColor?: string | null) {
    const resolved = this.resolveColor(rawColor);
    if (!resolved) {
      return undefined;
    }

    return {
      backgroundColor: resolved,
      backgroundImage: 'none',
    };
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

    const sampleInput = document.querySelector<HTMLElement>('.page-edit-character__color-field .q-field__native');
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

  onColorPicked(field: CharacterColorField, color: string) {
    this.character[field] = color;
    this.onChange();
  }

  onColorCleared(field: CharacterColorField) {
    this.character[field] = '';
    this.onChange();
  }

  async onAppearanceImageSelectClick() {
    const GalleryDialog = (await import('components/common/GalleryDialog.vue')).default;

    this.$q
      .dialog({
        component: GalleryDialog,
        componentProps: {
          characterId: this.character.id,
          banner: true,
          minAspectRatio: this.APPEARANCE_IMAGE_ASPECT_RATIO,
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setAppearanceImage(image);
      });
  }

  async onAppearanceImageUploadClick() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q
      .dialog({
        component: UploadDialog,
        componentProps: {
          characterId: this.character.id,
          banner: true,
          minAspectRatio: this.APPEARANCE_IMAGE_ASPECT_RATIO,
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setAppearanceImage(image);
      });
  }

  onAppearanceImageRemoveClick() {
    if (!this.character.appearanceImage) {
      return;
    }

    this.character.appearanceImage = null;
    this.onChange();
  }

  setAppearanceImage(image: ImageSummaryDto) {
    this.character.appearanceImage = new BannerDto({
      id: image.id,
      url: image.url,
      width: image.width,
      height: image.height,
    });
    this.onChange();
  }

  onRevertClick() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.character = new CharacterProfileDto(this.characterBackup);
    this.isDirty = false;
  }

  async onSubmit() {
    this.saving = true;

    try {
      await this.$api.characters.saveCharacter(this.character);
      this.characterBackup = new CharacterProfileDto(this.character);
      this.savePulseTrigger++;

      notifySuccess('Charakter gespeichert.', {
        label: 'Anschauen',
        color: 'white',
        handler: () => this.viewCharacter(),
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
      this.isDirty = false;
    }
  }

  viewCharacter() {
    const name = this.character.name || '';
    const server = this.character.server || '';
    void this.$router.push(`/${server}/${name.replace(/ /g, '_')}`);
  }
}
</script>

<style lang="scss">
.page-edit-character__top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 36%);
  gap: 16px;
  align-items: start;
  margin-bottom: 20px;
}

.page-edit-character__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-character__color-pair {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.page-edit-character__color-control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.page-edit-character__color-field .q-field__control-container {
  flex: 0 1 auto;
  min-width: 0;
}

.page-edit-character__color-field .q-field__control {
  justify-content: flex-start;
}

.page-edit-character__color-field .q-field__control-container.col {
  flex: 0 1 auto;
}

.page-edit-character__color-field .q-field__native,
.page-edit-character__color-field .q-field__input {
  width: auto;
  min-width: 6ch;
}

.page-edit-character__color-field .q-field__append {
  padding-left: 8px;
}

// ER2-903: 24 px minimum target size.
.page-edit-character__color-picker-btn {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  border-radius: 999px;
  border: 1px solid var(--rule-gold);
  // Filled state: user-defined backgroundColor flows in via :style binding.
  // Crystal facet chrome stays subtle so the user's hue dominates.
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 0 0 2px var(--surface-pearl),
    0 1px 3px rgba(43, 36, 24, 0.18);
  transition:
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
}

.page-edit-character__color-picker-btn:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    0 0 0 2px var(--surface-pearl),
    0 2px 8px rgba(186, 155, 91, 0.32);
}

// Empty swatch — paints with the prism gradient + slow shimmer (mat-crystal),
// reading as a "facet awaiting a hue" rather than an inert checker pattern.
// The shimmer is throttled by --motion-ambient so reduced-motion zeroes it.
.page-edit-character__color-picker-btn--empty {
  background: var(--crystal-prism);
  background-size: 200% 200%;
  background-position: 0% 50%;
  animation: mat-crystal-shimmer calc(var(--motion-ambient) * 1.5) ease-in-out infinite;
}

.page-edit-character__color-clear-btn {
  // ER2-903: size="xs" would shrink the target below 24 px.
  min-width: 24px;
  min-height: 24px;
  color: var(--ink-muted, rgba(0, 0, 0, 0.58));
}

.page-edit-character__appearance-image-section {
  max-width: none;
  margin-top: 0;
  margin-bottom: 0;
}

.page-edit-character__appearance-media {
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  overflow: hidden;
  min-height: 420px;
  background: rgba(246, 241, 232, 0.8);
}

.page-edit-character__appearance-image {
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.page-edit-character__appearance-image-placeholder {
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6a7a8c;
  font-style: italic;
}

body.body--dark .page-edit-character__color-picker-btn {
  border-color: var(--rule-arcane);
  box-shadow:
    inset 0 1px 0 rgba(184, 165, 255, 0.32),
    0 0 0 2px var(--surface-deep),
    0 1px 3px rgba(0, 0, 0, 0.5);
}

body.body--dark .page-edit-character__color-picker-btn:hover {
  box-shadow:
    inset 0 1px 0 rgba(184, 165, 255, 0.44),
    0 0 0 2px var(--surface-deep),
    0 2px 8px rgba(184, 165, 255, 0.28);
}

body.body--dark .page-edit-character__color-clear-btn {
  color: rgba(236, 227, 247, 0.7);
}

body.body--dark .page-edit-character__appearance-media {
  border-color: rgba(141, 181, 223, 0.3);
  background: rgba(17, 24, 34, 0.8);
}

body.body--dark .page-edit-character__appearance-image-placeholder {
  color: #b0c0d1;
}

// Crystal frame around the q-color popup launched from the appearance swatches.
// Applied via class="crystal-color-picker" on the q-color element; the rule lives
// here (unscoped style block) so it reaches the popup body regardless of where
// q-popup-proxy teleports it. The ::before sweep is a one-shot prism wash that
// rides over the picker chrome on open, then fades out — the q-popup-proxy's
// own scale transition handles the geometry.
.q-color-picker.crystal-color-picker {
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 1px var(--rule-gold),
    inset 0 0 0 4px var(--rule-gold-soft),
    0 16px 40px rgba(43, 36, 24, 0.22);
  position: relative;
  overflow: hidden;
}

.q-color-picker.crystal-color-picker::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--crystal-prism);
  background-size: 200% 200%;
  mix-blend-mode: screen;
  opacity: 0.55;
  animation: crystal-color-picker-sweep var(--motion-cinematic) var(--ease-elpis) 1 forwards;
  z-index: 1;
  border-radius: inherit;
}

.q-color-picker.crystal-color-picker > * {
  position: relative;
  z-index: 2;
}

@keyframes crystal-color-picker-sweep {
  0%   { opacity: 0.55; background-position: 0% 50%; }
  60%  { opacity: 0.32; background-position: 100% 50%; }
  100% { opacity: 0;    background-position: 100% 50%; }
}

body.body--dark .q-color-picker.crystal-color-picker {
  box-shadow:
    inset 0 0 0 1px var(--rule-arcane),
    inset 0 0 0 4px var(--rule-arcane-soft),
    0 16px 40px rgba(0, 0, 0, 0.55);
}

body.body--dark .q-color-picker.crystal-color-picker::before {
  opacity: 0.4;
  mix-blend-mode: lighten;
}

.page-edit-character__lodestone-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-edit-character__checkbox .q-field__bottom {
  padding-top: 0;
}

.page-edit-character__preview {
  margin-bottom: 24px;
}

.page-edit-character__age, .page-edit-character__pronouns {
  width: 200px;
}

.page-edit-character__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-character__preview h6 {
  font-family: $header-font;
}

.page-edit-character__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    margin: 0;
  }
}

@media screen and (max-width: $breakpoint-md) {
  .page-edit-character__top-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-edit-character__appearance-media {
    min-height: 280px;
  }

  .page-edit-character__appearance-image,
  .page-edit-character__appearance-image-placeholder {
    min-height: 280px;
    height: 280px;
  }
}
</style>
