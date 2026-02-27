<template>
  <div class="event-view">
    <banner-view :banner="event.banner" />

    <header class="event-view__header">
      <div class="event-view__icon">
        <q-img
          v-if="event.icon"
          class="event-view__icon-img"
          :src="eventIconUrl"
          :ratio="1"
          fit="cover"
        />
        <q-icon v-else name="event" />
      </div>
      <div class="event-view__title-block">
        <h2 class="event-view__title regular-header-font">{{ event.title }}</h2>
        <div class="event-view__subtitle">
          <span v-if="hasStartDate" class="event-view__time">
            {{ timeRangeServer }}
            <q-tooltip>{{ timeRangeLocal }}</q-tooltip>
          </span>
          <span class="event-view__type">{{ eventTypeLabel }}</span>
          <q-chip v-if="event.recurring" dense class="event-view__chip">
            Wiederkehrend
          </q-chip>
        </div>
      </div>
    </header>

    <section class="event-view__meta">
      <div v-if="hasStartDate" class="event-view__meta-row">
        <q-icon name="schedule" />
        <div class="event-view__meta-body">
          <div class="event-view__meta-label">Beginn</div>
          <div class="event-view__meta-value">
            {{ formatServer(event.startDateTime) }}
            <q-tooltip>{{ formatLocal(event.startDateTime) }}</q-tooltip>
          </div>
        </div>
      </div>
      <div v-if="hasEndDate" class="event-view__meta-row">
        <q-icon name="schedule" />
        <div class="event-view__meta-body">
          <div class="event-view__meta-label">Ende</div>
          <div class="event-view__meta-value">
            {{ formatServer(event.endDateTime) }}
            <q-tooltip>{{ formatLocal(event.endDateTime) }}</q-tooltip>
          </div>
        </div>
      </div>
      <div class="event-view__meta-row">
        <q-icon name="category" />
        <div class="event-view__meta-body">
          <div class="event-view__meta-label">Typ</div>
          <div class="event-view__meta-value">{{ eventTypeLabel }}</div>
        </div>
      </div>
      <div v-if="event.link" class="event-view__meta-row">
        <q-icon name="link" />
        <div class="event-view__meta-body">
          <div class="event-view__meta-label">Link</div>
          <div class="event-view__meta-value">
            <a :href="event.link" target="_blank" rel="noopener">{{ linkLabel(event.link, event.linkText) }}</a>
          </div>
        </div>
      </div>
      <div v-if="event.contact" class="event-view__meta-row">
        <q-icon name="contact_page" />
        <div class="event-view__meta-body">
          <div class="event-view__meta-label">Kontakt</div>
          <div class="event-view__meta-value">
            <link-field :content="event.contact" />
          </div>
        </div>
      </div>
    </section>

    <section v-if="contentNotes.length" class="event-view__warnings">
      <div class="event-view__warnings-title">Inhaltswarnungen</div>
      <div class="event-view__warnings-chips">
        <q-chip
          v-for="item in contentNotes"
          :key="item"
          dense
          class="event-view__warning-chip"
        >
          {{ item }}
        </q-chip>
      </div>
    </section>

    <section v-if="event.locations && event.locations.length" class="event-view__locations">
      <h3>Standorte</h3>
      <div class="event-view__location-list">
        <div
          v-for="(location, index) in event.locations"
          :key="location.id || index"
          class="event-view__location-card"
        >
          <div class="event-view__location-header">
            <div class="event-view__location-title">
              {{ locationTitle(location, index) }}
            </div>
            <router-link
              v-if="location.venueId"
              :to="`/venue/${location.venueId}`"
              class="event-view__location-link"
            >
              Treffpunkt anzeigen
            </router-link>
          </div>
          <div v-if="location.address" class="event-view__location-row">
            <q-icon name="place" />
            <span>{{ location.address }}</span>
          </div>
          <div v-if="location.server" class="event-view__location-row">
            <q-icon name="public" />
            <span>{{ location.server }}</span>
          </div>
          <div v-if="location.link" class="event-view__location-row">
            <q-icon name="link" />
            <a :href="location.link" target="_blank" rel="noopener">{{ linkLabel(location.link, location.linkText) }}</a>
          </div>
        </div>
      </div>
    </section>

    <section v-if="hasDetails" class="event-view__details">
      <h3>Details</h3>
      <html-viewer :content="event.details" />
    </section>

    <section v-if="hasOocDetails" class="event-view__details">
      <h3>OOC Details</h3>
      <html-viewer :content="event.oocDetails" />
    </section>
  </div>
</template>

<script lang="ts">
import { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventLocationDto } from '@app/shared/dto/events/event-location.dto';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { getEventTypeLabel } from 'src/common/event-types';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import LinkField from '../common/LinkField.vue';

