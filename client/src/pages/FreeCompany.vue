<template>
  <q-page class="page-free-company">
		<template v-if="fc && fc.id">
			<free-company-profile :free-company="fc" />

			<section class="page-free-company__members">
				<header class="page-free-company__members-header">
					<h3>Mitglieder</h3>
					<div class="page-free-company__members-count">
						{{ members.total }} {{ members.total === 1 ? 'Mitglied' : 'Mitglieder' }}
					</div>
				</header>

				<div class="page-free-company__members-grid">
					<div
						v-for="profile in members.data"
						:key="`${profile.name}_${profile.server}`"
						class="page-free-company__member-card"
					>
						<router-link :to="getLink(profile)" class="page-free-company__member-link">
							<aetheryte-badge
								size="md"
								shape="round"
								:src="profile.avatar"
								:alt="profile.name"
								class="page-free-company__member-avatar"
							/>
							<div class="page-free-company__member-body">
								<div class="page-free-company__member-name">{{ profile.name }}</div>
								<div class="page-free-company__member-meta">
									{{ $display.races[profile.race] }} - {{ profile.server }}
								</div>
								<div v-if="profile.profession" class="page-free-company__member-profession">
									{{ profile.profession }}
								</div>
							</div>
						</router-link>
					</div>
				</div>

				<div v-if="members.total === 0" class="page-free-company__members-empty">
					Keine Mitglieder gefunden.
				</div>
			</section>

      <section v-if="fc.mine" class="page-free-company__permissions">
        <header class="page-free-company__members-header">
          <h3>Bearbeitungsrechte</h3>
        </header>
        <free-company-member-permission-editor :members="memberPermissions" :free-company-id="fc.id" />
      </section>

    	<report-violation-section :pageType="PageType.FREE_COMPANY" :pageId="fc.id" />
		</template>
		<template v-else-if="notFound">
			<h2>Freie Gesellschaft konnte nicht gefunden werden</h2>
			<p>Die Freie Gesellschaft {{name}} ({{server}}) ist nicht auf <strong>Elpisgarten</strong> vertreten.</p>
		</template>
	</q-page>
</template>

<script lang="ts">
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import errors from '@app/shared/errors';
import FreeCompanyProfile from 'components/free-company/FreeCompanyProfile.vue';
import FreeCompanyMemberPermissionEditor from 'components/free-company/FreeCompanyMemberPermissionEditor.vue';
import AetheryteBadge from 'components/aetherium/AetheryteBadge.vue';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { notifyError } from 'src/common/notify';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { MetaOptions } from 'quasar/dist/types/meta';
import { createMetaMixin } from 'quasar';
import { PageType } from '@app/shared/enums/page-type.enum';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';

const $api = useApi();
const freeCompaniesApi = $api.freeCompanies as unknown as FreeCompaniesAPI;
const $router = useRouter();
const $store = useStore();

interface Content {
	name: string;
	server: string;
	fc: FreeCompanyDto;
	members: PagingResultDto<CharacterSummaryDto>;
  memberPermissions: FreeCompanyMemberPermissionDto[];
	notFound: boolean;
}

async function load(params: RouteParams): Promise<Content> {
		const server = params.server as string;
		let name = params.fc as string;

		if (!name || !server) {
			void $router.replace('/');
			throw new Error();
		}

		name = name.replace(/_/g, ' ');

		try {
      const characterId = $store.getters.characterId || undefined;
			const fc = await freeCompaniesApi.getFreeCompany(name, server, characterId);
      const members = await $api.characters.getCharacterProfiles({ freeCompanyId: fc.id, limit: 99999 });
      const memberPermissions: FreeCompanyMemberPermissionDto[] = fc.mine
        ? await freeCompaniesApi.getMemberPermissions(fc.id)
        : [];

			return {
				name,
				server,
				fc,
				members,
        memberPermissions,
				notFound: false
			}
		} catch (e) {
			if (errors.getStatusCode(e) === 404) {
				return {
					name,
					server,
					fc: new FreeCompanyDto(),
					members: { data: [], total: 0 },
          memberPermissions: [],
					notFound: true
				}
			} else {
				notifyError(e);
				throw e;
			}
		}
}

