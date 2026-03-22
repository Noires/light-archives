<template>
  <q-page class="page-edit-event">
    <template v-if="loaded">
      <h2>{{ eventId ? 'Event bearbeiten' : 'Neues Event erstellen' }}</h2>
      <q-stepper
        v-model="step"
        class="page-edit-event__stepper"
        color="secondary"
        animated
        bordered
        flat
        keep-alive
        header-nav
        alternative-labels
        :contracted="$q.screen.lt.lg"
        :vertical="$q.screen.lt.md"
      >
        <q-step
          :name="STEP_LOCATION"
          title="Treffpunkt"
          icon="place"
          :header-nav="canHeaderNavigateTo(STEP_LOCATION)"
          :done="step > STEP_LOCATION"
        >
          <q-form ref="locationForm" class="page-edit-event__section">
            <h6>Treffpunkt und Vorlage</h6>
            <p class="page-edit-event__section-hint">
              Verknüpfe zuerst einen Treffpunkt. So wird die Eventvorlage direkt übernommen und du sparst dir viele manuelle Eingaben.
            </p>
            <section class="page-edit-event__form-controls">
              <character-selector
                v-if="!eventId"
                v-model="selectedCharacterId"
                :rules="[
                  $rules.required('Bitte wähle einen Charakter aus.'),
                ]"
              />
              <q-select
                v-model="event.locations[0].venueId"
                label="Verknüpfter Treffpunkt (optional)"
                use-input
                input-debounce="250"
                emit-value
                map-options
                clearable
                :options="venueOptions"
                @filter="onVenueSearch"
                @update:model-value="onVenueSelected"
              />
              <q-input
                v-model="event.locations[0].name"
                label="Treffpunktname *"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />
              <q-input
                v-model="event.locations[0].address"
                label="Adresse"
              >
                <template v-slot:prepend>
                  <q-icon name="place" />
                </template>
              </q-input>
              <world-select
                v-model="event.locations[0].server"
                label="Welt"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />
              <q-input
                v-model="event.locations[0].link"
                label="Standortlink"
                :rules="[
                  $rules.url('Bitte hinterlasse eine gültige URL.'),
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="link" />
                </template>
              </q-input>
              <q-input
                v-model="event.locations[0].linkText"
                label="Standort-Linktext (optional)"
              />
            </section>
          </q-form>
        </q-step>

        <q-step
          :name="STEP_FACTS"
          title="Eckdaten"
          icon="schedule"
          :header-nav="canHeaderNavigateTo(STEP_FACTS)"
          :done="step > STEP_FACTS"
        >
          <q-form ref="factsForm" class="page-edit-event__section">
            <h6>Eckdaten</h6>
            <div class="page-edit-event__accordion">
              <q-expansion-item
                v-model="factsBasicsExpanded"
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-facts"
                icon="sell"
                label="Titel und Typ"
              >
                <div class="page-edit-event__expansion-body">
                  <section class="page-edit-event__form-controls">
                    <q-input
                      v-model="event.title"
                      label="Titel *"
                      :rules="[
                        $rules.required('Dieses Feld ist erforderlich.'),
                      ]"
                    />
                    <div class="page-edit-event__select-group">
                      <div class="page-edit-event__select-title">Event-Typ *</div>
                      <q-option-group
                        v-model="event.eventType"
                        :options="eventTypeOptions"
                        type="radio"
                        color="secondary"
                        class="page-edit-event__options-grid"
                        :rules="[
                          $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                      />
                    </div>
                    <div class="page-edit-event__select-group">
                      <div class="page-edit-event__select-title">Nicht jugendfrei (18+)</div>
                      <adult-only-selector v-model="event.adultOnly" />
                      <div class="text-caption">
                        Markiere das Event als 18+, wenn es Inhalte nur für Erwachsene enthält.
                      </div>
                    </div>
                    <div class="page-edit-event__select-group">
                      <div class="page-edit-event__select-title">Inhaltswarnungen</div>
                      <q-option-group
                        v-model="event.contentNotes"
                        :options="contentNoteOptions"
                        type="checkbox"
                        color="secondary"
                        class="page-edit-event__options-grid"
                      />
                    </div>
                  </section>
                </div>
              </q-expansion-item>

              <q-expansion-item
                v-model="factsTimingExpanded"
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-facts"
                icon="event"
                label="Zeit und Teilnahme"
              >
                <div class="page-edit-event__expansion-body">
                  <section class="page-edit-event__form-controls">
                    <div class="page-edit-event__select-group">
                      <div class="page-edit-event__select-title">Geschlossenes Event</div>
                      <q-option-group
                        v-model="event.closedEvent"
                        :options="yesNoOptions"
                        type="radio"
                        color="secondary"
                        inline
                      />
                      <div class="text-caption">
                        Teilnahme nur mit Anmeldung bis zur Frist. Nach Ablauf der Frist sind keine Zu- oder Absagen mehr möglich.
                      </div>
                    </div>
                    <q-input
                      v-if="event.closedEvent"
                      v-model.number="event.registrationDeadlineDays"
                      type="number"
                      min="0"
                      label="Anmeldefrist (Tage vor Beginn)"
                    />
                    <q-input
                      v-if="event.closedEvent"
                      :model-value="event.registrationDeadlineTime || ''"
                      readonly
                      label="Anmeldefrist Uhrzeit (optional)"
                    >
                      <template v-slot:append>
                        <q-icon
                          v-if="event.registrationDeadlineTime"
                          name="clear"
                          class="cursor-pointer"
                          @click.stop="event.registrationDeadlineTime = null"
                        />
                        <q-icon name="access_time" class="cursor-pointer">
                          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                            <q-time
                              v-model="event.registrationDeadlineTime"
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
                    <div class="page-edit-event__date-time-grid">
                      <q-input
                        :model-value="startDateDisplay"
                        readonly
                        label="Beginn: Datum *"
                        :rules="[
                          $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                      >
                        <template v-slot:append>
                          <q-icon
                            v-if="startDate || startTime"
                            name="clear"
                            class="cursor-pointer"
                            @click.stop="clearStartDateTime"
                          />
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date
                                v-model="startDate"
                                mask="YYYY-MM-DD"
                                first-day-of-week="1"
                              >
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Schließen" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                      <q-input
                        :model-value="startTime || ''"
                        readonly
                        label="Beginn: Uhrzeit *"
                        :rules="[
                          $rules.required('Dieses Feld ist erforderlich.'),
                        ]"
                      >
                        <template v-slot:append>
                          <q-icon
                            v-if="startDate || startTime"
                            name="clear"
                            class="cursor-pointer"
                            @click.stop="clearStartDateTime"
                          />
                          <q-icon name="access_time" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-time
                                v-model="startTime"
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
                    <div class="page-edit-event__date-time-grid">
                      <q-input
                        :model-value="endDateDisplay"
                        readonly
                        label="Ende: Datum"
                        :input-class="isEndDateImplicit ? 'page-edit-event__date-time-value--implicit' : ''"
                        :rules="[() => validateEndDate()]"
                      >
                        <template v-slot:append>
                          <q-icon
                            v-if="endDate"
                            name="clear"
                            class="cursor-pointer"
                            @click.stop="clearEndDateOverride"
                          />
                          <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-date
                                v-model="endDate"
                                mask="YYYY-MM-DD"
                                first-day-of-week="1"
                              >
                                <div class="row items-center justify-end">
                                  <q-btn v-close-popup label="Schließen" color="primary" flat />
                                </div>
                              </q-date>
                            </q-popup-proxy>
                          </q-icon>
                        </template>
                      </q-input>
                      <q-input
                        :model-value="endTime || ''"
                        readonly
                        label="Ende: Uhrzeit"
                        :rules="[() => validateEndTime()]"
                      >
                        <template v-slot:append>
                          <q-icon
                            v-if="endTime"
                            name="clear"
                            class="cursor-pointer"
                            @click.stop="clearEndTime"
                          />
                          <q-icon name="access_time" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                              <q-time
                                v-model="endTime"
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
                  </section>
                </div>
              </q-expansion-item>
            </div>
          </q-form>
        </q-step>

        <q-step
          :name="STEP_CONTENT"
          title="Inhalte"
          icon="article"
          :header-nav="canHeaderNavigateTo(STEP_CONTENT)"
          :done="step > STEP_CONTENT"
        >
          <section class="page-edit-event__section">
            <h6>Inhalte</h6>
            <div class="page-edit-event__accordion">
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-content"
                icon="article"
                label="Event-Beschreibung"
                default-opened
              >
                <div class="page-edit-event__expansion-body">
                  <html-editor v-model="event.details" />
                </div>
              </q-expansion-item>
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-content"
                icon="info"
                label="OOC-Details"
              >
                <div class="page-edit-event__expansion-body">
                  <html-editor v-model="event.oocDetails" />
                </div>
              </q-expansion-item>
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-content"
                icon="notes"
                label="Extra-Infos"
              >
                <div class="page-edit-event__expansion-body">
                  <html-editor v-model="event.extraInfo" />
                </div>
              </q-expansion-item>
            </div>
          </section>
        </q-step>

        <q-step
          :name="STEP_CONTACT"
          title="Kontakt"
          icon="link"
          :header-nav="canHeaderNavigateTo(STEP_CONTACT)"
          :done="step > STEP_CONTACT"
        >
          <q-form ref="contactForm" class="page-edit-event__section">
            <h6>Kontakt und Links</h6>
            <div class="page-edit-event__accordion">
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-contact"
                icon="contact_mail"
                label="Kontakt"
                :default-opened="!eventLinksExpanded"
              >
                <div class="page-edit-event__expansion-body">
                  <q-input
                    v-model="event.contact"
                    label="Event-Kontakt"
                  />
                </div>
              </q-expansion-item>
              <q-expansion-item
                v-model="eventLinksExpanded"
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-contact"
                icon="link"
                label="Event-Links"
              >
                <div class="page-edit-event__expansion-body">
                  <template v-for="(_, index) in (event.links || [])" :key="`event-link-${index}`">
                    <div class="page-edit-event__event-link-row">
                      <q-input
                        v-model="event.links[index].url"
                        label="Link"
                        :rules="[
                          $rules.url('Bitte hinterlasse einen Link.'),
                        ]"
                      />
                      <q-input
                        v-model="event.links[index].label"
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
                </div>
              </q-expansion-item>
            </div>
            <div class="page-edit-event__inline-actions">
              <q-btn flat color="secondary" icon="add" label="Event-Link hinzufügen" @click="addEventLink" />
            </div>
          </q-form>
        </q-step>

        <q-step
          :name="STEP_MEDIA"
          title="Medien"
          icon="image"
          :header-nav="canHeaderNavigateTo(STEP_MEDIA)"
          :done="step > STEP_MEDIA"
        >
          <section class="page-edit-event__section">
            <h6>Medien</h6>
            <div class="page-edit-event__accordion">
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-media"
                icon="photo"
                label="Event-Icon"
                default-opened
              >
                <div class="page-edit-event__expansion-body">
                  <event-icon-edit-section v-model="event.icon" />
                </div>
              </q-expansion-item>
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-media"
                icon="image"
                label="Banner"
              >
                <div class="page-edit-event__expansion-body">
                  <banner-edit-section v-model="event.banner" />
                </div>
              </q-expansion-item>
              <q-expansion-item
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-media"
                icon="chat"
                label="Discord-Banner"
              >
                <div class="page-edit-event__expansion-body">
                  <banner-edit-section
                    v-model="event.discordBanner"
                    title="Discord-Banner"
                    :ratio="5 / 2"
                    :min-aspect-ratio="minDiscordBannerAspectRatio"
                    hint="Mindestens 5:2 (Breite:Höhe), empfohlen 1500x600. Formate: JPG/PNG, max. 1 MiB. Beim Hochladen kannst du den Ausschnitt zuschneiden."
                  />
                </div>
              </q-expansion-item>
            </div>
          </section>

        </q-step>

        <q-step
          :name="STEP_DISCORD"
          title="Discord"
          icon="campaign"
          :header-nav="canHeaderNavigateTo(STEP_DISCORD)"
          :done="step > STEP_DISCORD"
        >

          <section class="page-edit-event__section">
            <h6>Vorankündigungen</h6>
            <p class="page-edit-event__section-hint">
              Der Elpisgarten Discord-Bot kann das Event im Kanal <tt>#rp-event-announcements</tt> ankündigen.
              Leere Texte werden beim Speichern automatisch aus Titel und Beschreibung befüllt.
            </p>
            <div class="page-edit-event__accordion">
              <q-expansion-item
                v-for="(announcement, index) in event.announcements"
                :key="index"
                class="page-edit-event__expansion-item"
                header-class="page-edit-event__expansion-header"
                group="edit-event-discord"
                icon="campaign"
                :label="`Vorankündigung ${index + 1}`"
                :caption="announcementCaption(announcement.minutesBefore)"
                :default-opened="index === 0"
              >
                <div class="page-edit-event__expansion-body">
                  <event-announcement-editor v-model="event.announcements[index]" @remove="removeAnnouncement(index)" />
                </div>
              </q-expansion-item>
            </div>
            <div class="page-edit-event__inline-actions">
              <q-btn flat color="secondary" icon="add" label="Vorankündigung hinzufügen" @click="addAnnouncement" />
            </div>
          </section>
        </q-step>

        <q-step
          :name="STEP_PREVIEW"
          title="Vorschau"
          icon="visibility"
          :header-nav="canHeaderNavigateTo(STEP_PREVIEW)"
        >
          <section class="page-edit-event__preview">
            <event-view :event="event" :preview="true" />
          </section>
        </q-step>

        <template v-slot:navigation>
          <q-stepper-navigation class="page-edit-event__button-bar">
            <q-btn label="Zurücksetzen" color="secondary" @click="revert" />
            <div class="page-edit-event__wizard-actions">
              <q-btn
                v-if="canGoBack"
                flat
                color="secondary"
                label="Zurück"
                @click="goToPreviousStep"
              />
              <q-btn
                v-if="canGoNext"
                flat
                color="primary"
                :label="step === STEP_DISCORD ? 'Zur Vorschau' : 'Weiter'"
                @click="goToNextStep"
              />
              <q-btn
                v-else
                label="Änderungen speichern"
                color="primary"
                @click="onSubmit"
              />
            </div>
          </q-stepper-navigation>
        </template>
      </q-stepper>
      <q-inner-loading :showing="saving" />
    </template>
    <q-spinner v-else />

    <q-dialog v-model="confirmRevert" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <span class="q-ml-sm"
            >Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?
            </span>
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
import { EventAnnouncementDto } from '@app/shared/dto/events/event-announcement.dto';
import { EventEditDto } from '@app/shared/dto/events/event-edit.dto';
import { EventLinkDto } from '@app/shared/dto/events/event-link.dto';
import { EventLocationDto } from '@app/shared/dto/events/event-location.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { EventType } from '@app/shared/enums/event-type.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import errors from '@app/shared/errors';
import SharedConstants from '@app/shared/SharedConstants';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { QForm } from 'quasar';
import { EventTypeOptions } from 'src/common/event-types';
import HtmlEditor from 'components/common/HtmlEditor.vue';
import EventAnnouncementEditor from 'components/event/EventAnnouncementEditor.vue';
import { DateTime } from 'luxon';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import BannerEditSection from 'src/components/common/BannerEditSection.vue';
import CharacterSelector from 'src/components/common/CharacterSelector.vue';
import EventIconEditSection from 'src/components/event/EventIconEditSection.vue';
import WorldSelect from 'src/components/common/WorldSelect.vue';
import EventView from 'src/components/event/EventView.vue';
import AdultOnlySelector from 'src/components/event/AdultOnlySelector.vue';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();
const $store = useStore();

