<template>
  <div class="event-view">
    <header class="event-view__hero" :class="{ 'event-view__hero--image': !!bannerUrl }">
      <img v-if="bannerUrl" class="event-view__hero-img" :src="bannerUrl" alt="" />
      <div class="event-view__scrim" aria-hidden="true"></div>
      <div class="event-view__hero-inner">
        <breadcrumbs
          v-if="!preview"
          class="event-view__crumbs"
          :items="[{ label: 'Events', to: '/calendar' }, { label: event.title }]"
        />
        <div class="event-view__hero-row">
          <time v-if="hasStartDate" class="event-view__date" :datetime="startIso">
            <span class="event-view__date-weekday">{{ start.toFormat('ccc') }}</span>
            <span class="event-view__date-day">{{ start.toFormat('d') }}</span>
            <span class="event-view__date-month">{{ start.toFormat('LLL') }}</span>
          </time>
          <div class="event-view__hero-text">
            <div class="event-view__chips">
              <span v-if="live" class="event-view__chip event-view__chip--live">
                <span class="event-view__live-dot" aria-hidden="true"></span>
                Live
              </span>
              <span class="event-view__chip">
                <q-icon :name="eventTypeIcon" aria-hidden="true" />
                {{ eventTypeLabel }}
              </span>
              <span class="event-view__chip" :class="{ 'event-view__chip--adult': adult }">
                {{ adult ? '18+' : 'SFW' }}
              </span>
              <span v-if="seriesLabel" class="event-view__chip">
                <q-icon name="repeat" aria-hidden="true" />
                {{ seriesLabel }}
              </span>
            </div>
            <h1 class="event-view__title">{{ event.title }}</h1>
            <p class="event-view__subline">
              <span v-if="hasStartDate">
                <q-icon name="schedule" aria-hidden="true" />
                {{ timeRangeServer }}
                <q-tooltip>Deine Ortszeit: {{ timeRangeLocal }}</q-tooltip>
              </span>
              <span v-if="primaryLocation">
                <q-icon name="place" aria-hidden="true" />
                {{ primaryLocation }}
              </span>
              <span v-if="organiser">
                <q-icon name="person" aria-hidden="true" />
                {{ organiser }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>

    <slot name="actions" />

    <div class="event-view__body">
      <div class="event-view__main">
        <section class="event-view__section event-view__about mat-parchment" aria-labelledby="event-about">
          <h2 id="event-about" class="event-view__section-title">Worum geht's</h2>
          <html-viewer v-if="hasDetails" :content="event.details" />
          <p v-else class="event-view__muted">Der Veranstalter hat noch keine Beschreibung eingetragen.</p>
        </section>

        <event-programme
          v-if="programme.length"
          class="event-view__section"
          :items="programme"
          :start-date-time="event.startDateTime"
          :end-date-time="event.endDateTime"
        />

        <section v-if="hasOocDetails" class="event-view__section" aria-labelledby="event-ooc">
          <h2 id="event-ooc" class="event-view__section-title">OOC-Hinweise</h2>
          <html-viewer :content="event.oocDetails" />
        </section>

        <section v-if="hasExtraInfo" class="event-view__section" aria-labelledby="event-extra">
          <h2 id="event-extra" class="event-view__section-title">Weitere Infos</h2>
          <html-viewer :content="event.extraInfo" />
        </section>

        <section v-if="contentNotes.length" class="event-view__warnings" aria-labelledby="event-cw">
          <div id="event-cw" class="event-view__warnings-title">
            <q-icon name="warning" size="16px" aria-hidden="true" />
            Inhaltswarnungen
          </div>
          <div class="event-view__warnings-chips">
            <q-chip
              v-for="item in contentNotes"
              :key="item"
              dense
              icon="warning"
              class="event-view__warning-chip"
            >
              {{ item }}
            </q-chip>
          </div>
        </section>
      </div>

      <aside class="event-view__aside" aria-label="Ort und Details">
        <event-location-card
          v-for="(location, index) in event.locations"
          :key="location.id || index"
          :location="location"
          :venue="location.venueId ? venues[location.venueId] || null : null"
          :index="index"
        />

        <section class="event-view__card" aria-labelledby="event-facts">
          <h2 id="event-facts" class="event-view__card-title">Details</h2>
          <dl class="event-view__facts">
            <template v-if="hasStartDate">
              <dt>Beginn</dt>
              <dd>{{ formatServer(event.startDateTime) }}</dd>
            </template>
            <template v-if="hasEndDate">
              <dt>Ende</dt>
              <dd>{{ formatServer(event.endDateTime) }}</dd>
            </template>
            <dt>Teilnahme</dt>
            <dd>
              {{ event.closedEvent ? 'Geschlossenes Event, mit Anmeldung' : 'Offen für alle' }}
            </dd>
            <template v-if="event.contact">
              <dt>Kontakt</dt>
              <dd><link-field :content="event.contact" /></dd>
            </template>
            <template v-if="eventLinks.length">
              <dt>Links</dt>
              <dd>
                <a
                  v-for="(item, index) in eventLinks"
                  :key="`event-link-${index}`"
                  class="event-view__fact-link"
                  :href="item.url"
                  target="_blank"
                  rel="noopener"
                >{{ linkLabel(item.url, item.label) }}</a>
              </dd>
            </template>
          </dl>
        </section>

        <slot name="attendees" />
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseEventDto } from '@app/shared/dto/events/base-event.dto';
import { EventLinkDto } from '@app/shared/dto/events/event-link.dto';
import { EventProgrammeItemDto } from '@app/shared/dto/events/event-programme-item.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { ContentNoteTexts } from '@common/common/api/content-notes-api';
import { getEventTypeIcon, getEventTypeLabel } from 'src/common/event-types';
import { DateTime } from 'luxon';
import { Options, prop, Vue } from 'vue-class-component';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import LinkField from '../common/LinkField.vue';
import EventLocationCard from './EventLocationCard.vue';
import EventProgramme from './EventProgramme.vue';
import { isAdultEvent, isEventLive, locationLabel, serverDateTime } from './event-display';