@Options({
	components: {
		FreeCompanyProfile,
    FreeCompanyMemberPermissionEditor,
		ReportViolationSection,
		AetheryteBadge,
	},
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => (vm as PageFreeCompany).setContent(content));
	},
	async beforeRouteUpdate(to) {
		const content = await load(to.params);
		(this as PageFreeCompany).setContent(content);
	},
	mixins: [
		createMetaMixin(function(this: PageFreeCompany) {
			const result: MetaOptions = {
				meta: {}
			};

			if (this.fc.banner) {
				Object.assign(result.meta, {
					ogImage: {
						property: 'og:image',
						content: this.fc.banner.url,
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
export default class PageFreeCompany extends Vue {
	readonly PageType = PageType;

	name = '';
	server = '';
	fc: FreeCompanyDto = new FreeCompanyDto();
	members: PagingResultDto<CharacterSummaryDto> = { data: [], total: 0 };
  memberPermissions: FreeCompanyMemberPermissionDto[] = [];
	notFound = false;

	setContent(content: Content) {
		Object.assign(this, content);
	}

	getLink(profile: CharacterSummaryDto) {
		return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
	}
}
</script>

<style lang="scss">
// ELPIS-410: Free Company member grid uses round AetheryteBadge for the avatar
// and pulls the surrounding member-card chrome onto Aetherium tokens so the
// grid harmonises with the rest of the directory family (401/402/403 directory
// list cards, 111 home activity grid).
.page-free-company__members {
  margin: 32px 0;
}

.page-free-company__permissions {
  margin: 32px 0;
}

.page-free-company__members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 20px 22px;
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  border-radius: 6px;
}

.page-free-company__members-header h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-3);
  letter-spacing: var(--ls-display);
  color: var(--surface-ink);
}

.page-free-company__members-count {
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-0);
  color: var(--ink-muted);
}

.page-free-company__members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  border-radius: 6px;
}

.page-free-company__member-card {
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis);
}

.page-free-company__member-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 1px 2px rgba(43, 36, 24, 0.06),
    0 12px 28px rgba(43, 36, 24, 0.12);
  border-color: var(--rule-gold);
}

.page-free-company__member-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  color: inherit;
  text-decoration: none;
}

.page-free-company__member-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--type-scale-2);
  letter-spacing: var(--ls-display);
  color: var(--surface-ink);
}

.page-free-company__member-meta {
  font-family: var(--font-ui);
  color: var(--ink-muted);
  font-size: var(--type-scale-0);
}

.page-free-company__member-profession {
  font-family: var(--font-section);
  font-style: italic;
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
}

.page-free-company__members-empty {
  margin: 0;
  padding: 18px;
  color: var(--ink-muted);
  border: 1px solid var(--rule-gold-soft);
  background: var(--surface-vellum);
  box-shadow: 0 1px 2px rgba(43, 36, 24, 0.06);
  border-radius: 6px;
  text-align: center;
}

body.body--dark .page-free-company__members-header,
body.body--dark .page-free-company__members-grid,
body.body--dark .page-free-company__member-card,
body.body--dark .page-free-company__members-empty {
  background: var(--surface-lift);
  border-color: var(--rule-arcane-soft);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

body.body--dark .page-free-company__members-header h3,
body.body--dark .page-free-company__member-name {
  color: var(--ink-luminous);
}

body.body--dark .page-free-company__members-count,
body.body--dark .page-free-company__member-meta,
body.body--dark .page-free-company__member-profession,
body.body--dark .page-free-company__members-empty {
  color: rgba(236, 227, 247, 0.74);
}

body.body--dark .page-free-company__member-card:hover {
  border-color: var(--rule-arcane);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 12px 28px rgba(0, 0, 0, 0.45);
}

@media screen and (max-width: $breakpoint-sm) {
  .page-free-company__members-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .page-free-company__members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-free-company__member-card:hover {
    transform: none;
  }
}
</style>