async function load(params: RouteParams): Promise<{
  event: EventEditDto | null;
  eventId: number | null;
  contentNotes: { name: string }[];
}> {
  if (!$store.getters.characterId) {
    throw new Error();
  }

  const contentNotes = await $api.contentNotes.getContentNotes();
	const id = parseInt(params.id as string, 10);

	if (!id) {
		return { event: null, eventId: null, contentNotes };
	}

	try {
		const event = await $api.events.getEventForEdit(id);
		document.title = `${event.title} — Elpisgarten`;
		return { event, eventId: id, contentNotes };
	} catch (e) {
		if (errors.getStatusCode(e) === 404) {
			notifyError('Event konnte nicht gefunden werden.');
			void $router.replace('/');
		} else {
			notifyError(errors.getMessage(e));
		}

		throw e;
	}
}

@Options({
  components: {
    HtmlEditor,
    BannerEditSection,
    CharacterSelector,
    EventIconEditSection,
    EventView,
    EventAnnouncementEditor,
    WorldSelect,
    AdultOnlySelector,
  },
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => (vm as PageEditEvent).setContent(content));
	},
  async beforeRouteUpdate(to) {
		(this as PageEditEvent).setContent(await load(to.params));
	},
  watch: {
    startDate() {
      (this as PageEditEvent).syncStartDateTime();
    },
    startTime() {
      (this as PageEditEvent).syncStartDateTime();
    },
    endDate() {
      (this as PageEditEvent).syncEndDateTime();
    },
    endTime() {
      (this as PageEditEvent).syncEndDateTime();
    },
  }
})
export default class PageEditEvent extends Vue {
  readonly STEP_LOCATION = 1;
  readonly STEP_FACTS = 2;
  readonly STEP_CONTENT = 3;
  readonly STEP_CONTACT = 4;
  readonly STEP_MEDIA = 5;
  readonly STEP_DISCORD = 6;
  readonly STEP_PREVIEW = 7;
  readonly yesNoOptions = [
    { label: 'Ja', value: true },
    { label: 'Nein', value: false },
  ];

