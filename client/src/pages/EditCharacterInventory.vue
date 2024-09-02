<template>
  <template v-if="character.id">
    <h2>Inventar bearbeiten</h2>
    <q-form @submit="onSubmit">
      <template v-if="!preview">
        <h6>Besitz</h6>
        <html-editor @update:model-value="onChange" v-model="character.commonrumors" />
        <h6>Besondere Gegenstände</h6>
        <html-editor @update:model-value="onChange" v-model="character.specialitems" />
      </template>
      <section v-else class="page-edit-character__preview">
        <character-rumors :character="character" :preview="true" />
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
import CharacterRumors from 'src/components/character/CharacterRumors.vue';

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
    CharacterRumors,
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
