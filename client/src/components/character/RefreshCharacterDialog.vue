<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="refresh-character-dialog mat-aetherglass elevation-3">
      <glyph-corner size="sm" position="tl" class="refresh-character-dialog__corner" />
      <glyph-corner size="sm" position="tr" class="refresh-character-dialog__corner" />
      <glyph-corner size="sm" position="br" class="refresh-character-dialog__corner" />
      <glyph-corner size="sm" position="bl" class="refresh-character-dialog__corner" />
			<q-card-section>
				<h5>Aktualisierung bestätigen</h5>
				<p>
					Dies wird den neuen Charakternamen, das neue Volk und den neuen Server von
					<strong>{{ characterName }}</strong> via Lodestone abfragen und entsprechend anpassen.
				</p>
				<p><strong>Dieser Vorgang kann nicht rückgängig gemacht werden.</strong></p>
				<p>Fortfahren?</p>
			</q-card-section>
      <q-card-actions align="right">
        <q-btn flat color="primary" label="Abbrechen" @click="onCancelClick" />
        <q-btn flat color="negative" label="Bestätigen" @click="onProceedClick" />
      </q-card-actions>
			<q-inner-loading :showing="loading" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import GlyphCorner from '../aetherium/GlyphCorner.vue';

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  characterId = prop<number>({
    required: true,
  });

  characterName = prop<string>({
    required: true,
  });
}

@Options({
  name: 'RefreshCharacterDialog',
  components: { GlyphCorner },
  emits: ['ok', 'hide'],
})
export default class RefreshCharacterDialog extends Vue.with(Props) {
	loading = false;

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  onCancelClick() {
    this.hide();
  }

  async onProceedClick() {
		this.loading = true;

		try {
			const result = await this.$api.characters.refreshCharacter({ id: this.characterId });
			const characterId = this.$store.getters.characterId;

			if (characterId && this.characterId === characterId) {
				this.$store.commit('updateCharacter', result);
			}

			notifySuccess('Charakterdaten aktualisiert.');
			this.$emit('ok', result);
			this.hide();
		} catch (e) {
			notifyError(e);
		} finally {
			this.loading = false;
		}
  }
}
</script>

<style lang="scss">
.refresh-character-dialog {
  position: relative;
  min-width: 400px;
  max-width: 520px;
  border-radius: 8px;
  padding: 8px;
}

.refresh-character-dialog h5 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: var(--type-scale-4);
  letter-spacing: var(--ls-display);
}

.refresh-character-dialog__corner {
  position: absolute;
  z-index: 2;
}

.refresh-character-dialog__corner.glyph-corner--tl { top: 6px;    left: 6px;    }
.refresh-character-dialog__corner.glyph-corner--tr { top: 6px;    right: 6px;   }
.refresh-character-dialog__corner.glyph-corner--br { bottom: 6px; right: 6px;   }
.refresh-character-dialog__corner.glyph-corner--bl { bottom: 6px; left: 6px;    }
</style>
