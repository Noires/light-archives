<template>
  <q-page class="community-detail">
    <template v-if="community.id">
      <group-plate
        ref="plate"
        :name="community.name"
        :banner-url="community.banner ? community.banner.url : ''"
        placeholder-icon="groups"
        :eyebrow-parts="eyebrowParts"
        :chips="chips"
        :crumbs="crumbs"
      >
        <template #actions>
          <q-btn
            v-if="community.canEdit"
            class="elpis-btn group-plate__btn-media"
            flat
            no-caps
            icon="edit"
            label="Bearbeiten"
            :to="`/edit-community/${community.id}`"
          />
        </template>
        <template #primary>
          <q-btn
            v-if="canJoin"
            class="elpis-btn elpis-btn--primary"
            unelevated
            no-caps
            icon="how_to_reg"
            label="Beitreten"
            @click="onJoinClick"
          />
        </template>
      </group-plate>

      <section-tabs
        v-model="tab"
        class="community-detail__tabs"
        glass
        sync="query"
        aria-label="Bereiche der Community"
        :tabs="tabs"
      />

      <div class="community-detail__body">
        <section
          v-if="community.membershipStatus === MembershipStatus.APPLIED"
          class="elpis-membership-banner elpis-membership-banner--applied"
        >
          <span>Du hast eine Mitgliedschaft angefragt. Eine Führungsperson muss deine Bewerbung prüfen, bevor du beitreten kannst.</span>
        </section>
        <section
          v-else-if="community.membershipStatus === MembershipStatus.REJECTED"
          class="elpis-membership-banner elpis-membership-banner--rejected"
        >
          <span>Deine Mitgliedschaftsanfrage wurde abgelehnt.</span>
        </section>

        <div v-if="tab === 'uebersicht'" class="community-detail__overview">
          <div class="community-detail__main">
            <section v-if="community.description" aria-labelledby="community-about">
              <h2 id="community-about" class="community-detail__heading">Über uns</h2>
              <div class="community-detail__about mat-parchment">
                <html-viewer :content="community.description" />
              </div>
            </section>
            <!-- ER2 round 2: "Was wir spielen" -->
            <focus-items :items="community.focusItems" />
            <iframe
              v-if="community.carrdProfile"
              v-iframe-resize
              class="community-detail__carrd"
              :src="carrdLink"
              :title="`Carrd-Seite von ${community.name}`"
              width="100%"
              height="500px"
            ></iframe>
            <empty-state
              v-if="!community.description && !community.carrdProfile && !(community.focusItems && community.focusItems.length)"
              :variant="community.canEdit ? 'owner' : 'visitor'"
              icon="groups"
              title="Noch keine Beschreibung"
              :text="community.canEdit ? 'Erzähl, wer ihr seid und was euch verbindet.' : 'Diese Community hat sich noch nicht vorgestellt.'"
              :action-label="community.canEdit ? 'Beschreibung schreiben' : ''"
              :action-to="community.canEdit ? `/edit-community/${community.id}` : null"
            />
          </div>

          <aside class="community-detail__rail" aria-label="Eckdaten">
            <section v-if="community.recruiting" class="community-detail__card community-detail__card--seek" aria-labelledby="community-seek">
              <h2 id="community-seek" class="community-detail__card-title">Wir suchen</h2>
              <p class="community-detail__card-text">
                {{ community.name }} nimmt neue Mitglieder auf.
                <template v-if="community.recruitingOfficers"> Ansprechpartner: {{ community.recruitingOfficers }}.</template>
              </p>
              <q-btn
                v-if="canJoin"
                class="elpis-btn elpis-btn--primary"
                unelevated
                no-caps
                label="Beitreten"
                @click="onJoinClick"
              />
            </section>

            <group-facts :items="facts" :tags="community.tags || []" />

            <section v-if="members.length > 0" class="community-detail__card" aria-labelledby="community-members-preview">
              <h2 id="community-members-preview" class="community-detail__card-title">Mitglieder</h2>
              <avatar-stack :avatars="memberAvatars" :max="6" :label="memberLabel" />
              <q-btn
                class="elpis-btn elpis-btn--ghost"
                flat
                no-caps
                dense
                label="Alle ansehen"
                @click="tab = 'mitglieder'"
              />
            </section>

            <q-btn
              v-if="community.canEdit"
              class="elpis-btn elpis-btn--danger community-detail__delete"
              unelevated
              no-caps
              icon="delete"
              label="Community löschen"
              @click="onDeleteClick"
            />
          </aside>
        </div>

        <div v-else-if="tab === 'mitglieder'" class="community-detail__members">
          <template v-if="community.canManageMembers">
            <section v-if="applicants.length > 0" class="community-detail__manage" aria-labelledby="community-applicants">
              <h2 id="community-applicants" class="community-detail__heading">Bewerbungen</h2>
              <community-applicant-editor
                :community-id="community.id"
                :members="applicants"
                @updated="refreshEditableMembers"
              />
            </section>
            <section class="community-detail__manage" aria-labelledby="community-manage-members">
              <h2 id="community-manage-members" class="community-detail__heading">Mitglieder verwalten</h2>
              <community-member-editor
                :community="community"
                :members="confirmedMembers"
                @updated="refreshEditableMembers"
              />
            </section>
          </template>
          <template v-else>
            <h2 class="community-detail__heading">{{ memberLabel }}</h2>
            <ul v-if="members.length > 0" class="community-detail__member-grid">
              <li v-for="profile in members" :key="`${profile.name}_${profile.server}`">
                <member-card
                  :to="getLink(profile)"
                  :avatar-src="profile.avatar"
                  :name="profile.name"
                  :meta="`${$display.races[profile.race]} · ${profile.server}`"
                  :subtitle="profession(profile)"
                  :rank="profile.communityRole ? '' : rank(profile)"
                  :role="profile.communityRole || null"
                  :rp-status="rpStatus(profile)"
                />
              </li>
            </ul>
            <empty-state
              v-else
              icon="group"
              title="Noch keine Mitglieder"
              text="Wer beitritt und bestätigt wird, erscheint hier."
              :action-label="canJoin ? 'Beitreten' : ''"
              @action="onJoinClick"
            />
          </template>
        </div>

        <group-member-content
          v-else-if="tab === 'galerie' || tab === 'geschichten'"
          :kind="tab"
          :member-ids="memberIds"
          :group-name="community.name"
        />

        <report-violation-section :pageType="PageType.COMMUNITY" :pageId="community.id" hide-copy-link />
      </div>
    </template>
  </q-page>
