<template>
  <q-page class="page-edit-event">
    <template v-if="loaded">
      <h2>{{ eventId ? 'Event bearbeiten' : 'Neues Event erstellen' }}</h2>
      <q-form ref="form" @submit="onSubmit">
        <template v-if="!preview">
          <section class="page-edit-event__form-controls">
            <character-selector
              v-if="!eventId"
              v-model="selectedCharacterId"
              :rules="[
                $rules.required('Bitte wähle einen Charakter aus.'),
              ]"
            />
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
            </div>
            <q-date-time-picker
              v-if="startDateTimeVisible"
              label="Datum/Uhrzeit Beginn *"
              v-model="startDateTime"
              :display-value="startDateTimeDisplay"
              mode="datetime"
              first-day-of-week="1"
              format24h
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            />
            <q-date-time-picker
              v-if="endDateTimeVisible"
              label="Datum/Uhrzeit Ende"
              v-model="endDateTime"
              :display-value="endDateTimeDisplay"
              mode="datetime"
              first-day-of-week="1"
              format24h
              clearable
            />
            <q-checkbox
              v-model="event.recurring"
              label="Dies ist ein wiederkehrendes Event."
            />
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
            <h6>Standort</h6>
            <q-select
              v-model="event.locations[0].venueId"
              label="Treffpunkt verknüpfen (optional)"
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
              label="Treffpunkt-Name *"
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
          <h6>Details</h6>
          <html-editor v-model="event.details" />
          <h6>OOC Details</h6>
          <html-editor v-model="event.oocDetails" />
          <event-icon-edit-section v-model="event.icon" />
          <banner-edit-section v-model="event.banner" />
          <banner-edit-section
            v-model="event.discordBanner"
            title="Discord-Banner"
            :ratio="5 / 2"
            :min-aspect-ratio="minDiscordBannerAspectRatio"
            hint="Mindestens 5:2 (Breite:Höhe), empfohlen 1500x600. Formate: JPG/PNG, max. 1 MiB. Beim Hochladen kannst du den Ausschnitt zuschneiden."
          />
          <q-input
            v-model="event.link"
            label="Link"
            :rules="[
              $rules.url('Bitte hinterlasse einen Link.'),
            ]"
          />
          <q-input
            v-model="event.linkText"
            label="Linktext (optional)"
          />
          <q-input
            v-model="event.contact"
            label="Kontakt"
          />
          <h6>Vorankündigungen</h6>
          <p>Der Chaos Archives Discord-Bot kann das Event im <tt>#rp-event-announcements</tt>-Channel ankündigen. Du kannst Vorankündigungen flexibel planen (z. B. 2 Wochen, 1 Woche oder 2 Tage vorher).</p>
          <template v-for="(_, index) in event.announcements" :key="index">
            <event-announcement-editor v-model="event.announcements[index]" @remove="removeAnnouncement(index)" />
          </template>
          <div class="page-edit-event__button-bar" style="justify-content: end">
            <q-btn flat color="secondary" icon="add" label="Vorankündigung hinzufügen" @click="addAnnouncement" />
          </div>
        </template>
        <section v-else class="page-edit-event__preview">
          <event-view :event="event" :preview="true" />
        </section>
        <div class="page-edit-event__button-bar">
          <q-btn-toggle
            v-model="preview"
            :options="previewOptions"
            toggle-color="secondary"
          />
          <div class="page-edit-event__revert-submit">
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
import { EventLocationDto } from '@app/shared/dto/events/event-location.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { EventType } from '@app/shared/enums/event-type.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import errors from '@app/shared/errors';
import SharedConstants from '@app/shared/SharedConstants';
import { Component as QDateTimePicker } from '@toby.mosque/quasar-ui-qdatetimepicker';
import '@toby.mosque/quasar-ui-qdatetimepicker/dist/index.css'; // Temp, move somewhere
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
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
    QDateTimePicker,
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
    startDateTime: {
      handler(newValue: string, oldValue: string) {
        // Workaround for validation message bug. Forces the date/time picker to be re-rendered on value change,
        // thus resetting validation error messages.
        if (newValue !== oldValue) {
          const that = this as PageEditEvent;
          that.event.startDateTime = that.toMillis(newValue)!;
          that.startDateTimeVisible = false;
          void that.$nextTick(() => that.startDateTimeVisible = true);
        }
      }
    },
    endDateTime: {
      handler(newValue: string, oldValue: string) {
        // Workaround for display bugs with the clear button
        if (newValue !== oldValue) {
          const that = this as PageEditEvent;
          that.event.endDateTime = that.toMillis(newValue)!;
          that.endDateTimeVisible = false;
          void that.$nextTick(() => that.endDateTimeVisible = true);
        }
      }
    }
  }
})
export default class PageEditEvent extends Vue {
  readonly previewOptions = [
    { label: 'Bearbeitung', value: false },
    { label: 'Vorschau', value: true },
  ];

