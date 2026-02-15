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
							<q-avatar round size="56px" class="page-free-company__member-avatar">
								<img :src="profile.avatar" />
							</q-avatar>
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
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import errors from '@app/shared/errors';
import FreeCompanyProfile from 'components/free-company/FreeCompanyProfile.vue';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { notifyError } from 'src/common/notify';
import { useRouter } from 'src/router';
import { MetaOptions } from 'quasar/dist/types/meta';
import { createMetaMixin } from 'quasar';
import { PageType } from '@app/shared/enums/page-type.enum';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';

const $api = useApi();
const $router = useRouter();

interface Content {
	name: string;
	server: string;
	fc: FreeCompanyDto;
	members: PagingResultDto<CharacterSummaryDto>;
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
			const fc = await $api.freeCompanies.getFreeCompany(name, server);

			return {
				name,
				server,
				fc,
				members: await $api.characters.getCharacterProfiles({ freeCompanyId: fc.id, limit: 99999 }),
				notFound: false
			}
		} catch (e) {
			if (errors.getStatusCode(e) === 404) {
				return {
					name,
					server,
					fc: new FreeCompanyDto(),
					members: { data: [], total: 0 },
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
		ReportViolationSection,
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
.page-free-company__members {
  margin: 32px 0;
}

.page-free-company__members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
}

.page-free-company__members-header h3 {
  margin: 0;
  font-family: $header-font;
  letter-spacing: 0.02em;
}

.page-free-company__members-count {
  font-family: $header-font;
  font-size: 1.05rem;
  color: #20323d;
}

.page-free-company__members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(221, 180, 118, 0.25);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
}

.page-free-company__member-card {
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.page-free-company__member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
  border-color: rgba(221, 180, 118, 0.4);
}

.page-free-company__member-link {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.page-free-company__member-avatar {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
}

.page-free-company__member-name {
  font-weight: 700;
  color: #1f2c38;
}

.page-free-company__member-meta {
  color: rgba(35, 35, 35, 0.7);
  font-size: 0.85rem;
}

.page-free-company__member-profession {
  color: rgba(35, 35, 35, 0.65);
  font-size: 0.85rem;
}

.page-free-company__members-empty {
  margin: 0;
  padding: 18px;
  color: rgba(35, 35, 35, 0.7);
  border: 1px solid rgba(221, 180, 118, 0.2);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
  text-align: center;
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
  .page-free-company__member-card {
    transition: none;
  }

  .page-free-company__member-card:hover {
    transform: none;
  }
}
</style>
