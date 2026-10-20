<template>
  <section v-if="!hidden" class="notification-prefs" aria-labelledby="notification-prefs-title">
    <h2 id="notification-prefs-title" class="notification-prefs__title">Einstellungen</h2>
    <div v-if="loading" class="notification-prefs__loading" role="status">
      <q-spinner size="22px" />
      <span class="vision-sr-only">Einstellungen werden geladen</span>
    </div>
    <template v-else>
      <p class="notification-prefs__lead">Worüber möchtest du in Elpisgarten benachrichtigt werden?</p>
      <ul class="notification-prefs__list">
        <li v-for="option in typeOptions" :key="option.key">
          <q-toggle
            class="notification-prefs__toggle"
            :model-value="!!prefs[option.key]"
            :label="option.label"
            :disable="saving === option.key"
            @update:model-value="(value) => save(option.key, value)"
          />
        </li>
      </ul>

      <q-select
        class="notification-prefs__select"
        outlined
        dense
        emit-value
        map-options
        label="Event-Erinnerung"
        :options="minuteOptions"
        :model-value="prefs.reminderMinutes"
        :disable="!prefs.eventReminder || saving === 'reminderMinutes'"
        @update:model-value="(value) => save('reminderMinutes', value)"
      />
    </template>
  </section>
</template>

<script lang="ts">
import type { NotificationPreferencesDto } from '@app/shared/dto/social/notification.dto';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';
import { markUnavailable } from './social-state';

// ER2 social — "Einstellungen" card on /benachrichtigungen: one toggle per
// notification type and the reminder lead time. Each
// change is saved at once (PUT with just that field) and rolled back on
// failure. Hidden when the preferences endpoint is missing.

type PrefKey = keyof NotificationPreferencesDto;
type FlagKey = Exclude<PrefKey, 'reminderMinutes'>;

const BASE_MINUTES = [ 15, 30, 60, 120 ];

function minuteLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1 Stunde vorher' : `${hours} Stunden vorher`;
  }
  return `${minutes} Minuten vorher`;
}

@Options({
  name: 'NotificationPreferencesCard',
})
export default class NotificationPreferencesCard extends Vue {
  readonly typeOptions: { key: FlagKey; label: string }[] = [
    { key: 'seriesPart', label: 'Neue Teile verfolgter Serien' },
    { key: 'authorStory', label: 'Neue Geschichten verfolgter Autor:innen' },
    { key: 'venueEvent', label: 'Neue Events verfolgter Treffpunkte' },
    { key: 'eventReminder', label: 'Event-Erinnerungen' },
    { key: 'eventRegistration', label: 'Anmeldungen zu meinen Events' },
    { key: 'imageTag', label: 'Markierungen auf Bildern' },
  ];

  prefs: NotificationPreferencesDto = {};
  loading = true;
  hidden = false;
  saving: PrefKey | null = null;

  get minuteOptions(): { label: string; value: number }[] {
    const values = [ ...BASE_MINUTES ];
    const current = this.prefs.reminderMinutes;
    if (current && !values.includes(current)) {
      values.push(current);
      values.sort((a, b) => a - b);
    }
    return values.map((value) => ({ label: minuteLabel(value), value }));
  }

  created() {
    void this.load();
  }

  async load() {
    try {
      this.prefs = await this.$api.notifications.getPreferences();
    } catch (e) {
      markUnavailable('notifications', e);
      this.hidden = true;
    } finally {
      this.loading = false;
    }
  }

  async save(key: PrefKey, value: boolean | number | null) {
    if (value === null || value === undefined) {
      return;
    }
    const previous = this.prefs[key];
    this.prefs = { ...this.prefs, [key]: value };
    this.saving = key;
    try {
      const result = await this.$api.notifications.updatePreferences({ [key]: value });
      if (result && typeof result === 'object') {
        this.prefs = { ...this.prefs, ...result };
      }
    } catch (e) {
      this.prefs = { ...this.prefs, [key]: previous };
      notifyError('Die Einstellung konnte nicht gespeichert werden.');
    } finally {
      this.saving = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.notification-prefs {
  padding: 18px 18px 16px;
  font-family: var(--font-ui);
  color: var(--ink-primary);
  background: var(--vision-card);
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
}

.notification-prefs__title {
  margin: 0 0 4px;
  font: 600 18px/26px var(--font-display);
  letter-spacing: 0;
  text-align: left;
  color: var(--ink-primary);
}

.notification-prefs__lead {
  margin: 0;
  font: 400 13px/19px var(--font-ui);
  color: var(--ink-muted);
}

.notification-prefs__loading {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  color: var(--ink-muted);
}

.notification-prefs__list {
  margin: 10px 0 14px;
  padding: 0;
  list-style: none;
}

.notification-prefs__toggle {
  width: 100%;
  font-size: 14px;
  line-height: 20px;
  color: var(--ink-primary);

  :deep(.q-toggle__label) {
    flex: 1;
  }
}
</style>
