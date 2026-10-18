<template>
  <template v-if="character.id">
    <div class="page-edit-character__header">
        <h2>Profil bearbeiten</h2>
        <q-btn outline color="secondary" @click="onWikiImportClick" icon="download" label="Wiki Import" />
      </div>
    <q-form @submit="onSubmit">
      <template v-if="!preview">
        <q-banner v-if="!character.active" class="bg-dark text-white">
          Dieser Charakter wurde im Spiel umbenannt, daher musst du ein neues Profil für den umbenannten Charakter
          anlegen. Dieser
          Charakter ist nun inaktiv. Du kannst die Informationen nicht mehr via Lodestone aktualisieren.
        </q-banner>
        <section>
          <h6>Profilanzeige</h6>
          <p>Zur Erweiterung des Charakterprofils können weitere Unterpunkte hinzugeschaltet werden. Diese sind rein
            optional.</p>
          <section class="flexgrid">
            <q-checkbox v-model="character.showAppearance" @update:model-value="updateCharacter"
              label="Zeige Aussehen" />
            <q-checkbox v-model="character.showPersonality" @update:model-value="updateCharacter"
              label="Zeige Persönlichkeit" />
            <q-checkbox v-model="character.showContacts" @update:model-value="updateCharacter" label="Zeige Kontakte" />
            <q-checkbox v-model="character.showRumors" @update:model-value="updateCharacter" label="Zeige Gerüchte" />
            <q-checkbox v-model="character.showDiary" @update:model-value="updateCharacter" label="Zeige Tagebuch" />
            <q-checkbox v-model="character.showGallery" @update:model-value="updateCharacter" label="Zeige Galerie" />
            <q-checkbox v-model="character.showInventory" @update:model-value="updateCharacter" label="Zeige Inventar" />
          </section>
        </section>
        <!-- ER2 round 2: Akzentfarbe & Spielstil -->
        <section class="page-edit-character__style">
          <h6>Akzentfarbe &amp; Spielstil</h6>
          <div class="page-edit-character__form-controls">
            <q-input
              :model-value="character.accentColor || ''"
              @update:model-value="onAccentColorChange"
              label="Akzentfarbe"
              hint="Farbe für dein Profil im Format #RRGGBB. Leer lassen für die Standardfarbe."
              maxlength="7"
              clearable
              :rules="[(v: string) => !v || ACCENT_COLOR_REGEX.test(v) || 'Bitte gib eine Farbe im Format #RRGGBB an.']"
            >
              <template v-slot:prepend>
                <span
                  class="page-edit-character__swatch"
                  :style="{ background: isValidAccentColor(character.accentColor) ? character.accentColor : 'transparent' }"
                  aria-hidden="true"
                />
              </template>
              <template v-slot:append>
                <q-btn flat round dense icon="colorize" aria-label="Farbe auswählen">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color
                      :model-value="character.accentColor || '#ba9b5b'"
                      @update:model-value="onAccentColorChange"
                      format-model="hex"
                      no-header-tabs
                      default-view="palette"
                    />
                  </q-popup-proxy>
                </q-btn>
              </template>
            </q-input>
            <q-select
              :model-value="character.playStyleTags || []"
              @update:model-value="onPlayStyleTagsChange"
              @new-value="onNewPlayStyleTag"
              label="Spielstil-Tags"
              :hint="`Bis zu ${PLAY_STYLE_TAGS_MAX} Tags mit je max. ${PLAY_STYLE_TAG_MAX_LENGTH} Zeichen, z. B. Abenteuer oder Slice of Life. Mit Enter hinzufügen.`"
              multiple
              use-chips
              use-input
              hide-dropdown-icon
              input-debounce="0"
              :max-values="PLAY_STYLE_TAGS_MAX"
              :options="[]"
            />
          </div>
        </section>
        <banner-edit-section v-model="character.banner" />
        <h6>Biografie</h6>
        <div class="page-edit-character__lodestone-info">
          <section class="page-edit-character__form-controls">
            <q-input @update:model-value="onChange" :model-value="character.name" label="Name" readonly />
            <q-input @update:model-value="onChange" :model-value="$display.races[character.race]" label="Volk"
              readonly />
            <q-input @update:model-value="onChange" :model-value="$display.tribes[character.tribe]" label="Untervolk"
              readonly />
          </section>
          <section v-if="character.active">
            <q-btn outline color="secondary" @click="onRefreshClick" style="max-width: 140px"><i
                class="material-icons q-icon">refresh</i>Aktualisiere via Lodestone</q-btn>
          </section>
        </div>
        <section class="page-edit-character__form-controls">
          <q-input @update:model-value="onChange" v-model="character.title" label="Titel" />
          <q-input @update:model-value="onChange" v-model="character.nickname" label="Spitzname" />
          <q-input @update:model-value="onChange" v-model="character.family" label="Familie" />
          <q-input @update:model-value="onChange" v-model="character.deity" label="Schutzgottheit" />
          <q-input @update:model-value="onChange" v-model="character.profession" label="Profession" />
          <q-input @update:model-value="onChange" v-model="character.age" class="page-edit-character__age"
            label="Alter" />
          <q-input @update:model-value="onChange" v-model="character.birthday" label="Namenstag" />
          <q-input @update:model-value="onChange" v-model="character.pronouns" class="page-edit-character__pronouns"
            label="Geschlecht" :maxlength="SharedConstants.MAX_PRONOUNS_LENGTH" />
          <q-input @update:model-value="onChange" v-model="character.birthplace" label="Geburtsort" />
          <q-input @update:model-value="onChange" v-model="character.residence" label="Wohnort" />
          <q-input @update:model-value="onChange" v-model="character.relationsshipstatus" label="Beziehungsstatus" />
          <wikilink-hint note="Wikilinks funktionieren in allen obigen Feldern." />
        </section>
        <h6>Einleitung</h6>
        <html-editor @update:model-value="onChange" v-model="character.background" />
        <carrd-edit-section @update:model-value="onChange" class="page-edit-character__form-controls"
          entity-type="character" v-model="character.carrdProfile" />
      </template>
      <section v-else class="page-edit-character__preview">
        <character-profile :character="character" :preview="true" />
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
        <span class="q-ml-sm">Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version
          zurücksetzen?</span>
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
import CharacterProfile from 'components/character/CharacterProfile.vue';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CarrdEditSection from 'src/components/common/CarrdEditSection.vue';
import WikilinkHint from 'src/components/common/WikilinkHint.vue';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import HtmlEditor from '../components/common/HtmlEditor.vue';
import { ref } from 'vue';
import { Dialog } from 'quasar';
import type { ParsedCharacterData } from 'src/common/wiki-import';
import {
  ACCENT_COLOR_REGEX,
  isValidAccentColor,
  PLAY_STYLE_TAG_MAX_LENGTH,
  PLAY_STYLE_TAGS_MAX,
} from '@app/shared/validation/profile-fields';

