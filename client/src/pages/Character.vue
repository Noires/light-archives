<template>
	<q-page class="page-character">
		<template v-if="notFound">
			<empty-state
				class="page-character__not-found"
				icon="person_search"
				title="Charakter nicht gefunden"
				:text="`Der Charakter ${name} (${server}) ist nicht auf Elpisgarten registriert.`"
				action-label="Zu den Charakteren"
				action-to="/profiles"
			/>
		</template>
		<template v-else-if="character && character.id">
			<character-plate
				ref="plate"
				:character="character"
				:base-path="basePath"
				@rp-change="onRpChange"
			/>
			<section-tabs
				class="page-character__tabs"
				glass
				sync="route"
				aria-label="Profilbereiche"
				:tabs="tabs"
			/>

			<div class="page-character__body">
				<template v-if="!activeVisible">
					<empty-state
						icon="visibility_off"
						title="Dieser Bereich ist leer"
						:text="`${character.name} hat hier noch nichts veröffentlicht.`"
						action-label="Zum Profil"
						:action-to="basePath"
					/>
				</template>
				<template v-else>
					<empty-state
						v-if="isOwner && activeDimmed"
						class="page-character__owner-hint"
						variant="owner"
						:icon="activeSection.icon"
						:title="activeEnabled ? 'Dieser Bereich ist noch leer' : 'Für Besucher ausgeblendet'"
						:text="activeEnabled
							? 'Besucher sehen ihn erst, wenn du etwas eingetragen hast.'
							: 'Du hast diesen Bereich im Editor ausgeschaltet. Besucher sehen ihn nicht.'"
						action-label="Ergänzen"
						:action-to="editLink(activeSection.editPath)"
					/>
					<character-overview
						v-if="tab === 'profil'"
						:character="character"
						:content="content"
						:base-path="basePath"
					/>
					<character-appearance v-else-if="tab === 'aussehen'" :character="character" />
					<character-personality v-else-if="tab === 'persoenlichkeit'" :character="character" />
					<character-contacts v-else-if="tab === 'kontakte'" :character="character" />
					<character-rumors v-else-if="tab === 'geruechte'" :character="character" />
					<character-diary v-else-if="tab === 'tagebuch'" :content="content" :character="character" />
					<character-gallery v-else-if="tab === 'galerie'" :content="content" />
					<character-inventory v-else-if="tab === 'inventar'" :character="character" />
					<character-pen-and-paper v-else-if="tab === 'pen-and-paper'" :character="character" />
				</template>

				<report-violation-section :pageType="PageType.PROFILE" :pageId="character.id" />
			</div>
		</template>
	</q-page>
</template>

<script lang="ts">
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { RpPresenceFieldsDto } from '@app/shared/dto/characters/rp-presence.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import CharacterOverview from 'components/character/CharacterOverview.vue';
import CharacterPlate from 'components/character/CharacterPlate.vue';
import {
	CHARACTER_SECTIONS,
	CharacterSection,
	CharacterTabKey,
	DEFAULT_CHARACTER_TAB,
	findSection,
	isCharacterTabKey,
	sectionCount,
	sectionEnabled,
	sectionPublic,
} from 'components/character/profile-sections';
import EmptyState from 'components/vision/EmptyState.vue';
import SectionTabs from 'components/vision/SectionTabs.vue';
import type { SectionTab } from 'components/vision/types';
import { createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteLocationNormalized, RouteParams } from 'vue-router';
import CharacterAppearance from 'src/components/character/CharacterAppearance.vue';
import CharacterPersonality from 'src/components/character/CharacterPersonality.vue';
import CharacterContacts from 'src/components/character/CharacterContacts.vue';
import CharacterRumors from 'src/components/character/CharacterRumors.vue';
import CharacterDiary from 'src/components/character/CharacterDiary.vue';
import CharacterGallery from 'src/components/character/CharacterGallery.vue';
import CharacterInventory from 'src/components/character/CharacterInventory.vue';
import CharacterPenAndPaper from 'src/components/character/CharacterPenAndPaper.vue';

const $api = useApi();
const $router = useRouter();

interface Content {
	name: string;
	server: string;
	characterParam: string;
	character: CharacterProfileDto;
	content: CharacterContentDto;
	notFound: boolean;
}

function param(params: RouteParams, key: string): string {
	const value = params[key];
	return (Array.isArray(value) ? value[0] : value) || '';
}

function tabFromRoute(route: RouteLocationNormalized): CharacterTabKey {
	const tab = param(route.params, 'tab');
	return isCharacterTabKey(tab) ? tab : DEFAULT_CHARACTER_TAB;
}

/** Same character in both routes, so only the section changed. */
function sameCharacter(a: RouteLocationNormalized, b: RouteLocationNormalized): boolean {
	return param(a.params, 'server') === param(b.params, 'server')
		&& param(a.params, 'character') === param(b.params, 'character');
}

