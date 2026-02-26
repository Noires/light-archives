<template>
  <q-list class="user-menu" dense dark>
    <template v-if="!$store.getters.role">
      <q-item class="user-menu__discord-login" clickable v-ripple @click="loginWithDiscord">
        <q-item-section avatar class="user-menu__discord-login-icon">
          <svg
            class="user-menu__discord-logo"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            width="800px"
            height="800px"
            viewBox="0 -28.5 256 256"
            version="1.1"
            preserveAspectRatio="xMidYMid"
          >
            <g>
              <path
                d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                fill="#FFFFFF"
                fill-rule="nonzero"
              />
            </g>
          </svg>
        </q-item-section>
        <q-item-section>
          <q-item-label class="user-menu__discord-login-label">
            Login mit Discord
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-separator v-if="sentryConfigured" dark />
      <q-item v-if="sentryConfigured" clickable v-ripple @click="openTelemetryConsentSettings">
        <q-item-section>
          <q-item-label>Datenschutz &amp; Fehlerdiagnose</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template v-else>
      <q-item
        v-if="$store.getters.role !== Role.UNVERIFIED"
        clickable
        v-ripple
        @click="switchCharacter"
      >
        <q-item-section>
          <q-item-label>Charakter wechseln</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator dark />
      <q-item
        v-if="$store.getters.role === Role.UNVERIFIED"
        clickable
        v-ripple
        to="/verify"
      >
        <q-item-section>
          <q-item-label>{{ $store.getters.realRole === Role.UNVERIFIED ? 'Accountverzifizierung' : 'Charakterverifizierung'}}</q-item-label>
        </q-item-section>
      </q-item>
      <template v-else>
        <q-item
          clickable
          v-ripple
          :to="myProfileLink"
        >
          <q-item-section>
            <q-item-label>Profil ansehen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          :to="`/edit-character/${$store.getters.characterId}/profile`"
        >
          <q-item-section>
            <q-item-label>Profil bearbeiten</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-free-company"
        >
          <q-item-section>
            <q-item-label>Meine Freie Gesellschaft</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-community"
        >
          <q-item-section>
            <q-item-label>Community erstellen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-communities"
        >
          <q-item-section>
            <q-item-label>Meine Communities</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-venue"
        >
          <q-item-section>
            <q-item-label>Treffpunkt erstellen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-venues"
        >
          <q-item-section>
            <q-item-label>Meine Treffpunkte</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/create-story"
        >
          <q-item-section>
            <q-item-label>Neue Geschichte</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/create-event"
        >
          <q-item-section>
            <q-item-label>Neues Event</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/create-noticeboard-item"
        >
          <q-item-section>
            <q-item-label>Neuer Aushang</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="$store.getters.isTrusted"
          clickable
          v-ripple
          to="/create-wiki-page"
        >
          <q-item-section>
            <q-item-label>Neuer Wikibeitrag</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          @click="uploadImage"
        >
          <q-item-section>
            <q-item-label>Bild hochladen</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-ripple
          to="/my-content"
        >
          <q-item-section>
            <q-item-label>Meine Inhalte</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator dark />
        <q-item
          clickable
          v-ripple
          to="/support/tickets"
        >
          <q-item-section>
            <q-item-label>Support-Tickets</q-item-label>
          </q-item-section>
        </q-item>
        <q-item
          v-if="canAccessSupportQueue"
          clickable
          v-ripple
          to="/support/queue"
        >
          <q-item-section>
            <q-item-label>Support-Queue</q-item-label>
          </q-item-section>
        </q-item>
      </template>
      <q-separator dark />
      <q-item v-if="sentryConfigured" clickable v-ripple @click="openTelemetryConsentSettings">
        <q-item-section>
          <q-item-label>Datenschutz &amp; Fehlerdiagnose</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator v-if="sentryConfigured" dark />
      <q-item clickable v-ripple @click="logOut">
        <q-item-section>
          <q-item-label>Ausloggen</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { Role, roleImplies } from '@app/shared/enums/role.enum';