// ER2-504 — event detail: hero (banner or gradient, left-to-right scrim,
// glass date block, chips, Cinzel title, subline), then a two-column body.
// Slots: `actions` (sticky bar under the hero) and `attendees` (right
// rail). The programme timeline (ER2-506) renders from `event.programme`.

type EventWithExtras = BaseEventDto & { seriesLabel?: string };

class Props {
  event = prop<EventWithExtras>({
    required: true,
  });

  preview = prop<boolean>({
    default: false,
  });

  /** Venues linked from `locations[].venueId`, keyed by ID (ER2-505). */
  venues = prop<Record<number, VenueDto>>({
    default: () => ({}),
  });
}

@Options({
  name: 'EventView',
  components: {
    Breadcrumbs,
    HtmlViewer,
    LinkField,
    EventLocationCard,
    EventProgramme,
  },
})
export default class EventView extends Vue.with(Props) {
  now = Date.now();
  private timer: number | null = null;

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);
  }

  beforeUnmount() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
    }
  }

  get bannerUrl(): string {
    return this.event.banner?.url || '';
  }

  get start(): DateTime {
    return serverDateTime(this.hasStartDate ? this.event.startDateTime : Date.now());
  }

  get startIso(): string {
    return this.start.toISO() || '';
  }

  get live(): boolean {
    return this.hasStartDate && isEventLive(this.event, this.now);
  }

  get adult(): boolean {
    return isAdultEvent(this.event);
  }

  get seriesLabel(): string {
    return this.event.seriesLabel || '';
  }

  get eventTypeLabel(): string {
    return getEventTypeLabel(this.event.eventType);
  }

  get eventTypeIcon(): string {
    return getEventTypeIcon(this.event.eventType);
  }

  get primaryLocation(): string {
    return locationLabel((this.event.locations || [])[0]);
  }

  /** Contact as plain text for the subline (wikilinks reduced to their label). */
  get organiser(): string {
    const text = (this.event.contact || '')
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, label?: string) => label || target)
      .replace(/<[^>]*>/g, '')
      .trim();
    return text.length > 0 && text.length <= 60 && !text.includes('\n') ? text : '';
  }

  get programme(): EventProgrammeItemDto[] {
    return (this.event.programme || []).filter((item) => !!item && !!item.title);
  }

  get contentNotes(): string[] {
    const notes = this.event.contentNotes || [];
    return notes.map((note) => (ContentNoteTexts as { [key: string]: string })[note] || note);
  }

  get eventLinks(): EventLinkDto[] {
    const links = (this.event.links || [])
      .filter((link) => !!link?.url)
      .map((link) => new EventLinkDto({
        url: link.url,
        label: link.label || undefined,
      }));

    if (links.length > 0) {
      return links;
    }

    if (this.event.link) {
      return [
        new EventLinkDto({
          url: this.event.link,
          label: this.event.linkText || undefined,
        }),
      ];
    }

    return [];
  }

  get hasStartDate(): boolean {
    return this.isValidTimestamp(this.event.startDateTime);
  }

  get hasEndDate(): boolean {
    return this.isValidTimestamp(this.event.endDateTime) && this.event.endDateTime !== this.event.startDateTime;
  }

  /** "Sa., 18. Oktober · 20:00–23:00 MESZ" in server time. */
  get timeRangeServer(): string {
    if (!this.hasStartDate) {
      return '';
    }
    const start = this.start;
    let text = `${start.toFormat('ccc., d. LLLL')} · ${start.toFormat('HH:mm')}`;
    if (this.hasEndDate) {
      const end = serverDateTime(this.event.endDateTime as number);
      text += end.hasSame(start, 'day') || end.diff(start, 'hours').hours < 24
        ? `–${end.toFormat('HH:mm')}`
        : ` bis ${end.toFormat('ccc., d. LLLL, HH:mm')}`;
    }
    return `${text} ${start.toFormat('ZZZZ')}`;
  }

  get timeRangeLocal(): string {
    if (!this.hasStartDate) {
      return '';
    }
    if (!this.hasEndDate) {
      return this.formatLocal(this.event.startDateTime);
    }
    return `${this.formatLocal(this.event.startDateTime)} – ${this.formatLocal(this.event.endDateTime)}`;
  }

  get hasDetails(): boolean {
    return this.hasHtmlContent(this.event.details);
  }

  get hasOocDetails(): boolean {
    return this.hasHtmlContent(this.event.oocDetails);
  }

  get hasExtraInfo(): boolean {
    return this.hasHtmlContent(this.event.extraInfo);
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

  linkLabel(link: string, linkText?: string): string {
    return (linkText || '').trim() || link;
  }

  private hasHtmlContent(content: string | null | undefined): boolean {
    if (!content) {
      return false;
    }
    const container = document.createElement('div');
    container.innerHTML = content;
    return (container.textContent || '').trim().length > 0 || !!container.querySelector('img');
  }

  private isValidTimestamp(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
</script>

<style lang="scss" scoped>
// Hero text sits on a dark scrim in both themes, so it uses fixed light ink
// rather than theme tokens. Fallback gradient: Aetherium ink to arcane violet.
$hero-ink: #FFFFFF;
$hero-ink-soft: rgba(255, 255, 255, 0.86);

.event-view__hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 380px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(120deg, #2B2418 0%, #3D2A55 55%, #6B4FA8 100%);
  color: $hero-ink;

  @media (max-width: 599px) {
    min-height: 320px;
    border-radius: 12px;
  }
}

.event-view__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-view__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(11, 6, 18, 0.9) 0%, rgba(11, 6, 18, 0.7) 45%, rgba(11, 6, 18, 0.25) 100%),
    linear-gradient(0deg, rgba(11, 6, 18, 0.55) 0%, rgba(11, 6, 18, 0) 60%);
}

