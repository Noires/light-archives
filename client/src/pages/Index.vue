<template>
  <q-page class="home">
    <home-hero
      :stats="todayStats"
      :logged-in="isLoggedIn"
      :welcome-name="welcomeName"
      :avatar="currentCharacter?.avatar || ''"
      @login="loginWithDiscord"
    />

    <section id="heute" class="home-hub" aria-labelledby="home-hub-title" tabindex="-1">
      <div class="home-hub__head">
        <p class="home-eyebrow">Heute in Eorzea</p>
        <h1 id="home-hub-title" class="home-hub__title">Was läuft heute Abend?</h1>
        <p class="home-hub__meta">{{ todayLabel }} · alle Zeiten in Serverzeit ({{ zoneAbbreviation }})</p>
      </div>

      <section-tabs v-model="timelineView" :tabs="timelineTabs" aria-label="Zeitraum der Zeitleiste" />

      <div class="home-card home-hub__timeline">
        <timeline-strip
          v-if="eventsAvailable"
          :events="timelineEvents"
          :days="timelineView === 'week' ? 7 : 1"
          :dim-non-live="timelineView === 'now'"
          :aria-label="timelineAriaLabel"
          :empty-text="timelineEmptyText"
        />
        <p v-else class="home-hub__unavailable">Die Events konnten gerade nicht geladen werden.</p>
      </div>

      <div class="home-hub__columns">
        <home-up-next
          :events="events"
          :now="now"
          :tonight-count="tonightEvents.length"
          :available="eventsAvailable"
        />
        <home-open-venues
          :venues="sortedVenues"
          :open-count="venuesOpenCount"
          :loading="venuesLoading"
          :available="venuesAvailable"
        />
      </div>
    </section>

    <section class="home-community" aria-labelledby="home-community-title">
      <div class="home-section-head">
        <p class="home-eyebrow">Aus der Community</p>
        <h2 id="home-community-title" class="home-section-head__title">Was gibt es Neues?</h2>
      </div>

      <div class="home-community__grid">
        <home-activity-feed
          :initial-items="recentChanges"
          :avatars="profileAvatars"
          :thumbs="imageThumbs"
          :limit="recentChangesLimit"
        />

        <div class="home-community__aside">
          <home-module title="Neueste Geschichten" link-label="Alle Geschichten" link-to="/stories">
            <ul v-if="latestStories.length" class="home-stories">
              <li v-for="story in latestStories" :key="story.id" class="home-stories__item">
                <span class="home-stories__type">{{ $display.storyTypes[story.type] }}</span>
                <router-link class="home-stories__title" :to="`/story/${story.id}`">{{ story.title }}</router-link>
                <span class="home-stories__meta">
                  {{ story.author }} · {{ $display.relativeTime(story.createdAt) }}
                </span>
                <status-badge
                  v-if="storyNotes(story).length"
                  class="home-stories__cw"
                  type="cw"
                  :label="notesLabel(story)"
                  :title="`Inhaltswarnungen: ${storyNotes(story).join(', ')}`"
                />
              </li>
            </ul>
            <p v-else class="home-module-empty">Noch keine neuen Geschichten.</p>
          </home-module>

          <home-module title="Neue Gesichter" link-label="Alle Charaktere" link-to="/profiles">
            <ul v-if="latestProfiles.length" class="home-faces">
              <li v-for="profile in latestProfiles" :key="`${profile.name}@${profile.server}`">
                <router-link class="home-faces__link" :to="getProfileLink(profile)">
                  <q-avatar round size="56px" class="home-faces__avatar">
                    <img v-if="profile.avatar" :src="profile.avatar" alt="" loading="lazy" />
                    <q-icon v-else name="person" aria-hidden="true" />
                  </q-avatar>
                  <span class="home-faces__name">{{ profile.name }}</span>
                </router-link>
              </li>
            </ul>
            <p v-else class="home-module-empty">Noch keine neuen Charaktere.</p>
          </home-module>
        </div>
      </div>

      <div v-if="latestNoticeboardItems.length || latestGroups.length" class="home-community__more">
        <home-module
          v-if="latestNoticeboardItems.length"
          title="Neue Aushänge"
          link-label="Zum Anschlagbrett"
          link-to="/noticeboard"
        >
          <ul class="home-rows">
            <li v-for="item in latestNoticeboardItems" :key="item.id" class="home-rows__item">
              <q-icon name="campaign" class="home-rows__icon" aria-hidden="true" />
              <div class="home-rows__text">
                <router-link class="home-rows__title" :to="`/noticeboard/${item.id}`">{{ item.title }}</router-link>
                <span class="home-rows__meta">
                  {{ $display.noticeboardTypes[item.type] }} · {{ item.author }} · {{ $display.relativeTime(item.createdAt) }}
                </span>
              </div>
            </li>
          </ul>
        </home-module>

        <home-module
          v-if="latestGroups.length"
          title="Neue Gemeinschaften"
          link-label="Alle Communities"
          link-to="/communities"
        >
          <ul class="home-rows">
            <li v-for="group in latestGroups" :key="group.key" class="home-rows__item">
              <q-icon :name="group.icon" class="home-rows__icon" aria-hidden="true" />
              <div class="home-rows__text">
                <router-link class="home-rows__title" :to="group.link">{{ group.name }}</router-link>
                <span class="home-rows__meta">{{ group.meta }}</span>
              </div>
            </li>
          </ul>
        </home-module>
      </div>
    </section>

    <home-gallery-band v-if="galleryImages.length" :images="galleryImages" />
  </q-page>
