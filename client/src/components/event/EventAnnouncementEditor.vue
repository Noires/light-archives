<template>
  <q-card class="event-announcement-editor">
    <q-card-section>
      <div>Poste eine Vorankündigung auf Discord relativ zum Eventbeginn:</div>
      <div>
        <q-option-group :options="options" :model-value="minutesBefore" @update:model-value="setMinutesBefore" />
      </div>
      <q-input v-model.number="modelValue.minutesBefore" v-if="custom" label="Benutzerdefiniert" style="width: 200px">
        <template v-slot:after><span style="font-size: 16px">Minuten</span></template>
      </q-input>
      <div>Inhalt der Vorankündigung:</div>
      <q-input
				input-style="height: 300px"
        type="textarea"
        outlined
        v-model="modelValue.content"
      />
      <div class="text-caption">
        Discordformatierung (Markdown) kann genutzt werden. Um eine Rolle zu erwähnen, füge ein @-Symbol vor die Rolle:
        <strong>@eventankündigungen</strong>. Gepingt werden nur Rollen, die auf dem Server als erwähnbar markiert sind;
        <strong>@everyone</strong> und <strong>@here</strong> nie. Um eine Person zu erwähnen, schreib ihren Nickname,
        Anzeigenamen oder Discord-Nutzernamen in geschweifte Klammern: <strong>@{Sharshulam Noykin [Shiva]}</strong>.
        Wenn du das Feld leer lässt, wird automatisch der Eventtext verwendet.
      </div>
    </q-card-section>
    <q-card-section v-if="event" class="event-announcement-editor__preview">
      <div class="event-announcement-editor__preview-label">So sieht die Erinnerung auf Discord aus</div>
      <discord-message-preview
        :message="previewMessage"
        :label="event.title"
        caption="Zeiten erscheinen bei allen in ihrer eigenen Ortszeit, mit Countdown. Ändert sich das Event, wird die Erinnerung auf Discord angepasst; wird es gelöscht, erscheint sie als „Abgesagt“."
      />
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="negative" label="Vorankündigung entfernen" @click="onRemoveClick" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventAnnouncementDto } from '@app/shared/dto/events/event-announcement.dto';
import { Options, prop, Vue } from 'vue-class-component';
import DiscordMessagePreview from '../vision/DiscordMessagePreview.vue';
import { DiscordPreviewMessage } from '../vision/discord-preview';
import { buildEventReminderPreview } from './discord-reminder';

class Props {
  modelValue = prop<EventAnnouncementDto>({
    required: true,
  });

  /** The event being edited, for the live Discord preview. */
  event = prop<(BaseEventDto & { id?: number }) | null>({
    default: null,
  });
}

@Options({
  components: { DiscordMessagePreview },
  emits: ['remove'],
})
export default class EventAnnouncementEditor extends Vue.with(Props) {
  readonly options = [
    {
      label: '2 Wochen',
      value: 20160,
    },
    {
      label: '1 Woche',
      value: 10080,
    },
    {
      label: '2 Tage',
      value: 2880,
    },
    {
      label: '6 Stunden',
      value: 360,
    },
    {
      label: '1 Stunde',
      value: 60,
    },
    {
      label: '15 Minuten',
      value: 15,
    },
    {
      label: '3 Stunden nach Eventbeginn',
      value: -180,
    },
    {
      label: 'Benutzerdefiniert',
      value: -1,
    },
  ];

  private readonly presetValues = new Set([20160, 10080, 2880, 360, 60, 15, -180]);

  custom = false;

  created() {
    if (!this.presetValues.has(this.modelValue.minutesBefore)) {
      this.custom = true;
    }
  }

  get minutesBefore() {
    return this.custom ? -1 : this.modelValue.minutesBefore;
  }

  setMinutesBefore(newMinutesBefore: number) {
    if (newMinutesBefore === -1) {
      this.custom = true;
    } else {
      this.custom = false;
      this.modelValue.minutesBefore = newMinutesBefore;
    }
  }

  get previewMessage(): DiscordPreviewMessage {
    return buildEventReminderPreview(this.event!, this.modelValue, window.location.origin);
  }

  onRemoveClick() {
    this.$emit('remove');
  }
}
</script>

<style lang="scss">
.event-announcement-editor__preview {
  display: grid;
  gap: 8px;
}

.event-announcement-editor__preview-label {
  font: 600 11px/16px var(--font-ui);
  letter-spacing: var(--ls-eyebrow, 0.08em);
  text-transform: uppercase;
  color: var(--ink-muted);
}
</style>
