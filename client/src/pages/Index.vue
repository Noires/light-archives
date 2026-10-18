<template>
  <q-page :class="['page-index', { 'page-index--first-load': revealEnabled }]">
    <header class="page-index__hero">
      <div class="page-index__hero-text">
        <span class="page-index__eyebrow">Übersicht</span>
        <h2>Elpisgarten</h2>
        <p class="page-index__lead">
          Willkommen im Elpisgarten, der Enzyklopädie für Rollenspiel in Final Fantasy XIV.
          Stelle Charaktere vor, bewirb Events und Geschichten oder schau nach, wo aktuell RP stattfindet.
          Jede Rollenspielerin und jeder Rollenspieler ist eingeladen, eigene Projekte oder Charaktere hier darzustellen.
        </p>
        <p class="page-index__notice">
          <strong>Hinweis:</strong> Diese Seite kann Spoiler zur Geschichte von Final Fantasy XIV oder zum Rollenspiel enthalten.
          Schreibe und lies nur so viel, wie für dich passend ist.
        </p>
        <div class="page-index__hero-cta">
          <button
            v-if="!isLoggedIn"
            class="page-index__discord-button"
            type="button"
            @click="loginWithDiscord"
          >
            <svg
              class="page-index__discord-logo"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              width="800px"
              height="800px"
              viewBox="0 -28.5 256 256"
              version="1.1"
              preserveAspectRatio="xMidYMid"
            >
              <g>
                <path
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill="#FFFFFF"
                  fill-rule="nonzero"
                />
              </g>
            </svg>
            <span>Login mit Discord</span>
          </button>
          <div v-else class="page-index__welcome">
            <q-avatar round size="46px" class="page-index__welcome-avatar">
              <img v-if="currentCharacter?.avatar" :src="currentCharacter.avatar" />
              <span v-else>{{ welcomeInitial }}</span>
            </q-avatar>
            <div>
              <div class="page-index__welcome-title">Willkommen zurück</div>
              <div class="page-index__welcome-name">{{ welcomeName }}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

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
      </div>
    </section>

    <section class="page-index__grid">
      <section id="neueste-aenderungen" class="page-index__panel mat-vellum page-index__panel--wide page-index__section--changes">
        <div class="page-index__panel-header">
          <h5>Neueste Änderungen</h5>
          <router-link class="page-index__panel-link" to="/changes">Komplette Liste</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <q-list v-if="recentChanges.length" class="page-index__changes-list">
            <q-item
              v-for="entry in recentChanges"
              :key="entry.id"
              clickable
              :to="entry.link"
              class="page-index__changes-item"
            >
              <q-item-section>
                <q-item-label class="page-index__changes-title">
                  {{ entry.title }}
                </q-item-label>
                <q-item-label caption class="page-index__changes-meta">
                  <q-icon :name="changeAreaIcon(entry.area)" size="14px" class="page-index__changes-icon" />
                  {{ changeAreaLabel(entry.area) }} · {{ changeTypeLabel(entry.type) }}
                  <template v-if="entry.author"> · von {{ entry.author }}</template>
                </q-item-label>
              </q-item-section>
              <q-item-section side class="page-index__changes-time">
                {{ $display.relativeTime(entry.happenedAt) }}
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine Änderungen verfügbar.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--stories">
        <div class="page-index__panel-header">
          <h5>Neue Geschichten</h5>
          <router-link class="page-index__panel-link" to="/stories">Alle Geschichten</router-link>
        </div>
        <div class="page-index__panel-content">
          <div v-if="latestStories.length" class="page-index__stories-grid">
            <div v-for="story in latestStories" :key="story.id" class="page-stories__card">
              <router-link :to="getStoryLink(story)" class="page-stories__card-link">
                <div class="page-stories__card-top">
                  <span class="page-stories__card-type">
                    {{ $display.storyTypes[story.type] }}
                  </span>
                  <div class="page-stories__card-meta">
                    <span class="page-stories__card-author">{{ story.author }}</span>
                    <span class="page-stories__card-time">{{ $display.relativeTime(story.createdAt) }}</span>
                  </div>
                </div>
                <h3 class="page-stories__card-title">{{ story.title }}</h3>
                <p v-if="story.excerpt" class="page-stories__card-excerpt">{{ story.excerpt }}</p>
                <span class="page-stories__card-action">Lesen</span>
              </router-link>
            </div>
          </div>
          <div v-else class="page-index__empty">Noch keine neuen Geschichten.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__panel--media page-index__section--artwork">
        <div class="page-index__panel-header">
          <h5>Neue Kunstwerke</h5>
          <router-link class="page-index__panel-link" to="/gallery/artwork">Zur Galerie</router-link>
        </div>
        <div class="page-index__panel-content">
          <thumb-gallery v-if="latestArtwork.length" :images="latestArtwork" />
          <div v-else class="page-index__empty">Noch keine neuen Kunstwerke.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--noticeboard">
        <div class="page-index__panel-header">
          <h5>Neue Aushänge</h5>
          <router-link class="page-index__panel-link" to="/noticeboard">Zum Anschlagbrett</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <noticeboard-item-list
            v-if="latestNoticeboardItems.length"
            :noticeboard-items="latestNoticeboardItems"
          />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Aushänge.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--profiles">
        <div class="page-index__panel-header">
          <h5>Neue Charaktere</h5>
          <router-link class="page-index__panel-link" to="/profiles">Alle Charaktere</router-link>
        </div>
        <div class="page-index__panel-content">
          <div v-if="latestProfiles.length" class="page-index__profiles-grid">
            <div v-for="profile in latestProfiles" :key="`${profile.name}-${profile.server}`" class="page-characters__card">
              <router-link :to="getProfileLink(profile)" class="page-characters__card-link">
                <q-avatar round size="56px" class="page-characters__card-avatar">
                  <img :src="profile.avatar" />
                </q-avatar>
                <div class="page-characters__card-body">
                  <div class="page-characters__card-name">{{ profile.name }}</div>
                  <div class="page-characters__card-meta">
                    {{ $display.races[profile.race] }} - {{ profile.server }}
                  </div>
                </div>
              </router-link>
            </div>
          </div>
          <div v-else class="page-index__empty">Noch keine neuen Charaktere.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--free-companies">
        <div class="page-index__panel-header">
          <h5>Neue Freie Gesellschaften</h5>
          <router-link class="page-index__panel-link" to="/free-companies">Alle Gesellschaften</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <free-company-name-list
            v-if="latestFreeCompanies.length"
            :free-companies="latestFreeCompanies"
          />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Gesellschaften.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--venues">
        <div class="page-index__panel-header">
          <h5>Neue Treffpunkte</h5>
          <router-link class="page-index__panel-link" to="/venues">Alle Treffpunkte</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <venue-list v-if="latestVenues.length" :venues="latestVenues" />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Treffpunkte.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__section--communities">
        <div class="page-index__panel-header">
          <h5>Neue Communities</h5>
          <router-link class="page-index__panel-link" to="/communities">Alle Communities</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <community-list v-if="latestCommunities.length" :communities="latestCommunities" />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Communities.</div>
        </div>
      </section>

      <section class="page-index__panel mat-vellum page-index__panel--media page-index__section--screenshots">
        <div class="page-index__panel-header">
          <h5>Neue Screenshots</h5>
          <router-link class="page-index__panel-link" to="/gallery/screenshot">Zur Galerie</router-link>
        </div>
        <div class="page-index__panel-content">
          <thumb-gallery v-if="latestScreenshots.length" :images="latestScreenshots" />
          <div v-else class="page-index__empty">Noch keine neuen Screenshots.</div>
        </div>
      </section>
    </section>
  </q-page>