class Props {
  event = prop<BaseEventDto>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'EventView',
  components: {
    BannerView,
    HtmlViewer,
    LinkField,
  },
})
export default class EventView extends Vue.with(Props) {
  get eventIconUrl(): string {
    return this.event.icon?.previewUrl || this.event.icon?.url || this.event.icon?.thumbUrl || '';
  }

  get eventTypeLabel(): string {
    return getEventTypeLabel(this.event.eventType);
  }

  get contentNotes(): string[] {
    const notes = this.event.contentNotes || [];
    return notes.map((note) => (ContentNoteTexts as { [key: string]: string })[note] || note);
  }

  get hasStartDate(): boolean {
    return this.isValidTimestamp(this.event.startDateTime);
  }

  get hasEndDate(): boolean {
    return this.isValidTimestamp(this.event.endDateTime);
  }

  get timeRangeServer(): string {
    if (!this.hasStartDate) {
      return '';
    }
    if (!this.hasEndDate || this.event.endDateTime === this.event.startDateTime) {
      return this.formatServer(this.event.startDateTime);
    }
    return `${this.formatServer(this.event.startDateTime)} - ${this.formatServer(this.event.endDateTime)}`;
  }

  get timeRangeLocal(): string {
    if (!this.hasStartDate) {
      return '';
    }
    if (!this.hasEndDate || this.event.endDateTime === this.event.startDateTime) {
      return this.formatLocal(this.event.startDateTime);
    }
    return `${this.formatLocal(this.event.startDateTime)} - ${this.formatLocal(this.event.endDateTime)}`;
  }

  get hasDetails(): boolean {
    return this.hasHtmlContent(this.event.details);
  }

  get hasOocDetails(): boolean {
    return this.hasHtmlContent(this.event.oocDetails);
  }

  formatServer(value: number | null | undefined): string {
    if (!this.isValidTimestamp(value)) {
      return '';
    }
    return this.$display.formatDateTimeServer(value);
  }

  formatLocal(value: number | null | undefined): string {
    if (!this.isValidTimestamp(value)) {
      return '';
    }
    return this.$display.formatDateTimeLocal(value);
  }

  locationTitle(location: EventLocationDto, index: number): string {
    return location.name || location.address || location.server || `Standort ${index + 1}`;
  }

  linkLabel(link: string, linkText?: string): string {
    return (linkText || '').trim() || link;
  }

  private hasHtmlContent(content: string | null | undefined): boolean {
    if (!content) {
      return false;
    }
    return this.stripHtml(content).trim().length > 0;
  }

  private stripHtml(content: string): string {
    const container = document.createElement('div');
    container.innerHTML = content;
    return container.textContent || '';
  }

  private isValidTimestamp(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.event-view__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.event-view__icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: rgba(221, 180, 118, 0.18);
  border: 1px solid rgba(221, 180, 118, 0.35);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.event-view__icon .q-icon {
  font-size: 28px;
  color: rgba(35, 35, 35, 0.65);
}

.event-view__icon-img {
  width: 50px;
  height: 50px;
}

.event-view__title {
  text-align: left;
  margin-bottom: 6px;
}

.event-view__subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  color: rgba(35, 35, 35, 0.7);
  font-weight: 600;
}

.event-view__time {
  font-size: 0.95rem;
}

.event-view__type {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(35, 35, 35, 0.55);
}

.event-view__chip {
  background: rgba(221, 180, 118, 0.25);
  color: #6b4c21;
  font-weight: 600;
}

.event-view__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(221, 180, 118, 0.25);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.event-view__meta-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: rgba(35, 35, 35, 0.75);
}

.event-view__meta-body {
  display: grid;
  gap: 2px;
}

.event-view__meta-label {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.75rem;
  color: rgba(35, 35, 35, 0.55);
}

.event-view__meta-value {
  font-weight: 600;
}

.event-view__warnings {
  margin: 12px 0 18px;
}

.event-view__warnings-title {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: rgba(35, 35, 35, 0.6);
  font-weight: 600;
  margin-bottom: 6px;
}

.event-view__warnings-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-view__warning-chip {
  background: rgba(221, 180, 118, 0.22);
  color: #6b4c21;
  font-weight: 600;
}

.event-view__locations {
  margin: 18px 0 24px;
}

.event-view__location-list {
  display: grid;
  gap: 12px;
}

.event-view__location-card {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 16px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}

.event-view__location-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.event-view__location-title {
  font-weight: 700;
  color: #1f2c38;
}

.event-view__location-link {
  font-size: 0.85rem;
  font-weight: 600;
}

.event-view__location-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.event-view__details {
  margin-bottom: 24px;
}

@media screen and (max-width: $breakpoint-sm) {
  .event-view__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .event-view__title {
    text-align: left;
  }

  .event-view__meta {
    grid-template-columns: 1fr;
  }
}
</style>