</template>

<script lang="ts">
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { MainPageContentDto } from '@app/shared/dto/main-page/main-page-content.dto';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import {
  eveningWindow,
  eveningWindows,
  isEventLive,
  loadHomeEvents,
  loadHomeVenues,
  loadRpCount,
  loadVenueImages,
  RP_ACTIVE_LIMIT,
  overlaps,
  SERVER_ZONE,
  sortVenuesByOpening,
  toTimelineEvent,
} from 'components/mainpage/home-data';
import type { HomeTodayStats, HomeVenue } from 'components/mainpage/home-data';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { contentNotesLabel, storyContentNotes } from 'components/stories/story-card-data';
import HomeGalleryBand from 'components/mainpage/HomeGalleryBand.vue';
import HomeModule from 'components/mainpage/HomeModule.vue';
import StatusBadge from 'components/vision/StatusBadge.vue';
import HomeActivityFeed from 'components/mainpage/HomeActivityFeed.vue';
import HomeHero from 'components/mainpage/HomeHero.vue';
import HomeOpenVenues from 'components/mainpage/HomeOpenVenues.vue';
import HomeUpNext from 'components/mainpage/HomeUpNext.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import TimelineStrip from 'components/vision/TimelineStrip.vue';
import type { TimelineView } from 'components/vision/timeline';
import type { SectionTab } from 'components/vision/types';
import { DateTime } from 'luxon';
import type { RouteLocationRaw } from 'vue-router';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();
const RECENT_CHANGES_LIMIT = 8;

interface MainPageChangesApiClient {
  getMainPageContent(): Promise<MainPageContentDto>;
  changes: {
    getChanges(filter?: { offset?: number; limit?: number }): Promise<PagingResultDto<ChangeItemDto>>;
  };
}

interface HomeGroup {
  key: string;
  name: string;
  meta: string;
  icon: string;
  link: RouteLocationRaw;
}

interface HomeData {
  content: MainPageContentDto;
  recentChanges: ChangeItemDto[];
  events: EventSummaryDto[] | null;
}

async function load(): Promise<HomeData> {
  try {
    const api = $api as MainPageChangesApiClient;
    // Events are optional for the page: a failure only hides the hub data.
    const eventsPromise = loadHomeEvents($api).catch((e) => {
      console.log(e);
      return null;
    });
    const [content, recentChangesResult, events]: [MainPageContentDto, PagingResultDto<ChangeItemDto>, EventSummaryDto[] | null] = await Promise.all([
      api.getMainPageContent(),
      api.changes.getChanges({
        offset: 0,
        limit: RECENT_CHANGES_LIMIT,
      }),
      eventsPromise,
    ]);

    return {
      content,
      recentChanges: recentChangesResult.data,
      events,
    };
  } catch (e) {
    console.log(e);
    notifyError('Hauptseite konnte nicht abgerufen werden');
    throw e;
  }
}

