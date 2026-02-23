<template>
  <q-page class="page-venue">
    <template v-if="venue.id">
      <section v-if="!$store.getters.characterId"><!-- Not logged in --></section>
      <section v-else-if="venue.canEdit" class="edit-bar">
        <q-btn flat color="secondary" label="Treffpunkt bearbeiten" :to="`/edit-venue/${venue.id}`" />
        <q-btn v-if="venue.mine" flat color="negative" label="Treffpunkt loeschen" @click="onDeleteClick" />
      </section>
      <section v-else-if="!venue.membershipStatus" class="page-venue__join-button-bar">
        <q-btn outline color="primary" label="Treffpunkt beitreten" @click="onJoinClick" />
      </section>
      <section
        v-else-if="venue.membershipStatus === MembershipStatus.APPLIED"
        class="page-venue__edit-bar page-venue__membership-status"
      >
        Du hast eine Anfrage fuer eine Mitgliedschaft bei diesem Treffpunkt gesendet.
      </section>
      <section
        v-else-if="venue.membershipStatus === MembershipStatus.REJECTED"
        class="page-venue__edit-bar page-venue__membership-status"
      >
        Deine Mitgliedschaftsanfrage wurde abgelehnt.
      </section>
      <section
        v-else-if="venue.membershipStatus === MembershipStatus.CONFIRMED"
        class="page-venue__edit-bar page-venue__membership-status"
      >
        Du bist ein Mitglied dieses Treffpunkts.
      </section>

      <section class="page-venue__section-nav">
        <q-btn
          v-for="section in visibleSections"
          :key="section.id"
          dense
          flat
          :color="activeSection === section.id ? 'primary' : 'secondary'"
          :label="section.label"
          :to="sectionPath(section.id)"
        />
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
        <h3>Raeumlichkeiten</h3>
        <html-viewer v-if="venue.premises" :content="venue.premises" />
        <p v-else>Keine Beschreibung der Raeumlichkeiten vorhanden.</p>
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
        <p v-else>Keine verknuepften Bilder vorhanden.</p>
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
  </q-page>
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
  [VenueSection.OVERVIEW]: 'Uebersicht',
  [VenueSection.RULES]: 'Regeln',
  [VenueSection.PREMISES]: 'Raeumlichkeiten',
  [VenueSection.MENU]: 'Speisekarte',
  [VenueSection.STAFF]: 'Mitarbeiter',
  [VenueSection.JOBS]: 'Stellenangebote',
  [VenueSection.OOC]: 'OOC',
  [VenueSection.MEDIA]: 'Medien',
  [VenueSection.EVENTS]: 'Events',
  [VenueSection.NETWORK]: 'Vernetzung',
};

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
    const content = await load(to.params);
    (this as PageVenue).setContent(content);
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

  venue: VenueDto = new VenueDto();
  activeSection: VenueSection = VenueSection.OVERVIEW;
  upcomingEvents: EventSummaryDto[] = [];
  pastEvents: EventSummaryDto[] = [];
  jobItems: NoticeboardItemSummaryDto[] = [];
  mediaItems: ImageSummaryDto[] = [];
  applicants: VenueMemberDto[] = [];
  confirmedMembers: VenueMemberDto[] = [];

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

    const requestedSection = parseSection(this.$route.params.section as string | undefined);
    if (requestedSection !== this.activeSection) {
      void this.$router.replace(this.sectionPath(this.activeSection));
    }
  }

  get visibleSections() {
    const sections: { id: VenueSection; label: string }[] = [{ id: VenueSection.OVERVIEW, label: SECTION_LABELS[VenueSection.OVERVIEW] }];

    if (this.venue.showRules) {
      sections.push({ id: VenueSection.RULES, label: SECTION_LABELS[VenueSection.RULES] });
    }
    if (this.venue.showPremises) {
      sections.push({ id: VenueSection.PREMISES, label: SECTION_LABELS[VenueSection.PREMISES] });
    }
    if (this.venue.showMenu) {
      sections.push({ id: VenueSection.MENU, label: SECTION_LABELS[VenueSection.MENU] });
    }
    if (this.venue.showStaff) {
      sections.push({ id: VenueSection.STAFF, label: SECTION_LABELS[VenueSection.STAFF] });
    }
    if (this.venue.showJobs) {
      sections.push({ id: VenueSection.JOBS, label: SECTION_LABELS[VenueSection.JOBS] });
    }
    if (this.venue.showOoc) {
      sections.push({ id: VenueSection.OOC, label: SECTION_LABELS[VenueSection.OOC] });
    }
    if (this.venue.showMedia) {
      sections.push({ id: VenueSection.MEDIA, label: SECTION_LABELS[VenueSection.MEDIA] });
    }
    if (this.venue.showEvents) {
      sections.push({ id: VenueSection.EVENTS, label: SECTION_LABELS[VenueSection.EVENTS] });
    }
    if (this.venue.showNetwork) {
      sections.push({ id: VenueSection.NETWORK, label: SECTION_LABELS[VenueSection.NETWORK] });
    }

    return sections;
  }

  get overviewEvents() {
    return this.venue.showEvents ? this.upcomingEvents.slice(0, 5) : [];
  }

  get metaDescription(): string {
    switch (this.activeSection) {
      case VenueSection.RULES:
        return `Regeln von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.PREMISES:
        return `Raeumlichkeiten von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.MENU:
        return `Speisekarte von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.STAFF:
        return `Mitarbeiter von ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.JOBS:
        return `Stellenangebote und Stellengesuche von ${this.venue.name}.`;
      case VenueSection.OOC:
        return `OOC-Informationen zu ${this.venue.name} auf ${this.venue.server}.`;
      case VenueSection.MEDIA:
        return `Verknuepfte Medien von ${this.venue.name} auf ${this.venue.server}.`;
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
        title: 'Loeschbestaetigung',
        message: `Moechtest du "${this.venue.name}" wirklich loeschen?`,
        ok: {
          label: 'Loeschen',
          color: 'negative',
          flat: true,
        },
        cancel: 'Abbrechen',
      })
      .onOk(async () => {
        try {
          await this.$api.venues.deleteVenue(this.venue.id);

          notifySuccess('Treffpunkt geloescht.');
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
        message: `Moechtest du dich bei "${this.venue.name}" als ${character.name} bewerben?`,
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
.page-venue__edit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-venue__join-button-bar {
  text-align: center;
  margin-bottom: 8px;
}

.page-venue__section-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0 22px;
}

.page-venue__content-box {
  margin: 22px 0;
  padding: 16px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
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
  border: 1px solid rgba(221, 180, 118, 0.28);
  padding: 12px;
  text-decoration: none;
  color: inherit;
}

.page-venue__staff-name {
  font-weight: 700;
}

.page-venue__staff-server {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.7);
}

.page-venue__event-list {
  display: grid;
  gap: 10px;
}

.page-venue__event-item {
  border: 1px solid rgba(221, 180, 118, 0.2);
  padding: 10px 12px;
}

.page-venue__event-time {
  font-size: 0.85rem;
  color: rgba(35, 35, 35, 0.68);
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
</style>