</template>

<script lang="ts">
import { ChangeItemDto } from '@app/shared/dto/changes/change-item.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { MainPageContentDto } from '@app/shared/dto/main-page/main-page-content.dto';
import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import ThumbGallery from 'components/images/ThumbGallery.vue';
import {
  eveningWindow,
  eveningWindows,
  isEventLive,
  loadHomeEvents,
  overlaps,
  SERVER_ZONE,
  toTimelineEvent,
} from 'components/mainpage/home-data';
import HomeUpNext from 'components/mainpage/HomeUpNext.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import TimelineStrip from 'components/vision/TimelineStrip.vue';
import type { TimelineView } from 'components/vision/timeline';
import type { SectionTab } from 'components/vision/types';
import { DateTime } from 'luxon';
import NoticeboardItemList from 'components/noticeboard/NoticeboardItemList.vue';
import VenueList from 'components/venues/VenueList.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import CommunityList from 'src/components/communities/CommunityList.vue';
import FreeCompanyNameList from 'src/components/free-company/FreeCompanyNameList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();
const RECENT_CHANGES_LIMIT = 3;

interface MainPageChangesApiClient {
  getMainPageContent(): Promise<MainPageContentDto>;
  changes: {
    getChanges(filter?: { offset?: number; limit?: number }): Promise<PagingResultDto<ChangeItemDto>>;
  };
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
    FreeCompanyNameList,
    NoticeboardItemList,
    VenueList,
    CommunityList,
    ThumbGallery,
    HomeUpNext,
    SectionTabs,
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
  events: EventSummaryDto[] = [];
  eventsAvailable = true;
  timelineView: TimelineView = 'tonight';
  now = Date.now();

