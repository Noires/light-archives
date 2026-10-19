<template>
	<q-page class="fc-detail">
		<template v-if="fc && fc.id">
			<group-plate
				ref="plate"
				:name="fc.name"
				:banner-url="fc.banner ? fc.banner.url : ''"
				:crest="fc.crest || []"
				placeholder-icon="shield"
				:eyebrow-parts="eyebrowParts"
				:chips="chips"
				:crumbs="crumbs"
			>
				<template #actions>
					<q-btn
						v-if="fc.canEdit"
						class="elpis-btn group-plate__btn-media"
						flat
						no-caps
						icon="edit"
						label="Bearbeiten"
						:to="editLink"
					/>
				</template>
				<template #primary>
					<!-- ER2 round 2: application flow with status chips; website link as fallback -->
					<free-company-apply-action
						:fc="fc"
						:fallback-url="applyUrl"
						:is-member="isMember"
						on-media
						@changed="reload"
					/>
				</template>
			</group-plate>

			<section-tabs
				v-model="tab"
				class="fc-detail__tabs"
				glass
				sync="query"
				aria-label="Bereiche der Freien Gesellschaft"
				:tabs="tabs"
			/>

			<div class="fc-detail__body">
				<div v-if="tab === 'uebersicht'" class="fc-detail__overview">
					<div class="fc-detail__main">
						<p v-if="!fc.claimed" class="fc-detail__note">
							Die Leitung hat diese Freie Gesellschaft noch nicht auf <strong>Elpisgarten</strong> beansprucht.
						</p>
						<section v-if="fc.description" aria-labelledby="fc-about">
							<h2 id="fc-about" class="fc-detail__heading">Über uns</h2>
							<div class="fc-detail__about mat-parchment">
								<html-viewer :content="fc.description" />
							</div>
						</section>
						<!-- ER2 round 2: "Was wir spielen" -->
						<focus-items :items="fc.focusItems" />
						<iframe
							v-if="fc.carrdProfile"
							v-iframe-resize
							class="fc-detail__carrd"
							:src="carrdLink"
							:title="`Carrd-Seite von ${fc.name}`"
							width="100%"
							height="500px"
						></iframe>
						<empty-state
							v-if="fc.claimed && !fc.description && !fc.carrdProfile && !(fc.focusItems && fc.focusItems.length)"
							:variant="fc.canEdit ? 'owner' : 'visitor'"
							icon="shield"
							title="Noch keine Beschreibung"
							:text="fc.canEdit ? 'Erzähl, wer ihr seid und was ihr gemeinsam spielt.' : 'Diese Freie Gesellschaft hat sich noch nicht vorgestellt.'"
							:action-label="fc.canEdit ? 'Beschreibung schreiben' : ''"
							:action-to="fc.canEdit ? editLink : null"
						/>
					</div>

					<aside class="fc-detail__rail" aria-label="Eckdaten">
						<section v-if="fc.recruiting" class="fc-detail__card fc-detail__card--seek" aria-labelledby="fc-seek">
							<h2 id="fc-seek" class="fc-detail__card-title">Wir suchen</h2>
							<p class="fc-detail__card-text">
								{{ fc.name }} nimmt neue Mitglieder auf.
								<template v-if="fc.recruitingOfficers"> Sprich am besten {{ fc.recruitingOfficers }} an.</template>
							</p>
							<free-company-apply-action
								:fc="fc"
								:fallback-url="applyUrl"
								:is-member="isMember"
								apply-only
								@changed="reload"
							/>
						</section>

						<group-facts :items="facts" />

						<section v-if="members.total > 0" class="fc-detail__card" aria-labelledby="fc-members-preview">
							<h2 id="fc-members-preview" class="fc-detail__card-title">Mitglieder</h2>
							<avatar-stack :avatars="memberAvatars" :max="6" :label="memberLabel" />
							<q-btn
								class="elpis-btn elpis-btn--ghost fc-detail__card-link"
								flat
								no-caps
								dense
								label="Alle ansehen"
								@click="tab = 'mitglieder'"
							/>
						</section>
					</aside>
				</div>

				<div v-else-if="tab === 'mitglieder'" class="fc-detail__members">
					<h2 class="fc-detail__heading">{{ memberLabel }}</h2>
					<ul v-if="members.total > 0" class="fc-detail__member-grid">
						<li v-for="profile in members.data" :key="`${profile.name}_${profile.server}`">
							<member-card
								:to="getLink(profile)"
								:avatar-src="profile.avatar"
								:name="profile.name"
								:meta="`${$display.races[profile.race]} · ${profile.server}`"
								:subtitle="profession(profile)"
								:rp-status="rpStatus(profile)"
							/>
						</li>
					</ul>
					<empty-state
						v-else
						icon="group"
						title="Noch keine Mitglieder"
						text="Mitglieder erscheinen hier, sobald sie ihr Profil mit der Freien Gesellschaft verknüpfen."
					/>

					<free-company-applications
						v-if="fc.canEdit && fc.pendingApplicationCount !== undefined"
						class="fc-detail__applications"
						:free-company-id="fc.id"
						@changed="reload"
					/>

					<section v-if="fc.mine" class="fc-detail__permissions" aria-labelledby="fc-permissions">
						<h2 id="fc-permissions" class="fc-detail__heading">Bearbeitungsrechte</h2>
						<free-company-member-permission-editor :members="memberPermissions" :free-company-id="fc.id" />
					</section>
				</div>

				<group-member-content
					v-else-if="tab === 'galerie' || tab === 'geschichten'"
					:kind="tab"
					:member-ids="memberIds"
					:group-name="fc.name"
				/>

				<group-events
					v-else-if="tab === 'events' && groupEvents"
					:upcoming="groupEvents.upcoming"
					:past="groupEvents.past"
					:group-name="fc.name"
				/>

				<report-violation-section :pageType="PageType.FREE_COMPANY" :pageId="fc.id" hide-copy-link />
			</div>
		</template>
		<empty-state
			v-else-if="notFound"
			class="fc-detail__not-found"
			icon="shield"
			title="Freie Gesellschaft nicht gefunden"
			:text="`Die Freie Gesellschaft ${name} (${server}) ist nicht auf Elpisgarten vertreten.`"
			action-label="Zu den Freien Gesellschaften"
			action-to="/free-companies"
		/>
	</q-page>
