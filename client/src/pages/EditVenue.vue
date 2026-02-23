<template>
  <q-page class="page-edit-venue">
    <template v-if="loaded">
      <h2>{{ venueId ? 'Treffpunkt bearbeiten' : 'Treffpunkt erstellen' }}</h2>
      <q-form ref="form" @submit="onSubmit">
        <template v-if="!preview">
          <section class="page-edit-venue__form-controls">
            <character-selector
              v-if="!venueId"
              v-model="selectedCharacterId"
              :rules="[
                $rules.required('Bitte wähle einen Charakter aus.'),
              ]"
            />
            <q-input
              v-model="venue.name"
              label="Name *"
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            />
            <world-select
              v-model="venue.server"
              label="Welt *"
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            />
            <q-input
              class="page-edit-venue__founded-at"
              label="Gründung"
              :model-value="foundedAtDisplay"
              readonly
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            >
              <template v-slot:append>
                <template v-if="venue.foundedAt">
                  <q-icon name="clear" class="cursor-pointer" @click="venue.foundedAt = null" />&nbsp;
                </template>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxy" cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="venue.foundedAt" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Schließen" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              v-model="venue.website"
              label="Webseite"
              :rules="[
                $rules.url('Bitte hinterlasse einen Link.'),
              ]"
            />
            <q-input
              v-model="venue.purpose"
              label="Zweck"
            />
            <q-input
              v-model="venue.status"
              label="Status"
            />
            <div class="text-caption">Du kannst [[Wikilinks]], z.B. [[Charaktername]], in <strong>Zweck</strong> und <strong>Status</strong> nutzen.</div>
            <q-input
              :model-value="tags"
              @update:model-value="onTagsChanged"
              label="Schlagworte (mit Komma getrennt)"
            />
            <h6>Location</h6>
            <q-option-group
              inline
              v-model="venue.location"
              :options="locationOptions"
              @update:model-value="onLocationUpdated"
            />
            <template v-if="venue.location === VenueLocation.OPEN_WORLD">
              <q-input
                v-model="venue.address"
                label="Adresse *"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />
            </template>
            <template v-else>
              <q-select
                label="Wohngebiet *"
                v-model="venue.housingArea"
                :options="housingAreaOptions"
                emit-value
                map-options
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />
              <q-input
                class="page-edit-venue__number-input"
                v-model.number="venue.ward"
                label="Bezirk *"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                  $rules.integer('Bitte eine Nummer angeben.'),
                  $rules.minValue(SharedConstants.housing.MIN_WARD_NUMBER, `Bezirksnummer kann nicht kleiner sein als ${SharedConstants.housing.MIN_WARD_NUMBER}.`),
                  $rules.maxValue(SharedConstants.housing.MAX_WARD_NUMBER, `Bezirksnummer kann nicht größer sein als ${SharedConstants.housing.MAX_WARD_NUMBER}.`),
                ]"
              />
              <template v-if="venue.location === VenueLocation.HOUSE">
                <q-input
                class="page-edit-venue__number-input"
                  v-model.number="venue.plot"
                  label="Grundstück *"
                  :rules="[
                    $rules.required('Dieses Feld ist erforderlich.'),
                    $rules.integer('Bitte eine Nummer angeben.'),
                    $rules.minValue(SharedConstants.housing.MIN_MAIN_WARD_PLOT, `Grundstücksnummer kann nicht kleiner sein als ${SharedConstants.MIN_MAIN_WARD_PLOT}.`),
                    $rules.maxValue(SharedConstants.housing.MAX_SUBDIVISION_PLOT, `Grundstücksnummer kann nicht größer sein als ${SharedConstants.housing.MAX_SUBDIVISION_PLOT}.`),
                  ]"
                  @update:model-value="onPlotUpdated"
                />
                <q-checkbox :model-value="venue.subdivision" label="Erweiterung" disable />
              </template>
              <template v-else-if="venue.location === VenueLocation.APARTMENT">
                <q-input
                  v-model="venue.room"
                  label="Wohnung *"
                  :rules="[
                    $rules.required('Dieses Feld ist erforderlich.'),
                    (val) => parseInt(val, 10) >= SharedConstants.housing.MIN_APARTMENT_NUMBER || `Wohnungsnummer kann nicht kleiner sein als ${SharedConstants.housing.MIN_APARTMENT_NUMBER}.`,
                    (val) => parseInt(val, 10) <= SharedConstants.housing.MAX_APARTMENT_NUMBER || `Wohnungsnummer kann nicht größer sein als ${SharedConstants.housing.MAX_APARTMENT_NUMBER}.`,
                  ]"
                />
                <q-checkbox v-model="venue.subdivision" label="Erweiterung" />
              </template>
            </template>
          </section>
          <banner-edit-section v-model="venue.banner" />
          <h6>Beschreibung</h6>
          <html-editor v-model="venue.description" />
          <h6>Unterseiten</h6>
          <q-checkbox v-model="venue.showRules" label="Regeln anzeigen" />
          <html-editor v-if="venue.showRules" v-model="venue.rules" />
          <q-checkbox v-model="venue.showPremises" label="Raeumlichkeiten anzeigen" />
          <html-editor v-if="venue.showPremises" v-model="venue.premises" />
          <q-checkbox v-model="venue.showMenu" label="Speisekarte anzeigen" />
          <html-editor v-if="venue.showMenu" v-model="venue.menu" />
          <q-checkbox v-model="venue.showStaff" label="Mitarbeiterseite anzeigen" />
          <q-checkbox v-model="venue.showJobs" label="Stellenangebote anzeigen (aus Anschlagbrett)" />
          <q-checkbox v-model="venue.showOoc" label="OOC-Seite anzeigen" />
          <html-editor v-if="venue.showOoc" v-model="venue.ooc" />
          <q-checkbox v-model="venue.showMedia" label="Medienseite anzeigen (aus Galerie)" />
          <q-checkbox v-model="venue.showEvents" label="Eventseite anzeigen" />
          <q-checkbox v-model="venue.showNetwork" label="Vernetzung anzeigen" />
          <html-editor v-if="venue.showNetwork" v-model="venue.network" />
          <h6>Event-Vorlage</h6>
          <q-input
            v-model="venue.eventContact"
            label="Event-Kontakt"
          />
          <q-input
            v-model="venue.eventLink"
            label="Event-Link"
            :rules="[
              $rules.url('Bitte hinterlasse einen Link.'),
            ]"
          />
          <h6>Event-Beschreibung</h6>
          <html-editor v-model="venue.eventDescription" />
          <h6>Event-OOC Details</h6>
          <html-editor v-model="venue.eventOocDetails" />
          <h6>Event-Inhaltswarnungen</h6>
          <Multiselect
            v-model="venue.eventContentNotes"
            :options="contentNoteOptions"
            mode="tags"
            :searchable="true"
            :closeOnSelect="false"
            valueProp="value"
            track-by="label"
            label="label"
          />
          <carrd-edit-section
            class="page-edit-venue__form-controls"
            entity-type="venue"
            v-model="venue.carrdProfile"
          />
        </template>
        <section v-else class="page-edit-venue__preview">
          <venue-profile :venue="venue" :preview="true" />
        </section>
        <div class="page-edit-venue__button-bar">
          <q-btn-toggle
            v-model="preview"
            :options="previewOptions"
            toggle-color="secondary"
          />
          <div class="page-edit-venue__revert-submit">
            <q-btn label="Zurücksetzen" color="secondary" @click="revert" />&nbsp;
            <q-btn label="Änderungen speichern" type="submit" color="primary" />
          </div>
        </div>
        <q-inner-loading :showing="saving" />
      </q-form>
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm"
            >Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Bearbeitung fortsetzen" color="secondary" v-close-popup />
          <q-btn
            flat
            label="Zurücksetzen"
            color="negative"
            v-close-popup
            @click="onConfirmRevert"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import Multiselect from '@vueform/multiselect';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import errors from '@app/shared/errors';