  private clock: number | null = null;

  loaded = false;
  revealEnabled = false;

  // ELPIS-110 — IntersectionObserver-driven diagonal-wave reveal of activity
  // panels, gated to once per session via sessionStorage.
  private revealObserver: IntersectionObserver | null = null;

  created() {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const flag = window.sessionStorage.getItem('elpis.indexRevealed');
      if (!flag) {
        this.revealEnabled = true;
        window.sessionStorage.setItem('elpis.indexRevealed', '1');
      }
    } catch (_) {
      // Storage unavailable (private mode etc.) — skip the reveal rather than
      // throwing; the page still renders correctly without animation.
      this.revealEnabled = false;
    }
  }

  mounted() {
    this.clock = window.setInterval(() => {
      this.now = Date.now();
    }, 60000);

    if (!this.revealEnabled) {
      return;
    }
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // No IO support — just unhide every panel immediately.
      this.markAllRevealed();
      return;
    }
    const reduced = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.markAllRevealed();
      return;
    }

    const panels = (this.$el as HTMLElement).querySelectorAll('.page-index__panel');
    if (!panels.length) {
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('page-index__panel--revealed');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );

    panels.forEach((panel) => {
      this.revealObserver!.observe(panel);
    });
  }

  beforeUnmount() {
    if (this.clock !== null) {
      window.clearInterval(this.clock);
      this.clock = null;
    }
    this.revealObserver?.disconnect();
    this.revealObserver = null;
  }

  private markAllRevealed() {
    const panels = (this.$el as HTMLElement).querySelectorAll('.page-index__panel');
    panels.forEach((panel) => panel.classList.add('page-index__panel--revealed'));
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

  get timelineEvents() {
    const source = this.timelineView === 'week' ? this.weekEvents : this.tonightEvents;
    return source.map(toTimelineEvent);
  }

  get timelineAriaLabel(): string {
    switch (this.timelineView) {
      case 'now':
        return 'Zeitleiste heute Abend, laufende Events hervorgehoben';
      case 'week':
        return 'Zeitleiste der nächsten sieben Abende';
      default:
        return 'Zeitleiste heute Abend';
    }
  }

  get timelineEmptyText(): string {
    return this.timelineView === 'now' && this.tonightEvents.length === 0
      ? 'Gerade läuft nichts und für heute Abend ist noch nichts eingetragen.'
      : 'Für heute Abend ist noch nichts eingetragen.';
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

  get welcomeInitial() {
    return this.welcomeName.charAt(0).toUpperCase();
  }

  getStoryLink(story: MainPageContentDto['newStories'][number]) {
    return `/story/${story.id}`;
  }

  get latestStories() {
    return this.content.newStories.slice(0, 3);
  }

  get latestNoticeboardItems() {
    return this.content.newNoticeboardItems.slice(0, 3);
  }

  get latestProfiles() {
    return this.content.newProfiles.slice(0, 6);
  }

  get latestFreeCompanies() {
    return this.content.newFreeCompanies.slice(0, 3);
  }

  get latestVenues() {
    return this.content.newVenues.slice(0, 3);
  }

  get latestCommunities() {
    return this.content.newCommunities.slice(0, 3);
  }

  get latestScreenshots() {
    return this.content.newScreenshots.slice(0, 6);
  }

  get latestArtwork() {
    return this.content.newArtwork.slice(0, 6);
  }

  getProfileLink(profile: MainPageContentDto['newProfiles'][number]) {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

  changeAreaLabel(area: ChangeArea): string {
    const labels: Record<ChangeArea, string> = {
      [ChangeArea.PROFILE]: 'Profile',
      [ChangeArea.VENUE]: 'Treffpunkte',
      [ChangeArea.COMMUNITY]: 'Communities',
      [ChangeArea.FREE_COMPANY]: 'Freie Gesellschaften',
      [ChangeArea.STORY]: 'Geschichten',
      [ChangeArea.NOTICEBOARD]: 'Anschlagbrett',
      [ChangeArea.EVENT]: 'Events',
      [ChangeArea.MEDIA]: 'Medien',
    };

    return labels[area];
  }

  changeAreaIcon(area: ChangeArea): string {
    const icons: Record<ChangeArea, string> = {
      [ChangeArea.PROFILE]: 'person',
      [ChangeArea.VENUE]: 'place',
      [ChangeArea.COMMUNITY]: 'groups',
      [ChangeArea.FREE_COMPANY]: 'shield',
      [ChangeArea.STORY]: 'menu_book',
      [ChangeArea.NOTICEBOARD]: 'campaign',
      [ChangeArea.EVENT]: 'event',
      [ChangeArea.MEDIA]: 'photo_library',
    };

    return icons[area];
  }

  changeTypeLabel(type: ChangeType): string {
    return type === ChangeType.CREATED ? 'Neu' : 'Aktualisiert';
  }

  loginWithDiscord() {
    window.location.href = this.$api.user.getDiscordLoginUrl(window.location.origin);
  }
}
</script>

<style lang="scss">
.page-index {
  position: relative;
  padding: 32px 20px 48px;
  background: linear-gradient(180deg, #f8f4ee 0%, #ffffff 35%, #fafaf8 65%, #f2ede4 100%);
  border-radius: 30px;
  overflow: hidden;
}

.page-index::before {
  content: '';
  position: absolute;
  inset: -120px 0 auto;
  height: 260px;
  background: radial-gradient(circle at 20% 30%, rgba(221, 180, 118, 0.18), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(15, 76, 104, 0.12), transparent 50%);
  pointer-events: none;
}

.page-index h2,
.page-index h5 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-index h5 {
  font-size: 1.35rem;
  font-weight: 600;
  color: #1f2c38;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-index__hero {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  padding: 24px 28px;
  margin-bottom: 32px;
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 20px 48px rgba(0, 0, 0, 0.06);
  border-radius: 2px;
}

.page-index__eyebrow {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(139, 103, 58, 0.9);
  font-weight: 600;
}

.page-index__hero-text {
  display: grid;
  gap: 8px;
}

.page-index__lead {
  margin: 0;
  color: rgba(35, 35, 35, 0.7);
  max-width: none;
}

.page-index__notice {
  margin: 10px 0 0;
  color: rgba(35, 35, 35, 0.68);
  max-width: none;
}

.page-index__hero-cta {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.page-index__discord-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  min-height: 44px;
  border-radius: 8px;
  border: none;
  background: #5865f2;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
}

.page-index__discord-button:hover {
  background: #4752c4;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.24);
}

.page-index__discord-button:active {
  background: #3c45a5;
  transform: translateY(1px);
}

.page-index__discord-logo {
  width: 22px;
  height: 22px;
  display: block;
  color: #ffffff;
}

.page-index__welcome {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(221, 180, 118, 0.35);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 244, 238, 0.9) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-index__welcome-avatar {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
  background: rgba(221, 180, 118, 0.25);
  color: #6b4c21;
  font-weight: 700;
}

.page-index__welcome-title {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-index__welcome-name {
  font-weight: 700;
  color: #1f2c38;
}

.page-index__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

// .mat-vellum owns the cream surface, hairline rule (--rule-gold-soft @ 0.28),
// noise overlay and dark-mode flip. Local rule layers structure (flex column,
// min-height) and the ELPIS-111 hover lift on top.
.page-index__panel {
  display: flex;
  flex-direction: column;
  min-height: 120px;
  box-shadow:
    0 1px 2px rgba(43, 36, 24, 0.06),
    0 4px 12px rgba(43, 36, 24, 0.06);
  transition:
    transform var(--motion-base) var(--ease-elpis),
    box-shadow var(--motion-base) var(--ease-elpis),
    border-color var(--motion-base) var(--ease-elpis);
}

.page-index__panel:hover {
  transform: translateY(-4px);
  border-color: var(--rule-gold);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 28px rgba(43, 36, 24, 0.12);
}

.page-index__panel--wide {
  grid-column: span 2;
}

.page-index__section--changes {
  order: 1;
}

.page-index__section--noticeboard {
  order: 2;
}

.page-index__section--stories {
  order: 3;
}

.page-index__section--profiles {
  order: 4;
}

.page-index__section--free-companies {
  order: 5;
}

.page-index__section--venues {
  order: 6;
}

.page-index__section--communities {
  order: 7;
}

.page-index__section--screenshots {
  order: 8;
}

.page-index__section--artwork {
  order: 9;
}

.page-index__panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(90deg, rgba(221, 180, 118, 0.4) 0%, rgba(221, 180, 118, 0.15) 50%, rgba(221, 180, 118, 0.4) 100%);
  border-image-slice: 1;
  background: linear-gradient(180deg, rgba(248, 244, 238, 0.3) 0%, transparent 100%);
}

.page-index__panel-header a {
  color: inherit;
  text-decoration: none;
}

.page-index__panel-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f4d64;
  transition: color 0.2s ease, transform 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.page-index__panel-link:hover {
  color: #ddb476;
  transform: translateX(2px);
}

.page-index__panel-link::after {
  content: '→';
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.page-index__panel-link:hover::after {
  transform: translateX(3px);
}

.page-index__panel-meta {
  font-size: 0.8rem;
  color: rgba(35, 35, 35, 0.6);
}

.page-index__panel-content {
  padding: 12px 16px 16px;
}

.page-index__panel-content--flush {
  padding: 0;
}

.page-index__panel-content--flush .page-index__empty--padded {
  padding: 16px;
}

.page-index__panel-content .thumb-gallery {
  justify-content: flex-start;
}

.page-index__panel-content .thumb-gallery__image-wrapper {
  margin-right: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 2px;
  overflow: hidden;
}

.page-index__panel-content .thumb-gallery__image-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.page-index__panel--media .thumb-gallery > div {
  width: calc(((100% - 36px) / 3) + 12px);
}

.page-index__panel--media .thumb-gallery__image-wrapper {
  width: calc(100% - 12px);
}

.page-index__panel--media .thumb-gallery img {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
}

.page-index__changes-list {
  padding: 0;
}

.page-index__changes-item {
  border-bottom: 1px solid rgba(221, 180, 118, 0.18);
  min-height: 64px;
}

.page-index__changes-item:last-child {
  border-bottom: 0;
}

.page-index__changes-title {
  font-family: $header-font;
  font-weight: 600;
  color: #1f2c38;
  margin-bottom: 2px;
}

.page-index__changes-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(35, 35, 35, 0.64);
  font-size: 0.82rem;
}

.page-index__changes-icon {
  color: #8b673a;
}

.page-index__changes-time {
  color: rgba(35, 35, 35, 0.58);
  font-size: 0.8rem;
  white-space: nowrap;
}

.page-index__stories-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.page-index .page-stories__card {
  position: relative;
  height: 100%;
  border-radius: 6px;
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  color: var(--surface-ink);
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  overflow: hidden;
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
}

.page-index .page-stories__card:hover {
  transform: translateY(-4px);
  border-color: var(--rule-gold);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
}

.page-index .page-stories__card-link {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  min-height: 0;
  color: inherit;
  text-decoration: none;
}

.page-index .page-stories__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.page-index .page-stories__card-type {
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(186, 155, 91, 0.18);
  border: 1px solid var(--rule-gold-soft);
  color: var(--rule-gold);
  font-family: var(--font-ui);
  font-weight: 600;
  font-size: var(--type-scale-0);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
}

.page-index .page-stories__card-title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--type-scale-2);
  line-height: 1.3;
  color: var(--surface-ink);
  letter-spacing: var(--ls-display);
}

.page-index .page-stories__card-meta {
  display: grid;
  justify-items: end;
  text-align: right;
  gap: 2px;
  color: var(--ink-muted);
  font-size: var(--type-scale-0);
}

.page-index .page-stories__card-excerpt {
  margin: 0;
  color: var(--ink-muted);
  font-family: var(--font-section);
  font-size: var(--type-scale-1);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-index .page-stories__card-action {
  margin-top: auto;
  font-family: var(--font-ui);
  font-weight: 600;
  color: var(--rule-gold);
  font-size: var(--type-scale-0);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
}

.page-index .page-stories__card-link:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--rule-gold);
  border-radius: 6px;
}

