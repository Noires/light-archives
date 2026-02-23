<template>
  <q-layout class="page-venue-layout rounded-borders no-outline">
    <q-drawer
      v-if="venue.id && hasSectionMenu"
      v-model="drawer"
      class="border-radius-inherit"
      show-if-above
      :mini="miniState"
      :width="200"
      :breakpoint="0"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
    >
      <q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
        <q-list padding class="page-venue-layout__menu">
          <q-item
            v-for="section in visibleSections"
            :key="section.id"
            clickable
            v-ripple
            :active="activeSection === section.id"
            @click="onSectionClick(section.id)"
          >
            <q-item-section avatar>
              <q-icon :name="section.icon" />
            </q-item-section>
            <q-item-section>
              {{ section.label }}
            </q-item-section>
          </q-item>

          <q-item
            v-if="venue.canEdit"
            class="page-venue-layout__edit-item"
            clickable
            v-ripple
            :to="`/edit-venue/${venue.id}`"
          >
            <q-item-section avatar>
              <q-icon name="edit" />
            </q-item-section>
            <q-item-section>Bearbeiten</q-item-section>
          </q-item>
          <q-item
            v-if="venue.mine"
            class="page-venue-layout__delete-item"
            clickable
            v-ripple
            @click="onDeleteClick"
          >
            <q-item-section avatar>
              <q-icon name="delete" />
            </q-item-section>
            <q-item-section>LÃ¶schen</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page class="page-venue">
      <q-page-container>
        <template v-if="venue.id">
          <section
            v-if="!hasSectionMenu && (venue.canEdit || venue.mine)"
            class="edit-bar"
          >
            <q-btn
              v-if="venue.canEdit"
              flat
              color="secondary"
              label="Treffpunkt bearbeiten"
              :to="`/edit-venue/${venue.id}`"
            />
            <q-btn
              v-if="venue.mine"
              flat
              color="negative"
              label="Treffpunkt löschen"
              @click="onDeleteClick"
            />
          </section>

          <section v-if="!$store.getters.characterId"><!-- Not logged in --></section>
          <section v-else-if="!venue.canEdit && !venue.membershipStatus" class="page-venue__join-button-bar">
            <q-btn outline color="primary" label="Treffpunkt beitreten" @click="onJoinClick" />
          </section>
          <section
            v-else-if="!venue.canEdit && venue.membershipStatus === MembershipStatus.APPLIED"
            class="page-venue__membership-status"
          >
            Du hast eine Anfrage fÃ¼r eine Mitgliedschaft bei diesem Treffpunkt gesendet.
          </section>
          <section
            v-else-if="!venue.canEdit && venue.membershipStatus === MembershipStatus.REJECTED"
            class="page-venue__membership-status"
          >
            Deine Mitgliedschaftsanfrage wurde abgelehnt.
          </section>
          <section
            v-else-if="!venue.canEdit && venue.membershipStatus === MembershipStatus.CONFIRMED"
            class="page-venue__membership-status"
          >
            Du bist ein Mitglied dieses Treffpunkts.
          </section>

          <template v-if="activeSection === VenueSection.OVERVIEW">
            <venue-profile :venue="venue" :planned-events="overviewEvents" />
          </template>

          <section v-else-if="activeSection === VenueSection.RULES" class="page-venue__content-box">
            <h3>Regeln</h3>
            <html-viewer v-if="venue.rules" :content="venue.rules" />
            <p v-else>Keine Regeln eingetragen.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.PREMISES" class="page-venue__content-box">
            <h3>RÃ¤umlichkeiten</h3>
            <html-viewer v-if="venue.premises" :content="venue.premises" />
            <p v-else>Keine Beschreibung der RÃ¤umlichkeiten vorhanden.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.MENU" class="page-venue__content-box">
            <h3>Speisekarte</h3>
            <html-viewer v-if="venue.menu" :content="venue.menu" />
            <p v-else>Keine Speisekarte hinterlegt.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.STAFF" class="page-venue__content-box">
            <h3>Mitarbeiter</h3>
            <div v-if="venue.staff && venue.staff.length" class="page-venue__staff-grid">
              <router-link
                v-for="member in venue.staff"
                :key="`${member.server}_${member.name}`"
                class="page-venue__staff-card"
                :to="`/${member.server}/${member.name.replace(/ /g, '_')}`"
              >
                <q-avatar round size="56px">
                  <img :src="member.avatar" :alt="member.name" />
                </q-avatar>
                <div>
                  <div class="page-venue__staff-name">{{ member.name }}</div>
                  <div class="page-venue__staff-server">{{ member.server }}</div>
                </div>
              </router-link>
            </div>
            <p v-else>Keine sichtbaren Mitarbeiter eingetragen.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.JOBS" class="page-venue__content-box">
            <div class="page-venue__section-header">
              <h3>Stellenangebote</h3>
              <q-btn
                v-if="venue.canEdit"
                flat
                color="primary"
                label="Neuen Job-Aushang erstellen"
                :to="`/create-noticeboard-item?venueId=${venue.id}&type=${NoticeboardType.STELLENANGEBOT}`"
              />
            </div>
            <noticeboard-item-list v-if="jobItems.length" :noticeboard-items="jobItems" />
            <p v-else>Keine Stellenangebote oder Stellengesuche vorhanden.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.OOC" class="page-venue__content-box">
            <h3>OOC</h3>
            <html-viewer v-if="venue.ooc" :content="venue.ooc" />
            <p v-else>Keine OOC-Informationen vorhanden.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.MEDIA" class="page-venue__content-box">
            <h3>Medien</h3>
            <thumb-gallery v-if="mediaItems.length" :images="mediaItems" />
            <p v-else>Keine verknÃ¼pften Bilder vorhanden.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.EVENTS" class="page-venue__content-box">
            <h3>Aktuelle und kommende Events</h3>
            <div v-if="upcomingEvents.length" class="page-venue__event-list">
              <div v-for="event in upcomingEvents" :key="event.id" class="page-venue__event-item">
                <router-link :to="`/event/${event.id}`">{{ event.title }}</router-link>
                <div class="page-venue__event-time">{{ formatTimeRange(event) }}</div>
              </div>
            </div>
            <p v-else>Keine aktuellen oder kommenden Events.</p>

            <h3 class="page-venue__past-events-title">Vergangene Events</h3>
            <div v-if="pastEvents.length" class="page-venue__event-list">
              <div v-for="event in pastEvents" :key="`past_${event.id}`" class="page-venue__event-item">
                <router-link :to="`/event/${event.id}`">{{ event.title }}</router-link>
                <div class="page-venue__event-time">{{ formatTimeRange(event) }}</div>
              </div>
            </div>
            <p v-else>Keine vergangenen Events gefunden.</p>
          </section>

          <section v-else-if="activeSection === VenueSection.NETWORK" class="page-venue__content-box">
            <h3>Vernetzung</h3>
            <html-viewer v-if="venue.network" :content="venue.network" />
            <p v-else>Keine Vernetzungsinformationen vorhanden.</p>
          </section>

          <template v-if="venue.canManageMembers">
            <template v-if="applicants.length > 0">
              <h3>Bewerber</h3>
              <venue-applicant-editor :venue-id="venue.id" :members="applicants" @updated="refreshEditableMembers" />
            </template>
            <h3>Mitglieder</h3>
            <venue-member-editor :venue="venue" :members="confirmedMembers" @updated="refreshEditableMembers" />
          </template>

          <report-violation-section :pageType="PageType.VENUE" :pageId="venue.id" />
        </template>
      </q-page-container>
    </q-page>
  </q-layout>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { NoticeboardItemSummaryDto } from '@app/shared/dto/noticeboard/noticeboard-item-summary.dto';
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import { PageType } from '@app/shared/enums/page-type.enum';
import { VenueSection } from '@app/shared/enums/venue-section.enum';
import { createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import HtmlViewer from 'src/components/common/HtmlViewer.vue';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import NoticeboardItemList from 'src/components/noticeboard/NoticeboardItemList.vue';
import VenueApplicantEditor from 'src/components/venues/VenueApplicantEditor.vue';
import VenueMemberEditor from 'src/components/venues/VenueMemberEditor.vue';
import VenueProfile from 'components/venues/VenueProfile.vue';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';

const $api = useApi();
const $router = useRouter();
const $store = useStore();

const JOB_TYPES = [NoticeboardType.STELLENANGEBOT, NoticeboardType.STELLENGESUCH];

const SECTION_LABELS: Record<VenueSection, string> = {
  [VenueSection.OVERVIEW]: 'Ãœbersicht',
  [VenueSection.RULES]: 'Regeln',
  [VenueSection.PREMISES]: 'RÃ¤umlichkeiten',
  [VenueSection.MENU]: 'Speisekarte',
  [VenueSection.STAFF]: 'Mitarbeiter',
  [VenueSection.JOBS]: 'Stellenangebote',
  [VenueSection.OOC]: 'OOC',
  [VenueSection.MEDIA]: 'Medien',
  [VenueSection.EVENTS]: 'Events',
  [VenueSection.NETWORK]: 'Vernetzung',
};

const SECTION_ICONS: Record<VenueSection, string> = {
  [VenueSection.OVERVIEW]: 'home',
  [VenueSection.RULES]: 'gavel',
  [VenueSection.PREMISES]: 'meeting_room',
  [VenueSection.MENU]: 'restaurant_menu',
  [VenueSection.STAFF]: 'badge',
  [VenueSection.JOBS]: 'work',
  [VenueSection.OOC]: 'forum',
  [VenueSection.MEDIA]: 'collections',
  [VenueSection.EVENTS]: 'event',
  [VenueSection.NETWORK]: 'hub',
};

interface SectionEntry {
  id: VenueSection;
  label: string;
  icon: string;
}

interface PageData {
  venue: VenueDto;
  activeSection: VenueSection;
  upcomingEvents: EventSummaryDto[];
  pastEvents: EventSummaryDto[];
  jobs: NoticeboardItemSummaryDto[];
  media: ImageSummaryDto[];
}

function parseSection(rawSection?: string): VenueSection {
  if (rawSection && Object.values(VenueSection).includes(rawSection as VenueSection)) {
    return rawSection as VenueSection;
  }

  return VenueSection.OVERVIEW;
}

async function load(params: RouteParams): Promise<PageData> {
  const id = parseInt(params.id as string, 10);
  const name = params.name as string;
  const server = params.server as string;
  const section = parseSection(params.section as string | undefined);
  const characterId = $store.getters.characterId || undefined;

  if (!id && !name) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const venue = id
      ? await $api.venues.getVenue(id, characterId)
      : await $api.venues.getVenueByName(name.replace(/_/g, ' '), server, characterId);

    const shouldLoadEvents = venue.showEvents || section === VenueSection.OVERVIEW;
    const shouldLoadJobs = venue.showJobs || section === VenueSection.JOBS;
    const shouldLoadMedia = venue.showMedia || section === VenueSection.MEDIA;

    const [upcomingEvents, pastEvents, noticeboardItems, mediaResult] = await Promise.all([
      shouldLoadEvents && venue.id ? $api.events.getEventsForVenue(venue.id, 'upcoming') : Promise.resolve([]),
      shouldLoadEvents && venue.id ? $api.events.getEventsForVenue(venue.id, 'past') : Promise.resolve([]),
      shouldLoadJobs && venue.id ? $api.noticeboard.getNoticeboardItems({ venueId: venue.id }) : Promise.resolve([]),
      shouldLoadMedia && venue.id ? $api.images.getImages({ venueId: venue.id, limit: 24, offset: 0 }) : Promise.resolve({ total: 0, data: [] }),
    ]);

    return {
      venue,
      activeSection: section,
      upcomingEvents,
      pastEvents,
      jobs: noticeboardItems.filter((item) => JOB_TYPES.includes(item.type)),
      media: mediaResult.data,
    };
  } catch (e) {
    notifyError(e);
    throw e;
  }
}