async function load(params: RouteParams): Promise<Content> {
	const server = param(params, 'server');
	const characterParam = param(params, 'character');

	if (!characterParam || !server) {
		void $router.replace('/');
		throw new Error();
	}

	const name = characterParam.replace(/_/g, ' ');

	try {
		const character = await $api.characters.getCharacterProfile(name, server);

		return {
			name,
			server,
			characterParam,
			character,
			content: await $api.characters.getCharacterContent(character.id),
			notFound: false
		}
	} catch (e) {
		if (errors.getStatusCode(e) === 404) {
			return {
				name,
				server,
				characterParam,
				character: new CharacterProfileDto(),
				content: { stories: [], images: [] },
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
		CharacterOverview,
		CharacterPlate,
		CharacterAppearance,
		CharacterPersonality,
		CharacterContacts,
		CharacterRumors,
		CharacterDiary,
		CharacterGallery,
		CharacterInventory,
		CharacterPenAndPaper,
		EmptyState,
		ReportViolationSection,
		SectionTabs,
	},
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => {
			(vm as PageCharacter).setContent(content);
			(vm as PageCharacter).tab = tabFromRoute(to);
		});
	},
	async beforeRouteUpdate(to, from) {
		const vm = this as PageCharacter;
		if (sameCharacter(to, from) && vm.character.id) {
			// ER2-401 — switching sections keeps the loaded profile and, once the
			// reader has scrolled past the header, the tab bar in view.
			vm.tab = tabFromRoute(to);
			vm.keepTabsInView();
			return;
		}
		const content = await load(to.params);
		vm.setContent(content);
		vm.tab = tabFromRoute(to);
	},
	mixins: [
		createMetaMixin(function (this: PageCharacter) {
			const result: MetaOptions = {
				meta: {}
			};

			if (this.character.banner) {
				Object.assign(result.meta, {
					ogImage: {
						property: 'og:image',
						content: this.character.banner.url,
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
export default class PageCharacter extends Vue {
	readonly PageType = PageType;

	tab: CharacterTabKey = DEFAULT_CHARACTER_TAB;
	name = '';
	server = '';
	characterParam = '';
	character: CharacterProfileDto = new CharacterProfileDto();
	content: CharacterContentDto = { stories: [], images: [] };
	notFound = false;

	get isOwner(): boolean {
		return !!this.character.mine;
	}

	/** Old profile URL; the "profil" tab links here. */
	get basePath(): string {
		return `/${this.server}/${this.characterParam}`;
	}

	tabPath(key: CharacterTabKey): string {
		return key === DEFAULT_CHARACTER_TAB ? this.basePath : `${this.basePath}/${key}`;
	}

	editLink(editPath: string): string {
		return `/edit-character/${this.character.id}/${editPath}`;
	}

	isPublic(section: CharacterSection): boolean {
		return sectionPublic(section, this.character, this.content);
	}

	get tabs(): SectionTab[] {
		return CHARACTER_SECTIONS.map((section) => {
			const isPublic = this.isPublic(section);
			const count = sectionCount(section.key, this.character, this.content);
			return {
				key: section.key,
				label: section.label,
				icon: section.icon,
				to: this.tabPath(section.key),
				count: count ? count : undefined,
				hidden: !this.isOwner && !isPublic,
				dimmed: this.isOwner && !isPublic,
			};
		});
	}

	get activeSection(): CharacterSection {
		return findSection(this.tab);
	}

	get activeEnabled(): boolean {
		return sectionEnabled(this.activeSection, this.character);
	}

	get activeDimmed(): boolean {
		return !this.isPublic(this.activeSection);
	}

	get activeVisible(): boolean {
		return this.isOwner || this.tab === DEFAULT_CHARACTER_TAB || this.isPublic(this.activeSection);
	}

	onRpChange(presence: RpPresenceFieldsDto) {
		Object.assign(this.character, presence);
	}

	/**
	 * The router scrolls to the top on every navigation; for a tab switch below
	 * the header that hides the content the reader asked for, so scroll back
	 * to the tab bar afterwards.
	 */
	keepTabsInView() {
		const plate = (this.$refs.plate as Vue | undefined)?.$el as HTMLElement | undefined;
		if (!plate) {
			return;
		}
		const navHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--nav-height')) || 68;
		const plateBottom = plate.getBoundingClientRect().bottom + window.scrollY;
		const target = Math.max(0, plateBottom - navHeight);
		if (window.scrollY < target - 1) {
			return;
		}
		// After the router's own scroll-to-top has run.
		window.setTimeout(() => window.scrollTo({ top: target, left: 0 }), 0);
	}

	setContent(content: Content) {
		if ((content.content.images.length > 0) && (content.character.banner?.url != undefined))  {
			content.content.images = content.content.images.filter(x => !x.url.includes(content.character.banner!.url));
		}
		Object.assign(this, content);
	}
}
</script>

<style lang="scss" scoped>
.page-character {
	padding: 0 0 48px;
}

.page-character__not-found {
	margin: 48px 24px;
}

.page-character__tabs {
	position: sticky;
	top: var(--nav-height, 68px);
	z-index: 5;
}

// "Teilen" in the header replaces the copy-link button of the report row.
.page-character__body :deep(.report-violation-section > .q-btn:first-child) {
	display: none;
}

.page-character__body {
	padding: 24px 24px 0;

	@media (max-width: 599px) {
		padding: 16px 12px 0;
	}
}

.page-character__owner-hint {
	margin-bottom: 24px;
}
</style>
