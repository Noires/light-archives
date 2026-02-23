<template>
  <q-form class="step-image-details">
    <character-selector
      v-model="modelValue.characterId"
      :rules="[$rules.required('Bitte wähle einen Charakter aus.')]"
      @update:model-value="onModelUpdated"
    />
    Kategorie:
    <q-option-group
      v-model="modelValue.category"
      :options="categories"
      color="primary"
      inline
      @update:model-value="onModelUpdated"
    />
    <div class="text-caption">{{ categoryHints[modelValue.category] }}</div>
    <q-slide-transition>
      <section v-if="modelValue.category !== ImageCategory.UNLISTED">
        <q-input
          label="Titel *"
          v-model="modelValue.title"
          :rules="[$rules.required('Dieses Feld ist erforderlich.')]"
          @update:model-value="onModelUpdated"
        />
        <div class="step-image-details__description-label">Beschreibung:</div>
        <html-editor
          v-model="modelValue.description"
          :allow-images="false"
          height="200px"
          @update:model-value="onModelUpdated"
        />
        <q-select
          class="step-select-image__event-link"
          v-model="modelValue.event"
          :display-value="modelValue.event ? modelValue.event.title : null"
          :options="eventOptions"
          :option-label="(option) => `${option.title} (${$display.formatDate(option.startDateTime)})`"
          hide-dropdown-icon
          use-input
          clearable
          input-debounce="200"
          label="Eventlink"
          hint="Fang an zu schreiben, wir werden versuchen das Event zu finden."
          @filter="onEventFilter"
          @update:model-value="onModelUpdated"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Keine Ergebnisse
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-select
          class="step-select-image__venue-link"
          v-model="modelValue.venue"
          :display-value="modelValue.venue ? venueOptionLabel(modelValue.venue) : null"
          :options="editableVenues"
          :option-label="venueOptionLabel"
          clearable
          label="Treffpunktlink"
          hint="Optional: Bild einem Treffpunkt zuordnen."
          :loading="loadingEditableVenues"
          @update:model-value="onModelUpdated"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Keine editierbaren Treffpunkte
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </section>
    </q-slide-transition>
    <q-input
      class="step-image-details__credits"
      label="Credits *"
      v-model="modelValue.credits"
      :rules="[$rules.required('Dieses Feld ist erforderlich.')]"
      @update:model-value="onModelUpdated"
    />
    <div class="text-caption">
      Bitte nenne den Künstler des Bildes. Solltest du es selbst gemacht haben, schreibe
      "Von mir erstellt" oder etwas ähnliches. Poste keine urheberrechtlich geschützten Inhalte
      ohne Erlaubnis.
    </div>
  </q-form>
</template>

<script lang="ts">
import { EventSearchResultDto } from '@app/shared/dto/events/event-search-result.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import CharacterSelector from 'components/common/CharacterSelector.vue';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import { QForm } from 'quasar';
import { Options, prop, Vue } from 'vue-class-component';
import { ImageDetailsModel } from './image-details-model';

class Props {
  modelValue = prop<ImageDetailsModel>({
    default: null,
  });
}

@Options({
  name: 'StepImageDetails',
  components: {
    CharacterSelector,
    HtmlEditor,
  },
  emits: ['update:model-value'],
})
export default class StepImageDetails extends Vue.with(Props) {
  readonly ImageCategory = ImageCategory;

  categories: { label: string; value: ImageCategory }[];

  eventOptions: EventSearchResultDto[] = [];
  eventOptionsSearchString = '';
  editableVenues: VenueSummaryDto[] = [];
  loadingEditableVenues = false;

  categoryHints = {
    [ImageCategory.UNLISTED]:
      'Dein Bild wird nicht auf dem Dashbord und in den Galerien angezeigt.',
    [ImageCategory.ARTWORK]: 'Dein Bild wird in der Künstlergalerie angezeigt.',
    [ImageCategory.SCREENSHOT]:
      'Dein Bild wird in der Screenshotgalerie angezeigt.',
  };

  created() {
    this.categories = Object.keys(this.$display.imageCategories).map(
      (category) => ({
        label: this.$display.imageCategories[category],
        value: category as ImageCategory,
      })
    );
    void this.loadEditableVenues();
  }

  async loadEditableVenues() {
    if (!this.$store.getters.characterId) {
      this.editableVenues = [];
      return;
    }

    this.loadingEditableVenues = true;
    try {
      this.editableVenues = await this.$api.venues.getEditableVenues();
    } finally {
      this.loadingEditableVenues = false;
    }
  }

  venueOptionLabel(venue: VenueSummaryDto): string {
    return `${venue.name} (${venue.server})`;
  }

  async onEventFilter(value: string, update: () => void, abort: () => void) {
    value = value.trim();

    if (!value) {
      abort();
      return;
    }

    try {
      this.eventOptionsSearchString = value;
      const results = await this.$api.events.searchEvents(value);

      if (this.eventOptionsSearchString !== value) {
        // Too late
        return;
      }

      this.eventOptions = results;      
      update();
    } catch (e) {
      abort();
      throw e;
    }
	}

	onModelUpdated() {
		this.$emit('update:model-value', this.modelValue);
	}

  validate(): Promise<boolean> {
    return (this.$refs.form as QForm).validate();
  }
}
</script>

<style lang="scss">
.step-image-details__description-label {
  margin-top: 8px;
  margin-bottom: 8px;
}

.step-image-details__event-link {
  margin-top: 8px;
}

.step-image-details__credits {
  margin-top: 8px;
}

.step-select-image__venue-link {
  margin-top: 8px;
}
</style>