@Options({
  name: 'PageIndex',
  components: {
    HomeActivityFeed,
    HomeGalleryBand,
    HomeModule,
    HomeHero,
    HomeOpenVenues,
    HomeUpNext,
    SectionTabs,
    StatusBadge,
    TimelineStrip,
  },
  async beforeRouteEnter(_, __, next) {
    const data = await load();
    next(vm => (vm as PageIndex).setContent(data));
  }
})
export default class PageIndex extends Vue {
  content: MainPageContentDto = {
    news: [],
    newsUpToDate: false,
    newProfiles: [],
    newFreeCompanies: [],
    newCommunities: [],
    newVenues: [],
    newStories: [],
    newArtwork: [],
    newScreenshots: [],
    newNoticeboardItems: [],
  };
  recentChanges: ChangeItemDto[] = [];
  readonly recentChangesLimit = RECENT_CHANGES_LIMIT;
  events: EventSummaryDto[] = [];
  eventsAvailable = true;
  timelineView: TimelineView = 'tonight';
  venues: HomeVenue[] = [];
  venuesLoading = true;
  venuesAvailable = true;
  rpCount: number | null = null;
  now = Date.now();

  private clock: number | null = null;

  mounted() {
    this.clock = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);
    void this.loadVenues();
    void loadRpCount(this.$api).then((count) => {
      this.rpCount = count;
    });

  }

  beforeUnmount() {
    if (this.clock !== null) {
      window.clearInterval(this.clock);
      this.clock = null;
    }
  }

  setContent({ content, recentChanges, events }: HomeData) {
    this.content = content;
    this.recentChanges = recentChanges;
    this.events = events || [];
    this.eventsAvailable = events !== null;
    this.now = Date.now();
    if (this.liveEvents.length > 0) {
      this.timelineView = 'now';
    }
  }

  // --- ER2-305: activity feed ----------------------------------------------

  /**
   * ER2 round 2: changes carry authorAvatar / thumbnailUrl themselves. The
   * cross-reference with new profiles and images below is only needed for
   * older APIs that send neither.
   */
  get changesEnriched(): boolean {
    return this.recentChanges.some((change) => change.authorAvatar !== undefined || change.thumbnailUrl !== undefined);
  }

  get profileAvatars(): Record<string, string> {
    const result: Record<string, string> = {};
    if (this.changesEnriched) {
      return result;
    }
    this.content.newProfiles.forEach((profile) => {
      if (profile.avatar) {
        result[profile.name] = profile.avatar;
      }
    });
    return result;
  }

  get imageThumbs(): Record<number, string> {
    const result: Record<number, string> = {};
    if (this.changesEnriched) {
      return result;
    }
    [...this.content.newScreenshots, ...this.content.newArtwork].forEach((image) => {
      result[image.id] = image.thumbUrl;
    });
    return result;
  }

  // --- ER2-301: hero "Heute-Leiste" ----------------------------------------

  get todayStats(): HomeTodayStats {
    return {
      live: this.eventsAvailable ? this.liveEvents.length : null,
      tonight: this.eventsAvailable ? this.tonightEvents.length : null,
      venuesOpen: this.venueStatusKnown ? this.venuesOpenCount : null,
      inRp: this.rpCount,
      inRpCapped: this.rpCount !== null && this.rpCount >= RP_ACTIVE_LIMIT,
    };
  }

  // --- ER2-304: "Jetzt geöffnet" ------------------------------------------

  async loadVenues() {
    try {
      this.venues = await loadHomeVenues(this.$api);
    } catch (e) {
      console.log(e);
      this.venuesAvailable = false;
    } finally {
      this.venuesLoading = false;
    }

    // Older APIs send no banner in the summaries; fetch banners for the rows
    // on screen only. Rows whose list entry knew its banner are skipped.
    const images = await loadVenueImages(this.$api, this.sortedVenues.slice(0, 4));
    if (Object.keys(images).length > 0) {
      this.venues = this.venues.map((venue) => (images[venue.id] ? { ...venue, imageSrc: images[venue.id] } : venue));
    }
  }

  get sortedVenues(): HomeVenue[] {
    return sortVenuesByOpening(this.venues.filter((venue) => venue.info.state !== 'unknown'));
  }

  get venuesOpenCount(): number {
    return this.venues.filter((venue) => venue.info.state === 'open').length;
  }

  /** False when no venue carries opening data at all (hide the stat instead of showing 0). */
  get venueStatusKnown(): boolean {
    return this.venuesAvailable && !this.venuesLoading && this.venues.some((venue) => venue.info.state !== 'unknown');
  }

  // --- ER2-302: "Heute in Eorzea" ------------------------------------------

  get todayLabel(): string {
    return DateTime.fromMillis(this.now, { zone: SERVER_ZONE }).setLocale('de').toFormat('cccc, d. LLLL');
  }

  get zoneAbbreviation(): string {
    // MESZ in summer, MEZ in winter.
    return DateTime.fromMillis(this.now, { zone: SERVER_ZONE }).isInDST ? 'MESZ' : 'MEZ';
  }

  get liveEvents(): EventSummaryDto[] {
    return this.events.filter((event) => isEventLive(event, this.now));
  }

  get tonightEvents(): EventSummaryDto[] {
    const window = eveningWindow(this.now);
    return this.events.filter((event) => overlaps(event, window));
  }

  /** Events on one of the next seven evenings (what the week timeline shows). */
  get weekEvents(): EventSummaryDto[] {
    const windows = eveningWindows(this.now, 7);
    return this.events.filter((event) => windows.some((window) => overlaps(event, window)));
  }

  get timelineTabs(): SectionTab[] {
    const available = this.eventsAvailable;
    return [
      { key: 'now', label: 'Jetzt', icon: 'sensors', count: available ? this.liveEvents.length : undefined, dimmed: available && this.liveEvents.length === 0 },
      { key: 'tonight', label: 'Heute Abend', icon: 'nights_stay', count: available ? this.tonightEvents.length : undefined },
      { key: 'week', label: 'Diese Woche', icon: 'date_range', count: available ? this.weekEvents.length : undefined },
    ];
  }

  // All loaded events (today + the next 7 days): the strip's window follows
  // the clock and can be moved, so it clips the events itself.
  get timelineEvents() {
    return this.events.map(toTimelineEvent);
  }

  get timelineAriaLabel(): string {
    switch (this.timelineView) {
      case 'now':
        return 'Zeitleiste heute Abend, laufende Events hervorgehoben';
      case 'week':
        return 'Zeitleiste der nächsten sieben Tage';
      default:
        return 'Zeitleiste heute Abend';
    }
  }

  get timelineEmptyText(): string {
    return this.timelineView === 'now' && this.liveEvents.length === 0
      ? 'Gerade läuft nichts.'
      : 'In diesem Zeitraum ist nichts eingetragen.';
  }

  get isLoggedIn() {
    return !!this.$store.state.user;
  }

  get currentCharacter() {
    return this.$store.getters.character;
  }

  get welcomeName() {
    return this.currentCharacter?.name || 'Abenteurer';
  }

  // --- ER2-306: side modules and gallery band --------------------------------

  get latestStories(): StorySummaryDto[] {
    return this.content.newStories.slice(0, 3);
  }

  /** Content notes of a new story (ER2 round 2; absent on older APIs). */
  storyNotes(story: StorySummaryDto): string[] {
    return storyContentNotes(story);
  }

  notesLabel(story: StorySummaryDto): string {
    return contentNotesLabel(storyContentNotes(story));
  }

  get latestProfiles() {
    return this.content.newProfiles.slice(0, 6);
  }

  getProfileLink(profile: MainPageContentDto['newProfiles'][number]) {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

  get latestNoticeboardItems() {
    return this.content.newNoticeboardItems.slice(0, 3);
  }

  /** New free companies and communities, which have no other home module. */
  get latestGroups(): HomeGroup[] {
    const companies: HomeGroup[] = this.content.newFreeCompanies.slice(0, 2).map((fc) => ({
      key: `fc-${fc.server}-${fc.name}`,
      name: fc.name,
      meta: `Freie Gesellschaft · ${fc.server}`,
      icon: 'shield',
      link: `/fc/${fc.server}/${fc.name.replace(/ /g, '_')}`,
    }));
    const communities: HomeGroup[] = this.content.newCommunities.slice(0, 2).map((community) => ({
      key: `community-${community.id}`,
      name: community.name,
      meta: community.goal ? `Community · ${community.goal}` : 'Community',
      icon: 'groups',
      link: `/community/${community.name.replace(/ /g, '_')}`,
    }));
    return [...companies, ...communities];
  }

  /** Newest screenshots and artwork for "Momente der Woche". */
  get galleryImages(): ImageSummaryDto[] {
    return [...this.content.newScreenshots, ...this.content.newArtwork]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6);
  }

  loginWithDiscord() {
    window.location.href = this.$api.user.getDiscordLoginUrl(window.location.origin);
  }
}
</script>

