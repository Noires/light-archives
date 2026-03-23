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
                  v-model="venue.eventTitle"
                  class="page-edit-venue__event-title"
                  label="Titel (Vorlage)"
                />
                <div class="page-edit-venue__select-group">
                  <div class="page-edit-venue__select-title">Event-Typ</div>
                  <q-option-group
                    v-model="venue.eventType"
                    :options="eventTypeOptions"
                    type="radio"
                    color="secondary"
                    class="page-edit-venue__options-grid"
                  />
                </div>
                <div class="page-edit-venue__select-group">
                  <div class="page-edit-venue__select-title">Geschlossenes Event</div>
                  <q-option-group
                    v-model="venue.eventClosed"
                    :options="yesNoOptions"
                    type="radio"
                    color="secondary"
                    inline
                  />
                  <div class="text-caption">
                    Für Events aus dieser Vorlage gilt eine Anmeldepflicht bis zur gesetzten Frist.
                  </div>
                </div>
                <div v-if="venue.eventClosed" class="page-edit-venue__template-block">
                  <div class="page-edit-venue__template-header">
                    <div class="page-edit-venue__select-title">Anmeldefrist</div>
                    <q-btn
                      flat
                      dense
                      color="secondary"
                      icon="restart_alt"
                      label="Zurücksetzen"
                      @click="clearTemplateDeadline"
                    />
                  </div>
                  <div class="text-caption page-edit-venue__template-hint">
                    Definiert, bis wann man sich vor dem Event anmelden kann.
                  </div>
                  <div class="page-edit-venue__template-grid">
                    <q-input
                      v-model.number="venue.eventRegistrationDeadlineDays"
                      type="number"
                      min="0"
                      label="Tage vor Beginn"
                    />
                    <q-input
                      :model-value="venue.eventRegistrationDeadlineTime || ''"
                      readonly
                      label="Uhrzeit (optional)"
                    >
                      <template v-slot:append>
                        <q-icon
                          v-if="venue.eventRegistrationDeadlineTime"
                          name="clear"
                          class="cursor-pointer"
                          @click.stop="venue.eventRegistrationDeadlineTime = null"
                        />
                        <q-icon name="access_time" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-time
                              v-model="venue.eventRegistrationDeadlineTime"
                              mask="HH:mm"
                              format24h
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Schließen" color="primary" flat />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div v-if="registrationDeadlineSummary" class="text-caption page-edit-venue__template-summary">
                    {{ registrationDeadlineSummary }}
                  </div>
                </div>
                <div class="page-edit-venue__select-group">
                  <div class="page-edit-venue__select-title">Nicht jugendfrei (18+)</div>
                  <adult-only-selector v-model="venue.eventAdultOnly" />
                  <div class="text-caption">
                    Markiert alle aus der Vorlage erstellten Events automatisch als 18+.
                  </div>
                </div>
                <div class="page-edit-venue__select-group">
                  <div class="page-edit-venue__select-title">Event-Inhaltswarnungen</div>
                  <q-option-group
                    v-model="venue.eventContentNotes"
                    :options="contentNoteOptions"
                    type="checkbox"
                    color="secondary"
                    class="page-edit-venue__options-grid"
                  />
                </div>
                <div class="page-edit-venue__template-block">
                  <div class="page-edit-venue__template-header">
                    <div class="page-edit-venue__select-title">Vorlagen-Zeitplan</div>
                    <q-btn
                      flat
                      dense
                      color="secondary"
                      icon="restart_alt"
                      label="Alle Zeiten löschen"
                      @click="clearTemplateSchedule"
                    />
                  </div>
                  <div class="text-caption page-edit-venue__template-hint">
                    Wenn ein Wochentag gesetzt ist, wird beim Erstellen automatisch der nächste passende Termin verwendet.
                    Ohne Wochentag werden beim Erstellen nur Uhrzeiten vorbefüllt.
                  </div>
                  <div class="page-edit-venue__template-grid">
                    <q-select
                      v-model="venue.eventStartWeekday"
                      :options="weekdayOptions"
                      emit-value
                      map-options
                      clearable
                      label="Beginn: Wochentag"
                    />
                    <q-input
                      :model-value="venue.eventStartTime || ''"
                      readonly
                      label="Beginn: Uhrzeit"
                    >
                      <template v-slot:append>
                        <q-icon
                          v-if="venue.eventStartTime"
                          name="clear"
                          class="cursor-pointer"
                          @click.stop="venue.eventStartTime = null"
                        />
                        <q-icon name="access_time" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-time
                              v-model="venue.eventStartTime"
                              mask="HH:mm"
                              format24h
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Schließen" color="primary" flat />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                  <div class="page-edit-venue__template-grid">
                    <q-input
                      :model-value="venue.eventEndTime || ''"
                      readonly
                      :disable="!hasStartTemplate"
                      label="Ende: Uhrzeit"
                    >
                      <template v-slot:append>
                        <q-icon
                          v-if="venue.eventEndTime"
                          name="clear"
                          class="cursor-pointer"
                          @click.stop="venue.eventEndTime = null"
                        />
                        <q-icon name="access_time" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-time
                              v-model="venue.eventEndTime"
                              mask="HH:mm"
                              format24h
                            >
                              <div class="row items-center justify-end">
                                <q-btn v-close-popup label="Schließen" color="primary" flat />
                              </div>
                            </q-time>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                    <q-input
                      v-model.number="venue.eventEndDurationDays"
                      type="number"
                      min="0"
                      :disable="!hasStartTemplate"
                      label="Ende: Dauer in Tagen"
                    />
                  </div>
                  <div class="text-caption page-edit-venue__template-summary">
                    {{ scheduleTemplateSummary }}
                  </div>
                </div>
                <q-input
                  v-model="venue.eventContact"
                  label="Event-Kontakt"
                />
                <h6>Event-Links</h6>
                <template v-for="(_, index) in (venue.eventLinks || [])" :key="`venue-event-link-${index}`">
                  <div class="page-edit-venue__event-link-row">
                    <q-input
                      v-model="venue.eventLinks[index].url"
                      label="Link"
                      :rules="[
                        $rules.url('Bitte hinterlasse einen Link.'),
                      ]"
                    />
                    <q-input
                      v-model="venue.eventLinks[index].label"
                      label="Linktext (optional)"
                    />
                    <q-btn
                      flat
                      color="negative"
                      icon="delete"
                      aria-label="Event-Link entfernen"
                      @click="removeEventLink(index)"
                    />
                  </div>
                </template>
                <q-btn
                  flat
                  color="secondary"
                  icon="add"
                  label="Event-Link hinzufügen"
                  @click="addEventLink"
                />
                <h6>Event-Beschreibung</h6>
                <html-editor v-model="venue.eventDescription" />
                <h6>Event-OOC Details</h6>
                <html-editor v-model="venue.eventOocDetails" />
                <h6>Extra-Infos</h6>
                <q-input
                  v-model="venue.eventExtraInfo"
                  maxlength="100"
                  counter
                  label="Extra-Info (max. 100 Zeichen)"
                />
                <event-icon-edit-section v-model="venue.eventIcon" />
                <banner-edit-section v-model="venue.eventBanner" title="Event-Banner" />
                <banner-edit-section
                  v-model="venue.eventDiscordBanner"
                  title="Discord-Banner"
                  :ratio="5 / 2"
                  :min-aspect-ratio="minDiscordBannerAspectRatio"
                  hint="Mindestens 5:2 (Breite:Höhe), empfohlen 1500x600. Formate: JPG/PNG, max. 1 MiB. Beim Hochladen kannst du den Ausschnitt zuschneiden."
                />
              </section>

              <section v-else-if="editSection === 'network'" class="page-edit-venue__section">
                <h6>Vernetzung</h6>
                <html-editor v-model="venue.network" />
              </section>
            </template>

            <section v-else class="page-edit-venue__preview">
              <venue-profile v-if="editSection !== 'menu'" :venue="venue" :preview="true" />
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
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import errors from '@app/shared/errors';
import SharedConstants from '@app/shared/SharedConstants';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { EventTypeOptions } from 'src/common/event-types';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CarrdEditSection from 'src/components/common/CarrdEditSection.vue';
import CharacterSelector from 'src/components/common/CharacterSelector.vue';
import WorldSelect from 'src/components/common/WorldSelect.vue';
import AdultOnlySelector from 'src/components/event/AdultOnlySelector.vue';
import EventIconEditSection from 'src/components/event/EventIconEditSection.vue';
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
    AdultOnlySelector,
    EventIconEditSection,
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
  readonly eventTypeOptions = EventTypeOptions;
  readonly yesNoOptions = [
    { label: 'Ja', value: true },
    { label: 'Nein', value: false },
  ];
  readonly weekdayOptions = [
    { label: 'Montag', value: 1 },
    { label: 'Dienstag', value: 2 },
    { label: 'Mittwoch', value: 3 },
    { label: 'Donnerstag', value: 4 },
    { label: 'Freitag', value: 5 },
    { label: 'Samstag', value: 6 },
    { label: 'Sonntag', value: 7 },
  ];

  readonly VenueLocation = VenueLocation;
  readonly SharedConstants = SharedConstants;
  readonly minDiscordBannerAspectRatio = SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO;

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
      this.ensureVenueTemplateDefaults(this.venueBackup);
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
        eventLinks: [],
        eventTitle: '',
        eventType: EventType.RP,
        eventAdultOnly: false,
        eventClosed: false,
        eventRegistrationDeadlineDays: null,
        eventRegistrationDeadlineTime: null,
        eventStartDateTime: null,
        eventEndDateTime: null,
        eventStartWeekday: null,
        eventStartTime: null,
        eventEndTime: null,
        eventEndDurationDays: null,
        eventExtraInfo: '',
        eventIcon: null,
        eventBanner: null,
        eventDiscordBanner: null,
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
      this.ensureVenueTemplateDefaults(this.venueBackup);
    }

    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.loaded = true;
    this.editSection = 'basic';
    this.venue = new VenueDto(this.venueBackup);
    this.ensureVenueTemplateDefaults(this.venue);

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

  get hasStartTemplate(): boolean {
    return !!this.venue.eventStartTime;
  }

  get registrationDeadlineSummary(): string {
    const days = this.venue.eventRegistrationDeadlineDays;
    const time = this.venue.eventRegistrationDeadlineTime;

    if (days === null || days === undefined) {
      return '';
    }

    if (time) {
      return `Frist: ${days} Tag(e) vor Beginn um ${time} Uhr.`;
    }

    return `Frist: ${days} Tag(e) vor Beginn.`;
  }

  get scheduleTemplateSummary(): string {
    const startWeekday = this.venue.eventStartWeekday;
    const startTime = this.venue.eventStartTime;
    const endTime = this.venue.eventEndTime;
    const endDurationDays = this.venue.eventEndDurationDays;

    if (!startTime) {
      return 'Kein Beginn gesetzt. Wenn du Beginn leer lässt, wird beim Erstellen kein Zeitpunkt vorbefüllt.';
    }

    const startLabel = startWeekday
      ? `Beginn: ${this.getWeekdayLabel(startWeekday)} um ${startTime} Uhr.`
      : `Beginn: um ${startTime} Uhr.`;
    if (endTime === null || endTime === undefined || endDurationDays === null || endDurationDays === undefined) {
      return `${startLabel} Kein Ende gesetzt.`;
    }

    return `${startLabel} Ende: +${endDurationDays} Tag(e), ${endTime} Uhr.`;
  }

  get visibleEditSections(): EditSectionItem[] {
    const sections: EditSectionItem[] = [
      { id: 'basic', label: 'Basisdaten', icon: 'storefront' },
    ];

    if (this.venue.showRules) sections.push({ id: 'rules', label: 'Regeln', icon: 'gavel' });
    if (this.venue.showPremises) sections.push({ id: 'premises', label: 'Räumlichkeiten', icon: 'meeting_room' });
    if (this.venue.showMenu) sections.push({ id: 'menu', label: 'Angebote', icon: 'local_offer' });
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

  clearTemplateDeadline() {
    this.venue.eventRegistrationDeadlineDays = null;
    this.venue.eventRegistrationDeadlineTime = null;
  }

  clearTemplateSchedule() {
    this.venue.eventStartWeekday = null;
    this.venue.eventStartTime = null;
    this.venue.eventEndTime = null;
    this.venue.eventEndDurationDays = null;
    this.venue.eventStartDateTime = null;
    this.venue.eventEndDateTime = null;
  }

  private getWeekdayLabel(weekday: number): string {
    return this.weekdayOptions.find((option) => option.value === weekday)?.label || `Wochentag ${weekday}`;
  }

  private ensureVenueTemplateDefaults(target: VenueDto) {
    const links = (target.eventLinks || [])
      .map((link) => ({
        url: (link.url || '').trim(),
        label: (link.label || '').trim(),
      }))
      .filter((link) => link.url.length > 0);

    if (links.length === 0 && target.eventLink) {
      links.push({
        url: target.eventLink,
        label: '',
      });
    }

    target.eventLinks = links;
    target.eventLink = links[0]?.url || '';
    target.eventTitle = target.eventTitle || '';
    target.eventType = target.eventType || EventType.RP;
    target.eventAdultOnly = target.eventAdultOnly === true;
    target.eventClosed = target.eventClosed === true;
    target.eventRegistrationDeadlineDays = this.normalizeOptionalNonNegativeInteger(target.eventRegistrationDeadlineDays);
    target.eventRegistrationDeadlineTime = this.normalizeOptionalTime(target.eventRegistrationDeadlineTime);
    target.eventStartWeekday = this.normalizeOptionalWeekday(target.eventStartWeekday);
    target.eventStartTime = this.normalizeOptionalTime(target.eventStartTime);
    target.eventEndTime = this.normalizeOptionalTime(target.eventEndTime);
    target.eventEndDurationDays = this.normalizeOptionalNonNegativeInteger(target.eventEndDurationDays);

    if (target.eventStartTime === null) {
      target.eventStartWeekday = null;
      target.eventStartTime = null;
      target.eventStartDateTime = null;
    } else if (target.eventStartWeekday === null) {
      target.eventStartDateTime = null;
    }

    if (
      target.eventStartTime === null
      || target.eventEndTime === null
      || target.eventEndDurationDays === null
    ) {
      target.eventEndTime = null;
      target.eventEndDurationDays = null;
      target.eventEndDateTime = null;
    } else if (target.eventStartWeekday === null) {
      target.eventEndDateTime = null;
    }

    if (!target.eventClosed) {
      target.eventRegistrationDeadlineDays = null;
      target.eventRegistrationDeadlineTime = null;
    }

    target.eventStartDateTime = Number.isFinite(target.eventStartDateTime as number) ? target.eventStartDateTime! : null;
    target.eventEndDateTime = Number.isFinite(target.eventEndDateTime as number) ? target.eventEndDateTime! : null;
    target.eventExtraInfo = (target.eventExtraInfo || '').trim().substring(0, 100);
    target.eventIcon = target.eventIcon || null;
    target.eventBanner = target.eventBanner || null;
    target.eventDiscordBanner = target.eventDiscordBanner || null;
  }

  private normalizeOptionalNonNegativeInteger(value: number | null | undefined): number | null {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return null;
    }

    return Math.max(0, Math.floor(value));
  }

  private normalizeOptionalWeekday(value: number | null | undefined): number | null {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return null;
    }

    const normalized = Math.floor(value);
    return normalized >= 1 && normalized <= 7 ? normalized : null;
  }

  private normalizeOptionalTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }

    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(normalized) ? normalized : null;
  }

  addEventLink() {
    if (!this.venue.eventLinks) {
      this.venue.eventLinks = [];
    }

    this.venue.eventLinks.push({
      url: '',
      label: '',
    });
  }

  removeEventLink(index: number) {
    if (!this.venue.eventLinks) {
      return;
    }

    this.venue.eventLinks.splice(index, 1);
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
    this.ensureVenueTemplateDefaults(this.venue);
    this.ensureVisibleEditSection();
    void this.$nextTick(() => {
      this.suppressDirtyTracking = false;
      isDirty.value = false;
    });
  }

  async onSubmit() {
    this.saving = true;

    try {
      this.ensureVenueTemplateDefaults(this.venue);
      const eventLinks = this.venue.eventLinks || [];
      this.venue.eventLink = eventLinks[0]?.url || '';
      if (!this.venue.eventClosed) {
        this.venue.eventRegistrationDeadlineDays = null;
        this.venue.eventRegistrationDeadlineTime = null;
      }

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

<style lang="scss">
.page-edit-venue-layout {
  --edit-venue-select-group-border: rgba(221, 180, 118, 0.25);
  --edit-venue-select-group-bg: rgba(249, 247, 242, 0.95);
  --edit-venue-select-title-color: rgba(35, 35, 35, 0.7);
  --edit-venue-drawer-bg: linear-gradient(135deg, var(--drawer-bg-start) 0%, var(--drawer-bg-end) 100%);
  --edit-venue-drawer-border: var(--drawer-border);
  --edit-venue-drawer-top-glow: linear-gradient(180deg, var(--drawer-top-glow) 0%, transparent 100%);
  --edit-venue-drawer-text: var(--drawer-item-color);
  --edit-venue-drawer-hover-bg: var(--drawer-item-hover-bg);
  --edit-venue-drawer-hover-text: var(--drawer-item-hover-color);
  --edit-venue-drawer-active-bg: var(--drawer-item-active-bg);
  --edit-venue-drawer-active-text: var(--drawer-item-hover-color);
  --edit-venue-drawer-active-border: var(--drawer-item-active-border);
}

body.body--dark .page-edit-venue-layout {
  --edit-venue-select-group-border: rgba(141, 181, 223, 0.3);
  --edit-venue-select-group-bg: rgba(17, 25, 37, 0.9);
  --edit-venue-select-title-color: rgba(213, 226, 240, 0.76);
}

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

.page-edit-venue__select-group {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--edit-venue-select-group-border);
  background: var(--edit-venue-select-group-bg);
}

.page-edit-venue__event-title {
  margin-bottom: 10px;
}

.page-edit-venue__select-title {
  margin-bottom: 8px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--edit-venue-select-title-color);
}

