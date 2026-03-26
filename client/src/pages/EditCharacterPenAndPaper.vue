<template>
  <template v-if="character.id">
    <div class="page-edit-character__header">
      <h2>Pen &amp; Paper bearbeiten</h2>
    </div>
    <p class="text-caption">
      Diese Seite bundelt kompakte Sheet-Felder. Umfangreichere Fließtexte wie Hintergrund, Persönlichkeit oder Gerüchte
      bleiben in ihren jeweiligen Tabs.
    </p>
    <p class="text-caption page-edit-character-sheet__hint">
      Die Vorschau fasst alle ausgefüllten Angaben als kompaktes Dossier zusammen und enthält ein kleines lokales Würfel-Orakel.
    </p>
    <q-form @submit="onSubmit">
      <template v-if="!preview">
        <section class="page-edit-character-sheet__grid">
          <section class="page-edit-character-sheet__card">
            <h6>Identität</h6>
            <q-input @update:model-value="onChange" v-model="character.profession" label="Beruf" />
            <q-input @update:model-value="onChange" v-model="character.pronouns" label="Pronomen / Geschlecht" :maxlength="SharedConstants.MAX_PRONOUNS_LENGTH" />
            <q-input @update:model-value="onChange" v-model="character.age" label="Alter" />
            <q-input @update:model-value="onChange" v-model="character.apparentage" label="Optisches Alter" />
            <q-input @update:model-value="onChange" v-model="character.birthday" label="Namenstag" />
            <q-input @update:model-value="onChange" v-model="character.deity" label="Schutzgottheit" />
            <q-input @update:model-value="onChange" v-model="character.family" label="Familie" />
          </section>

          <section class="page-edit-character-sheet__card">
            <h6>Eindruck</h6>
            <q-input @update:model-value="onChange" v-model="character.haircolor" label="Haarfarbe" />
            <q-input @update:model-value="onChange" v-model="character.eyecolor" label="Augenfarbe" />
            <q-input @update:model-value="onChange" v-model="character.skintone" label="Hautfarbe" />
            <q-input @update:model-value="onChange" v-model="character.build" label="Statur" />
            <q-input @update:model-value="onChange" v-model="character.height" label="Größe" />
            <q-input @update:model-value="onChange" v-model="character.weight" label="Gewicht" />
            <q-input @update:model-value="onChange" v-model="character.voice" label="Stimme" />
            <q-input @update:model-value="onChange" v-model="character.specialfeatures" label="Besonderheiten" />
          </section>

          <section class="page-edit-character-sheet__card">
            <h6>Antrieb</h6>
            <q-input @update:model-value="onChange" v-model="character.slogan" label="Motto" />
            <q-input @update:model-value="onChange" v-model="character.motivation" label="Motivation" />
            <q-input @update:model-value="onChange" v-model="character.wishes" label="Wünsche" />
            <q-input @update:model-value="onChange" v-model="character.fears" label="Ängste" />
            <q-input @update:model-value="onChange" v-model="character.loves" label="Liebt" />
            <q-input @update:model-value="onChange" v-model="character.hates" label="Hasst" />
            <q-input @update:model-value="onChange" v-model="character.strengths" label="Stärken" />
            <q-input @update:model-value="onChange" v-model="character.weaknesses" label="Schwächen" />
            <q-input @update:model-value="onChange" v-model="character.ticks" label="Eigenheiten" />
            <q-input @update:model-value="onChange" v-model="character.currently" label="Aktuell" autogrow type="textarea" />
          </section>

          <section class="page-edit-character-sheet__card">
            <h6>Umfeld</h6>
            <q-input @update:model-value="onChange" v-model="character.birthplace" label="Geburtsort" />
            <q-input @update:model-value="onChange" v-model="character.residence" label="Wohnort" />
            <q-input @update:model-value="onChange" v-model="character.relationsshipstatus" label="Beziehungsstatus" />
            <q-input @update:model-value="onChange" v-model="character.freecompanies" label="Freie Gesellschaft" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.meetingplaces" label="Treffpunkte" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.communities" label="Communities" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.mentioned" label="Erwähnt in" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.possession" label="Besitz" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.specialitems" label="Besondere Gegenstände" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.past" label="Vergangenheit" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.oocInfo" label="OOC" autogrow type="textarea" />
          </section>

          <section class="page-edit-character-sheet__card">
            <h6>Beziehungen</h6>
            <q-input @update:model-value="onChange" v-model="character.partners" label="Partner" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.parents" label="Eltern" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.children" label="Kinder" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.relatives" label="Verwandte" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.friends" label="Freunde" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.acquaintances" label="Bekannte" autogrow type="textarea" />
            <q-input @update:model-value="onChange" v-model="character.enemies" label="Feinde" autogrow type="textarea" />
          </section>
        </section>
      </template>

      <section v-else class="page-edit-character__preview">
        <character-pen-and-paper :character="character" />
      </section>

      <div class="page-edit-character__button-bar">
        <q-btn-toggle v-model="preview" :options="previewOptions" toggle-color="secondary" />
        <div class="page-edit-character__revert-submit">
          <q-btn label="Zurücksetzen" color="secondary" @click="onRevertClick" />
          &nbsp;
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
import SharedConstants from '@app/shared/SharedConstants';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { ref } from 'vue';
import { Dialog } from 'quasar';
import CharacterPenAndPaper from 'src/components/character/CharacterPenAndPaper.vue';

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
    CharacterPenAndPaper,
  },
  async beforeRouteEnter(to, _, next) {
    isDirty.value = false;
    const character = await load(to.params);
    next((vm) => (vm as PageEditCharacterPenAndPaper).setContent(character));
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
    } else {
      next();
    }
  },
  emits: ['updateCharacter']
})
export default class PageEditCharacterPenAndPaper extends Vue {
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

  setContent(character: CharacterProfileDto) {
    this.characterBackup = character;
    this.character = new CharacterProfileDto(this.characterBackup);
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
      this.$emit('updateCharacter', this.characterBackup);

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
.page-edit-character-sheet__hint {
  margin-bottom: 16px;
}

.page-edit-character-sheet__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.page-edit-character-sheet__card {
  padding: 18px;
  border-radius: 14px;
  background:
    radial-gradient(circle at top left, rgba(189, 164, 113, 0.12), transparent 40%),
    rgba(248, 243, 232, 0.96);
  border: 1px solid rgba(122, 90, 57, 0.16);
}

.page-edit-character-sheet__card h6 {
  margin-top: 0;
}

body.body--dark .page-edit-character-sheet__card {
  background: rgba(31, 37, 44, 0.94);
  border-color: rgba(205, 171, 114, 0.18);
}

@media screen and (max-width: 900px) {
  .page-edit-character-sheet__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