  eventId: number|null = null;
  event = new EventEditDto();
  eventBackup = new EventEditDto();
  contentNoteOptions: { label: string; value: string }[] = [];
  readonly eventTypeOptions = EventTypeOptions;
  readonly minDiscordBannerAspectRatio = SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO;
  venueOptions: VenueOption[] = [];

  startDate: string | null = null;
  startTime: string | null = null;
  endDate: string | null = null;
  endTime: string | null = null;

  step = this.STEP_LOCATION;
  loaded = false;
  saving = false;

  confirmRevert = false;

  selectedCharacterId: number | null = null;
  factsBasicsExpanded = true;
  factsTimingExpanded = false;
  eventLinksExpanded = false;
  private syncingDateTimeFields = false;

  get canGoBack() {
    return this.step > this.STEP_LOCATION;
  }

  get canGoNext() {
    return this.step < this.STEP_PREVIEW;
  }

  canHeaderNavigateTo(targetStep: number) {
    if (targetStep <= this.step) {
      return true;
    }

    for (let step = this.STEP_LOCATION; step < targetStep; step += 1) {
      if (!this.areRequiredDetailsComplete(step)) {
        return false;
      }
    }

    return true;
  }

  setContent(content: { event: EventEditDto | null; eventId: number | null; contentNotes?: { name: string }[] }) {
    if (content.contentNotes) {
      this.contentNoteOptions = content.contentNotes.map((contentNote) => ({
        label: (ContentNoteTexts as { [key: string]: string })[contentNote.name] || contentNote.name,
        value: contentNote.name,
      }));
    }

		if (content.event) {
			this.eventId = content.eventId;
			this.eventBackup = new EventEditDto(content.event);
      this.normalizeEvent(this.eventBackup);
      this.eventBackup.discordBanner = this.eventBackup.discordBanner || null;
      this.ensureSingleLocation(this.eventBackup);
    } else {
      this.eventId = null;
      this.eventBackup = new EventEditDto({
        mine: true,
        startDateTime: null as unknown as number,
        endDateTime: null,
        title: '',
        details: '',
        oocDetails: '',
        extraInfo: '',
        link: '',
        linkText: '',
        links: [],
        contact: '',
        eventType: EventType.RP,
        adultOnly: false,
        closedEvent: false,
        registrationDeadlineDays: null,
        registrationDeadlineTime: null,
        banner: null,
        discordBanner: null,
        icon: null,
        locations: [ this.newLocation() ],
        announcements: [
          new EventAnnouncementDto({ minutesBefore: 360, content: '' }),
          new EventAnnouncementDto({ minutesBefore: -180, content: '' }),
        ],
        contentNotes: [],
      });
    }

    this.venueOptions = [];
    if (this.eventBackup.locations[0]?.venueId) {
      void this.seedVenueOption(this.eventBackup.locations[0].venueId);
    }

    // Initialize selected character (default to current active character)
    this.selectedCharacterId = this.$store.getters.characterId || null;

    this.loaded = true;
    this.event = new EventEditDto(this.eventBackup);
    this.normalizeEvent(this.event);
    this.ensureSingleLocation(this.event);
    this.setStartDateTimeFields(this.event.startDateTime);
    this.setEndDateTimeFields(this.event.endDateTime);
    this.factsBasicsExpanded = true;
    this.factsTimingExpanded = false;
    this.eventLinksExpanded = (this.event.links?.length || 0) > 0;
  }