<style lang="scss" scoped>
// Elpis Reborn 2 home hub (ER2-301 … ER2-306). Tokens only; every role token
// flips with body.body--dark, so no theme overrides are needed here.

.home {
  position: relative;
}

.home-community__aside {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 24px;
  min-width: 0;
}

.home-community__more {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;
}

@media (max-width: 767px) {
  .home-community__more {
    grid-template-columns: minmax(0, 1fr);
  }
}

.home-module-empty {
  margin: 0;
  padding: 8px 0;
  font-family: var(--font-section);
  font-style: italic;
  color: var(--ink-muted);
}

// Shared row link: the title link covers its whole row.
.home-stories__title,
.home-rows__title,
.home-faces__link {
  color: var(--ink-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
  }
}

.home-stories__title::after,
.home-rows__title::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
}

.home-stories__title:focus-visible::after,
.home-rows__title:focus-visible::after,
.home-faces__link:focus-visible {
  box-shadow:
    0 0 0 2px var(--glow-aether),
    0 0 0 3px var(--vision-focus-edge);
}

.home-stories,
.home-rows,
.home-faces {
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-stories__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px solid var(--rule-soft);

  &:first-child {
    padding-top: 0;
    border-top: 0;
  }
}

.home-stories__type {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-link);
}

.home-stories__title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.home-stories__meta,
.home-rows__meta {
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 16px;
  color: var(--ink-muted);
}

