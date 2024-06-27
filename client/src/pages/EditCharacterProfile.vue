<template>
  <template v-if="character.id">
    <h2>Profil bearbeiten</h2>
    <q-form @submit="onSubmit">
      <template v-if="!preview">
        <q-banner v-if="!character.active" class="bg-dark text-white">
          Dieser Charakter wurde im Spiel umbenannt, daher musst du ein neues Profil für den umbenannten Charakter
          anlegen. Dieser
          Charakter ist nun inaktiv. Du kannst die Informationen nicht mehr via Lodestone aktualisieren.
        </q-banner>
        <div class="page-edit-character__lodestone-info">
          <section class="page-edit-character__form-controls">
            <q-input @update:model-value="onChange" :model-value="character.name" label="Name" readonly />
            <q-input @update:model-value="onChange" :model-value="$display.races[character.race]" label="Volk"
              readonly />
            <q-input @update:model-value="onChange" :model-value="$display.tribes[character.tribe]" label="Stamm"
              readonly />
          </section>
          <section v-if="character.active">
            <q-btn outline color="secondary" @click="onRefreshClick" style="max-width: 140px"><i
                class="material-icons q-icon">refresh</i>Aktualisiere via Lodestone</q-btn>
          </section>
        </div>
        <section>
          <p></p>
          <p>Alle Felder sind optional.</p>
          <h6>Profilanzeige</h6>
          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox @update:model-value="onChange" v-model="character.showAvatar" label="Zeige Avatar" />
            </template>
          </q-field>
          <div class="text-caption">Zeigt den Avatar des Charakters links vom Namen an.</div>
          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox @update:model-value="onChange" v-model="character.showInfoboxes" label="Zeige Infoboxen" />
            </template>
          </q-field>
          <div class="text-caption">
            Zeigt die Charakterinformationen in Infoboxen an. Wenn nicht ausgewählt, werden die Infoboxen von der
            öffentlichen
            Profilseite
            verborgen.
          </div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showAppearance" @update:model-value="updateCharacter"
                label="Zeige Aussehen" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für die Beschreibung des Aussehens. Wenn nicht ausgewählt, wird
            das Tab
            von der öffentlichen Profilseite
            verborgen.</div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showPersonality" @update:model-value="updateCharacter"
                label="Zeige Persönlichkeit" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für die Beschreibung der Persönlichkeit. Wenn nicht ausgewählt,
            wird das
            Tab
            von der öffentlichen Profilseite
            verborgen.</div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showContacts" @update:model-value="updateCharacter"
                label="Zeige Kontakte" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für die Beschreibung der Kontakte. Wenn nicht ausgewählt, wird
            das Tab von
            der öffentlichen Profilseite
            verborgen.</div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showRumors" @update:model-value="updateCharacter" label="Zeige Gerüchte" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für die Beschreibung des Gerüchte. Wenn nicht ausgewählt, wird
            das Tab von
            der öffentlichen Profilseite
            verborgen.</div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showDiary" @update:model-value="updateCharacter" label="Zeige Tagebuch" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für das Tagebuch. Wenn nicht ausgewählt, wird das Tab
            von der öffentlichen Profilseite
            verborgen.</div>

          <q-field class="page-edit-character__checkbox" borderless>
            <template v-slot:control>
              <q-checkbox v-model="character.showGallery" @update:model-value="updateCharacter"
                label="Zeige Gallerie" />
            </template>
          </q-field>
          <div class="text-caption">Erstellt einen Tab für die Galerie. Wenn nicht ausgewählt, wird das Tab von
            der
            öffentlichen Profilseite
            verborgen.</div>

        </section>
        <banner-edit-section v-model="character.banner" />
        <section class="page-edit-character__form-controls">
          <h6>Namen & Titel</h6>
          <q-input @update:model-value="onChange" v-model="character.title" label="Titel" />
          <q-input @update:model-value="onChange" v-model="character.nickname" label="Spitzname" />
          <h6>Biografie</h6>
          <q-input @update:model-value="onChange" v-model="character.profession" label="Profession" />
          <q-input @update:model-value="onChange" v-model="character.age" class="page-edit-character__age"
            label="Alter" />
          <q-input @update:model-value="onChange" v-model="character.pronouns" class="page-edit-character__pronouns"
            label="Pronouns" :maxlength="SharedConstants.MAX_PRONOUNS_LENGTH" />
          <q-input @update:model-value="onChange" v-model="character.birthplace" label="Geburtsort" />
          <q-input @update:model-value="onChange" v-model="character.residence" label="Wohnort" />
          <div class="text-caption">Du kannst [[Wikilinks]], z.B. [[Charaktername]], in allen obigen Feldern nutzen.
          </div>
        </section>
        <template v-if="!character.showAppearance">
          <h6>Erscheinungsbild</h6>
          <html-editor @update:model-value="onChange" v-model="character.appearance" />
        </template>
        <h6>Hintergrund</h6>
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
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import HtmlEditor from '../components/common/HtmlEditor.vue';
import { ref } from 'vue';
import { Dialog } from 'quasar';

const $api = useApi();
const isDirty = ref(false);

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
  },
  async beforeRouteEnter(to, _, next) {
    isDirty.value = false;
    const character = await load(to.params);
    next((vm) => (vm as PageEditProfile).setContent(character));
  },
  beforeRouteLeave(to, from, next) {
    if (isDirty.value) {
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

  onChange() {
    isDirty.value = true;
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
        label: 'Schließen',
        color: 'white',
        handler: () => 0,
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
      this.updateCharacter();
      isDirty.value = false;
    }
  }

  updateCharacter() {
    isDirty.value = true;
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
</style>