  private normalizeEvent(target: EventEditDto) {
    target.contentNotes = target.contentNotes || [];
    if (target.eventType === EventType.ADULT) {
      target.eventType = EventType.RP;
      target.adultOnly = true;
    }
    target.eventType = target.eventType || EventType.RP;
    target.adultOnly = target.adultOnly === true;
    target.closedEvent = target.closedEvent === true;
    if (target.registrationDeadlineDays === null || target.registrationDeadlineDays === undefined) {
      target.registrationDeadlineDays = null;
    } else {
      target.registrationDeadlineDays = Math.max(0, Math.floor(target.registrationDeadlineDays));
    }
    target.registrationDeadlineTime = this.normalizeOptionalTime(target.registrationDeadlineTime);
    if (!target.closedEvent) {
      target.registrationDeadlineTime = null;
    }
    target.extraInfo = target.extraInfo || '';
    target.links = this.normalizeLinks(target.links, target.link, target.linkText);
    target.link = target.links[0]?.url || '';
    target.linkText = target.links[0]?.label || '';
  }

  private ensureSingleLocation(target: EventEditDto) {
    const location = target.locations && target.locations.length > 0
      ? target.locations[0]
      : this.newLocation();
    target.locations = [
      new EventLocationDto({
        id: location.id,
        name: location.name || '',
        address: location.address || '',
        server: location.server || this.$store.getters.character!.server,
        link: location.link || '',
        linkText: location.linkText || '',
        venueId: location.venueId || undefined,
      }),
    ];
  }

  private fromMillisToParts(value: number | null): { date: string | null; time: string | null } {
    if (!value) {
      return {
        date: null,
        time: null,
      };
    }

    const dateTime = DateTime.fromMillis(value, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    });

