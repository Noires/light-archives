<template>
  <div v-if="visible" class="calendar-sub">
    <h3 class="calendar-sub__title">Kalender-Abo</h3>

    <p v-if="!loggedIn" class="calendar-sub__text">
      <a href="#" class="calendar-sub__login" @click.prevent="login">Melde dich an</a>,
      um deine Zusagen und gemerkten Events als Abo in deinem Kalender zu sehen.
    </p>

    <div v-else-if="loading" class="calendar-sub__loading" role="status">
      <q-spinner size="20px" />
      <span class="vision-sr-only">Kalender-Abo wird geladen</span>
    </div>

    <template v-else-if="token && token.url">
      <p class="calendar-sub__text">
        Abonniere diesen Link in Google Kalender, Outlook oder Apple Kalender. Zusagen und gemerkte Events erscheinen dann von selbst.
      </p>
      <q-input
        class="calendar-sub__input"
        outlined
        dense
        readonly
        label="Abo-Link"
        :model-value="token.url"
        @focus="selectAll"
      />
      <div class="calendar-sub__actions">
        <q-btn
          flat
          no-caps
          class="elpis-btn elpis-btn--secondary"
          icon="content_copy"
          label="Kopieren"
          @click="copy"
        />
        <q-btn
          flat
          no-caps
          class="elpis-btn elpis-btn--ghost"
          icon="autorenew"
          label="Neuen Link erzeugen"
          :loading="busy === 'create'"
          :disable="!!busy"
          @click="confirmRenew"
        />
        <q-btn
          flat
          no-caps
          class="elpis-btn elpis-btn--ghost"
          icon="link_off"
          label="Abo beenden"
          :loading="busy === 'revoke'"
          :disable="!!busy"
          @click="revoke"
        />
      </div>
      <p class="calendar-sub__note">
        <q-icon name="lock" size="16px" aria-hidden="true" />
        <span>
          Der Link enthält einen privaten Schlüssel. Teile ihn nicht: Wer ihn kennt, sieht deine Zusagen und gemerkten Events.
          Mit „Neuen Link erzeugen“ wird der alte Link sofort ungültig.
        </span>
      </p>
    </template>

    <template v-else>
      <p class="calendar-sub__text">
        Ein persönlicher Link für deinen Kalender: Zusagen und gemerkte Events erscheinen dort von selbst und bleiben aktuell.
      </p>
      <q-btn
        flat
        no-caps
        class="elpis-btn elpis-btn--secondary calendar-sub__create"
        icon="add_link"
        label="Kalender-Abo erstellen"
        :loading="busy === 'create'"
        :disable="!!busy"
        @click="create"
      />
      <p class="calendar-sub__note">
        <q-icon name="lock" size="16px" aria-hidden="true" />
        <span>Der Link enthält einen privaten Schlüssel. Teile ihn nicht. Du kannst ihn jederzeit neu erzeugen oder beenden.</span>
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import type { CalendarTokenDto } from '@app/shared/dto/social/calendar-token.dto';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { canUseSocial, errorStatus, loginWithDiscord, markUnavailable, socialState } from './social-state';

// ER2 social — "Kalender-Abo" in the "Nie wieder verpassen" card of the
// events page: personal ICS feed URL (registered and bookmarked events) with
// copy, rotate and revoke. Guests see a login hint (only if the endpoint
// exists, probed without credentials); the block disappears for
// unverified accounts and when the API has no calendar-token endpoint.

@Options({
  name: 'CalendarSubscription',
  watch: {
    enabled() {
      void (this as CalendarSubscription).load();
    },
  },
})
export default class CalendarSubscription extends Vue {
  token: CalendarTokenDto | null = null;
  loading = true;
  busy: 'create' | 'revoke' | null = null;
  guestEndpointExists = false;

  get loggedIn(): boolean {
    return !!this.$store.getters.realRole;
  }

  get enabled(): boolean {
    return canUseSocial(this.$store.getters.realRole);
  }

  get visible(): boolean {
    if (!this.loggedIn) {
      return this.guestEndpointExists;
    }
    return this.enabled && !socialState.unavailable.calendarToken;
  }

  created() {
    void this.load();
  }

  async load() {
    if (!this.loggedIn) {
      this.loading = false;
      await this.probeForGuest();
      return;
    }
    if (!this.enabled) {
      this.loading = false;
      return;
    }
    this.loading = true;
    try {
      this.token = await this.$api.calendarToken.getCalendarToken();
    } catch (e) {
      markUnavailable('calendarToken', e);
      this.token = null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Guests cannot call the endpoint, but an unauthenticated request tells
   * whether it exists: 401/403 means yes, 404 (older API) means no.
   */
  async probeForGuest() {
    try {
      await this.$axios.get(`${this.$api.prefix}calendar-token`);
      this.guestEndpointExists = true;
    } catch (e) {
      const status = errorStatus(e);
      this.guestEndpointExists = status === 401 || status === 403;
    }
  }

  login() {
    loginWithDiscord(this.$api);
  }

  selectAll(event: FocusEvent) {
    (event.target as HTMLInputElement | null)?.select?.();
  }

  async copy() {
    if (!this.token?.url) {
      return;
    }
    try {
      await copyToClipboard(this.token.url);
      notifySuccess('Abo-Link kopiert.');
    } catch (e) {
      notifyError('Kopieren hat nicht geklappt.');
    }
  }

  async create() {
    this.busy = 'create';
    try {
      this.token = await this.$api.calendarToken.createCalendarToken();
    } catch (e) {
      if (!markUnavailable('calendarToken', e)) {
        notifyError('Der Abo-Link konnte nicht erzeugt werden.');
      }
    } finally {
      this.busy = null;
    }
  }

  confirmRenew() {
    this.$q.dialog({
      title: 'Neuen Link erzeugen?',
      message: 'Der bisherige Link funktioniert danach nicht mehr. Kalender, die ihn abonniert haben, musst du mit dem neuen Link verbinden.',
      cancel: { label: 'Abbrechen', flat: true, noCaps: true },
      ok: { label: 'Neuen Link erzeugen', flat: true, noCaps: true },
      persistent: false,
    }).onOk(() => {
      void this.create();
    });
  }

  async revoke() {
    this.busy = 'revoke';
    try {
      await this.$api.calendarToken.revokeCalendarToken();
      this.token = null;
      notifySuccess('Kalender-Abo beendet. Der Link funktioniert nicht mehr.');
    } catch (e) {
      notifyError('Das Abo konnte nicht beendet werden.');
    } finally {
      this.busy = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.calendar-sub {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--rule-soft);
  font-family: var(--font-ui);
  color: var(--ink-primary);
}

.calendar-sub__title {
  margin: 0 0 6px;
  font: 600 15px/22px var(--font-ui);
  letter-spacing: 0;
  text-align: left;
  color: var(--ink-primary);
}

.calendar-sub__text {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 20px;
  color: var(--ink-muted);
}

.calendar-sub__login {
  color: var(--ink-link);
  font-weight: 600;

  &:focus-visible {
    outline: none;
    border-radius: 4px;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.calendar-sub__loading {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  color: var(--ink-muted);
}

.calendar-sub__input {
  margin-bottom: 8px;

  :deep(input) {
    font-family: var(--font-mono, monospace);
    font-size: 12px;
  }
}

.calendar-sub__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.calendar-sub__note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-muted);

  .q-icon {
    flex: none;
    margin-top: 1px;
  }
}

.calendar-sub__create {
  margin-bottom: 10px;
}
</style>