</template>

<script lang="ts">
import { CommunityDto } from '@app/shared/dto/communities/community.dto';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { notifyError, notifySuccess } from 'src/common/notify';
import { useRouter } from 'src/router';
import { MetaOptions } from 'quasar/dist/types/meta';
import { createMetaMixin } from 'quasar';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { useStore } from 'src/store';
import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import { CommunityMemberDto } from '@app/shared/dto/communities/community-member.dto';
import { isEmptyFieldValue } from 'components/character/empty-field';
import { keepTabsInView } from 'components/character/keep-tabs-in-view';
import { stripWikilinks } from 'components/character/profile-sections';
import { activeRpStatus } from 'components/character/rp-status';
import FocusItems from 'components/communities/FocusItems.vue';
import GroupFacts from 'components/communities/GroupFacts.vue';
import GroupMemberContent from 'components/communities/GroupMemberContent.vue';
import GroupPlate from 'components/communities/GroupPlate.vue';
import type { GroupFact, GroupPlateChip } from 'components/communities/group-plate';
import AvatarStack from 'components/vision/AvatarStack.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import MemberCard from 'components/vision/MemberCard.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { AvatarItem, BreadcrumbItem, SectionTab } from 'components/vision/types';
import CommunityApplicantEditor from 'src/components/communities/CommunityApplicantEditor.vue';
import CommunityMemberEditor from 'src/components/communities/CommunityMemberEditor.vue';
import { PageType } from '@app/shared/enums/page-type.enum';
import HtmlViewer from 'src/components/common/HtmlViewer.vue';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';

const $api = useApi();
const $store = useStore();
const $router = useRouter();

