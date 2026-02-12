<template>
  <div class="venue-profile">
    <banner-view :banner="venue.banner" />
    <header class="venue-profile__header">
      <div class="layout__filler"></div>
      <div class="venue-profile__header-names">
        <h2 class="venue-profile__header-title">{{ venue.name }}</h2>
        <div class="venue-profile__header-subtitle">{{ address }}</div>
      </div>
      <div class="layout__filler"></div>
    </header>
    <character-details-box class="venue-profile__infobox">
      <character-detail label="Welt" :value="venue.server" v-if="venue.server" />
      <character-detail label="Besitzer" :value="venue.owner" :router-link="ownerLink" />
      <character-detail label="Gründung" :value="$display.formatDate(venue.foundedAt)" v-if="venue.foundedAt" />
      <character-detail label="Webseite" :value="venue.website" :link="venue.website" v-if="venue.website" />
      <character-detail label="Zweck" :value="venue.purpose" v-if="venue.purpose" />
      <character-detail label="Status" :value="venue.status" v-if="venue.status" />
    </character-details-box>
    <template v-if="venue.description">
      <html-viewer class="venue-profile__description" :content="venue.description" />
    </template>
    <section v-if="plannedEvents.length" class="venue-profile__events">
      <h3>Geplante Events</h3>
      <div class="venue-profile__events-list">
        <div
          v-for="event in plannedEvents"
          :key="event.id"
          class="venue-profile__event-card"
        >
          <div class="venue-profile__event-time">{{ formatTimeRange(event) }}</div>
          <router-link :to="`/event/${event.id}`" class="venue-profile__event-title">
            {{ event.title }}
          </router-link>
        </div>
      </div>
    </section>
    <iframe
      v-if="venue.carrdProfile"
      v-iframe-resize
      :src="carrdLink"
      width="100%"
      height="500px"
      class="venue-profile__carrd-iframe"
    >
    </iframe>
    <template v-if="!venue.description && !venue.carrdProfile">
      Keine Beschreibung.
    </template>
    <template v-if="venue.tags.length > 0">
      <hr />
      <strong>Schlagworte:</strong> {{ venue.tags.join(', ') }}
    </template>
  </div>
</template>

<script lang="ts">
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import html from '@app/shared/html';
import { Options, prop, Vue } from 'vue-class-component';
import BannerView from '../common/BannerView.vue';
import CharacterDetail from 'components/character/CharacterDetail.vue';
import CharacterDetailsBox from 'components/character/CharacterDetailsBox.vue';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import HtmlViewer from '../common/HtmlViewer.vue';

class Props {
  venue = prop<VenueDto>({
    required: true,
  });

  plannedEvents = prop<EventSummaryDto[]>({
    default: () => [],
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'VenueProfile',
  components: {
    CharacterDetail,
    CharacterDetailsBox,
    BannerView,
    HtmlViewer,
  },
})
export default class VenueProfile extends Vue.with(Props) {
	get editVenueLink(): string {
		return `/edit-venue/${this.venue.id}`;
	}

  get address(): string {
    let address: string;

		if (this.venue.location === VenueLocation.OPEN_WORLD) {
			address = this.venue.address;
		} else {
			const plot = this.venue.location === VenueLocation.HOUSE ? `Grundstück ${this.venue.plot!}` : `Wohnung ${this.venue.room!}`;
			address = `${this.$display.housingAreas[this.venue.housingArea!]}, Bezirk ${this.venue.ward!}, ${plot}`;

			if (this.venue.subdivision) {
				address += ' (Erweiterung)';
			}
		}

    return address;
  }

  get description(): string {
    return html.sanitize(this.venue.description);
  }

  get carrdLink(): string {
    return `${this.$api.prefix}carrd/character/preview/${this.venue.carrdProfile}`;
  }

  get ownerLink(): string {
    const server = this.venue.ownerServer || '';
    const character = this.venue.owner?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  formatTimeRange(event: EventSummaryDto) {
    const start = this.$display.formatDateTimeServer(event.startDateTime);
    if (event.endDateTime) {
      const end = this.$display.formatDateTimeServer(event.endDateTime);
      return `${start} – ${end}`;
    }
    return start;
  }
}
</script>

<style lang="scss">
@import url($extraGoogleFonts);

.venue-profile__header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.venue-profile__header-title {
  margin: 0;
  line-height: auto;
}

.venue-profile__header-names {
  text-align: center;
}

.venue-profile__header-subtitle {
  font-family: $header-font;
  font-size: 1.6em;
}

.venue-profile__details td {
  padding: 4px 8px;
}

.venue-profile__details tr > td:first-child {
  font-weight: bold;
}

.venue-profile__description {
  margin-bottom: 24px;
}

.venue-profile__events {
  margin: 24px 0;
}

.venue-profile__events-list {
  display: grid;
  gap: 12px;
}

.venue-profile__event-card {
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  padding: 12px 16px;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}

.venue-profile__event-time {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(35, 35, 35, 0.7);
  margin-bottom: 4px;
}

.venue-profile__event-title {
  font-weight: 700;
  color: #1f2c38;
  text-decoration: none;
}

.venue-profile__event-title:hover {
  text-decoration: underline;
}

.venue-profile__description_no-header {
  margin-top: 24px;
}

.venue-profile__infobox {
  margin-bottom: 24px;
}

.venue-profile__carrd-iframe {
  border: none;
}
</style>
