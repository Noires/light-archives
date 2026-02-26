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
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.haircolorShade1)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
                      @click="onColorCleared('haircolorShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.haircolorShade2)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.eyecolorShade1)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
                      @click="onColorCleared('eyecolorShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.eyecolorShade2)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.skintoneShade1)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
                      @click="onColorCleared('skintoneShade1')"
                    />
                  </div>
                  <div class="page-edit-character__color-control">
                    <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.skintoneShade2)">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-color
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
            <q-btn label="Änderungen speichern" type="submit" color="primary" />
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
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
const isDirty = ref(false);
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
    isDirty.value = false;
    const character = await load(to.params);
    next((vm) => (vm as PageEditProfile).setContent(character));
  },
  beforeRouteLeave(to, from, next) {
    if (isDirty.value) {
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
    isDirty.value = true;
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
    isDirty.value = false;
  }

  async onSubmit() {
    this.saving = true;

    try {
      await this.$api.characters.saveCharacter(this.character);
      this.characterBackup = new CharacterProfileDto(this.character);

      notifySuccess('Charakter gespeichert.', {
        label: 'Anschauen',
        color: 'white',
        handler: () => this.viewCharacter(),
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
      isDirty.value = false;
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

.page-edit-character__color-picker-btn {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-image:
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.14) 0,
      rgba(0, 0, 0, 0.14) 3px,
      rgba(255, 255, 255, 0.85) 3px,
      rgba(255, 255, 255, 0.85) 6px
    );
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.95);
}

.page-edit-character__color-clear-btn {
  color: rgba(0, 0, 0, 0.58);
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
  border-color: rgba(213, 226, 240, 0.44);
  box-shadow: 0 0 0 2px rgba(10, 15, 24, 0.86);
}

body.body--dark .page-edit-character__color-clear-btn {
  color: rgba(213, 226, 240, 0.62);
}

body.body--dark .page-edit-character__appearance-media {
  border-color: rgba(141, 181, 223, 0.3);
  background: rgba(17, 24, 34, 0.8);
}

body.body--dark .page-edit-character__appearance-image-placeholder {
  color: #b0c0d1;
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
