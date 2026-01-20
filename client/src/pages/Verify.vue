<template>
  <q-page>
    <template v-if="verificationStatus.characterVerified">
      <h2>Verifizierung abgeschlossen</h2>
      <p>
        Glückwunsch! Dein Charakter wurde erfolgreich bestätigt. Du kannst nun dein
        Charakterprofil ausfüllen und Inhalte auf <strong>Elpisgarten</strong> veröffentlichen.
      </p>
    </template>
    <template v-else>
      <h2>Charakterverifizierung</h2>
      <p>
        Bevor du Inhalte auf <strong>Elpisgarten</strong> unter diesem Charakter verfassen kannst, musst du deine Eigentümerschaft bestätigen.
      </p>
    </template>
    <q-card class="page-verify__card">
      <q-card-section
        :class="{
          'bg-positive': verificationStatus.characterVerified,
          'text-white': verificationStatus.characterVerified,
        }"
      >
        <h5>Charakterverifizierung</h5>
        <template v-if="verificationStatus.characterVerified">
          <p>
            Dein Charakter
            <strong>{{ $store.getters.character?.name }}</strong> wurde verifiziert.
          </p>
        </template>
        <template v-else-if="!$store.getters.characterId">
          <p>
            Du hast noch keinen Charakter hinzugefügt. Füge zuerst einen Charakter hinzu, um die Verifizierung zu starten.
          </p>
          <q-btn color="primary" label="Charakter hinzufügen" @click="openCharacterDialog" />
        </template>
        <template v-else>
          <p>
            Du musst bestätigen, dass
            <strong>{{ $store.getters.character?.name }}</strong> dein Charakter ist, indem du das Profil im Lodestone
            bearbeitest. Um die Eigentümerschaft dieses Charakters zu bestätigen, sind die folgenden Schritte erforderlich:
          </p>
          <ol>
            <li>
              Oeffne
              <a :href="lodestoneCharacterLink" target="_blank"
                >{{ $store.getters.character?.name }}'s Profilseite im Lodestone
                <q-icon class="external-link-icon" name="launch" /></a
              >.
            </li>
            <li>Bearbeite die "Vorstellung" unterhalb des Charakterbildes.</li>
            <li>
              Kopiere den untenstehenden Code irgendwo in deine Vorstellung.
              <q-input readonly filled dense :model-value="verificationStatus.characterVerificationCode">
                <template v-slot:append>
                  <q-btn flat dense icon="content_copy" title="In Zwischenablage speichern" @click="copyVerificationCode" />
                </template>
              </q-input>
            </li>
            <li>Klicke auf Bestätigen um eine Vorschau deiner Aenderungen zu sehen.</li>
            <li><strong>Klicke erneut auf Bestätigen</strong> um deine Aenderungen zu speichern.</li>
          </ol>
          <p>Diese Seite wird sich automatisch aktualisieren sobald sie den Code in deiner Vorstellung erkennt.</p>
          <div class="page-verify__actions">
            <q-btn
              outline
              color="negative"
              icon="delete"
              label="Falschen Charakter entfernen"
              @click="confirmRemoveCharacter"
            />
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { VerificationStatusDto } from '@app/shared/dto/user/verification-status.dto';
import { copyToClipboard } from 'quasar';
import errors from '@app/shared/errors';
import { Vue } from 'vue-class-component';
import { notifyError, notifySuccess } from 'src/common/notify';

const REFRESH_INTERVAL = 5000;

export default class PageVerify extends Vue {
  verificationStatus: VerificationStatusDto = {
    emailVerified: false,
    characterVerified: false,
    email: '',
    characterVerificationCode: null,
  };

  private refreshTimerId: NodeJS.Timeout|null = null;

  async created() {
    await this.refresh();
  }

  unmounted() {
    // We're leaving the page, so stop the refresh timer.
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  private async refresh() {
    try {
      const characterId = this.$store.getters.characterId;
      if (!characterId) {
        return;
      }

      this.verificationStatus = await this.$api.user.getVerificationStatus(characterId);

      if (!this.verificationStatus.characterVerified) {
        await this.refreshLodestoneStatus();
      }
    } catch (e) {
      console.log(e);
    }

    if (!this.verificationStatus.characterVerified) {
      this.refreshTimerId = setTimeout(() => void this.refresh(), REFRESH_INTERVAL);
    } else {
      // Update user role
      const session = await this.$api.user.getSession();
      this.$store.commit('setUser', session);
    }
  }

  private async refreshLodestoneStatus() {
    try {
      const characterId = this.$store.getters.characterId;
      const verificationCode = this.verificationStatus.characterVerificationCode;

      if (!characterId || !verificationCode) {
        return;
      }

      await this.$api.user.verifyCharacter({ id: characterId });
      // If we get here, this means character verification succeeded.
      this.verificationStatus = await this.$api.user.getVerificationStatus(characterId);
    } catch (e) {
      if (errors.getStatusCode(e) !== 404) {
        console.log(e);
      }
    }
  }

  get lodestoneCharacterLink() {
    const lodestoneId = this.$store.getters.character!.lodestoneId || -1; // guaranteed to exist
    return `https://eu.finalfantasyxiv.com/lodestone/character/${lodestoneId}/`;
  }

  async copyVerificationCode() {
    if (!this.verificationStatus.characterVerificationCode) {
      return;
    }

    try {
      await copyToClipboard(this.verificationStatus.characterVerificationCode);
      notifySuccess('Verifizierungscode wurde in der Zwischenablage gespeichert.');
    } catch (e) {
      notifyError(e);
    }
  }

  async openCharacterDialog() {
    const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;

    this.$q.dialog({
      component: SwitchCharacterDialog
    });
  }

  confirmRemoveCharacter() {
    const characterName = this.$store.getters.character?.name || 'diesen Charakter';
    const characterId = this.$store.getters.characterId;
    if (!characterId) {
      return;
    }

    this.$q.dialog({
      title: 'Charakter entfernen?',
      message: `Möchtest du ${characterName} wirklich entfernen?`,
      cancel: true,
      persistent: true,
    }).onOk(async () => {
      try {
        await this.$api.characters.deleteAccountCharacter(characterId);
        const session = await this.$api.user.getSession();
        this.$store.commit('setUser', session);
        notifySuccess('Charakter wurde entfernt.');

        if (session.characters.length === 0) {
          void this.$router.push('/');
        }
      } catch (e) {
        notifyError(e);
      }
    });
  }
}
</script>

<style lang="scss">
.page-verify__card {
  margin-bottom: 16px;
}

.page-verify__actions {
  margin-top: 12px;
}
</style>
