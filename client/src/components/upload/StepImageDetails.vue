<template>
  <q-form class="step-image-details elpis-form">
    <character-selector
      v-model="modelValue.characterId"
      :rules="[$rules.required('Bitte wähle einen Charakter aus.')]"
      @update:model-value="onModelUpdated"
    />
    <div class="step-image-details__category-label">Kategorie:</div>
    <q-option-group
      class="step-image-details__categories"
      v-model="modelValue.category"
      :options="categories"
      color="primary"
      inline
      @update:model-value="onModelUpdated"
    />
    <div class="step-image-details__hint">{{ categoryHints[modelValue.category] }}</div>
    <q-slide-transition>
      <section v-if="modelValue.category !== ImageCategory.UNLISTED">
        <q-input
          label="Titel *"
          v-model="modelValue.title"
          :rules="[$rules.required('Dieses Feld ist erforderlich.')]"
          filled
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
          filled
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
          filled
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
    <!-- ER2 round 2: albums (hidden when the API has none or lacks the endpoint) -->
    <q-select
      v-if="albumOptions.length"
      class="step-image-details__albums"
      :model-value="modelValue.albumIds || []"
      :options="albumOptions"
      label="Alben"
      hint="Optional: Bild in eines oder mehrere deiner Alben einsortieren."
      multiple
      emit-value
      map-options
      use-chips
      filled
      @update:model-value="onAlbumsUpdated"
    />
    <q-input
      class="step-image-details__credits"
      label="Credits *"
      v-model="modelValue.credits"
      :rules="[$rules.required('Dieses Feld ist erforderlich.')]"
      filled
      @update:model-value="onModelUpdated"
    />
    <div class="step-image-details__hint">
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

  /** Owner of an existing image (edit mode); otherwise modelValue.characterId is used. */
  albumCharacterId = prop<number | null>({
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
  watch: {
    albumOwnerId() {
      void (this as StepImageDetails).loadAlbums();
    },
  },
})
export default class StepImageDetails extends Vue.with(Props) {
  readonly ImageCategory = ImageCategory;

  categories: { label: string; value: ImageCategory }[];

  eventOptions: EventSearchResultDto[] = [];
  eventOptionsSearchString = '';
  editableVenues: VenueSummaryDto[] = [];
  loadingEditableVenues = false;
  albumOptions: { label: string; value: number }[] = [];
  private albumsToken = 0;

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
    void this.loadAlbums();
  }

  get albumOwnerId(): number | null {
    return this.albumCharacterId || this.modelValue?.characterId || null;
  }

  async loadAlbums() {
    const token = ++this.albumsToken;
    const ownerId = this.albumOwnerId;

    if (!ownerId) {
      this.albumOptions = [];
      return;
    }

    try {
      const albums = await this.$api.albums.getAlbums(ownerId);

      if (token === this.albumsToken) {
        this.albumOptions = albums
          .filter((album) => album.ownerId === ownerId)
          .map((album) => ({ label: album.title, value: album.id }));

        // Drop selections that belong to another character's albums.
        const valid = new Set(this.albumOptions.map((option) => option.value));
        if (this.modelValue.albumIds && this.modelValue.albumIds.some((id) => !valid.has(id))) {
          this.modelValue.albumIds = this.modelValue.albumIds.filter((id) => valid.has(id));
          this.onModelUpdated();
        }
      }
    } catch {
      // Older API without albums.
      if (token === this.albumsToken) {
        this.albumOptions = [];
      }
    }
  }

  onAlbumsUpdated(ids: number[] | null) {
    this.modelValue.albumIds = ids || [];
    this.onModelUpdated();
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
// ELPIS-608 — StepImageDetails form refinements. Inputs picked up the
// `filled` prop so they can opt into the shared `.elpis-form` field chrome
// (see app.scss). Layout untouched per the AC ("no layout change") — the
// only structural change is wrapping the bare "Kategorie:" and the two
// caption hints in named classes so they pick up the eyebrow + muted-ink
// idiom rather than reading as Quasar default body text.
.step-image-details__category-label {
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 12px;
  margin-bottom: 6px;
}

.step-image-details__categories {
  margin-bottom: 4px;
}

.step-image-details__hint {
  font-family: var(--font-section);
  font-style: italic;
  font-size: var(--type-scale-1);
  color: var(--ink-muted);
  line-height: var(--lh-body);
  margin-top: 4px;
  margin-bottom: 8px;
}

.step-image-details__description-label {
  font-family: var(--font-ui);
  font-size: var(--type-scale-0);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-muted);
  margin-top: 12px;
  margin-bottom: 6px;
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

.step-image-details__albums {
  margin-top: 8px;
}

body.body--dark .step-image-details__category-label,
body.body--dark .step-image-details__description-label,
body.body--dark .step-image-details__hint {
  color: rgba(217, 225, 234, 0.74);
}
</style>