    return {
      date: dateTime.toISODate(),
      time: dateTime.toFormat('HH:mm'),
    };
  }

  private toMillisFromParts(date: string | null, time: string | null): number | null {
    if (!date || !time) {
      return null;
    }

    return DateTime.fromISO(`${date}T${time}`, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    }).toMillis();
  }

  private setStartDateTimeFields(value: number | null) {
    this.syncingDateTimeFields = true;
    const { date, time } = this.fromMillisToParts(value);
    this.startDate = date;
    this.startTime = time;
    this.syncingDateTimeFields = false;
    this.syncStartDateTime();
  }

  private setEndDateTimeFields(value: number | null) {
    this.syncingDateTimeFields = true;
    const { date, time } = this.fromMillisToParts(value);
    this.endDate = date && date !== this.startDate ? date : null;
    this.endTime = time;
    this.syncingDateTimeFields = false;
    this.syncEndDateTime();
  }

  private syncStartDateTime() {
    if (this.syncingDateTimeFields) {
      return;
    }

    this.event.startDateTime = this.toMillisFromParts(this.startDate, this.startTime) as unknown as number;
    this.syncEndDateTime();
  }

  private syncEndDateTime() {
    if (this.syncingDateTimeFields) {
      return;
    }

    this.event.endDateTime = this.toMillisFromParts(this.effectiveEndDate, this.endTime);
  }

  clearStartDateTime() {
    this.startDate = null;
    this.startTime = null;
  }

  clearEndDateOverride() {
    this.endDate = null;
  }

  clearEndTime() {
    this.endDate = null;
    this.endTime = null;
  }

  validateEndDate() {
    return !this.endTime || !!this.effectiveEndDate || 'Bitte wähle zuerst ein Beginndatum.';
  }

  validateEndTime() {
    return !this.endDate || !!this.endTime || 'Bitte wähle auch eine Enduhrzeit.';
  }

  get startDateDisplay() {
    return this.startDate ? this.$display.formatDate(this.startDate) : '';
  }

  get effectiveEndDate() {
    return this.endDate || this.startDate;
  }

  get isEndDateImplicit() {
    return !this.endDate && !!this.startDate;
  }

  get endDateDisplay() {
    return this.effectiveEndDate ? this.$display.formatDate(this.effectiveEndDate) : '';
  }

  get startDateTimeMillis(): number | null {
    return this.toMillisFromParts(this.startDate, this.startTime);
  }

  get endDateTimeMillis(): number | null {
    return this.toMillisFromParts(this.effectiveEndDate, this.endTime);
  }

  private areRequiredDetailsComplete(step: number) {
    switch (step) {
      case this.STEP_LOCATION:
        return this.hasLocationRequiredDetails();
      case this.STEP_FACTS:
        return this.hasFactsBasicsRequiredDetails() && this.hasFactsTimingRequiredDetails();
      default:
        return true;
    }
  }

  private hasLocationRequiredDetails() {
    const location = this.event.locations[0];
    return (this.eventId !== null || this.selectedCharacterId !== null)
      && !!location?.name?.trim()
      && !!location?.server;
  }

  private hasFactsBasicsRequiredDetails() {
    return !!this.event.title?.trim() && !!this.event.eventType;
  }

  private hasFactsTimingRequiredDetails() {
    return this.startDateTimeMillis !== null;
  }

  private hasInvalidEventLinks() {
    return (this.event.links || []).some((link) => {
      const url = (link?.url || '').trim();
      if (url.length === 0) {
        return false;
      }

      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:';
      } catch {
        return true;
      }
    });
  }

  private expandPanelsForValidation(step: number) {
    if (step === this.STEP_FACTS) {
      if (!this.hasFactsBasicsRequiredDetails()) {
        this.factsBasicsExpanded = true;
        this.factsTimingExpanded = false;
      } else if (!this.hasFactsTimingRequiredDetails()) {
        this.factsBasicsExpanded = false;
        this.factsTimingExpanded = true;
      }
    }

    if (step === this.STEP_CONTACT && this.hasInvalidEventLinks()) {
      this.eventLinksExpanded = true;
    }
  }

  async goToNextStep() {
    if (!(await this.validateStep(this.step))) {
      return;
    }

    if (this.canGoNext) {
      this.step += 1;
    }
  }

  goToPreviousStep() {
    if (this.canGoBack) {
      this.step -= 1;
    }
  }

  private getValidationRefs(step: number): string[] {
    switch (step) {
      case this.STEP_LOCATION:
        return ['locationForm'];
      case this.STEP_FACTS:
        return ['factsForm'];
      case this.STEP_CONTACT:
        return ['contactForm'];
      default:
        return [];
    }
  }

  private getFormRef(refName: string): QForm | null {
    const form = this.$refs[refName] as QForm | QForm[] | undefined;
    return Array.isArray(form) ? form[0] || null : form || null;
  }

  private async validateStep(step: number): Promise<boolean> {
    this.expandPanelsForValidation(step);

    for (const refName of this.getValidationRefs(step)) {
      const form = this.getFormRef(refName);
      if (form && await form.validate() !== true) {
        return false;
      }
    }

    return true;
  }

  private async validateForSubmit(): Promise<boolean> {
    const currentStep = this.step;

    for (const validationStep of [this.STEP_LOCATION, this.STEP_FACTS, this.STEP_CONTACT]) {
      if (this.step !== validationStep) {
        this.step = validationStep;
        await this.$nextTick();
      }

      if (!(await this.validateStep(validationStep))) {
        return false;
      }
    }

    if (this.step !== currentStep) {
      this.step = currentStep;
      await this.$nextTick();
    }

    return true;
  }

  addAnnouncement() {
    this.event.announcements.push(new EventAnnouncementDto({
      minutesBefore: 20160,
      content: '',
    }));
  }

  announcementCaption(minutesBefore: number) {
    if (minutesBefore === 0) {
      return 'Zum Eventbeginn';
    }

    const absoluteMinutes = Math.abs(minutesBefore);
    const direction = minutesBefore > 0 ? 'vorher' : 'nach Beginn';

    if (absoluteMinutes % 10080 === 0) {
      const weeks = absoluteMinutes / 10080;
      return `${weeks} ${weeks === 1 ? 'Woche' : 'Wochen'} ${direction}`;
    }

    if (absoluteMinutes % 1440 === 0) {
      const days = absoluteMinutes / 1440;
      return `${days} ${days === 1 ? 'Tag' : 'Tage'} ${direction}`;
    }

    if (absoluteMinutes % 60 === 0) {
      const hours = absoluteMinutes / 60;
      return `${hours} ${hours === 1 ? 'Stunde' : 'Stunden'} ${direction}`;
    }

    return `${absoluteMinutes} Minuten ${direction}`;
  }

  removeAnnouncement(index: number) {
    this.event.announcements.splice(index, 1);
  }

  addEventLink() {
    if (!this.event.links) {
      this.event.links = [];
    }

    this.event.links.push(new EventLinkDto({
      url: '',
      label: '',
    }));
    this.eventLinksExpanded = true;
  }

  removeEventLink(index: number) {
    if (!this.event.links) {
      return;
    }

    this.event.links.splice(index, 1);
    if (this.event.links.length === 0) {
      this.eventLinksExpanded = false;
    }
  }

  newLocation() {
    return new EventLocationDto({
      name: '',
      address: '',
      server: this.$store.getters.character!.server,
      link: '',
      linkText: '',
      venueId: undefined,
    });
  }

  private normalizeLinks(
    links: EventLinkDto[] | null | undefined,
    legacyLink?: string | null,
    legacyLabel?: string | null,
  ): EventLinkDto[] {
    const normalized = (links || [])
      .map((link) => new EventLinkDto({
        url: (link?.url || '').trim(),
        label: (link?.label || '').trim() || undefined,
      }))
      .filter((link) => link.url.length > 0);

    if (normalized.length === 0) {
      const legacyUrl = (legacyLink || '').trim();
      if (legacyUrl.length > 0) {
        return [
          new EventLinkDto({
            url: legacyUrl,
            label: (legacyLabel || '').trim() || undefined,
          }),
        ];
      }
    }

    return normalized;
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

  async onVenueSearch(value: string, update: (fn: () => void) => void) {
    const query = value.trim();

    if (query.length < 2) {
      update(() => {
        this.venueOptions = [];
      });
      return;
    }

    const server = this.event.locations[0]?.server || undefined;
    const venues = await this.$api.venues.searchVenues(query, server || undefined);

    const options = venues.map((venue) => ({
      label: `${venue.name} (${venue.server})`,
      value: venue.id,
      venue,
    }));

    update(() => {
      this.venueOptions = options;
    });
  }

  async onVenueSelected(venueId: number | null) {
    const location = this.event.locations[0];
    if (!location) {
      return;
    }

    if (!venueId) {
      location.venueId = undefined;
      return;
    }

    location.venueId = venueId;

    const option = this.venueOptions.find((candidate) => candidate.value === venueId);
    if (option) {
      this.applyVenueToLocation(location, option.venue);
    }

    try {
      const venue = await this.$api.venues.getVenue(venueId);
      const updatedLocation = this.event.locations[0];
      if (!updatedLocation || updatedLocation.venueId !== venueId) {
        return;
      }

      this.applyVenueTemplate(venue);
      const summary = this.toVenueSummary(venue);

      if (option) {
        this.venueOptions = this.venueOptions.map((candidate) =>
          candidate.value === venueId
            ? {
                ...candidate,
                label: `${summary.name} (${summary.server})`,
                venue: summary,
              }
            : candidate,
        );
      } else {
        const seededOption = {
          label: `${summary.name} (${summary.server})`,
          value: summary.id,
          venue: summary,
        };
        this.venueOptions = [seededOption];
      }

      this.applyVenueToLocation(updatedLocation, summary);
      this.eventLinksExpanded = (this.event.links?.length || 0) > 0;
    } catch (e) {
      notifyError(e);
    }
  }

  private async seedVenueOption(venueId: number) {
    try {
      const venue = await this.$api.venues.getVenue(venueId);
      const summary = this.toVenueSummary(venue);
      this.venueOptions = [
        {
          label: `${summary.name} (${summary.server})`,
          value: summary.id,
          venue: summary,
        },
      ];

      const backupLocation = this.eventBackup.locations[0];
      if (backupLocation && backupLocation.venueId === venueId) {
        this.applyVenueToLocation(backupLocation, summary);
      }

      const currentLocation = this.event.locations[0];
      if (currentLocation && currentLocation.venueId === venueId) {
        this.applyVenueToLocation(currentLocation, summary);
      }
    } catch (e) {
      notifyError(e);
    }
  }

  private applyVenueToLocation(location: EventLocationDto, venue: VenueSummaryDto) {
    location.name = venue.name;
    location.address = venue.address;
    location.server = venue.server;
  }

  private applyVenueTemplate(venue: VenueDto) {
    if (!this.event.title && venue.eventTitle) {
      this.event.title = venue.eventTitle;
    }

    if (!this.event.details && venue.eventDescription) {
      this.event.details = venue.eventDescription;
    }

    if (!this.event.oocDetails && venue.eventOocDetails) {
      this.event.oocDetails = venue.eventOocDetails;
    }

    if (!this.event.contact && venue.eventContact) {
      this.event.contact = venue.eventContact;
    }

    if ((!this.event.links || this.event.links.length === 0) && (venue.eventLinks?.length || venue.eventLink || venue.website)) {
      const templateLinks = venue.eventLinks && venue.eventLinks.length > 0
        ? venue.eventLinks
        : [{ url: venue.eventLink || venue.website, label: '' }];

      this.event.links = this.normalizeLinks(templateLinks, venue.eventLink || venue.website, '');
      this.event.link = this.event.links[0]?.url || '';
      this.event.linkText = this.event.links[0]?.label || '';
    }

    if (this.event.eventType === EventType.RP && venue.eventType && venue.eventType !== EventType.RP) {
      this.event.eventType = venue.eventType;
    }

    if (!this.event.adultOnly && venue.eventAdultOnly) {
      this.event.adultOnly = true;
    }

    if (venue.eventClosed) {
      if (!this.event.closedEvent) {
        this.event.closedEvent = true;
      }

      if (this.event.registrationDeadlineDays === null || this.event.registrationDeadlineDays === undefined) {
        this.event.registrationDeadlineDays = venue.eventRegistrationDeadlineDays ?? null;
      }

      if (!this.event.registrationDeadlineTime && venue.eventRegistrationDeadlineTime) {
        this.event.registrationDeadlineTime = venue.eventRegistrationDeadlineTime;
      }
    }

    if (!this.event.extraInfo && venue.eventExtraInfo) {
      this.event.extraInfo = venue.eventExtraInfo;
    }

    if (!this.event.icon && venue.eventIcon) {
      this.event.icon = venue.eventIcon;
    }

    if (!this.event.banner && venue.eventBanner) {
      this.event.banner = venue.eventBanner;
    }

    if (!this.event.discordBanner && venue.eventDiscordBanner) {
      this.event.discordBanner = venue.eventDiscordBanner;
    }

    if (!this.startTime && venue.eventStartTime) {
      if (!this.startDate && venue.eventStartWeekday) {
        const start = this.resolveTemplateStartDateTime(venue);
        if (start) {
          this.setStartDateTimeFields(start);
        } else {
          this.startTime = venue.eventStartTime;
        }
      } else {
        this.startTime = venue.eventStartTime;
      }
    } else if (!this.startDate && !this.startTime) {
      const start = this.resolveTemplateStartDateTime(venue);
      if (start) {
        this.setStartDateTimeFields(start);
      }
    }

    if (!this.endDate && !this.endTime && this.startDateTimeMillis !== null) {
      const end = this.resolveTemplateEndDateTime(venue, this.startDateTimeMillis);
      if (end) {
        this.setEndDateTimeFields(end);
      }
    } else if (!this.endTime && venue.eventEndTime) {
      this.endDate = null;
      this.endTime = venue.eventEndTime;
    }

    if ((!this.event.contentNotes || this.event.contentNotes.length === 0) && venue.eventContentNotes?.length) {
      this.event.contentNotes = [...venue.eventContentNotes];
    }
  }

  private resolveTemplateStartDateTime(venue: VenueDto): number | null {
    if (venue.eventStartWeekday && venue.eventStartTime) {
      return this.resolveNextMatchingWeekdayTime(venue.eventStartWeekday, venue.eventStartTime);
    }

    if (venue.eventStartDateTime) {
      return this.resolveLegacyNextMatchingWeekdayTime(venue.eventStartDateTime);
    }

    return null;
  }

  private resolveTemplateEndDateTime(venue: VenueDto, startMillis: number | null): number | null {
    if (startMillis && venue.eventEndTime && venue.eventEndDurationDays !== null && venue.eventEndDurationDays !== undefined) {
      return this.resolveEndDateTimeFromTemplate(startMillis, venue.eventEndTime, venue.eventEndDurationDays);
    }

    if (venue.eventEndDateTime) {
      return this.resolveLegacyNextMatchingWeekdayTime(venue.eventEndDateTime);
    }

    return null;
  }

  private resolveEndDateTimeFromTemplate(startMillis: number, endTime: string, endDurationDays: number): number {
    const [hour, minute] = endTime.split(':').map((part) => parseInt(part, 10));
    return DateTime.fromMillis(startMillis, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    })
      .plus({ days: Math.max(0, Math.floor(endDurationDays)) })
      .set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      })
      .toMillis();
  }

  private resolveNextMatchingWeekdayTime(weekday: number, time: string): number {
    const [hour, minute] = time.split(':').map((part) => parseInt(part, 10));
    const now = DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE);
    const daysToAdd = (weekday - now.weekday + 7) % 7;
    let candidate = now
      .plus({ days: daysToAdd })
      .set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
      });

    if (daysToAdd === 0 && candidate.toMillis() <= now.toMillis()) {
      candidate = candidate.plus({ weeks: 1 });
    }

    return candidate.toMillis();
  }

  private resolveLegacyNextMatchingWeekdayTime(templateMillis: number): number {
    const template = DateTime.fromMillis(templateMillis, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
    });
    return this.resolveNextMatchingWeekdayTime(template.weekday, template.toFormat('HH:mm'));
  }

  private toVenueSummary(venue: VenueDto): VenueSummaryDto {
    return {
      id: venue.id,
      name: venue.name,
      server: venue.server,
      purpose: venue.purpose,
      housingArea: venue.housingArea,
      address: this.formatVenueAddress(venue),
    };
  }

  private formatVenueAddress(venue: VenueDto): string {
    if (venue.location === VenueLocation.OPEN_WORLD) {
      return venue.address;
    }

    const plotNumber = venue.plot ?? '';
    const roomNumber = venue.room ?? '';
    const plot = venue.location === VenueLocation.HOUSE ? `Grundstück ${plotNumber}` : `Wohnung ${roomNumber}`;
    const housingArea = venue.housingArea ? this.$display.housingAreas[venue.housingArea] : '';
    const ward = venue.ward ?? '';
    let address = `${housingArea}, Bezirk ${ward}, ${plot}`;

    if (venue.subdivision) {
      address += ' (Erweiterung)';
    }

    return address;
  }

  revert() {
    this.confirmRevert = true;
  }

  onConfirmRevert() {
    // We use setContent instead of just reassigning from backup
    // because the split start/end date and time fields are managed outside this.event
    if (this.eventId) {
      this.setContent({
        event: this.eventBackup,
        eventId: this.eventId,
      });
    } else {
      this.setContent({
        event: null,
        eventId: null,
      });
    }
  }

  async onSubmit() {
    if (!(await this.validateForSubmit())) {
      return;
    }

    this.saving = true;

    try {
      this.normalizeEvent(this.event);
      const eventLinks = this.event.links || [];
      this.event.link = eventLinks[0]?.url || '';
      this.event.linkText = eventLinks[0]?.label || '';
      if (!this.event.closedEvent) {
        this.event.registrationDeadlineDays = null;
        this.event.registrationDeadlineTime = null;
      }

      this.applyAnnouncementDefaults();

      if (!this.eventId) {
        if (!this.selectedCharacterId) {
          throw new Error('No character selected');
        }
        const result = await this.$api.events.createEvent(this.event, this.selectedCharacterId);
        this.event = new EventEditDto(result);
        this.normalizeEvent(this.event);
        this.eventId = result.id;
        void this.$router.replace(`/edit-event/${result.id}`);
      } else {
        this.event = new EventEditDto(await this.$api.events.updateEvent(this.eventId, this.event));
        this.normalizeEvent(this.event);
      }

      this.eventBackup = new EventEditDto(this.event);

      notifySuccess('Event gespeichert.', {
        label: 'Anschauen',
        color: 'white',
        handler: () => this.viewEvent(),
      });

      void this.$store.dispatch('updateEvents');
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
  }

  viewEvent() {
    if (this.eventId) {
      void this.$router.push(`/event/${this.eventId}`);
    }
  }

  private applyAnnouncementDefaults() {
    const content = this.buildAnnouncementContent();
    if (!content) {
      return;
    }

    this.event.announcements.forEach((announcement) => {
      if (!announcement.content || announcement.content.trim().length === 0) {
        announcement.content = content;
      }
    });
  }

  private buildAnnouncementContent(): string {
    const title = (this.event.title || '').trim();
    const details = this.stripHtml(this.event.details || '').trim();

    if (title && details) {
      return `${title}\n\n${details}`;
    }

    return details || title;
  }

  private stripHtml(content: string): string {
    const container = document.createElement('div');
    container.innerHTML = content;
    return container.textContent || '';
  }
}

