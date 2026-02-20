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
        Du hast eine Anfrage fuer eine Mitgliedschaft bei diesem Treffpunkt gesendet. Eine Fuehrungsperson muss
        deine Bewerbung ueberpruefen.
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

      <venue-profile :venue="venue" :planned-events="plannedEvents" />

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
import { VenueMemberDto } from '@app/shared/dto/venues/venue-member.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { PageType } from '@app/shared/enums/page-type.enum';
import { createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
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

async function load(params: RouteParams): Promise<{ venue: VenueDto; events: EventSummaryDto[] }> {
  const id = parseInt(params.id as string, 10);
  const name = params.name as string;
  const server = params.server as string;
  const characterId = $store.getters.characterId || undefined;

  if (!id && !name) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const venue = id
      ? await $api.venues.getVenue(id, characterId)
      : await $api.venues.getVenueByName(name.replace(/_/g, ' '), server, characterId);
    const events = venue.id ? await $api.events.getEventsForVenue(venue.id) : [];
    return { venue, events };
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
      const result: MetaOptions = {
        title: `${this.venue.name} - Elpisgarten`,
        meta: {},
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

  venue: VenueDto = new VenueDto();
  plannedEvents: EventSummaryDto[] = [];
  applicants: VenueMemberDto[] = [];
  confirmedMembers: VenueMemberDto[] = [];

  setContent(content: { venue: VenueDto; events: EventSummaryDto[] }) {
    this.venue = content.venue;
    this.plannedEvents = content.events || [];
    this.applicants = [];
    this.confirmedMembers = [];

    if (this.venue.canManageMembers) {
      void this.refreshEditableMembers();
    }
  }

  async refreshEditableMembers() {
    const allMembers = await this.$api.venues.getMembers(this.venue.id);
    this.applicants = allMembers.filter((member) => member.status === MembershipStatus.APPLIED);
    this.confirmedMembers = allMembers.filter((member) => member.status === MembershipStatus.CONFIRMED);
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
</style>