@Options({
  components: {
    VenueProfile,
    VenueApplicantEditor,
    VenueMemberEditor,
    ReportViolationSection,
    HtmlViewer,
    NoticeboardItemList,
    ThumbGallery,
  },
  async beforeRouteEnter(to, _, next) {
    const content = await load(to.params);
    next((vm) => (vm as PageVenue).setContent(content));
  },
  async beforeRouteUpdate(to) {
    await (this as PageVenue).loadForRoute(to.params);
  },
  mixins: [
    createMetaMixin(function (this: PageVenue) {
      const sectionLabel = SECTION_LABELS[this.activeSection] || SECTION_LABELS[VenueSection.OVERVIEW];
      const result: MetaOptions = {
        title: `${this.venue.name} - ${sectionLabel} - Elpisgarten`,
        meta: {
          description: {
            name: 'description',
            content: this.metaDescription,
          },
          ogTitle: {
            property: 'og:title',
            content: `${this.venue.name} - ${sectionLabel}`,
          },
          ogDescription: {
            property: 'og:description',
            content: this.metaDescription,
          },
        },
      };

      if (this.venue.banner) {
        Object.assign(result.meta, {
          ogImage: {
            property: 'og:image',
            content: this.venue.banner.url,
          },
          twitterCard: {
            property: 'twitter:card',
            content: 'summary_large_image',
          },
        });
      }

      return result;
    }),
  ],
})
export default class PageVenue extends Vue {
  readonly PageType = PageType;
  readonly MembershipStatus = MembershipStatus;
  readonly VenueSection = VenueSection;
  readonly NoticeboardType = NoticeboardType;