type VenueOption = {
  label: string;
  value: number;
  venue: VenueSummaryDto;
};
</script>

<style lang="scss">
.page-edit-event {
  --edit-event-select-group-border: rgba(221, 180, 118, 0.25);
  --edit-event-select-group-bg: rgba(249, 247, 242, 0.95);
  --edit-event-select-title-color: rgba(35, 35, 35, 0.7);
  --edit-event-option-color: inherit;
  --edit-event-section-border: rgba(221, 180, 118, 0.22);
  --edit-event-section-bg: rgba(255, 255, 255, 0.82);
  --edit-event-section-hint: rgba(35, 35, 35, 0.75);
}

body.body--dark .page-edit-event {
  --edit-event-select-group-border: rgba(141, 181, 223, 0.3);
  --edit-event-select-group-bg: rgba(17, 25, 37, 0.9);
  --edit-event-select-title-color: rgba(213, 226, 240, 0.76);
  --edit-event-option-color: rgba(213, 226, 240, 0.9);
  --edit-event-section-border: rgba(141, 181, 223, 0.3);
  --edit-event-section-bg: rgba(17, 25, 37, 0.88);
  --edit-event-section-hint: rgba(213, 226, 240, 0.82);
}

.page-edit-event__form-controls {
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-event__stepper {
  margin-bottom: 18px;
  background: transparent;
}

.page-edit-event__accordion {
  display: grid;
  gap: 12px;
}

.page-edit-event__expansion-item {
  border: 1px solid var(--edit-event-select-group-border);
  background: var(--edit-event-select-group-bg);
}

.page-edit-event__expansion-item .q-expansion-item__container {
  background: transparent;
}

.page-edit-event__expansion-header {
  color: var(--edit-event-select-title-color);
}

.page-edit-event__expansion-header .q-item__label {
  font-weight: 700;
}

.page-edit-event__expansion-header .q-item__label--caption {
  color: var(--edit-event-section-hint);
}

.page-edit-event__expansion-body {
  padding: 0 14px 14px;
}

.page-edit-event__section {
  margin-bottom: 22px;
  padding: 14px 16px;
  border: 1px solid var(--edit-event-section-border);
  background: var(--edit-event-section-bg);
}

.page-edit-event__section-hint {
  margin: 0 0 12px;
  color: var(--edit-event-section-hint);
}

.page-edit-event__preview {
  margin-bottom: 24px;
}

.page-edit-event__select-group {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--edit-event-select-group-border);
  background: var(--edit-event-select-group-bg);
}