</template>

<script lang="ts">
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { FreeCompanyMemberPermissionDto } from '@app/shared/dto/fcs/free-company-member-permission.dto';
import type FreeCompaniesAPI from '@common/common/api/free-companies-api';
import { CharacterSummaryDto } from '@app/shared/dto/characters/character-summary.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { RpStatus } from '@app/shared/enums/rp-status.enum';
import errors from '@app/shared/errors';
import { isEmptyFieldValue } from 'components/character/empty-field';
import { stripWikilinks } from 'components/character/profile-sections';
import { keepTabsInView } from 'components/character/keep-tabs-in-view';
import { activeRpStatus } from 'components/character/rp-status';
import FocusItems from 'components/communities/FocusItems.vue';
import GroupFacts from 'components/communities/GroupFacts.vue';
import GroupEvents from 'components/communities/GroupEvents.vue';
import GroupMemberContent from 'components/communities/GroupMemberContent.vue';
import { loadGroupEvents } from 'components/communities/member-content';
import type { GroupEvents as GroupEventLists } from 'components/communities/member-content';
import GroupPlate from 'components/communities/GroupPlate.vue';
import type { GroupFact, GroupPlateChip } from 'components/communities/group-plate';
import FreeCompanyMemberPermissionEditor from 'components/free-company/FreeCompanyMemberPermissionEditor.vue';
import FreeCompanyApplications from 'components/free-company/FreeCompanyApplications.vue';
import FreeCompanyApplyAction from 'components/free-company/FreeCompanyApplyAction.vue';
import AvatarStack from 'components/vision/AvatarStack.vue';
import EmptyState from 'components/vision/EmptyState.vue';
import MemberCard from 'components/vision/MemberCard.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { AvatarItem, BreadcrumbItem, SectionTab } from 'components/vision/types';
import { useApi } from 'src/boot/axios';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import { notifyError } from 'src/common/notify';
import { useRouter } from 'src/router';
import { useStore } from 'src/store';
import { MetaOptions } from 'quasar/dist/types/meta';
import { createMetaMixin } from 'quasar';
import { PageType } from '@app/shared/enums/page-type.enum';
import HtmlViewer from 'src/components/common/HtmlViewer.vue';
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
		AvatarStack,
		EmptyState,
		FreeCompanyApplications,
		FreeCompanyApplyAction,
		FreeCompanyMemberPermissionEditor,
		FocusItems,
		GroupEvents,
		GroupFacts,
		GroupMemberContent,
		GroupPlate,
		HtmlViewer,
		MemberCard,
		ReportViolationSection,
		SectionTabs,
	},
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => (vm as PageFreeCompany).setContent(content));
	},
	async beforeRouteUpdate(to, from) {
		// Tab changes only touch the query.
		if (to.path === from.path && (this as PageFreeCompany).fc.id) {
			keepTabsInView(((this as PageFreeCompany).$refs.plate as Vue | undefined)?.$el as HTMLElement | undefined);
			return;
		}
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

	tab = 'uebersicht';
	name = '';
	server = '';
	fc: FreeCompanyDto = new FreeCompanyDto();
	members: PagingResultDto<CharacterSummaryDto> = { data: [], total: 0 };
	memberPermissions: FreeCompanyMemberPermissionDto[] = [];
	notFound = false;
	/** ER2: null while loading or when the API lacks the endpoint */
	groupEvents: GroupEventLists | null = null;
	private eventsToken = 0;

	setContent(content: Content) {
		const previousId = this.fc.id;
		Object.assign(this, content);

		if (this.fc.id !== previousId || !this.groupEvents) {
			void this.loadEvents();
		}
	}

	async loadEvents() {
		const token = ++this.eventsToken;
		const id = this.fc.id;
		this.groupEvents = null;

		if (!id) {
			return;
		}

		const events = await loadGroupEvents('freeCompany', id);

		if (token === this.eventsToken) {
			this.groupEvents = events;
		}
	}

	get hasEvents(): boolean {
		return !!this.groupEvents && (this.groupEvents.upcoming.length > 0 || this.groupEvents.past.length > 0);
	}

	/** ER2 round 2: refresh after applying, withdrawing or deciding. */
	async reload() {
		try {
			this.setContent(await load(this.$route.params));
		} catch {
			// load() already notified.
		}
	}

	/** The current character is listed as a member. */
	get isMember(): boolean {
		const character = this.$store.getters.character;
		return !!character && this.members.data.some((member) => member.name === character.name && member.server === character.server);
	}

	get tabs(): SectionTab[] {
		return [
			{ key: 'uebersicht', label: 'Übersicht', icon: 'shield' },
			{
				key: 'mitglieder',
				label: this.fc.pendingApplicationCount ? `Mitglieder · ${this.fc.pendingApplicationCount} Bewerbungen` : 'Mitglieder',
				icon: 'group',
				count: this.members.total,
			},
			// ER2 round 2: only when the member list carries character ids (newer API)
			{ key: 'galerie', label: 'Galerie', icon: 'photo_library', hidden: this.memberIds.length === 0 },
			{ key: 'geschichten', label: 'Geschichten', icon: 'auto_stories', hidden: this.memberIds.length === 0 },
			// ER2: hidden when the endpoint fails (older API) or there are no events
			{ key: 'events', label: 'Events', icon: 'event', hidden: !this.hasEvents },
		];
	}

	get memberIds(): number[] {
		return this.members.data.map((member) => member.id).filter((id): id is number => typeof id === 'number');
	}

	get crumbs(): BreadcrumbItem[] {
		return [
			{ label: 'Freie Gesellschaften', to: '/free-companies' },
			{ label: this.fc.name },
		];
	}

	get eyebrowParts(): string[] {
		return [
			this.fc.tag ? `«${this.fc.tag}»` : '',
			'Freie Gesellschaft',
			this.fc.foundedAt ? `gegründet ${this.$display.formatDate(this.fc.foundedAt)}` : '',
		].filter((part) => !!part);
	}

	get chips(): GroupPlateChip[] {
		const chips: GroupPlateChip[] = [];
		if (this.fc.server) {
			chips.push({ label: `${this.fc.server} [Light]`, icon: 'public' });
		}
		if (this.fc.recruiting) {
			chips.push({ label: 'Nimmt Mitglieder auf', live: true });
		}
		if (this.members.total > 0) {
			chips.push({ label: this.memberLabel, icon: 'group' });
		}
		return chips;
	}

	get memberLabel(): string {
		return `${this.members.total} ${this.members.total === 1 ? 'Mitglied' : 'Mitglieder'}`;
	}

	get memberAvatars(): AvatarItem[] {
		return this.members.data.map((member) => ({ src: member.avatar, alt: member.name }));
	}

	get facts(): GroupFact[] {
		const fc = this.fc;
		return [
			{ label: 'Welt', value: fc.server ? `${fc.server} [Light]` : '' },
			{ label: 'Gründung', value: fc.foundedAt ? this.$display.formatDate(fc.foundedAt) : '' },
			{ label: 'Ziel', value: fc.goal },
			{ label: 'Status', value: fc.status },
			{ label: 'Tätigkeit', value: fc.areaOfOperations },
			{ label: 'Rekrutierer', value: fc.recruitingOfficers },
			{ label: 'Webseite', value: fc.website, href: this.safeUrl(fc.website) },
		];
	}

	/** Fallback when the API has no application flow: a recruiting FC links its website. */
	get applyUrl(): string {
		return this.fc.recruiting ? this.safeUrl(this.fc.website) : '';
	}

	get editLink(): string {
		return `/edit-free-company/${this.fc.server}/${this.fc.name.replace(/ /g, '_')}`;
	}

	get carrdLink(): string {
		return `${this.$api.prefix}carrd/character/preview/${this.fc.carrdProfile}`;
	}

	safeUrl(value?: string | null): string {
		return value && /^https?:\/\//i.test(value.trim()) ? value.trim() : '';
	}

	getLink(profile: CharacterSummaryDto): string {
		return `/${profile.server}/${profile.name.replace(/ /g, '_')}`;
	}

	profession(profile: CharacterSummaryDto): string {
		return profile.profession && !isEmptyFieldValue(profile.profession) ? stripWikilinks(profile.profession) : '';
	}

	rpStatus(profile: CharacterSummaryDto): RpStatus | null {
		return activeRpStatus(profile);
	}
}
</script>

