<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="switch-character-dialog">
      <h5>Charakter wechseln</h5>
      <character-name-list
        class="switch-character-dialog__character-list"
        :profiles="characters"
        :links="false"
				:activeName="activeName"
				:activeServer="activeServer"
        @select="onCharacterSelect"
      />
      <q-slide-transition>
        <q-form v-if="adding" @submit="onAddCharacterSubmit">
          <h6>Neuen Charakter zu diesem Account hinzufügen</h6>
          <character-finder-field v-model="newCharacter" />
          <q-card-actions align="right" class="switch-character-dialog__add-form-buttons">
            <q-btn flat color="secondary" label="Abbrechen" @click="onAddCharacterCancelClick" />
            <q-btn color="primary" label="Charakter hinzufügen" type="submit" :disable="newCharacter.lodestoneId === -1" />
          </q-card-actions>
        </q-form>
      </q-slide-transition>
      <q-card-actions class="switch-character-dialog__buttons" v-if="!adding">
        <q-btn flat color="secondary" icon="add" label="Neuen Charakter hinzufügen" @click="onAddCharacterClick" />
        <q-btn flat color="primary" label="Schließen" @click="onCloseClick" />
      </q-card-actions>
      <q-inner-loading :showing="submitting" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import CharacterNameList from '../mainpage/CharacterNameList.vue';
import { CharacterSearchModel } from './character-search-model';
import CharacterFinderField from './CharacterFinderField.vue';

interface DialogRef {
  show(): void;
  hide(): void;
}

@Options({
  components: {
    CharacterNameList,
    CharacterFinderField,
  },
  emits: ['ok', 'hide'],
})
export default class SwitchCharacterDialog extends Vue {
  characters: SessionCharacterDto[] = [];

  newCharacter: CharacterSearchModel = {
    name: '',
    server: '',
    avatar: '',
    lodestoneId: -1,
  };

  adding = false;
  submitting = false;

  created() {
    this.$store.state.user!.characters.forEach((character) => this.characters.push(character));
  }

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

	get activeName() {
		return this.$store.getters.character?.name;
	}

	get activeServer() {
		return this.$store.getters.character?.server;
	}

  onCharacterSelect(character: SessionCharacterDto) {
    const oldCharacterId = this.$store.getters.characterId;
    this.$store.commit('setCurrentCharacterId', character.id);
    this.$emit('ok', character);
    this.hide();

    if (character.id !== oldCharacterId) {
      notifySuccess(`${character.name} ist jetzt dein aktiver Charakter.`);
    }
  }

  onAddCharacterClick() {
    this.adding = true;
  }

  onAddCharacterCancelClick() {
    this.adding = false;
  }

  async onAddCharacterSubmit() {
    this.submitting = true;

    try {
      const character = await this.$api.characters.addAccountCharacter({ lodestoneId: this.newCharacter.lodestoneId });

      notifySuccess('Charakter erfolgreich hinzugefügt. Du wirst ihn verifizieren müssen.');
      this.$store.commit('addCharacter', character);
      this.onCharacterSelect(character);
    } catch (e) {
      notifyError(e);
    } finally {
      this.submitting = false;
    }
  }

  onCloseClick() {
    this.hide();
  }
}
</script>

<style lang="scss">
.switch-character-dialog {
  width: 800px;
  padding: 8px 24px;
}

.switch-character-dialog__character-list > * {
  display: inline-flex;
  width: 50%;
  min-width: 200px;
}

.switch-character-dialog__character-list.character-name-list .q-item {
  background: white;
}

.switch-character-dialog__character-list.character-name-list .q-item.character-name-list__item_active {
  background: $striped-list-bg-even;
}

.switch-character-dialog__add-form-buttons {
  margin-top: 8px;
}

.switch-character-dialog__buttons {
  justify-content: space-between;
}

@media (min-width: 1280px) {
  .q-dialog__inner--minimized > .switch-character-dialog {
    max-width: 800px;
  }
}
</style>
