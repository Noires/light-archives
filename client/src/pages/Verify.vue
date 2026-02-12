<template>
  <q-page class="page-verify">
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
        :class="[
          'page-verify__card-section',
          {
            'bg-positive': verificationStatus.characterVerified,
            'text-white': verificationStatus.characterVerified,
          }
        ]"
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
          <ol class="page-verify__steps">
            <li>
              Öffne
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
            <li>Klicke auf Bestätigen, um eine Vorschau deiner Änderungen zu sehen.</li>
            <li><strong>Klicke erneut auf Bestätigen</strong> um deine Änderungen zu speichern.</li>
          </ol>
          <p>Diese Seite wird sich automatisch aktualisieren, sobald sie den Code in deiner Vorstellung erkennt.</p>
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
import { Options, Vue } from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import { notifyError, notifySuccess } from 'src/common/notify';

const REFRESH_INTERVAL = 5000;

@Options({})
export default class PageVerify extends Vue {
  verificationStatus: VerificationStatusDto = {
    characterVerified: false,
    characterVerificationCode: null,
  };

  private refreshTimerId: NodeJS.Timeout|null = null;
  private isUnmounted = false;
  private currentCharacterId: number|null = null;

  async created() {
    this.currentCharacterId = this.$store.getters.characterId;
    await this.refresh();
  }

  unmounted() {
    this.isUnmounted = true;
    // We're leaving the page, so stop the refresh timer.
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }

  @Watch('$store.getters.characterId')
  private async onCharacterChange() {
    const newCharacterId = this.$store.getters.characterId;

    // Don't refresh if character ID is null (all characters deleted)
    if (!newCharacterId) {
      return;
    }

    // Don't refresh if character ID hasn't actually changed
    if (newCharacterId === this.currentCharacterId) {
      return;
    }

    // Update tracked character ID
    this.currentCharacterId = newCharacterId;

    // Stop the current refresh timer
    if (this.refreshTimerId !== null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    // Reset verification status
    this.verificationStatus = {
      characterVerified: false,
      characterVerificationCode: null,
    };

    // Fetch new character's verification status
    await this.refresh();
  }

  private async refresh() {
    const characterId = this.$store.getters.characterId;
    if (!characterId) {
      return;
    }

    try {
      const verificationStatus = await this.$api.user.getVerificationStatus(characterId);

      // Check if component was unmounted or character changed during API call
      if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
        return;
      }

      this.verificationStatus = verificationStatus;

      if (!this.verificationStatus.characterVerified) {
        await this.refreshLodestoneStatus();
      }
    } catch (e) {
      console.log(e);
      // Don't schedule retry if component is unmounted or character changed
      if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
        return;
      }
    }

    // Check again before scheduling next refresh or updating session
    if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
      return;
    }

    if (!this.verificationStatus.characterVerified) {
      this.refreshTimerId = setTimeout(() => void this.refresh(), REFRESH_INTERVAL);
    } else {
      // Character was just verified - update session and refresh status
      try {
        const session = await this.$api.user.getSession();

        // Check if component was unmounted or character changed during API call
        if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
          return;
        }

        this.$store.commit('setUser', session);

        // Refresh local component state to reflect verified status
        const updatedStatus = await this.$api.user.getVerificationStatus(characterId);

        // Final check before updating state
        if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
          return;
        }

        this.verificationStatus = updatedStatus;
      } catch (e) {
        console.log('Failed to update session after verification:', e);
        // Continue showing verified state even if session update fails
      }
    }
  }

  private async refreshLodestoneStatus() {
    const characterId = this.$store.getters.characterId;
    const verificationCode = this.verificationStatus.characterVerificationCode;

    if (!characterId || !verificationCode) {
      return;
    }

    try {
      await this.$api.user.verifyCharacter({ id: characterId });

      // Check if component was unmounted or character changed during API call
      if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
        return;
      }

      // If we get here, this means character verification succeeded.
      const updatedStatus = await this.$api.user.getVerificationStatus(characterId);

      // Final check before updating state
      if (this.isUnmounted || this.$store.getters.characterId !== characterId) {
        return;
      }

      this.verificationStatus = updatedStatus;
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
.page-verify {
  max-width: 960px;
  margin: 0 auto;
}

.page-verify h2 {
  font-family: Michroma, sans-serif;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.page-verify > p {
  font-size: 1.05rem;
  color: #333;
}

.page-verify__card {
  margin: 18px 0 16px;
  border-radius: 18px;
  border: 1px solid rgba(221, 180, 118, 0.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 246, 242, 0.98));
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  animation: page-verify-rise 420ms ease-out both;
}

.page-verify__card-section {
  position: relative;
  padding: 20px 24px 24px;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.page-verify__card-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(800px 200px at 0% 0%, rgba(221, 180, 118, 0.16), transparent);
  opacity: 0.9;
  pointer-events: none;
}

.page-verify__card-section.bg-positive::before {
  opacity: 0.2;
}

.page-verify__card-section > * {
  position: relative;
  z-index: 1;
}

.page-verify__steps {
  margin: 14px 0 12px;
  padding-left: 18px;
  display: grid;
  gap: 8px;
}

.page-verify__steps li {
  line-height: 1.45;
}

.page-verify__actions {
  margin-top: 12px;
}

@keyframes page-verify-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 700px) {
  .page-verify__card-section {
    padding: 16px 16px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-verify__card {
    animation: none;
  }
}
</style>