  drawer = false;
  miniState = true;

  venue: VenueDto = new VenueDto();
  activeSection: VenueSection = VenueSection.OVERVIEW;
  upcomingEvents: EventSummaryDto[] = [];
  pastEvents: EventSummaryDto[] = [];
  jobItems: NoticeboardItemSummaryDto[] = [];
  mediaItems: ImageSummaryDto[] = [];
  applicants: VenueMemberDto[] = [];
  confirmedMembers: VenueMemberDto[] = [];
  private loadRequestId = 0;

  setContent(content: PageData) {
    this.venue = content.venue;
    this.activeSection = this.getVisibleSection(content.activeSection);
    this.upcomingEvents = content.upcomingEvents || [];
    this.pastEvents = content.pastEvents || [];
    this.jobItems = content.jobs || [];
    this.mediaItems = content.media || [];
    this.applicants = [];
    this.confirmedMembers = [];

    if (this.venue.canManageMembers) {
      void this.refreshEditableMembers();
    }

    if (content.activeSection !== this.activeSection) {
      void this.$router.replace(this.sectionPath(this.activeSection));
    }
  }

  async loadForRoute(params: RouteParams) {
    const requestId = ++this.loadRequestId;
    const content = await load(params);

    // Ignore stale responses when users switch sections quickly.
    if (requestId !== this.loadRequestId) {
      return;
    }

    this.setContent(content);
  }

