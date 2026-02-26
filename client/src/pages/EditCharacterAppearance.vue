<template>
<template v-if="character.id">
      <div class="page-edit-character__header">
        <h2>Aussehen bearbeiten</h2>
        <q-btn outline color="secondary" @click="onWikiImportClick" icon="download" label="Wiki Import" />
      </div>
      <q-form @submit="onSubmit">
        <template v-if="!preview">
          <section class="page-edit-character__form-controls">
            <h6>Allgemeines</h6>
            <q-input @update:model-value="onChange" v-model="character.haircolor" label="Haarfarbe">
              <template #append>
                <div class="page-edit-character__color-pair">
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.haircolorShade1 || character.haircolor)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.haircolorShade1 || character.haircolor)"
                        format-model="hex"
                        @update:model-value="onColorPicked('haircolorShade1', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.haircolorShade2)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.haircolorShade2)"
                        format-model="hex"
                        @update:model-value="onColorPicked('haircolorShade2', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
                </div>
              </template>
            </q-input>
            <q-input @update:model-value="onChange" v-model="character.eyecolor" label="Augenfarbe">
              <template #append>
                <div class="page-edit-character__color-pair">
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.eyecolorShade1 || character.eyecolor)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.eyecolorShade1 || character.eyecolor)"
                        format-model="hex"
                        @update:model-value="onColorPicked('eyecolorShade1', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.eyecolorShade2)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.eyecolorShade2)"
                        format-model="hex"
                        @update:model-value="onColorPicked('eyecolorShade2', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
                </div>
              </template>
            </q-input>
            <q-input @update:model-value="onChange" v-model="character.skintone" label="Hautfarbe">
              <template #append>
                <div class="page-edit-character__color-pair">
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.skintoneShade1 || character.skintone)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.skintoneShade1 || character.skintone)"
                        format-model="hex"
                        @update:model-value="onColorPicked('skintoneShade1', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
                  <q-btn dense flat round class="page-edit-character__color-picker-btn" :style="colorButtonStyle(character.skintoneShade2)">
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                      <q-color
                        :model-value="pickerColor(character.skintoneShade2)"
                        format-model="hex"
                        @update:model-value="onColorPicked('skintoneShade2', $event)"
                      />
                    </q-popup-proxy>
                  </q-btn>
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
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { CharacterRefreshResultDto } from '@app/shared/dto/characters/character-refresh-result.dto';
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

  onColorPicked(field: CharacterColorField, color: string) {
    this.character[field] = color;
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

body.body--dark .page-edit-character__color-picker-btn {
  border-color: rgba(213, 226, 240, 0.44);
  box-shadow: 0 0 0 2px rgba(10, 15, 24, 0.86);
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
</style>