  eventId: number|null = null;
  event = new EventEditDto();
  eventBackup = new EventEditDto();
  contentNoteOptions: { label: string; value: string }[] = [];
  readonly eventTypeOptions = EventTypeOptions;
  readonly minDiscordBannerAspectRatio = SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO;
  venueOptions: VenueOption[] = [];

  startDateTime: string|null = null;
  endDateTime: string|null = null;

  startDateTimeVisible = true;
  endDateTimeVisible = true;

  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

  selectedCharacterId: number | null = null;

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
      this.eventBackup.linkText = this.eventBackup.linkText || '';
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
        link: '',
        linkText: '',
        contact: '',
        recurring: false,
        eventType: EventType.RP,
        adultOnly: false,
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
    this.startDateTime = this.fromMillis(this.event.startDateTime);
    this.endDateTime = this.fromMillis(this.event.endDateTime);
  }

  private normalizeEvent(target: EventEditDto) {
    target.contentNotes = target.contentNotes || [];
    if (target.eventType === EventType.ADULT) {
      target.eventType = EventType.RP;
      target.adultOnly = true;
    }
    target.eventType = target.eventType || EventType.RP;
    target.adultOnly = target.adultOnly === true;
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

  private fromMillis(value: number|null): string|null {
    if (!value) {
      return null;
    } else {
      return DateTime.fromMillis(value, {
        zone: SharedConstants.FFXIV_SERVER_TIMEZONE
      }).toISO().substring(0, 16);
    }
  }

  private toMillis(value: string|null): number|null {
    if (!value) {
      return null;
    }

    return DateTime.fromISO(value, {
      zone: SharedConstants.FFXIV_SERVER_TIMEZONE
    }).toMillis();
  }

  get startDateTimeMillis(): number|null {
    return this.toMillis(this.startDateTime);
  }

  get startDateTimeDisplay() {
    const millis = this.startDateTimeMillis;

    if (!millis) {
      return '';
    }

    return this.$display.formatDateTimeServer(millis);
  }

  get endDateTimeMillis(): number|null {
    return this.toMillis(this.endDateTime);
  }

  get endDateTimeDisplay() {
    const millis = this.endDateTimeMillis;

    if (!millis) {
      return '';
    }

    return this.$display.formatDateTimeServer(millis);
  }

  addAnnouncement() {
    this.event.announcements.push(new EventAnnouncementDto({
      minutesBefore: 20160,
      content: '',
    }));
  }

  removeAnnouncement(index: number) {
    this.event.announcements.splice(index, 1);
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
    if (!this.event.details && venue.eventDescription) {
      this.event.details = venue.eventDescription;
    }

    if (!this.event.oocDetails && venue.eventOocDetails) {
      this.event.oocDetails = venue.eventOocDetails;
    }

    if (!this.event.contact && venue.eventContact) {
      this.event.contact = venue.eventContact;
    }

    if (!this.event.link && (venue.eventLink || venue.website)) {
      this.event.link = venue.eventLink || venue.website;
    }

    if ((!this.event.contentNotes || this.event.contentNotes.length === 0) && venue.eventContentNotes?.length) {
      this.event.contentNotes = [...venue.eventContentNotes];
    }
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
    // because startDateTime and endDateTime are not part of this.event but are part of form model
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
    this.saving = true;

    try {
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
}

body.body--dark .page-edit-event {
  --edit-event-select-group-border: rgba(141, 181, 223, 0.3);
  --edit-event-select-group-bg: rgba(17, 25, 37, 0.9);
  --edit-event-select-title-color: rgba(213, 226, 240, 0.76);
  --edit-event-option-color: rgba(213, 226, 240, 0.9);
}

.page-edit-event__form-controls {
  flex-basis: 0;
  flex-grow: 1;
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

@media screen and (max-width: $breakpoint-sm) {
  .page-edit-event__options-grid {
    grid-template-columns: 1fr;
  }
}

.page-edit-event__button-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
}


.page-edit-event__preview h6 {
  font-family: $header-font;
}
</style>