  get visibleSections(): SectionEntry[] {
    const sections: SectionEntry[] = [{ id: VenueSection.OVERVIEW, label: SECTION_LABELS[VenueSection.OVERVIEW], icon: SECTION_ICONS[VenueSection.OVERVIEW] }];

    if (this.venue.showRules) {
      sections.push({ id: VenueSection.RULES, label: SECTION_LABELS[VenueSection.RULES], icon: SECTION_ICONS[VenueSection.RULES] });
    }
    if (this.venue.showPremises) {
      sections.push({ id: VenueSection.PREMISES, label: SECTION_LABELS[VenueSection.PREMISES], icon: SECTION_ICONS[VenueSection.PREMISES] });
    }
    if (this.venue.showMenu) {
      sections.push({ id: VenueSection.MENU, label: SECTION_LABELS[VenueSection.MENU], icon: SECTION_ICONS[VenueSection.MENU] });
    }
    if (this.venue.showStaff) {
      sections.push({ id: VenueSection.STAFF, label: SECTION_LABELS[VenueSection.STAFF], icon: SECTION_ICONS[VenueSection.STAFF] });
    }
    if (this.venue.showJobs) {
      sections.push({ id: VenueSection.JOBS, label: SECTION_LABELS[VenueSection.JOBS], icon: SECTION_ICONS[VenueSection.JOBS] });
    }
    if (this.venue.showOoc) {
      sections.push({ id: VenueSection.OOC, label: SECTION_LABELS[VenueSection.OOC], icon: SECTION_ICONS[VenueSection.OOC] });
    }
    if (this.venue.showMedia) {
      sections.push({ id: VenueSection.MEDIA, label: SECTION_LABELS[VenueSection.MEDIA], icon: SECTION_ICONS[VenueSection.MEDIA] });
    }
    if (this.venue.showEvents) {
      sections.push({ id: VenueSection.EVENTS, label: SECTION_LABELS[VenueSection.EVENTS], icon: SECTION_ICONS[VenueSection.EVENTS] });
    }
    if (this.venue.showNetwork) {
      sections.push({ id: VenueSection.NETWORK, label: SECTION_LABELS[VenueSection.NETWORK], icon: SECTION_ICONS[VenueSection.NETWORK] });
    }

    return sections;
  }