const $api = useApi();

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
    CharacterProfile,
    BannerEditSection,
    CarrdEditSection,
    WikilinkHint,
  },
  async beforeRouteEnter(to, _, next) {
    const character = await load(to.params);
    next((vm) => (vm as PageEditProfile).setContent(character));
  },
  beforeRouteLeave(to, from, next) {
    if ((this as PageEditProfile).isDirty) {
      if (to.path.includes('edit-character')) {
        Dialog.create({
          title: 'Warnung',
          message: 'Bitte speichere oder setze deine Änderungen zurück, bevor du zu einem anderen Charakter Tab navigierst.',
          ok: {
            push: true,
            label: 'Ok'
          }
        }).onOk(() => {
          next(false);
        });
      }
      else {
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
    }
    else {
      next();
    }
  },
  emits: ['updateCharacter'],
})
export default class PageEditProfile extends Vue {
  readonly SharedConstants = SharedConstants;
  readonly ACCENT_COLOR_REGEX = ACCENT_COLOR_REGEX;
  readonly PLAY_STYLE_TAGS_MAX = PLAY_STYLE_TAGS_MAX;
  readonly PLAY_STYLE_TAG_MAX_LENGTH = PLAY_STYLE_TAG_MAX_LENGTH;
  readonly isValidAccentColor = isValidAccentColor;

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
        const { name, race, tribe, server, avatar } = characterData;
        Object.assign(this.character, { name, race, tribe, server, avatar });
      });
  }

  async onWikiImportClick() {
    const WikiImportDialog = (await import('src/components/character/WikiImportDialog.vue')).default;

    this.$q
      .dialog({
        component: WikiImportDialog,
        componentProps: {
          targetSection: 'profile',
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

  // ER2 round 2
  onAccentColorChange(value: string | null) {
    this.character.accentColor = value ? value.trim() : null;
    this.onChange();
  }

  onPlayStyleTagsChange(tags: string[] | null) {
    this.character.playStyleTags = tags || [];
    this.onChange();
  }

  onNewPlayStyleTag(value: string, done: (item?: string, mode?: 'add' | 'add-unique' | 'toggle') => void) {
    const tag = value.replace(/\s+/g, ' ').trim().substring(0, PLAY_STYLE_TAG_MAX_LENGTH);
    const existing = (this.character.playStyleTags || []).map((t) => t.toLowerCase());

    if (!tag || existing.includes(tag.toLowerCase()) || existing.length >= PLAY_STYLE_TAGS_MAX) {
      done();
      return;
    }

    done(tag, 'add-unique');
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
        label: 'Schließen',
        color: 'white',
        handler: () => 0,
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
      this.updateCharacter();
      this.isDirty = false;
    }
  }

  updateCharacter() {
    this.isDirty = true;
    this.$emit('updateCharacter', this.character);
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

.page-edit-character__style {
  margin-bottom: 16px;
}

.page-edit-character__swatch {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--rule-gold-soft, rgba(186, 155, 91, 0.28));
}

.page-edit-character__age,
.page-edit-character__pronouns {
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