.page-index__profiles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.page-index .page-characters__card {
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  color: var(--surface-ink);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
}

.page-index .page-characters__card:hover {
  transform: translateY(-4px);
  border-color: var(--rule-gold);
  box-shadow:
    0 2px 4px rgba(43, 36, 24, 0.08),
    0 12px 24px rgba(43, 36, 24, 0.12);
}

.page-index .page-characters__card-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  min-height: 88px;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}

.page-index .page-characters__card-avatar {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.page-index .page-characters__card-name {
  font-weight: 700;
  color: #1f2c38;
}

.page-index .page-characters__card-meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.85rem;
}

.page-index .free-company-name-list {
  gap: 14px;
  padding: 12px 16px 16px;
}

.page-index .free-company-name-list__item {
  min-height: 88px;
  padding: 14px 16px;
}

.page-index .free-company-name-list__crest {
  min-width: 56px;
  padding-right: 12px;
}

.page-index .free-company-name-list__crest .free-company-crest {
  width: 56px;
  height: 56px;
}

.page-index .free-company-name-list__crest .free-company-crest img {
  width: 56px;
  height: 56px;
}

.page-index .free-company-name-list__content {
  gap: 2px;
}

.page-index .free-company-name-list__name {
  font-size: 1rem;
  line-height: 1.25;
  font-weight: 700;
  color: #1f2c38;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-index .free-company-name-list__goal {
  font-size: 0.85rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-index .free-company-name-list__server {
  font-size: 0.75rem;
  line-height: 1.2;
}

.page-index__empty {
  color: rgba(35, 35, 35, 0.6);
  font-size: 0.95rem;
  font-style: italic;
  text-align: center;
  padding: 24px 16px;
}

body.body--dark .page-index {
  background: linear-gradient(180deg, #0f151f 0%, #121d2b 45%, #0d141d 100%);
  color: rgba(213, 226, 240, 0.9);
}

body.body--dark .page-index::before {
  background:
    radial-gradient(circle at 20% 30%, rgba(141, 181, 223, 0.2), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(90, 125, 166, 0.16), transparent 50%);
}

body.body--dark .page-index h5,
body.body--dark .page-index .page-stories__card-title,
body.body--dark .page-index .page-characters__card-name,
body.body--dark .page-index .page-index__changes-title {
  color: rgba(213, 226, 240, 0.94);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

// Hero stays on its own legacy chrome (Aetherglass-light pattern); panels are
// fully owned by .mat-vellum's body.body--dark variant — only the hover lift
// shadow is redefined here so the lift reads on Obsidian.
body.body--dark .page-index__hero {
  background: rgba(17, 24, 34, 0.94);
  border-color: rgba(141, 181, 223, 0.28);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.34);
}

body.body--dark .page-index__panel {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.3);
}

body.body--dark .page-index__panel:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 28px rgba(0, 0, 0, 0.45);
}

