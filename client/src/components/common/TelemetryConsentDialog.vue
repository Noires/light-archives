<template>
  <q-dialog
    ref="dialog"
    class="telemetry-consent-dialog__root"
    :no-backdrop-dismiss="!settingsMode"
    :no-esc-dismiss="!settingsMode"
    @hide="onDialogHide"
  >
    <q-card class="telemetry-consent-dialog">
      <q-card-section class="telemetry-consent-dialog__header">
        <h5>{{ title }}</h5>
        <p>
          Wir nutzen freiwillige Fehlerdiagnose, um Abstürze und technische Probleme schneller zu beheben.
          Du kannst jederzeit ablehnen oder später umstellen.
        </p>
      </q-card-section>

      <q-card-section class="telemetry-consent-dialog__details">
        <p><strong>Gesendet werden nur technische Diagnosedaten:</strong></p>
        <ul>
          <li>Fehlermeldungen und Stacktraces</li>
          <li>Browser- und Gerätekontext</li>
          <li>Die betroffene Seitenroute (ohne Query-Parameter)</li>
        </ul>
        <p class="telemetry-consent-dialog__hint">
          Es werden keine Zugangstoken oder E-Mail-Adressen übertragen.
        </p>
      </q-card-section>

      <q-card-actions align="between">
        <q-btn flat class="elpis-btn elpis-btn--ghost" label="Datenschutzerklärung" @click="onOpenPrivacyClick" />
        <div class="telemetry-consent-dialog__actions">
          <q-btn v-if="settingsMode" flat class="elpis-btn elpis-btn--ghost" label="Schließen" @click="onCloseClick" />
          <!-- ER2-106 — both choices carry the same weight (DSGVO): same
               variant, same size, no warning colour on "Ablehnen". -->
          <q-btn
            flat
            class="elpis-btn elpis-btn--secondary telemetry-consent-dialog__choice"
            label="Ablehnen"
            :disable="declineDisabled"
            @click="onDeclineClick"
          />
          <q-btn
            flat
            class="elpis-btn elpis-btn--secondary telemetry-consent-dialog__choice"
            label="Fehlerdiagnose erlauben"
            :disable="allowDisabled"
            @click="onAllowClick"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { Options, Vue, prop } from 'vue-class-component';

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  settingsMode = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'TelemetryConsentDialog',
  emits: ['ok', 'hide'],
})
export default class TelemetryConsentDialog extends Vue.with(Props) {
  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  onCloseClick() {
    this.hide();
  }

  onDeclineClick() {
    this.$emit('ok', TelemetryConsentStatus.DENIED);
    this.hide();
  }

  onAllowClick() {
    this.$emit('ok', TelemetryConsentStatus.GRANTED);
    this.hide();
  }

  onOpenPrivacyClick() {
    void this.$router.push('/privacy-statement');
  }

  get title() {
    return this.settingsMode ? 'Fehlerdiagnose-Einstellungen' : 'Freiwillige Fehlerdiagnose';
  }

  get currentConsentStatus(): TelemetryConsentStatus {
    return this.$store.getters.telemetryConsentStatus;
  }

  get declineDisabled() {
    return this.settingsMode && this.currentConsentStatus === TelemetryConsentStatus.DENIED;
  }

  get allowDisabled() {
    return this.settingsMode && this.currentConsentStatus === TelemetryConsentStatus.GRANTED;
  }
}
</script>

<style lang="scss">
// ER2-106 — a 60 % scrim so the choice reads as modal (Quasar default is 40 %).
.telemetry-consent-dialog__root .q-dialog__backdrop {
  background: rgba(0, 0, 0, 0.6);
}

.telemetry-consent-dialog__choice {
  min-width: 200px;
}

.telemetry-consent-dialog {
  width: min(720px, 95vw);
  border-radius: 16px;
}

.telemetry-consent-dialog__header {
  h5 {
    margin: 0 0 8px;
  }

  p {
    margin: 0;
  }
}

.telemetry-consent-dialog__details {
  padding-top: 0;

  ul {
    margin: 8px 0;
    padding-left: 20px;
  }
}

.telemetry-consent-dialog__hint {
  margin: 0;
  color: var(--ink-muted);
}

.telemetry-consent-dialog__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 700px) {
  .telemetry-consent-dialog__actions {
    width: 100%;
  }

  .telemetry-consent-dialog__choice {
    flex: 1 1 0;
    min-width: 0;
  }
}
</style>