  get overviewEvents() {
    return this.venue.showEvents ? this.upcomingEvents.slice(0, 5) : [];
  }

  get hasSectionMenu() {
    return this.visibleSections.length > 1;
  }

  get metaDescription(): string {
    switch (this.activeSection) {
      case VenueSection.RULES:
        return `Regeln von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.PREMISES:
        return `RÃ¤umlichkeiten von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.MENU:
        return `Speisekarte von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.STAFF:
        return `Mitarbeiter von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.JOBS:
        return `Stellenangebote und Stellengesuche von ${this.venue.name}.`;
      case VenueSection.OOC:
        return `OOC-Informationen zu ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.MEDIA:
        return `VerknÃ¼pfte Medien von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.EVENTS:
        return `Aktuelle und vergangene Events von ${this.venue.name}.`;
      case VenueSection.NETWORK:
        return `Vernetzung und verbundene Geschichten von ${this.venue.name}.`;
      default:
        return this.venue.purpose || `Treffpunktprofil von ${this.venue.name} auf ${this.venue.server}.`;
    }
  }

  sectionPath(section: VenueSection): string {
    const name = this.venue.name.replace(/ /g, '_');
    const base = `/venue/${this.venue.server}/${name}`;

    if (section === VenueSection.OVERVIEW) {
      return base;
    }

    return `${base}/${section}`;
  }

  onSectionClick(section: VenueSection) {
    this.activeSection = section;
  }

  private getVisibleSection(section: VenueSection): VenueSection {
    const isVisible = this.visibleSections.some((entry) => entry.id === section);
    return isVisible ? section : VenueSection.OVERVIEW;
  }

  async refreshEditableMembers() {
    const allMembers = await this.$api.venues.getMembers(this.venue.id);
    this.applicants = allMembers.filter((member) => member.status === MembershipStatus.APPLIED);
    this.confirmedMembers = allMembers.filter((member) => member.status === MembershipStatus.CONFIRMED);
  }

  formatTimeRange(event: EventSummaryDto): string {
    const start = this.$display.formatDateTimeServer(event.startDateTime);
    if (event.endDateTime) {
      const end = this.$display.formatDateTimeServer(event.endDateTime);
      return `${start} - ${end}`;
    }
    return start;
  }

  onDeleteClick() {
    this.$q
      .dialog({
        title: 'LÃ¶schbestÃ¤tigung',
        message: `MÃ¶chtest du "${this.venue.name}" wirklich lÃ¶schen?`,
        ok: {
          label: 'LÃ¶schen',
          color: 'negative',
          flat: true,
        },
        cancel: 'Abbrechen',
      })
      .onOk(async () => {
        try {
          await this.$api.venues.deleteVenue(this.venue.id);

          notifySuccess('Treffpunkt gelÃ¶scht.');
          void this.$router.replace('/');
        } catch (e) {
          notifyError(e);
        }
      });
  }