body.body--dark .page-index__panel-header {
  border-image: linear-gradient(
    90deg,
    rgba(141, 181, 223, 0.38) 0%,
    rgba(141, 181, 223, 0.14) 50%,
    rgba(141, 181, 223, 0.38) 100%
  );
  border-image-slice: 1;
  background: linear-gradient(180deg, rgba(141, 181, 223, 0.12) 0%, transparent 100%);
}

body.body--dark .page-index__eyebrow {
  color: rgba(171, 201, 235, 0.88);
}

body.body--dark .page-index__lead,
body.body--dark .page-index__notice,
body.body--dark .page-index__welcome-title,
body.body--dark .page-index__changes-meta,
body.body--dark .page-index__changes-time,
body.body--dark .page-index .page-stories__card-meta,
body.body--dark .page-index .page-stories__card-excerpt,
body.body--dark .page-index .page-characters__card-meta,
body.body--dark .page-index__empty {
  color: rgba(213, 226, 240, 0.74);
}

body.body--dark .page-index__changes-icon {
  color: rgba(196, 221, 247, 0.84);
}

body.body--dark .page-index__welcome {
  border-color: rgba(141, 181, 223, 0.32);
  background: linear-gradient(135deg, rgba(18, 26, 37, 0.96) 0%, rgba(16, 23, 33, 0.96) 100%);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

body.body--dark .page-index__welcome-avatar {
  background: rgba(141, 181, 223, 0.2);
  color: rgba(213, 226, 240, 0.96);
}

body.body--dark .page-index__welcome-name {
  color: rgba(213, 226, 240, 0.94);
}

body.body--dark .page-index__panel-link,
body.body--dark .page-index .page-stories__card-action {
  color: rgba(171, 201, 235, 0.94);
}

body.body--dark .page-index__panel-link:hover {
  color: rgba(196, 221, 247, 0.98);
}

body.body--dark .page-index__changes-item {
  border-bottom-color: rgba(141, 181, 223, 0.22);
}

body.body--dark .page-index .page-stories__card,
body.body--dark .page-index .page-characters__card {
  background: var(--surface-lift);
  color: var(--ink-luminous);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

body.body--dark .page-index .page-stories__card:hover,
body.body--dark .page-index .page-characters__card:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.45),
    0 12px 24px rgba(0, 0, 0, 0.45);
}

