<template>
  <div class="venue-profile">
    <venue-hero v-if="preview" :venue="venue" preview />

    <div class="venue-profile__grid">
      <div class="venue-profile__main">
        <section class="venue-profile__about mat-parchment" aria-labelledby="venue-about">
          <h2 id="venue-about" class="venue-profile__heading">Über {{ venue.name || 'diesen Treffpunkt' }}</h2>
          <html-viewer v-if="hasDescription" class="venue-profile__description" :content="venue.description" />
          <p v-else class="venue-profile__muted">Noch keine Beschreibung.</p>
        </section>

        <section v-if="hasOfferings" class="venue-profile__section" aria-labelledby="venue-offerings">
          <h2 id="venue-offerings" class="venue-profile__heading">Angebote</h2>
          <venue-offerings-view :offerings="offerings" />
        </section>

        <section v-if="plannedEvents.length" class="venue-profile__section" aria-labelledby="venue-events">
          <h2 id="venue-events" class="venue-profile__heading">Nächste Abende</h2>
          <div class="venue-profile__events">
            <event-card v-for="event in plannedEvents" :key="event.id" :event="toCard(event)" :state="isLive(event) ? 'live' : 'default'" />
          </div>
        </section>

        <venue-external-page v-if="venue.carrdProfile" :profile="venue.carrdProfile" />
      </div>

      <aside class="venue-profile__aside" aria-label="Öffnungszeiten, Ort und Team">
        <div class="venue-profile__card">
          <venue-hours-card :venue="venue" />
        </div>
        <div class="venue-profile__card">
          <venue-location-card :venue="venue" />
        </div>
        <section v-if="staff.length" class="venue-profile__card" aria-labelledby="venue-team">
          <h2 id="venue-team" class="venue-profile__card-title">Team</h2>
          <ul class="venue-profile__team">
            <li v-for="member in staff" :key="`${member.server}_${member.name}`">
              <router-link class="venue-profile__member" :to="`/${member.server}/${member.name.replace(/ /g, '_')}`">
                <q-avatar size="36px" class="venue-profile__member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" alt="" />
                  <q-icon v-else name="person" aria-hidden="true" />
                </q-avatar>
                <span>{{ member.name }}</span>
              </router-link>
            </li>
          </ul>
        </section>
        <section class="venue-profile__card" aria-labelledby="venue-facts">
          <h2 id="venue-facts" class="venue-profile__card-title">Steckbrief</h2>
          <dl class="venue-profile__facts">
            <template v-if="venue.owner">
              <dt>Besitzer</dt>
              <dd><router-link :to="ownerLink">{{ venue.owner }}</router-link></dd>
            </template>
            <template v-if="venue.foundedAt">
              <dt>Gründung</dt>
              <dd>{{ $display.formatDate(venue.foundedAt) }}</dd>
            </template>
            <template v-if="venue.status">
              <dt>Status</dt>
              <dd>{{ venue.status }}</dd>
            </template>
            <template v-if="venue.website">
              <dt>Webseite</dt>
              <dd><a :href="venue.website" target="_blank" rel="noopener">{{ websiteLabel }}</a></dd>
            </template>
          </dl>
        </section>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { VenueOfferingsDto } from '@app/shared/dto/venues/venue-offering.dto';
import { VenueStaffMemberDto } from '@app/shared/dto/venues/venue-staff-member.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';
import EventCard from 'components/vision/EventCard.vue';
import type { EventCardEvent } from 'components/vision/types';
import HtmlViewer from '../common/HtmlViewer.vue';
import { effectiveEnd, isEventLive, locationLabel } from '../event/event-display';
import VenueExternalPage from './VenueExternalPage.vue';
import VenueHero from './VenueHero.vue';
import VenueHoursCard from './VenueHoursCard.vue';
import VenueLocationCard from './VenueLocationCard.vue';
import VenueOfferingsView from './VenueOfferingsView.vue';

// ER2-509 — venue overview: "Über …" parchment with drop cap, offerings and
// next evenings on the left; opening hours, location, team and facts on the
// right. In `preview` (EditVenue) the hero renders here too.

class Props {
  venue = prop<VenueDto>({
    required: true,
  });

  plannedEvents = prop<EventSummaryDto[]>({
    default: () => [],
  });

  offerings = prop<VenueOfferingsDto | null>({
    default: null,
  });

  preview = prop<boolean>({
    default: false,
  });
}

@Options({
  name: 'VenueProfile',
  components: {
    EventCard,
    HtmlViewer,
    VenueExternalPage,
    VenueHero,
    VenueHoursCard,
    VenueLocationCard,
    VenueOfferingsView,
  },
})
export default class VenueProfile extends Vue.with(Props) {
  get hasDescription(): boolean {
    const text = (this.venue.description || '').replace(/<[^>]*>/g, '').trim();
    return text.length > 0 || /<img/i.test(this.venue.description || '');
  }

  get hasOfferings(): boolean {
    return !!this.offerings && this.offerings.categories.length > 0;
  }

  get staff(): VenueStaffMemberDto[] {
    return this.venue.staff || [];
  }

  get ownerLink(): string {
    const server = this.venue.ownerServer || '';
    const character = this.venue.owner?.replace(/ /g, '_') || '';
    return `/${server}/${character}`;
  }

  get websiteLabel(): string {
    return (this.venue.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  isLive(event: EventSummaryDto): boolean {
    return isEventLive(event);
  }

  toCard(event: EventSummaryDto): EventCardEvent {
    return {
      id: event.id,
      title: event.title,
      startDateTime: event.startDateTime,
      endDateTime: effectiveEnd(event),
      imageSrc: event.icon?.thumbUrl || event.icon?.url || null,
      locationLabel: locationLabel((event.locations || [])[0], false),
      recurringLabel: event.seriesLabel || null,
      live: this.isLive(event),
    };
  }
}
</script>

<style lang="scss" scoped>
.venue-profile__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.venue-profile__main,
.venue-profile__aside {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.venue-profile__aside {
  gap: 16px;
}

.venue-profile__about {
  padding: 28px 32px;
  border-radius: 12px;

  @media (max-width: 599px) {
    padding: 20px 18px;
  }
}

.venue-profile__heading {
  text-align: left;
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

// Illuminated first letter, like the story and wiki parchments.
.venue-profile__description :deep(p:first-of-type)::first-letter {
  float: left;
  margin: 6px 10px 0 0;
  font-family: 'Cinzel Eorzea', var(--font-display);
  font-size: 3.4em;
  line-height: 0.85;
  color: var(--ink-link);
}

.venue-profile__muted {
  margin: 0;
  font-style: italic;
  color: var(--ink-muted);
}

.venue-profile__events {
  display: grid;
  gap: 10px;
}

.venue-profile__card {
  padding: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.venue-profile__card-title {
  text-align: left;
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.venue-profile__team {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.venue-profile__member {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 8px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-primary) !important;
  text-decoration: none !important;

  &:hover {
    background-color: var(--rule-tint);
  }
}

.venue-profile__member-avatar {
  background-color: var(--rule-tint);
  color: var(--ink-muted);
}

.venue-profile__facts {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 14px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;

  dt {
    color: var(--ink-muted);
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  a {
    color: var(--ink-link) !important;
  }
}

</style>