.page-edit-event__select-title {
  margin-bottom: 8px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--edit-event-select-title-color);
}

.page-edit-event__options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 12px;
  row-gap: 6px;
  color: var(--edit-event-option-color);
}

.page-edit-event__options-grid .q-option-group__option {
  margin: 0;
}

.page-edit-event__date-time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.page-edit-event__date-time-value--implicit {
  color: var(--edit-event-section-hint) !important;
}

.page-edit-event__event-link-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.page-edit-event__inline-actions {
  display: flex;
  justify-content: flex-end;
}

.page-edit-event__wizard-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-left: auto;
}

@media screen and (max-width: $breakpoint-sm) {
  .page-edit-event__options-grid {
    grid-template-columns: 1fr;
  }

  .page-edit-event__date-time-grid {
    grid-template-columns: 1fr;
  }

  .page-edit-event__event-link-row {
    grid-template-columns: 1fr;
  }

  .page-edit-event__section {
    padding: 12px;
  }

  .page-edit-event__inline-actions {
    justify-content: flex-start;
  }

  .page-edit-event__button-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .page-edit-event__wizard-actions {
    width: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}

.page-edit-event__button-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
  margin-bottom: 16px;
}


.page-edit-event__preview h6 {
  font-family: $header-font;
}
</style>
