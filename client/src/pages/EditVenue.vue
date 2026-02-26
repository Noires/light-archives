<template>
  <q-layout class="rounded-borders no-outline page-edit-venue-layout">
    <q-drawer
      class="border-radius-inherit edit-drawer"
      v-model="drawer"
      show-if-above
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      :width="220"
      :breakpoint="0"
    >
      <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding>
          <q-item
            v-for="section in visibleEditSections"
            :key="section.id"
            clickable
            v-ripple
            :active="editSection === section.id"
            @click="editSection = section.id"
          >
            <q-item-section avatar>
              <q-icon :name="section.icon" />
            </q-item-section>
            <q-item-section>
              {{ section.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page class="page-edit-venue">
      <q-page-container>
        <template v-if="loaded">
          <h2>{{ venueId ? 'Treffpunkt bearbeiten' : 'Treffpunkt erstellen' }}</h2>

          <q-form ref="form" @submit="onSubmit">
            <template v-if="!preview">
              <section v-if="editSection === 'basic'" class="page-edit-venue__section">
                <h6>Basisdaten</h6>
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
                  <q-input v-model="venue.purpose" label="Zweck" />
                  <q-input v-model="venue.status" label="Status" />
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
                <h6>Treffpunktanzeige</h6>
                <p>
                  Zur Erweiterung des Treffpunkts können weitere Unterpunkte hinzugeschaltet werden.
                  Diese sind rein optional.
                </p>
                <section class="page-edit-venue__toggle-grid">
                  <q-checkbox v-model="venue.showRules" label="Regeln" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showPremises" label="Räumlichkeiten" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showMenu" label="Angebote" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showStaff" label="Mitarbeiter" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showJobs" label="Stellenangebote" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showOoc" label="OOC" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showMedia" label="Medien" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showEvents" label="Events" @update:model-value="onSectionToggleChange" />
                  <q-checkbox v-model="venue.showNetwork" label="Vernetzung" @update:model-value="onSectionToggleChange" />
                </section>

                <banner-edit-section
                  v-model="venue.banner"
                  :character-id="!venueId ? selectedCharacterId : null"
                />
                <h6>Beschreibung</h6>
                <html-editor v-model="venue.description" />
                <h6>Carrd-Einbindung</h6>
                <carrd-edit-section
                  class="page-edit-venue__form-controls"
                  entity-type="venue"
                  v-model="venue.carrdProfile"
                />
              </section>

              <section v-else-if="editSection === 'rules'" class="page-edit-venue__section">
                <h6>Regeln</h6>
                <html-editor v-model="venue.rules" />
              </section>

              <section v-else-if="editSection === 'premises'" class="page-edit-venue__section">
                <h6>Räumlichkeiten</h6>
                <html-editor v-model="venue.premises" />
              </section>

              <section v-else-if="editSection === 'menu'" class="page-edit-venue__section">
                <h6>Angebote</h6>
                <venue-offerings-editor
                  v-model="venueOfferings"
                  :venue-id="venueId || 0"
                  :character-id="selectedCharacterId"
                />
              </section>

              <section v-else-if="editSection === 'staff'" class="page-edit-venue__section">
                <h6>Mitarbeiter</h6>
                <p>Die Mitarbeiterseite zeigt automatisch Mitglieder des Treffpunkts an, die für die Anzeige freigeschaltet sind.</p>
                <div class="text-caption">Die Sichtbarkeit wird in der Mitgliederverwaltung des Treffpunkts gesteuert.</div>
              </section>

              <section v-else-if="editSection === 'jobs'" class="page-edit-venue__section">
                <h6>Stellenangebote</h6>
                <p>Diese Seite zeigt automatisch Stellenangebote und Stellengesuche vom Anschlagbrett für diesen Treffpunkt.</p>
                <q-btn
                  v-if="venueId"
                  flat
                  color="primary"
                  icon="add"
                  label="Neuen Job-Aushang erstellen"
                  :to="`/create-noticeboard-item?venueId=${venueId}&type=STELLENANGEBOT`"
                />
              </section>

              <section v-else-if="editSection === 'ooc'" class="page-edit-venue__section">
                <h6>OOC</h6>
                <html-editor v-model="venue.ooc" />
              </section>

              <section v-else-if="editSection === 'media'" class="page-edit-venue__section">
                <h6>Medien</h6>
                <p>Die Medienseite zeigt automatisch verknüpfte Bilder aus der Galerie für diesen Treffpunkt.</p>
              </section>

              <section v-else-if="editSection === 'events'" class="page-edit-venue__section">
                <h6>Events</h6>
                <p>Diese Vorlage wird für neue Events des Treffpunkts verwendet.</p>
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
              </section>

              <section v-else-if="editSection === 'network'" class="page-edit-venue__section">
                <h6>Vernetzung</h6>
                <html-editor v-model="venue.network" />
              </section>
            </template>

            <section v-else class="page-edit-venue__preview">
              <venue-profile :venue="venue" :preview="true" />
              <section v-if="venue.showMenu" class="page-edit-venue__section">
                <h3>Angebote</h3>
                <venue-offerings-view :offerings="venueOfferings" />
              </section>
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
              <span class="q-ml-sm">Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?</span>
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
      </q-page-container>
    </q-page>
  </q-layout>
</template>

<script lang="ts">
import Multiselect from '@vueform/multiselect';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
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
import VenueOfferingsEditor from 'src/components/venues/VenueOfferingsEditor.vue';
import VenueOfferingsView from 'src/components/venues/VenueOfferingsView.vue';
import { useRouter } from 'src/router';
import { Dialog } from 'quasar';
import { Options, Vue } from 'vue-class-component';
import { ref } from 'vue';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();
const isDirty = ref(false);

type EditVenueSection = 'basic' | 'rules' | 'premises' | 'menu' | 'staff' | 'jobs' | 'ooc' | 'media' | 'events' | 'network';

type EditSectionItem = {
  id: EditVenueSection;
  label: string;
  icon: string;
};

async function load(params: RouteParams): Promise<{ venue: VenueDto | null; contentNotes: { name: string }[]; offerings: VenueOfferingsDto | null }> {
  const id = parseInt(params.id as string, 10);
  const contentNotes = await $api.contentNotes.getContentNotes();

  if (!id) {
    return { venue: null, contentNotes, offerings: null };
  }

  try {
    const [venue, offerings] = await Promise.all([
      $api.venues.getVenue(id),
      $api.venues.getOfferings(id).catch(() => ({ categories: [] } as VenueOfferingsDto)),
    ]);
    return { venue, contentNotes, offerings };
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
    VenueOfferingsEditor,
    VenueOfferingsView,
  },
  async beforeRouteEnter(to, _, next) {
    isDirty.value = false;
    const content = await load(to.params);
    next(vm => (vm as PageEditVenue).setContent(content));
  },
  async beforeRouteUpdate(to) {
    (this as PageEditVenue).setContent(await load(to.params));
  },
  beforeRouteLeave(to, from, next) {
    if ((this as PageEditVenue).saving) {
      next();
      return;
    }

    if (!isDirty.value) {
      next();
      return;
    }

    if (to.path.includes('edit-venue')) {
      Dialog.create({
        title: 'Warnung',
        message: 'Bitte speichere oder setze deine Änderungen zurück, bevor du zu einem anderen Treffpunkt-Tab navigierst.',
        ok: {
          push: true,
          label: 'Ok',
        },
      }).onOk(() => {
        next(false);
      });
      return;
    }

    Dialog.create({
      title: 'Warnung',
      message: 'Ungespeicherte Änderungen gehen verloren. Möchtest du fortfahren?',
      ok: {
        push: true,
        label: 'Ok',
      },
      cancel: {
        push: true,
        color: 'secondary',
        label: 'Abbrechen',
      },
    })
      .onOk(() => {
        next();
      })
      .onCancel(() => {
        next(false);
      })
      .onDismiss(() => {
        next(false);
      });
  },
  watch: {
    venue: {
      deep: true,
      handler() {
        (this as PageEditVenue).markDirty();
      },
    },
    venueOfferings() {
      (this as PageEditVenue).markDirty();
    },
    selectedCharacterId(newValue: number | null, oldValue: number | null) {
      (this as PageEditVenue).onSelectedCharacterIdChanged(newValue, oldValue);
    },
  },
})
export default class PageEditVenue extends Vue {
  readonly NoticeboardType = NoticeboardType;
  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  readonly VenueLocation = VenueLocation;
  readonly SharedConstants = SharedConstants;

  venueId: number | null = null;
  venue = new VenueDto();
  venueBackup = new VenueDto();
  contentNoteOptions: { label: string; value: string }[] = [];

  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

  editSection: EditVenueSection = 'basic';

  drawer = ref(false);
  miniState = true;

  selectedCharacterId: number | null = null;
  venueOfferings: VenueOfferingsDto = { categories: [] };
  private savedOfferingImageIds: Set<number> = new Set();
  private suppressDirtyTracking = false;

  setContent(content: { venue: VenueDto | null; contentNotes?: { name: string }[]; offerings?: VenueOfferingsDto | null }) {
    this.suppressDirtyTracking = true;
    this.venueOfferings = content.offerings || { categories: [] };
    this.savedOfferingImageIds = this.collectOfferingImageIds(this.venueOfferings);

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

    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.loaded = true;
    this.editSection = 'basic';
    this.venue = new VenueDto(this.venueBackup);

    void this.$nextTick(() => {
      this.suppressDirtyTracking = false;
      isDirty.value = false;
    });
  }

  get foundedAtDisplay() {
    return this.venue.foundedAt ? this.$display.formatDate(this.venue.foundedAt) : '(Unknown)';
  }

  get tags() {
    return this.venue.tags.join(', ');
  }

  get visibleEditSections(): EditSectionItem[] {
    const sections: EditSectionItem[] = [
      { id: 'basic', label: 'Basisdaten', icon: 'storefront' },
    ];

    if (this.venue.showRules) sections.push({ id: 'rules', label: 'Regeln', icon: 'gavel' });
    if (this.venue.showPremises) sections.push({ id: 'premises', label: 'Räumlichkeiten', icon: 'meeting_room' });
    if (this.venue.showMenu) sections.push({ id: 'menu', label: 'Angebote', icon: 'restaurant_menu' });
    if (this.venue.showStaff) sections.push({ id: 'staff', label: 'Mitarbeiter', icon: 'badge' });
    if (this.venue.showJobs) sections.push({ id: 'jobs', label: 'Stellenangebote', icon: 'work' });
    if (this.venue.showOoc) sections.push({ id: 'ooc', label: 'OOC', icon: 'forum' });
    if (this.venue.showMedia) sections.push({ id: 'media', label: 'Medien', icon: 'collections' });
    if (this.venue.showEvents) sections.push({ id: 'events', label: 'Events', icon: 'event' });
    if (this.venue.showNetwork) sections.push({ id: 'network', label: 'Vernetzung', icon: 'hub' });

    return sections;
  }

  onSectionToggleChange() {
    this.ensureVisibleEditSection();
  }

  onSelectedCharacterIdChanged(newValue: number | null, oldValue: number | null) {
    this.markDirty();

    // During creation, a banner selected for a different owner character becomes invalid.
    if (!this.venueId && oldValue !== null && newValue !== oldValue && this.venue.banner) {
      this.venue.banner = null;
    }
  }

  markDirty() {
    if (!this.suppressDirtyTracking) {
      isDirty.value = true;
    }
  }

  private ensureVisibleEditSection() {
    if (!this.visibleEditSections.some((section) => section.id === this.editSection)) {
      this.editSection = 'basic';
    }
  }

  onTagsChanged(newTags: string) {
    this.venue.tags = newTags.split(/,\s*/).map((tag) => tag.trim()).filter(tag => tag !== '');
  }

  get locationOptions() {
    return Object.values(VenueLocation).map(location => ({
      label: this.$display.venueLocations[location],
      value: location,
    }));
  }

  get housingAreaOptions() {
    return Object.values(HousingArea).map(housingArea => ({
      label: this.$display.housingAreas[housingArea],
      value: housingArea,
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

  private collectOfferingImageIds(offerings: VenueOfferingsDto): Set<number> {
    const ids = new Set<number>();
    for (const cat of offerings.categories) {
      for (const off of cat.offerings || []) {
        if (off.imageId != null) ids.add(off.imageId);
      }
      for (const sub of cat.subcategories || []) {
        for (const off of sub.offerings || []) {
          if (off.imageId != null) ids.add(off.imageId);
        }
      }
    }
    return ids;
  }

  private cleanupUnsavedOfferingImages() {
    if (!this.venueId) return;
    const currentIds = this.collectOfferingImageIds(this.venueOfferings);
    for (const id of currentIds) {
      if (!this.savedOfferingImageIds.has(id)) {
        void $api.venues.deleteOfferingImage(this.venueId, id).catch(() => undefined);
      }
    }
  }

  beforeUnmount() {
    this.cleanupUnsavedOfferingImages();
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    this.suppressDirtyTracking = true;
    this.venue = new VenueDto(this.venueBackup);
    this.ensureVisibleEditSection();
    void this.$nextTick(() => {
      this.suppressDirtyTracking = false;
      isDirty.value = false;
    });
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
        await this.$api.venues.saveOfferings(this.venueId, this.venueOfferings);
        this.savedOfferingImageIds = this.collectOfferingImageIds(this.venueOfferings);
        this.venueBackup = new VenueDto(this.venue);
        isDirty.value = false;
        void this.$router.replace(`/edit-venue/${result.id}`);
      } else {
        await this.$api.venues.editVenue(this.venue);
        await this.$api.venues.saveOfferings(this.venueId, this.venueOfferings);
        this.savedOfferingImageIds = this.collectOfferingImageIds(this.venueOfferings);
        this.venueBackup = new VenueDto(this.venue);
        isDirty.value = false;
      }

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

.page-edit-venue__toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 6px 14px;
  margin-bottom: 16px;
}

.q-field--standard.q-field--readonly.page-edit-venue__founded-at .q-field__control::before {
  border-bottom-style: solid;
}

.page-edit-venue__section {
  margin-bottom: 16px;
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

.edit-drawer {
  background-color: #9f848d;
}

.edit-drawer .q-item {
  color: #1b1b1b;
}

@media screen and (max-width: $breakpoint-sm) {
  .page-edit-venue__button-bar {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .page-edit-venue__toggle-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
