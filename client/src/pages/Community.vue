<template>
  <q-page class="page-community">
    <template v-if="community.id">
      <section v-if="!$store.getters.characterId"><!-- Not logged in --></section>
      <section v-else-if="!community.membershipStatus" class="page-community__join-button-bar">
        <q-btn outline color="primary" label="Community beitreten" @click="onJoinClick" />
      </section>
      <section
        v-else-if="community.membershipStatus === MembershipStatus.APPLIED"
        class="page-community__edit-bar page-community__membership-status"
      >
        Du hast eine Anfrage für eine Mitgliedschaft in dieser Community gesendet. Eine Führungsperson muss deine Bewerbung überprüfen bevor du beitreten kannst.
        </section>
      <section
        v-else-if="community.membershipStatus === MembershipStatus.REJECTED"
        class="page-community__edit-bar page-community__membership-status"
      >
        Deine Mitgliedschaftsanfrage wurde abgelehnt.
      </section>
      <section v-else-if="community.canEdit" class="page-community__edit-bar">
        <q-btn flat color="secondary" label="Community bearbeiten" :to="`/edit-community/${community.id}`" />
        <q-btn flat color="negative" label="Community löschen" @click="onDeleteClick" />
      </section>
      <section
        v-else-if="community.membershipStatus === MembershipStatus.CONFIRMED"
        class="page-community__edit-bar page-community__membership-status"
      >
        Du bist ein Mitglied dieser Community.
      </section>
      <community-profile :community="community" />
      <template v-if="!community.canManageMembers">
        <section class="page-community__members">
          <header class="page-community__members-header">
            <h3>Mitglieder</h3>
            <div class="page-community__members-count">
              {{ members.length }} {{ members.length === 1 ? 'Mitglied' : 'Mitglieder' }}
            </div>
          </header>

          <div class="page-community__members-grid">
            <div
              v-for="profile in members"
              :key="`${profile.name}_${profile.server}`"
              class="page-community__member-card"
            >
              <router-link :to="getLink(profile)" class="page-community__member-link">
                <q-avatar round size="56px" class="page-community__member-avatar">
                  <img :src="profile.avatar" />
                </q-avatar>
                <div class="page-community__member-body">
                  <div class="page-community__member-name">{{ profile.name }}</div>
                  <div class="page-community__member-meta">
                    {{ $display.races[profile.race] }} - {{ profile.server }}
                  </div>
                  <div v-if="profile.profession" class="page-community__member-profession">
                    {{ profile.profession }}
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <div v-if="members.length === 0" class="page-community__members-empty">
            Keine Mitglieder gefunden.
          </div>
        </section>
      </template>
      <template v-else>
				<template v-if="applicants.length > 0">
					<h3>Bewerber</h3>
					<community-applicant-editor
						:community-id="community.id"
						:members="applicants"
						@updated="refreshEditableMembers"
					/>
				</template>
				<h3>Mitglieder</h3>
        <community-member-editor
          :community="community"
          :members="confirmedMembers"
          @updated="refreshEditableMembers"
        />
      </template>
    	<report-violation-section :pageType="PageType.COMMUNITY" :pageId="community.id" />
    </template>
  </q-page>
</template>

<script lang="ts">
import { CommunityDto } from '@app/shared/dto/communities/community.dto';
import CommunityProfile from 'components/communities/CommunityProfile.vue';
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
import { CommunityMemberDto } from '@app/shared/dto/communities/community-member.dto';
import CommunityApplicantEditor from 'src/components/communities/CommunityApplicantEditor.vue';
import CommunityMemberEditor from 'src/components/communities/CommunityMemberEditor.vue';
import { PageType } from '@app/shared/enums/page-type.enum';
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
    CommunityProfile,
    CommunityApplicantEditor,
		CommunityMemberEditor,
		ReportViolationSection,
  },
  async beforeRouteEnter(to, _, next) {
    const { community, members } = await load(to.params);
    next((vm) => (vm as PageCommunity).setContent(community, members));
  },
  async beforeRouteUpdate(to) {
    const { community, members } = await load(to.params);
    (this as PageCommunity).setContent(community, members);
  },
  mixins: [
    createMetaMixin(function (this: PageCommunity) {
      const result: MetaOptions = {
        title: `${this.community.name} — Chaos Archives`,
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

  async refreshEditableMembers() {
    const allMembers = await this.$api.communities.getMembers(this.community.id);
    this.applicants = allMembers.filter((member) => member.status === MembershipStatus.APPLIED);
    this.confirmedMembers = allMembers.filter((member) => member.status === MembershipStatus.CONFIRMED);
  }

  getLink(profile: CharacterSummaryDto) {
    return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
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
    const character = this.$store.getters.character!;

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

<style lang="scss">
.page-community__edit-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-community__join-button-bar {
  text-align: center;
  margin-bottom: 8px;
}

.page-community__members {
  margin: 32px 0;
}

.page-community__members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-community__members-header h3 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-community__members-count {
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-community__members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-community__member-card {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.page-community__member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-community__member-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.page-community__member-avatar {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.page-community__member-name {
  font-weight: 700;
  color: #1f2c38;
}

.page-community__member-meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.85rem;
}

.page-community__member-profession {
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.85rem;
}

.page-community__members-empty {
  margin: 0;
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  text-align: center;
}

@media screen and (max-width: $breakpoint-sm) {
  .page-community__members-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-community__members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-community__member-card {
    transition: none;
  }

  .page-community__member-card:hover {
    transform: none;
  }
}
</style>