.event-view__hero-inner {
  position: relative;
  display: grid;
  gap: 18px;
  width: 100%;
  padding: 24px 32px 32px;

  @media (max-width: 599px) {
    padding: 16px 18px 22px;
  }
}

.event-view__crumbs {
  justify-self: start;
  padding: 4px 12px;
  border-radius: 999px;
  background-color: rgba(11, 6, 18, 0.55);
  backdrop-filter: blur(6px);

  :deep(*) {
    color: $hero-ink-soft !important;
  }

  :deep(a:hover) {
    color: $hero-ink !important;
  }
}

.event-view__hero-row {
  display: flex;
  align-items: flex-end;
  gap: 24px;

  @media (max-width: 599px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}

.event-view__date {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 92px;
  padding: 10px 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  font-family: var(--font-ui);
  line-height: 1.1;
  text-align: center;

  @supports not (backdrop-filter: blur(1px)) {
    background-color: rgba(11, 6, 18, 0.6);
  }
}

.event-view__date-weekday,
.event-view__date-month {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: $hero-ink-soft;
}

.event-view__date-day {
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1.1;
  font-variant-numeric: lining-nums;
}

.event-view__hero-text {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.event-view__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-view__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background-color: rgba(11, 6, 18, 0.45);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: $hero-ink;
}

.event-view__chip--live {
  border-color: #6EDCA8;
  color: #B9F2D6;
}

.event-view__chip--adult {
  border-color: #FF8FA0;
  color: #FFC7D0;
}

.event-view__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #6EDCA8;
  box-shadow: 0 0 0 0 rgba(110, 220, 168, 0.6);
  animation: event-view-pulse 2s ease-out infinite;
}