import SharedConstants from '@app/shared/SharedConstants';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CarrdEditSection from 'src/components/common/CarrdEditSection.vue';
import CharacterSelector from 'src/components/common/CharacterSelector.vue';
import WorldSelect from 'src/components/common/WorldSelect.vue';
import VenueProfile from 'src/components/venues/VenueProfile.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();

async function load(params: RouteParams): Promise<{ venue: VenueDto | null; contentNotes: { name: string }[] }> {
	const id = parseInt(params.id as string, 10);
  const contentNotes = await $api.contentNotes.getContentNotes();

	if (!id) {
		return { venue: null, contentNotes };
	}

	try {
		const venue = await $api.venues.getVenue(id);
		return { venue, contentNotes };
	} catch (e) {
		if (errors.getStatusCode(e) === 404) {
			notifyError('Treffpunkt konnte nicht gefunden werden.');
		} else {
			notifyError(errors.getMessage(e));
		}

    void $router.replace('/');
		throw e;
	}
}

@Options({
  name: 'PageEditVenue',
  components: {
    VenueProfile,
    HtmlEditor,
    BannerEditSection,
    CarrdEditSection,
    CharacterSelector,
    WorldSelect,
    Multiselect,
  },
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => (vm as PageEditVenue).setContent(content));
	},
	async beforeRouteUpdate(to) {
		(this as PageEditVenue).setContent(await load(to.params));
	},
})
export default class PageEditVenue extends Vue {
  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  readonly VenueLocation = VenueLocation;

  readonly SharedConstants = SharedConstants;

	venueId: number|null = null;
  venue = new VenueDto();
  venueBackup = new VenueDto();
  contentNoteOptions: { label: string; value: string }[] = [];

  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

  selectedCharacterId: number | null = null;