  onJoinClick() {
    const character = this.$store.getters.character;

    if (!character) {
      return;
    }

    this.$q
      .dialog({
        title: 'Mitgliedschaftsantrag',
        message: `MÃ¶chtest du dich bei "${this.venue.name}" als ${character.name} bewerben?`,
        ok: {
          label: 'Bewerben',
          color: 'primary',
          flat: true,
        },
        cancel: {
          label: 'Abbrechen',
          color: 'secondary',
          flat: true,
        },
      })
      .onOk(async () => {
        try {
          await this.$api.venues.applyForMembership(this.venue.id, character.id);
          this.venue.membershipStatus = MembershipStatus.APPLIED;
          notifySuccess('Du hast dich beworben.');
        } catch (e) {
          notifyError(e);
        }
      });
  }
}
</script>

<style lang="scss">
.page-venue-layout {
  --venue-edit-bg: #9f848d;
  --venue-edit-bg-hover: #615056;
  --venue-edit-color: #1b1b1b;
  --venue-edit-color-hover: #000000;
  --venue-box-border: rgba(221, 180, 118, 0.25);
  --venue-box-bg: rgba(255, 255, 255, 0.92);
  --venue-box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  --venue-muted: rgba(35, 35, 35, 0.72);
}

body.body--dark .page-venue-layout {
  --venue-edit-bg: rgba(141, 181, 223, 0.22);
  --venue-edit-bg-hover: rgba(141, 181, 223, 0.34);
  --venue-edit-color: rgba(226, 237, 248, 0.95);
  --venue-edit-color-hover: #f2f7ff;
  --venue-box-border: rgba(141, 181, 223, 0.32);
  --venue-box-bg: rgba(17, 24, 34, 0.92);
  --venue-box-shadow: 0 18px 36px rgba(0, 0, 0, 0.34);
  --venue-muted: rgba(213, 226, 240, 0.74);
}

.page-venue-layout__edit-item {
  margin-top: 12px;
  background: var(--venue-edit-bg);
  color: var(--venue-edit-color);
}

.page-venue-layout__edit-item:hover {
  background: var(--venue-edit-bg-hover);
  color: var(--venue-edit-color-hover);
}

.page-venue-layout__delete-item {
  margin-top: 8px;
  background: rgba(190, 40, 40, 0.14);
  color: #7a1d1d;
}

.page-venue-layout__delete-item:hover {
  background: rgba(190, 40, 40, 0.22);
  color: #611313;
}

body.body--dark .page-venue-layout__delete-item {
  background: rgba(233, 93, 93, 0.18);
  color: rgba(255, 213, 213, 0.96);
}

body.body--dark .page-venue-layout__delete-item:hover {
  background: rgba(233, 93, 93, 0.28);
  color: #ffffff;
}

.page-venue__join-button-bar {
  text-align: center;
  margin-bottom: 8px;
}

.page-venue__membership-status {
  margin: 10px 0 14px;
  padding: 12px 14px;
  border: 1px solid var(--venue-box-border);
  background: var(--venue-box-bg);
  box-shadow: var(--venue-box-shadow);
  color: var(--venue-muted);
}

.page-venue__content-box {
  margin: 14px 0 22px;
  padding: 16px;
  border: 1px solid var(--venue-box-border);
  background: var(--venue-box-bg);
  box-shadow: var(--venue-box-shadow);
}

.page-venue__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.page-venue__staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.page-venue__staff-card {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--venue-box-border);
  background: var(--venue-box-bg);
  box-shadow: var(--venue-box-shadow);
  padding: 12px;
  text-decoration: none;
  color: inherit;
}

.page-venue__staff-name {
  font-weight: 700;
}

.page-venue__staff-server {
  font-size: 0.85rem;
  color: var(--venue-muted);
}

.page-venue__event-list {
  display: grid;
  gap: 10px;
}

.page-venue__event-item {
  border: 1px solid var(--venue-box-border);
  background: var(--venue-box-bg);
  box-shadow: var(--venue-box-shadow);
  padding: 10px 12px;
}

.page-venue__event-time {
  font-size: 0.85rem;
  color: var(--venue-muted);
}

.page-venue__past-events-title {
  margin-top: 18px;
}

@media screen and (max-width: $breakpoint-sm) {
  .page-venue__section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-venue__staff-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-venue-layout__menu .q-item,
  .page-venue-layout__edit-item,
  .page-venue-layout__delete-item {
    transition: none;
  }
}
</style>