import { SessionCharacterDto } from '@app/shared/dto/user/session-character.dto';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { notifyError, notifySuccess } from 'src/common/notify';
import { persistTelemetryConsent } from 'src/common/telemetry-consent-actions';
import { isSentryConfigured } from 'src/common/sentry';

@Options({
  
})
export default class UserMenu extends Vue {
  readonly Role = Role;
  readonly sentryConfigured = isSentryConfigured();

  get canAccessSupportQueue(): boolean {
    const role = this.$store.getters.role;
    return !!role && roleImplies(role, Role.MODERATOR);
  }

  get myProfileLink() {
		const server = this.$store.getters.character?.server || '';
		const character = this.$store.getters.character?.name.replace(/ /g, '_') || '';
		return `/${server}/${character}`;
	}

  async switchCharacter() {
    const SwitchCharacterDialog = (await import('components/character/SwitchCharacterDialog.vue')).default;

    this.$q.dialog({
      component: SwitchCharacterDialog
    }).onOk((character: SessionCharacterDto) => {
      if (character.verified) {
        void this.$router.push('/');
      } else {
        void this.$router.push('/verify');
      }
    });
  }

  async uploadImage() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q.dialog({
      component: UploadDialog
    }).onOk(async (image: ImageSummaryDto) => {
      const PostUploadDialog = (await import('components/upload/PostUploadDialog.vue')).default;

      this.$q.dialog({
        component: PostUploadDialog,
        componentProps: {
          image
        }
      });
    });
  }

  async logOut() {
    try {
      const refreshToken = this.$api.getRefreshToken();
      if (refreshToken) {
        await this.$api.user.logout(refreshToken);
      }
    } catch (e) {
      // Ignore logout errors - continue with local logout
    }
    this.$store.commit('setUser', null);
    this.$api.clearTokens();
    notifySuccess('Du hast dich ausgeloggt.');
    void this.$router.push('/');
  }

  loginWithDiscord() {
    window.location.href = this.$api.user.getDiscordLoginUrl(window.location.origin);
  }

  async openTelemetryConsentSettings() {
    const TelemetryConsentDialog = (await import('components/common/TelemetryConsentDialog.vue')).default;

    this.$q.dialog({
      component: TelemetryConsentDialog,
      componentProps: {
        settingsMode: true,
      },
    }).onOk((status: TelemetryConsentStatus) => {
      void this.onTelemetryConsentSelection(status);
    });
  }

  async onTelemetryConsentSelection(status: TelemetryConsentStatus) {
    try {
      await persistTelemetryConsent(this.$api, this.$store, status);

      if (status === TelemetryConsentStatus.GRANTED) {
        notifySuccess('Freiwillige Fehlerdiagnose wurde aktiviert.');
      } else {
        notifySuccess('Freiwillige Fehlerdiagnose wurde deaktiviert.');
      }
    } catch (e) {
      notifyError(e);
    }
  }
}
</script>

<style lang="scss">
.user-menu__button-bar {
  margin-bottom: 8px;
}

.user-menu__discord-login {
  margin: 0 12px 12px 12px !important;
  padding: 10px 18px !important;
  min-height: 44px;
  background: #5865f2 !important;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  gap: 10px;
}

.user-menu__discord-login .q-focus-helper {
  display: none;
}

.user-menu__discord-login .q-item__section {
  color: #ffffff;
  padding: 0;
  min-width: auto;
}

.user-menu__discord-login .q-item__section--avatar {
  min-width: auto !important;
}

.user-menu__discord-login:hover {
  background: #4752c4 !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.24);
}

.user-menu__discord-login:active {
  background: #3c45a5 !important;
  transform: translateY(1px);
}

.user-menu__discord-logo {
  width: 22px;
  height: 22px;
  display: block;
}

.user-menu__discord-login-label {
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  color: #ffffff !important;
}

</style>
