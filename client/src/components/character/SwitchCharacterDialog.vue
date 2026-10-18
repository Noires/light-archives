<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="switch-character-dialog mat-aetherglass elevation-3">
      <glyph-corner size="sm" position="tl" class="switch-character-dialog__corner" />
      <glyph-corner size="sm" position="tr" class="switch-character-dialog__corner" />
      <glyph-corner size="sm" position="br" class="switch-character-dialog__corner" />
      <glyph-corner size="sm" position="bl" class="switch-character-dialog__corner" />
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
import GlyphCorner from '../aetherium/GlyphCorner.vue';
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
    GlyphCorner,
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
    if (!this.ensureTermsAccepted()) {
      return;
    }
    this.adding = true;
  }

  onAddCharacterCancelClick() {
    this.adding = false;
  }

  async onAddCharacterSubmit() {
    if (!this.ensureTermsAccepted()) {
      return;
    }
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

  private ensureTermsAccepted(): boolean {
    if (this.$store.getters.hasAcceptedTerms) {
      return true;
    }

    notifyError('Bitte akzeptiere zuerst die Nutzungsbedingungen, bevor du einen Charakter hinzufügst.');
    void this.$router.push('/terms');
    this.hide();
    return false;
  }
}
</script>

<style lang="scss">
.switch-character-dialog {
  width: 800px;
  padding: 18px 28px 12px;
  position: relative;
  // Aetherglass owns the surface; restate radius so the corner stamps sit on
  // a defined edge rather than the Quasar default.
  border-radius: 8px;
}

.switch-character-dialog__corner {
  position: absolute;
  z-index: 2;
}

.switch-character-dialog__corner.glyph-corner--tl { top: 6px;    left: 6px;    }
.switch-character-dialog__corner.glyph-corner--tr { top: 6px;    right: 6px;   }
.switch-character-dialog__corner.glyph-corner--br { bottom: 6px; right: 6px;   }
.switch-character-dialog__corner.glyph-corner--bl { bottom: 6px; left: 6px;    }

.switch-character-dialog h5 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: var(--type-scale-4);
  letter-spacing: var(--ls-display);
  text-align: center;
}

.switch-character-dialog h6 {
  margin: 12px 0 8px;
  font-family: var(--font-display);
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
}

.switch-character-dialog__character-list > * {
  display: inline-flex;
  width: 50%;
  min-width: 200px;
}

// Gold-rule hover replaces the legacy --app-select-menu-item-hover-bg fill.
// The hairline reads on the Aetherglass surface; alpha bumps from 0.28 → 0.6
// on hover/focus/active per ELPIS-205's tier.
.switch-character-dialog__character-list.character-name-list .q-item {
  border-radius: 4px;
  margin: 2px 0;
  transition:
    background-color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis);
}

.switch-character-dialog__character-list.character-name-list .q-item:hover,
.switch-character-dialog__character-list.character-name-list .q-item.q-manual-focusable--focused {
  background: rgba(186, 155, 91, 0.10);
  box-shadow: inset 0 0 0 1px var(--rule-gold);
}

.switch-character-dialog__character-list.character-name-list .q-item.character-name-list__item_active {
  background: rgba(186, 155, 91, 0.16);
  box-shadow: inset 0 0 0 1px var(--rule-gold);
  font-weight: 600;
}

body.body--dark .switch-character-dialog__character-list.character-name-list .q-item:hover,
body.body--dark .switch-character-dialog__character-list.character-name-list .q-item.q-manual-focusable--focused {
  background: rgba(167, 139, 196, 0.12);
  box-shadow: inset 0 0 0 1px var(--rule-arcane);
}

body.body--dark .switch-character-dialog__character-list.character-name-list .q-item.character-name-list__item_active {
  background: rgba(167, 139, 196, 0.18);
  box-shadow: inset 0 0 0 1px var(--rule-arcane);
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