.home-stories__cw {
  position: relative;
  z-index: 1;
}

.home-faces {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 8px;
}

.home-faces__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  border-radius: 10px;
  text-align: center;

  &:hover {
    text-decoration: none;
    background-color: var(--rule-tint);
  }
}

.home-faces__avatar {
  background-color: var(--rule-tint);
  color: var(--ink-muted);
  box-shadow: 0 0 0 2px var(--vision-card), 0 0 0 3px var(--rule-soft);
}

.home-faces__name {
  max-width: 100%;
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-rows__item {
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--rule-soft);

  &:first-child {
    padding-top: 0;
    border-top: 0;
  }
}

.home-rows__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--rule-tint);
  color: var(--ink-muted);
  font-size: 18px;
}

.home-rows__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.home-rows__title {
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-eyebrow {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-link);
}

.home-card {
  background-color: var(--vision-card);
  border: 1px solid var(--rule-soft);
  border-radius: 16px;
  color: var(--ink-primary);
}

.home-hub {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 48px;
  scroll-margin-top: 88px;

  &:focus {
    outline: none;
  }
}

.home-hub__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.home-hub__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-6);
  font-weight: 600;
  line-height: var(--lh-display);
  letter-spacing: var(--ls-display);
  color: var(--ink-primary);
}

.home-hub__meta {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 20px;
  color: var(--ink-muted);
}

.home-hub__timeline {
  padding: 16px 12px 18px;
}

.home-hub__columns {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  margin-top: 8px;
}

@media (max-width: 1023px) {
  .home-hub__columns {
    grid-template-columns: minmax(0, 1fr);
  }
}

.home-section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.home-section-head__title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-5);
  font-weight: 600;
  line-height: var(--lh-heading);
  color: var(--ink-primary);
}

.home-community {
  position: relative;
  z-index: 1;
  margin-bottom: 48px;
}

.home-community__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: 24px;
  align-items: stretch;
}

@media (max-width: 1023px) {
  .home-community__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.home-hub__unavailable {
  margin: 0;
  padding: 24px 12px;
  font-family: var(--font-section);
  font-style: italic;
  color: var(--ink-muted);
  text-align: center;
}

@media (max-width: 599px) {
  .home-hub__title {
    font-size: var(--type-scale-5);
  }
}
</style>