async function load(
  params: RouteParams
): Promise<{ community: CommunityDto; members: PagingResultDto<CharacterSummaryDto> }> {
  const name = params.name as string;

  if (!name) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const characterId = $store.getters.characterId!;
    const community = await $api.communities.getCommunityByName(name.replace(/_/g, ' '), characterId);
    const members = await $api.characters.getCharacterProfiles({ communityId: community.id, limit: 99999 });
    return { community, members };
  } catch (e) {
    notifyError(e);
    void $router.replace('/');
    throw e;
  }
}

@Options({
  components: {
    AvatarStack,
    CommunityApplicantEditor,
    CommunityMemberEditor,
    EmptyState,
    FocusItems,
    GroupFacts,
    GroupMemberContent,
    GroupPlate,
    HtmlViewer,
    MemberCard,
    ReportViolationSection,
    SectionTabs,
  },
  async beforeRouteEnter(to, _, next) {
    const { community, members } = await load(to.params);
    next((vm) => (vm as PageCommunity).setContent(community, members));
  },
  async beforeRouteUpdate(to, from) {
    const vm = this as PageCommunity;
    // Tab changes only touch the query.
    if (to.path === from.path && vm.community.id) {
      keepTabsInView((vm.$refs.plate as Vue | undefined)?.$el as HTMLElement | undefined);
      return;
    }
    const { community, members } = await load(to.params);
    vm.setContent(community, members);
  },
  mixins: [
    createMetaMixin(function (this: PageCommunity) {
      const result: MetaOptions = {
        title: `${this.community.name} — Elpisgarten`,
        meta: {},
      };

      if (this.community.banner) {
        Object.assign(result.meta, {
          ogImage: {
            property: 'og:image',
            content: this.community.banner.url,
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
export default class PageCommunity extends Vue {
  readonly PageType = PageType;
  readonly MembershipStatus = MembershipStatus;

  tab = 'uebersicht';
  community: CommunityDto = new CommunityDto();
  members: CharacterSummaryDto[] = [];
  applicants: CommunityMemberDto[] = [];
  confirmedMembers: CommunityMemberDto[] = [];

  setContent(community: CommunityDto, members: PagingResultDto<CharacterSummaryDto>) {
    this.community = community;
    this.members = members.data;

    if (community.canManageMembers) {
      void this.refreshEditableMembers();
    }
  }

  get canJoin(): boolean {
    return !!this.$store.getters.characterId && !this.community.membershipStatus;
  }

  get tabs(): SectionTab[] {
    return [
      { key: 'uebersicht', label: 'Übersicht', icon: 'groups' },
      { key: 'mitglieder', label: 'Mitglieder', icon: 'group', count: this.members.length },
      // ER2 round 2: only when the member list carries character ids (newer API)
      { key: 'galerie', label: 'Galerie', icon: 'photo_library', hidden: this.memberIds.length === 0 },
      { key: 'geschichten', label: 'Geschichten', icon: 'auto_stories', hidden: this.memberIds.length === 0 },
    ];
  }

  get memberIds(): number[] {
    return this.members.map((member) => member.id).filter((id): id is number => typeof id === 'number');
  }

  get crumbs(): BreadcrumbItem[] {
    return [
      { label: 'Communities', to: '/communities' },
      { label: this.community.name },
    ];
  }

  get eyebrowParts(): string[] {
    return [
      'Community',
      this.community.foundedAt ? `gegründet ${this.$display.formatDate(this.community.foundedAt)}` : '',
    ].filter((part) => !!part);
  }

  get chips(): GroupPlateChip[] {
    const chips: GroupPlateChip[] = [];
    if (this.community.recruiting) {
      chips.push({ label: 'Nimmt Mitglieder auf', live: true });
    }
    if (this.members.length > 0) {
      chips.push({ label: this.memberLabel, icon: 'group' });
    }
    switch (this.community.membershipStatus) {
      case MembershipStatus.CONFIRMED:
        chips.push({ label: 'Du bist Mitglied', icon: 'verified' });
        break;
      case MembershipStatus.APPLIED:
        chips.push({ label: 'Bewerbung gesendet', icon: 'hourglass_empty' });
        break;
    }
    return chips;
  }

  get memberLabel(): string {
    return `${this.members.length} ${this.members.length === 1 ? 'Mitglied' : 'Mitglieder'}`;
  }

  get memberAvatars(): AvatarItem[] {
    return this.members.map((member) => ({ src: member.avatar, alt: member.name }));
  }

  get facts(): GroupFact[] {
    const c = this.community;
    const owner = c.owner ? `${c.owner}${c.ownerServer ? ` (${c.ownerServer})` : ''}` : '';
    return [
      { label: 'Gegründet von', value: owner },
      { label: 'Gründung', value: c.foundedAt ? this.$display.formatDate(c.foundedAt) : '' },
      { label: 'Ziel', value: c.goal },
      { label: 'Status', value: c.status },
      { label: 'Rekrutierer', value: c.recruitingOfficers },
      { label: 'Webseite', value: c.website, href: this.safeUrl(c.website) },
      { label: 'Discord', value: c.discord, href: this.safeUrl(c.discord) },
    ];
  }

  get carrdLink(): string {
    return `${this.$api.prefix}carrd/character/preview/${this.community.carrdProfile}`;
  }

  safeUrl(value?: string | null): string {
    return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : '';
  }

  async refreshEditableMembers() {
    const allMembers = await this.$api.communities.getMembers(this.community.id);
    this.applicants = allMembers.filter((member) => member.status === MembershipStatus.APPLIED);
    this.confirmedMembers = allMembers.filter((member) => member.status === MembershipStatus.CONFIRMED);
  }

  getLink(profile: CharacterSummaryDto): string {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
  }

  profession(profile: CharacterSummaryDto): string {
    return profile.profession && !isEmptyFieldValue(profile.profession) ? stripWikilinks(profile.profession) : '';
  }

  /** Only the founder is known without the management endpoint. */
  rank(profile: CharacterSummaryDto): string {
    const c = this.community;
    return c.owner && profile.name === c.owner && (!c.ownerServer || profile.server === c.ownerServer) ? 'Gründer:in' : '';
  }

  rpStatus(profile: CharacterSummaryDto): RpStatus | null {
    return activeRpStatus(profile);
  }

  onDeleteClick() {
    this.$q
      .dialog({
        title: 'Löschbestätigung',
        message: `Möchtest du “${this.community.name}” wirklich löschen?`,
        ok: {
          label: 'Löschen',
          color: 'negative',
          flat: true,
        },
        cancel: 'Abbrechen',
      })
      .onOk(async () => {
        try {
          await this.$api.communities.deleteCommunity(this.community.id);

          notifySuccess('Community wurde gelöscht.');
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
        message: `Möchtest du dich bei “${this.community.name}” als ${character.name} bewerben? Eine Führungsperson muss deine Bewerbung bestätigen.`,
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
          await this.$api.communities.applyForMembership(this.community.id, character.id);
          this.community.membershipStatus = MembershipStatus.APPLIED;
          notifySuccess('Du hast dich beworben.');
        } catch (e) {
          notifyError(e);
        }
      });
  }
}
</script>

<style lang="scss" scoped>
.community-detail {
  padding: 0 0 48px;
}

.community-detail__tabs {
  position: sticky;
  top: var(--nav-height, 68px);
  z-index: 5;
}

.community-detail__body {
  padding: 24px 24px 0;

  @media (max-width: 599px) {
    padding: 16px 12px 0;
  }
}

.community-detail__overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 32px;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.community-detail__main,
.community-detail__rail {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.community-detail__rail {
  gap: 20px;
}

.community-detail__heading {
  text-align: left;
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.community-detail__about {
  padding: 28px 32px;
  border-radius: 12px;
  font-size: 17px;
  line-height: 1.7;

  @media (max-width: 599px) {
    padding: 20px 18px;
  }
}

.community-detail__carrd {
  border: none;
  min-height: 380px;
}

.community-detail__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 20px 20px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
}

.community-detail__card--seek {
  border-color: var(--vision-live);
  box-shadow: inset 4px 0 0 var(--vision-live);
  padding-left: 24px;
}

.community-detail__card-title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 18px;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.community-detail__card-text {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-primary);
}

.community-detail__delete {
  align-self: flex-start;
}

.community-detail__manage + .community-detail__manage {
  margin-top: 32px;
}

.community-detail__member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  > li {
    display: flex;
    min-width: 0;

    > * {
      flex: 1 1 auto;
    }
  }
}
</style>