.page-edit-venue__options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
}

.page-edit-venue__options-grid .q-option-group__option {
  margin: 0;
}

.page-edit-venue__event-link-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.page-edit-venue__template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.page-edit-venue__template-block {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--edit-venue-select-group-border);
  background: var(--edit-venue-select-group-bg);
}

.page-edit-venue__template-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.page-edit-venue__template-hint {
  margin-bottom: 10px;
}

.page-edit-venue__template-summary {
  margin-top: 8px;
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

.edit-drawer.q-drawer--left {
  background: var(--edit-venue-drawer-bg);
  border-right: 1px solid var(--edit-venue-drawer-border);
}

.edit-drawer.q-drawer--left::before {
  background: var(--edit-venue-drawer-top-glow);
}

.edit-drawer .q-item {
  color: var(--edit-venue-drawer-text);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.edit-drawer .q-item:hover,
.edit-drawer .q-item:first-child:hover {
  color: var(--edit-venue-drawer-hover-text);
  background: var(--edit-venue-drawer-hover-bg);
}

.edit-drawer .q-item.q-router-link--active,
.edit-drawer .q-item.q-item--active {
  color: var(--edit-venue-drawer-active-text);
  background: var(--edit-venue-drawer-active-bg);
  border-left: 3px solid var(--edit-venue-drawer-active-border);
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

  .page-edit-venue__options-grid {
    grid-template-columns: 1fr;
  }

  .page-edit-venue__event-link-row {
    grid-template-columns: 1fr;
  }

  .page-edit-venue__template-grid {
    grid-template-columns: 1fr;
  }

  .page-edit-venue__template-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