body.body--dark .page-index .page-stories__card-type {
  color: var(--glow-aether-d);
  background: rgba(193, 155, 255, 0.16);
  border-color: var(--rule-arcane-soft);
}

body.body--dark .page-index .page-stories__card-action {
  color: var(--glow-aether-d);
}

body.body--dark .page-index .page-stories__card-link:focus-visible {
  box-shadow: inset 0 0 0 2px var(--rule-arcane);
}

@media screen and (max-width: 1100px) {
  .page-index__hero {
    grid-template-columns: minmax(0, 1fr);
    align-items: flex-start;
  }

  .page-index__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-index__panel--wide {
    grid-column: span 1;
  }
}

@media screen and (max-width: $breakpoint-sm) {
  .page-index {
    padding: 20px 14px 36px;
  }

  .page-index__hero {
    padding: 16px;
  }

  .page-index__profiles-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-index__panel--media .thumb-gallery > div {
    width: calc(((100% - 24px) / 2) + 12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-index__panel,
  .page-index .page-stories__card,
  .page-index .page-characters__card,
  .page-index__panel-content .thumb-gallery__image-wrapper,
  .page-index__discord-button {
    transition: none;
  }

  .page-index__panel:hover,
  .page-index .page-stories__card:hover,
  .page-index .page-characters__card:hover,
  .page-index__panel-content .thumb-gallery__image-wrapper:hover,
  .page-index__discord-button:hover {
    transform: none;
  }
}

// ELPIS-110 — Diagonal-wave reveal on first session load. Each panel starts
// hidden; IntersectionObserver adds .page-index__panel--revealed as it enters
// the viewport, triggering a per-section delayed fade-rise. Delays are tuned
// to read as a top-left → bottom-right wave on the 2-col desktop grid; on
// single-col layouts they collapse to a sequential top-down reveal which
// reads cleanly. `animation-fill-mode: backwards` holds the from-state during
// the delay; after the animation the panel returns to its specified style so
// hover lift transitions still fire normally.
.page-index--first-load .page-index__panel:not(.page-index__panel--revealed) {
  opacity: 0;
}

.page-index--first-load .page-index__panel--revealed {
  animation: elpis-panel-reveal var(--motion-base) var(--ease-elpis) var(--reveal-delay, 0ms) backwards;
}

@keyframes elpis-panel-reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Diagonal indices on the 2-col grid (one panel per row at row 0, then two
// panels per row from row 1 onward). Same-diagonal panels share a delay so
// the wave reads as a 60 ms-stepped front rather than a sequential cascade.
.page-index__section--changes        { --reveal-delay: 0ms; }
.page-index__section--noticeboard    { --reveal-delay: 60ms; }
.page-index__section--stories        { --reveal-delay: 120ms; }
.page-index__section--profiles       { --reveal-delay: 120ms; }
.page-index__section--free-companies { --reveal-delay: 180ms; }
.page-index__section--venues         { --reveal-delay: 180ms; }
.page-index__section--communities    { --reveal-delay: 240ms; }
.page-index__section--screenshots    { --reveal-delay: 240ms; }
.page-index__section--artwork        { --reveal-delay: 300ms; }

@media (prefers-reduced-motion: reduce) {
  .page-index--first-load .page-index__panel:not(.page-index__panel--revealed),
  .page-index--first-load .page-index__panel--revealed {
    opacity: 1;
    animation: none;
    transform: none;
  }
}
</style>

<style lang="scss" scoped>
// Elpis Reborn 2 home hub (ER2-301 … ER2-306). Tokens only; every role token
// flips with body.body--dark, so no theme overrides are needed here.

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
