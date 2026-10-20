<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="fc-apply-dialog mat-aetherglass elevation-3" role="dialog" aria-labelledby="fc-apply-dialog-title">
      <header class="fc-apply-dialog__header">
        <h2 id="fc-apply-dialog-title" class="fc-apply-dialog__title">Bei {{ freeCompanyName }} bewerben</h2>
        <q-btn flat round dense icon="close" aria-label="Schließen" @click="hide" />
      </header>

      <q-form class="fc-apply-dialog__form" @submit="onSubmit">
        <q-select
          v-model="characterId"
          :options="characterOptions"
          label="Mit welchem Charakter? *"
          emit-value
          map-options
          filled
          :rules="[(val) => !!val || 'Bitte wähle einen Charakter aus.']"
        />
        <q-input
          v-model="message"
          type="textarea"
          label="Nachricht an die Leitung"
          hint="Optional. Erzähl kurz, wer dein Charakter ist und was du suchst."
          :maxlength="FC_APPLICATION_MESSAGE_MAX_LENGTH"
          counter
          autogrow
          filled
        />
        <p class="fc-apply-dialog__note">
          <q-icon name="info" size="18px" aria-hidden="true" />
          <span>
            Die Leitung sieht deine Bewerbung hier auf Elpisgarten. Aufgenommen wirst du im Spiel; dein Profil zeigt die
            Freie Gesellschaft, sobald der Lodestone-Abgleich die Mitgliedschaft meldet.
          </span>
        </p>

        <div class="fc-apply-dialog__actions">
          <q-btn class="elpis-btn elpis-btn--secondary" flat no-caps label="Abbrechen" @click="hide" />
          <q-btn class="elpis-btn elpis-btn--primary" unelevated no-caps type="submit" label="Bewerbung senden" :loading="sending" />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { FC_APPLICATION_MESSAGE_MAX_LENGTH } from '@app/shared/dto/fcs/free-company-application.dto';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';

// ER2 round 2 — "Bewerben": character select (the user's verified
// characters) and an optional message. Emits ok with the character id.

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  freeCompanyId = prop<number>({ required: true });
  freeCompanyName = prop<string>({ required: true });
}

@Options({
  name: 'FreeCompanyApplyDialog',
  emits: ['ok', 'hide'],
})
export default class FreeCompanyApplyDialog extends Vue.with(Props) {
  readonly FC_APPLICATION_MESSAGE_MAX_LENGTH = FC_APPLICATION_MESSAGE_MAX_LENGTH;

  characterId: number | null = null;
  message = '';
  sending = false;

  get characterOptions(): { label: string; value: number }[] {
    return this.$store.getters.characters
      .filter((character) => character.verified)
      .map((character) => ({ label: `${character.name} (${character.server})`, value: character.id }));
  }

  created() {
    const current = this.$store.getters.characterId;
    const options = this.characterOptions;
    this.characterId = options.find((option) => option.value === current)?.value || options[0]?.value || null;
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

  async onSubmit() {
    if (!this.characterId) {
      return;
    }

    this.sending = true;

    try {
      const api = this.$api.freeCompanies as unknown as FreeCompaniesAPI;
      await api.apply(this.freeCompanyId, this.characterId, this.message.trim() || undefined);
      notifySuccess('Bewerbung gesendet.');
      this.$emit('ok', this.characterId);
      this.hide();
    } catch (e) {
      notifyError(e);
    } finally {
      this.sending = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.fc-apply-dialog {
  width: min(560px, 96vw);
  max-width: 96vw;
  padding: 18px 24px 16px;
  border-radius: 12px;
  color: var(--ink-primary);
}

.fc-apply-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.fc-apply-dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  line-height: 1.3;
  color: var(--ink-primary);
}

.fc-apply-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fc-apply-dialog__note {
  display: flex;
  gap: 8px;
  margin: 8px 0 0;
  padding: 10px 12px;
  border: 1px solid var(--rule-soft);
  border-radius: 8px;
  background: var(--rule-tint);
  font-family: var(--font-ui);
  font-size: var(--type-scale-1);
  line-height: 1.5;
  color: var(--ink-primary);

  .q-icon {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--ink-link);
  }
}

.fc-apply-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
</style>