@keyframes event-view-pulse {
  0% { box-shadow: 0 0 0 0 rgba(110, 220, 168, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(110, 220, 168, 0); }
  100% { box-shadow: 0 0 0 0 rgba(110, 220, 168, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .event-view__live-dot {
    animation: none;
  }
}

.event-view__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: 0;
  color: $hero-ink;
  overflow-wrap: anywhere;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);

  @media (max-width: 599px) {
    font-size: 32px;
  }
}

.event-view__subline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.4;
  color: $hero-ink-soft;

  > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.event-view__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 28px;
  align-items: start;
  margin-top: 24px;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.event-view__main,
.event-view__aside {
  display: grid;
  gap: 20px;
  min-width: 0;
}

.event-view__section {
  min-width: 0;
}

.event-view__about {
  padding: 28px 32px;
  border-radius: 12px;

  @media (max-width: 599px) {
    padding: 20px 18px;
  }
}

.event-view__section-title,
.event-view__card-title {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.event-view__card-title {
  font-size: 17px;
}

.event-view__muted {
  margin: 0;
  color: var(--ink-muted);
  font-style: italic;
}

.event-view__card {
  padding: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.event-view__facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px 14px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;

  dt {
    font-weight: 600;
    color: var(--ink-muted);
  }

  dd {
    margin: 0;
    color: var(--ink-primary);
    overflow-wrap: anywhere;
  }
}

.event-view__fact-link {
  display: block;
  color: var(--ink-link) !important;
}

// ER2-101 — content warnings use the dedicated CW tokens in both themes.
.event-view__warnings-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vision-cw-text);
}

.event-view__warnings-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.q-chip.event-view__warning-chip {
  background: var(--vision-cw-bg);
  color: var(--vision-cw-text);
  font-weight: 600;
  border: 1px solid var(--vision-cw-border);

  :deep(.q-icon) {
    color: inherit;
  }
}
</style>