<style lang="scss" scoped>
.fc-detail {
	padding: 0 0 48px;
}

.fc-detail__not-found {
	margin: 48px 24px;
}

.fc-detail__tabs {
	position: sticky;
	top: var(--nav-height, 68px);
	z-index: 5;
}

.fc-detail__body {
	padding: 24px 24px 0;

	@media (max-width: 599px) {
		padding: 16px 12px 0;
	}
}

.fc-detail__overview {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 340px;
	gap: 32px;
	align-items: start;

	@media (max-width: 1023px) {
		grid-template-columns: minmax(0, 1fr);
	}
}

.fc-detail__main,
.fc-detail__rail {
	display: flex;
	flex-direction: column;
	gap: 24px;
	min-width: 0;
}

.fc-detail__rail {
	gap: 20px;
}

.fc-detail__heading {
	text-align: left;
	margin: 0 0 14px;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 22px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.fc-detail__note {
	margin: 0;
	padding: 12px 16px;
	border: 1px dashed var(--rule-strong);
	border-radius: 12px;
	font-family: var(--font-ui);
	font-size: 14px;
	color: var(--ink-primary);
}

.fc-detail__about {
	padding: 28px 32px;
	border-radius: 12px;
	font-size: 17px;
	line-height: 1.7;

	@media (max-width: 599px) {
		padding: 20px 18px;
	}
}

.fc-detail__carrd {
	border: none;
	min-height: 380px;
}

.fc-detail__card {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;
	padding: 18px 20px 20px;
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	background-color: var(--vision-card);
}

.fc-detail__card--seek {
	border-color: var(--vision-live);
	box-shadow: inset 4px 0 0 var(--vision-live);
	padding-left: 24px;
}

.fc-detail__card-title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 18px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.fc-detail__card-text {
	margin: 0;
	font-family: var(--font-ui);
	font-size: 14px;
	line-height: 1.5;
	color: var(--ink-primary);
}

.fc-detail__member-grid {
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

.fc-detail__permissions,
.fc-detail__applications {
	margin-top: 40px;
}

</style>
