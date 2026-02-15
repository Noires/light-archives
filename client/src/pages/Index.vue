<template>
  <q-page class="page-index">
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

    <section class="page-index__grid">
      <section id="neueste-aenderungen" class="page-index__panel page-index__panel--wide">
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

      <section class="page-index__panel page-index__panel--wide">
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

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Kunstwerke</h5>
          <router-link class="page-index__panel-link" to="/gallery/artwork">Zur Galerie</router-link>
        </div>
        <div class="page-index__panel-content">
          <thumb-gallery v-if="content.newArtwork.length" :images="content.newArtwork" />
          <div v-else class="page-index__empty">Noch keine neuen Kunstwerke.</div>
        </div>
      </section>

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Aushänge</h5>
          <router-link class="page-index__panel-link" to="/noticeboard">Zum Anschlagbrett</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <noticeboard-item-list
            v-if="content.newNoticeboardItems.length"
            :noticeboard-items="content.newNoticeboardItems"
          />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Aushänge.</div>
        </div>
      </section>

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Charaktere</h5>
          <router-link class="page-index__panel-link" to="/profiles">Alle Charaktere</router-link>
        </div>
        <div class="page-index__panel-content">
          <div v-if="content.newProfiles.length" class="page-index__profiles-grid">
            <div v-for="profile in content.newProfiles" :key="`${profile.name}-${profile.server}`" class="page-characters__card">
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

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Freie Gesellschaften</h5>
          <router-link class="page-index__panel-link" to="/free-companies">Alle Gesellschaften</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <free-company-name-list
            v-if="content.newFreeCompanies.length"
            :free-companies="content.newFreeCompanies"
          />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Gesellschaften.</div>
        </div>
      </section>

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Treffpunkte</h5>
          <router-link class="page-index__panel-link" to="/venues">Alle Treffpunkte</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <venue-list v-if="content.newVenues.length" :venues="content.newVenues" />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Treffpunkte.</div>
        </div>
      </section>

      <section class="page-index__panel">
        <div class="page-index__panel-header">
          <h5>Neue Communities</h5>
          <router-link class="page-index__panel-link" to="/communities">Alle Communities</router-link>
        </div>
        <div class="page-index__panel-content page-index__panel-content--flush">
          <community-list v-if="content.newCommunities.length" :communities="content.newCommunities" />
          <div v-else class="page-index__empty page-index__empty--padded">Noch keine neuen Communities.</div>
        </div>
      </section>

      <section class="page-index__panel page-index__panel--wide">
        <div class="page-index__panel-header">
          <h5>Neue Screenshots</h5>
          <router-link class="page-index__panel-link" to="/gallery/screenshot">Zur Galerie</router-link>
        </div>
        <div class="page-index__panel-content">
          <thumb-gallery v-if="content.newScreenshots.length" :images="content.newScreenshots" />
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
import ThumbGallery from 'components/images/ThumbGallery.vue';
import NoticeboardItemList from 'components/noticeboard/NoticeboardItemList.vue';
import VenueList from 'components/venues/VenueList.vue';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import CommunityList from 'src/components/communities/CommunityList.vue';
import FreeCompanyNameList from 'src/components/free-company/FreeCompanyNameList.vue';
import { Options, Vue } from 'vue-class-component';

const $api = useApi();
const RECENT_CHANGES_LIMIT = 6;

interface MainPageChangesApiClient {
  getMainPageContent(): Promise<MainPageContentDto>;
  changes: {
    getChanges(filter?: { offset?: number; limit?: number }): Promise<PagingResultDto<ChangeItemDto>>;
  };
}

async function load(): Promise<{ content: MainPageContentDto; recentChanges: ChangeItemDto[] }> {
  try {
    const api = $api as MainPageChangesApiClient;
    const [content, recentChangesResult]: [MainPageContentDto, PagingResultDto<ChangeItemDto>] = await Promise.all([
      api.getMainPageContent(),
      api.changes.getChanges({
        offset: 0,
        limit: RECENT_CHANGES_LIMIT,
      }),
    ]);

    return {
      content,
      recentChanges: recentChangesResult.data,
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
  },
  async beforeRouteEnter(_, __, next) {
    const { content, recentChanges } = await load();
    next(vm => (vm as PageIndex).setContent(content, recentChanges));
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

  loaded = false;

  setContent(content: MainPageContentDto, recentChanges: ChangeItemDto[]) {
    this.content = content;
    this.recentChanges = recentChanges;
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
    return this.content.newStories.slice(0, 5);
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

  changeTypeLabel(type: ChangeType): string {
    return type === ChangeType.CREATED ? 'Neu' : 'Aktualisiert';
  }

  loginWithDiscord() {
    window.location.href = this.$api.user.getDiscordLoginUrl();
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

.page-index__panel {
  border: 1px solid rgba(221, 180, 118, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 120px;
  border-radius: 2px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.page-index__panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.08);
}

.page-index__panel--wide {
  grid-column: span 2;
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
  color: rgba(35, 35, 35, 0.64);
  font-size: 0.82rem;
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
  height: 100%;
  border-radius: 0;
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.page-index .page-stories__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-index .page-stories__card-link {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  min-height: 200px;
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
  border-radius: 0;
  background: rgba(221, 180, 118, 0.2);
  color: #6b4c21;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-index .page-stories__card-title {
  margin: 0;
  font-family: $header-font;
  font-size: 1.05rem;
  line-height: 1.3;
  color: #1f2c38;
}

.page-index .page-stories__card-meta {
  display: grid;
  justify-items: end;
  text-align: right;
  gap: 2px;
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.8rem;
}

.page-index .page-stories__card-excerpt {
  margin: 0;
  color: rgba(35, 35, 35, 0.72);
  font-size: 0.92rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.page-index .page-stories__card-action {
  margin-top: auto;
  font-weight: 600;
  color: #1f4d64;
  letter-spacing: 0.01em;
}

.page-index .page-stories__card-link:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgba(31, 77, 100, 0.3);
  border-radius: 0;
}

.page-index__profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.page-index .page-characters__card {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.page-index .page-characters__card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-index .page-characters__card-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
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

.page-index__empty {
  color: rgba(35, 35, 35, 0.6);
  font-size: 0.95rem;
  font-style: italic;
  text-align: center;
  padding: 24px 16px;
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
</style>
