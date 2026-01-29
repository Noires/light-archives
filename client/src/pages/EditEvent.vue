<template>
  <q-page class="page-edit-event">
    <template v-if="loaded">
      <h2>{{ eventId ? 'Event bearbeiten' : 'Neues Event erstellen' }}</h2>
      <q-form ref="form" @submit="onSubmit">
        <template v-if="!preview">
          <section class="page-edit-event__form-controls">
            <q-input
              v-model="event.title"
              label="Titel *"
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            />
            <q-select
              v-model="event.eventType"
              label="Event-Typ *"
              :options="eventTypeOptions"
              emit-value
              map-options
              :rules="[
                $rules.required('Dieses Feld ist erforderlich.'),
              ]"
            />
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
            <h6>Inhaltswarnungen</h6>
            <Multiselect
              v-model="event.contentNotes"
              :options="contentNoteOptions"
              mode="tags"
              :searchable="true"
              :closeOnSelect="false"
              valueProp="value"
              track-by="label"
              label="label"
            />
          <template v-for="(location, index) in event.locations" :key="index">
              <h6>Standort</h6>
              <q-select
                v-model="location.venueId"
                label="Treffpunkt-Name (Verknüpfen)"
                use-input
                input-debounce="250"
                emit-value
                map-options
                clearable
                :options="venueOptions[index] || []"
                @filter="(val, update, abort) => onVenueSearch(val, update, abort, index)"
                @update:model-value="(value) => onVenueSelected(value, index)"
              />
              <q-input
                v-model="location.name"
                label="Treffpunkt-Name *"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />          
              <q-input
                v-model="location.address"
                label="Adresse"
              >
                <template v-slot:prepend>
                  <q-icon name="place" />
                </template>
              </q-input>
              <world-select
                v-model="location.server"
                label="Welt"
                :rules="[
                  $rules.required('Dieses Feld ist erforderlich.'),
                ]"
              />
              <q-input
                v-model="location.link"
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
                v-model="location.tags"
                label="Standort Schlagworte"
              />
              <div v-if="event.locations.length > 1" class="page-edit-event__button-bar" style="justify-content: end">
                <q-btn flat color="negative" icon="remove" label="Diesen Standort entfernen" @click="removeLocation(index)" />
              </div>
          </template>
          <div class="page-edit-event__button-bar" style="justify-content: end">
            <q-btn flat color="secondary" icon="add" label="Standort hinzufügen" @click="addLocation" />
          </div>
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
            hint="Discord-Banner sollten ein SeitenverhÃ¤ltnis von 5:2 haben (z. B. 800Ã—320)."
          />
          <q-input
            v-model="event.link"
            label="Link"
            :rules="[
              $rules.url('Bitte hinterlasse einen Link.'),
            ]"
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
import Multiselect from '@vueform/multiselect';
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
import EventIconEditSection from 'src/components/event/EventIconEditSection.vue';
import WorldSelect from 'src/components/common/WorldSelect.vue';
import EventView from 'src/components/event/EventView.vue';
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
    EventIconEditSection,
    EventView,
    EventAnnouncementEditor,
    WorldSelect,
    Multiselect,
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
  venueOptions: VenueOption[][] = [];

  startDateTime: string|null = null;
  endDateTime: string|null = null;

  startDateTimeVisible = true;
  endDateTimeVisible = true;

  preview = false;
  loaded = false;
  saving = false;

  confirmRevert = false;

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
      this.eventBackup.contentNotes = this.eventBackup.contentNotes || [];
      this.eventBackup.eventType = this.eventBackup.eventType || EventType.GENERAL;
      this.eventBackup.discordBanner = this.eventBackup.discordBanner || null;
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
        contact: '',
        recurring: false,
        eventType: EventType.GENERAL,
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

    this.venueOptions = this.eventBackup.locations.map(() => []);
    this.eventBackup.locations.forEach((location, index) => {
      if (location.venueId) {
        void this.seedVenueOption(index, location.venueId);
      }
    });

    this.loaded = true;
    this.event = new EventEditDto(this.eventBackup);
    this.startDateTime = this.fromMillis(this.event.startDateTime);
    this.endDateTime = this.fromMillis(this.event.endDateTime);
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

  addLocation() {
    this.event.locations.push(this.newLocation());
    this.venueOptions.push([]);
  }

  newLocation() {
    return new EventLocationDto({
      name: '',
      address: '',
      server: this.$store.getters.character!.server,
      tags: '',
      link: '',
      venueId: undefined,
    });
  }

  removeLocation(index: number) {
    this.event.locations.splice(index, 1);
    this.venueOptions.splice(index, 1);
  }

  async onVenueSearch(value: string, update: (fn: () => void) => void, _abort: () => void, index: number) {
    const query = value.trim();

    if (query.length < 2) {
      update(() => {
        this.venueOptions.splice(index, 1, []);
      });
      return;
    }

    const server = this.event.locations[index]?.server || undefined;
    const venues = await this.$api.venues.searchVenues(query, server || undefined);

    const options = venues.map((venue) => ({
      label: `${venue.name} (${venue.server})`,
      value: venue.id,
      venue,
    }));

    update(() => {
      this.venueOptions.splice(index, 1, options);
    });
  }

  async onVenueSelected(venueId: number | null, index: number) {
    const location = this.event.locations[index];
    if (!location) {
      return;
    }

    if (!venueId) {
      location.venueId = undefined;
      return;
    }

    location.venueId = venueId;

    const option = this.venueOptions[index]?.find((candidate) => candidate.value === venueId);
    if (option) {
      this.applyVenueToLocation(location, option.venue);
    }

    try {
      const venue = await this.$api.venues.getVenue(venueId);
      this.applyVenueTemplate(venue);

      if (!option) {
        const summary = this.toVenueSummary(venue);
        const seededOption = {
          label: `${summary.name} (${summary.server})`,
          value: summary.id,
          venue: summary,
        };
        this.venueOptions.splice(index, 1, [seededOption]);
        this.applyVenueToLocation(location, summary);
      }
    } catch (e) {
      notifyError(e);
    }
  }

  private async seedVenueOption(index: number, venueId: number) {
    try {
      const venue = await this.$api.venues.getVenue(venueId);
      const summary = this.toVenueSummary(venue);
      this.venueOptions.splice(index, 1, [
        {
          label: `${summary.name} (${summary.server})`,
          value: summary.id,
          venue: summary,
        },
      ]);
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
        const characterId = this.$store.getters.characterId!;
        const result = await this.$api.events.createEvent(this.event, { characterId });
        this.event = new EventEditDto(result);
        this.eventId = result.id;
        void this.$router.replace(`/edit-event/${result.id}`);
      } else {
        this.event = new EventEditDto(await this.$api.events.updateEvent(this.eventId, this.event));
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
.page-edit-event__form-controls {
  max-width: 500px;
  flex-basis: 0;
  flex-grow: 1;
}

.page-edit-event__preview {
  margin-bottom: 24px;
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