  setContent(content: { venue: VenueDto | null; contentNotes?: { name: string }[] }) {
    if (content.contentNotes) {
      this.contentNoteOptions = content.contentNotes.map((contentNote) => ({
        label: (ContentNoteTexts as { [key: string]: string })[contentNote.name] || contentNote.name,
        value: contentNote.name,
      }));
    }

		if (content.venue) {
			this.venueId = content.venue.id;
			this.venueBackup = new VenueDto(content.venue);
      this.venueBackup.eventContentNotes = this.venueBackup.eventContentNotes || [];
      this.venueBackup.eventDescription = this.venueBackup.eventDescription || '';
      this.venueBackup.eventOocDetails = this.venueBackup.eventOocDetails || '';
      this.venueBackup.eventContact = this.venueBackup.eventContact || '';
      this.venueBackup.eventLink = this.venueBackup.eventLink || '';
      this.venueBackup.showRules = !!this.venueBackup.showRules;
      this.venueBackup.rules = this.venueBackup.rules || '';
      this.venueBackup.showPremises = !!this.venueBackup.showPremises;
      this.venueBackup.premises = this.venueBackup.premises || '';
      this.venueBackup.showMenu = !!this.venueBackup.showMenu;
      this.venueBackup.menu = this.venueBackup.menu || '';
      this.venueBackup.showStaff = !!this.venueBackup.showStaff;
      this.venueBackup.showJobs = !!this.venueBackup.showJobs;
      this.venueBackup.showOoc = !!this.venueBackup.showOoc;
      this.venueBackup.ooc = this.venueBackup.ooc || '';
      this.venueBackup.showMedia = !!this.venueBackup.showMedia;
      this.venueBackup.showEvents = !!this.venueBackup.showEvents;
      this.venueBackup.showNetwork = !!this.venueBackup.showNetwork;
      this.venueBackup.network = this.venueBackup.network || '';
    } else {
      this.venueId = null;
      this.venueBackup = new VenueDto({
        id: null as unknown as number,
        mine: true,
        foundedAt: null,
        name: '',
        server: this.$store.getters.character!.server,
        description: '',
        website: '',
        purpose: '',
        status: '',
        location: VenueLocation.OPEN_WORLD,
        address: '',
        housingArea: null,
        ward: null,
        plot: null,
        room: null,
        subdivision: false,
        carrdProfile: '',
        banner: null,
        tags: [],
        eventDescription: '',
        eventOocDetails: '',
        eventContact: '',
        eventLink: '',
        eventContentNotes: [],
        showRules: false,
        rules: '',
        showPremises: false,
        premises: '',
        showMenu: false,
        menu: '',
        showStaff: false,
        showJobs: false,
        showOoc: false,
        ooc: '',
        showMedia: false,
        showEvents: false,
        showNetwork: false,
        network: '',
      });
    }

    // Initialize selected character (default to current active character)
    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.loaded = true;
    this.venue = new VenueDto(this.venueBackup);
  }

  get foundedAtDisplay() {
    return this.venue.foundedAt ? this.$display.formatDate(this.venue.foundedAt) : '(Unknown)';
  }

  get tags() {
    return this.venue.tags.join(', ');
  }

  onTagsChanged(newTags: string) {
    this.venue.tags = newTags.split(/,\s*/).map((tag) => tag.trim()).filter(tag => tag !== '');
  }

  get locationOptions() {
    return Object.values(VenueLocation).map(location => ({
      label: this.$display.venueLocations[location],
      value: location
    }));
  }

  get housingAreaOptions() {
    return Object.values(HousingArea).map(housingArea => ({
      label: this.$display.housingAreas[housingArea],
      value: housingArea
    }));
  }

  onLocationUpdated() {
    if (this.venue.location !== VenueLocation.OPEN_WORLD && !this.venue.subdivision) {
      this.venue.subdivision = false;
    }

    this.onPlotUpdated();
  }

  onPlotUpdated() {
    if (this.venue.location === VenueLocation.HOUSE) {
      this.venue.subdivision = !!this.venue.plot && this.venue.plot >= SharedConstants.housing.MIN_SUBDIVISION_PLOT;
    }
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.venue = new VenueDto(this.venueBackup);
  }

  async onSubmit() {
    this.saving = true;

    try {
      if (!this.venueId) {
        if (!this.selectedCharacterId) {
          throw new Error('No character selected');
        }
        this.venue.characterId = this.selectedCharacterId;
        const result = await this.$api.venues.createVenue(this.venue);
        this.venue.id = result.id;
        this.venueId = result.id;
        void this.$router.replace(`/edit-venue/${result.id}`);
      } else {
        await this.$api.venues.editVenue(this.venue);
      }

      this.venueBackup = new VenueDto(this.venue);

      notifySuccess('Treffpunkt gespeichert.', {
        label: 'Anschauen',
        color: 'white',
        handler: () => this.viewVenue(),
      });
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  viewVenue() {
    if (this.venueId) {
      void this.$router.push(`/venue/${this.venueId}`);
    }
  }
}
</script>

<style src="@vueform/multiselect/themes/default.css"></style>

<style lang="scss">
.page-edit-venue__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.q-field--standard.q-field--readonly.page-edit-venue__founded-at .q-field__control::before {
  border-bottom-style: solid;
}

.page-edit-venue__preview {
  margin-bottom: 24px;
}

.page-edit-venue__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}

.page-edit-venue__preview h6 {
  font-family: $header-font;
}
</style>
