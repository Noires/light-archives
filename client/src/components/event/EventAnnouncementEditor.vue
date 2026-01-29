<template>
  <q-card class="event-announcement-editor">
    <q-card-section>
      <div>Poste eine VorankÃ¼ndigung auf Discord relativ zum Eventbeginn:</div>
      <div>
        <q-option-group :options="options" :model-value="minutesBefore" @update:model-value="setMinutesBefore" />
      </div>
      <q-input v-model.number="modelValue.minutesBefore" v-if="custom" label="Benutzerdefiniert" style="width: 200px">
        <template v-slot:after><span style="font-size: 16px">Minuten</span></template>
      </q-input>
      <div>Inhalt der VorankÃ¼ndigung:</div>
      <q-input
				input-style="height: 300px"
        type="textarea"
        outlined
        v-model="modelValue.content"
      />
      <div class="text-caption">Discordformatierung (Markdown) kann genutzt werden. Um eine Rolle zu erwÃ¤hnen, fÃ¼ge ein @-Symbol vor die Rolle: <strong>@eventankÃ¼ndigungen</strong>. Um einen Nutzer zu erwÃ¤hnen, verwende deren Discordname <strong>@UserName#1234</strong> oder Nickname auf dem Server in geschweiften Klammern: <strong>@{Sharshulam Noykin [Shiva]}</strong>. Wenn du das Feld leer lÃ¤sst, wird automatisch der Eventtext verwendet.</div>
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat color="negative" label="VorankÃ¼ndigung entfernen" @click="onRemoveClick" />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts">
import { EventAnnouncementDto } from '@app/shared/dto/events/event-announcement.dto';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  modelValue = prop<EventAnnouncementDto>({
    required: true,
  });
}

@Options({
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

  onRemoveClick() {
    this.$emit('remove');
  }
}
</script>
