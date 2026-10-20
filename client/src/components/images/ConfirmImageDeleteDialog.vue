<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="confirm-image-delete-dialog mat-aetherglass elevation-3">
			<header class="confirm-image-delete-dialog__header">
				<q-icon class="confirm-image-delete-dialog__icon" name="warning" />
				<h5 class="confirm-image-delete-dialog__title">Löschbestätigung</h5>
			</header>
			<q-img class="confirm-image-delete-dialog__preview" :src="image.url" fit="contain" />
			<p class="confirm-image-delete-dialog__copy">Möchtest du dieses Bild wirklich löschen? <strong>Dieser Vorgang kann nicht rückgängig gemacht werden.</strong></p>
      <p v-if="forceConfirming" class="confirm-image-delete-dialog__copy confirm-image-delete-dialog__copy--force">
        <strong>{{forceConfirmMessage}}.</strong> Möchtest du dieses Bild trotzdem löschen und von jeder Seite entfernen?
        </p>
			<q-card-actions align="right">
				<q-btn flat color="primary" label="Abbrechen" @click="onCancelClick" />
				<q-btn flat color="negative" :label="!forceConfirming ? 'Löschen' : 'Trotzdem löschen'" @click="onDeleteClick" />
			</q-card-actions>
			<q-inner-loading :showing="deleting" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ImageDto } from '@app/shared/dto/image/image.dto';
import errors from '@app/shared/errors';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
	image = prop<ImageDto>({
		required: true
	})
}

@Options({
  emits: ['ok', 'hide'],
})
export default class ConfirmImageDeleteDialog extends Vue.with(Props) {
  forceConfirming = false;
  forceConfirmMessage = '';
	deleting = false;

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

  async onDeleteClick() {
		try {
      this.deleting = true;

			await this.$api.images.deleteImage(this.image.id, this.forceConfirming);

      this.$emit('ok');
    	this.hide();
    } catch (e) {
      if (errors.getStatusCode(e) === 409) {
        // Conflict: used as a banner
        this.forceConfirming = true;
        this.forceConfirmMessage = errors.getMessage(e);
      } else {
        notifyError(e);
      }
    } finally {
      this.deleting = false;
    }
  }
}
</script>

<style lang="scss">
// ELPIS-611 — ConfirmImageDeleteDialog on elevation/3 Aetherglass with a
// red-shifted danger left rail. The header carries a warning glyph in
// `--semantic-danger` ink so the destructive nature of the action reads
// before the user parses the copy. The dialog reuses the dialog-tier
// Aetherglass chrome (.mat-aetherglass.elevation-3) shared with
// SwitchCharacterDialog (215) and the revert dialogs (221) — only the
// danger rail + warning glyph are unique here.
.confirm-image-delete-dialog {
	padding: 18px 24px 12px;
	min-width: 320px;
	max-width: 540px;
	border-radius: 8px;
	box-shadow:
		inset 4px 0 0 var(--semantic-danger),
		0 18px 48px rgba(43, 36, 24, 0.18);
}

.confirm-image-delete-dialog__header {
	display: flex;
	align-items: center;
	gap: 10px;
	margin: 0 0 14px;
}

.confirm-image-delete-dialog__icon {
	color: var(--semantic-danger);
	font-size: 26px;
	flex: 0 0 auto;
}

.confirm-image-delete-dialog__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	letter-spacing: var(--ls-display);
	color: var(--ink-primary);
}

.confirm-image-delete-dialog__preview {
	max-height: 50vh;
	height: auto;
	margin-bottom: 16px;
	border: 1px solid var(--rule-gold-soft);
	border-radius: 4px;
}

.confirm-image-delete-dialog__copy {
	font-family: var(--font-section);
	font-size: var(--type-scale-2);
	line-height: var(--lh-body);
	color: var(--ink-primary);
	margin-bottom: 12px;
}

.confirm-image-delete-dialog__copy--force {
	padding: 10px 14px;
	border-radius: 4px;
	background: rgba(199, 72, 79, 0.10);
	border: 1px solid var(--semantic-danger);
	box-shadow: inset 4px 0 0 var(--semantic-danger);
}

.confirm-image-delete-dialog .q-img {
	max-height: 50vh;
	height: auto;
	margin-bottom: 16px;
}

body.body--dark .confirm-image-delete-dialog {
	box-shadow:
		inset 4px 0 0 var(--semantic-danger),
		0 18px 48px rgba(0, 0, 0, 0.5);
}

body.body--dark .confirm-image-delete-dialog__title {
	color: var(--ink-luminous);
}

body.body--dark .confirm-image-delete-dialog__copy {
	color: var(--ink-luminous);
}

body.body--dark .confirm-image-delete-dialog__preview {
	border-color: var(--rule-arcane-soft);
}

body.body--dark .confirm-image-delete-dialog__copy--force {
	background: rgba(199, 72, 79, 0.20);
}
</style>
