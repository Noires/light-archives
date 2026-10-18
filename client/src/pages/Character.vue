<template>
	<q-layout class="page-character-layout rounded-borders no-outline">
		<q-drawer
			class="border-radius-inherit page-character-layout__drawer mat-aetherglass"
			v-model="drawer"
			show-if-above
			:mini="isMobileSidebar || miniState"
			:mini-width="56"
			:width="200"
			:breakpoint="0"
			@mouseover="onDrawerMouseOver"
			@mouseout="onDrawerMouseOut"
		>
			<q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
				<q-list padding class="page-character-layout__menu">
					<q-item clickable v-ripple :active="tab === 'profile'" :aria-current="tab === 'profile' ? 'page' : undefined" @click="onTab('profile')">
						<q-item-section avatar>
							<q-icon name="account_circle" />
						</q-item-section>

						<q-item-section>
							Profil
						</q-item-section>
					</q-item>

					<q-item v-show="character.showAppearance" clickable v-ripple :active="tab === 'appearance'" :aria-current="tab === 'appearance' ? 'page' : undefined" @click="onTab('appearance')">
						<q-item-section avatar>
							<q-icon name="curtains" />
						</q-item-section>

						<q-item-section>
							Aussehen
						</q-item-section>
					</q-item>

					<q-item v-show="character.showPersonality" clickable v-ripple :active="tab === 'personality'" :aria-current="tab === 'personality' ? 'page' : undefined" @click="onTab('personality')">
						<q-item-section avatar>
							<q-icon name="psychology" />
						</q-item-section>

						<q-item-section>
							Persönlichkeit
						</q-item-section>
					</q-item>

					<q-item v-show="character.showContacts" clickable v-ripple :active="tab === 'contacts'" :aria-current="tab === 'contacts' ? 'page' : undefined" @click="onTab('contacts')">
						<q-item-section avatar>
							<q-icon name="diversity_3" />
						</q-item-section>

						<q-item-section>
							Kontakte
						</q-item-section>
					</q-item>

					<q-item v-show="character.showRumors" clickable v-ripple :active="tab === 'rumors'" :aria-current="tab === 'rumors' ? 'page' : undefined" @click="onTab('rumors')">
						<q-item-section avatar>
							<q-icon name="sms" />
						</q-item-section>

						<q-item-section>
							Gerüchte
						</q-item-section>
					</q-item>

					<q-item v-show="character.showDiary" clickable v-ripple :active="tab === 'diary'" :aria-current="tab === 'diary' ? 'page' : undefined" @click="onTab('diary')">
						<q-item-section avatar>
							<q-icon name="auto_stories" />
						</q-item-section>

						<q-item-section>
							Tagebuch
						</q-item-section>
					</q-item>

					<q-item v-show="character.showGallery" clickable v-ripple :active="tab === 'gallery'" :aria-current="tab === 'gallery' ? 'page' : undefined" @click="onTab('gallery')">
						<q-item-section avatar>
							<q-icon name="collections" />
						</q-item-section>

						<q-item-section>
							Galerie
						</q-item-section>
					</q-item>
					
					<q-item v-show="character.showInventory" clickable v-ripple :active="tab === 'inventory'" :aria-current="tab === 'inventory' ? 'page' : undefined" @click="onTab('inventory')">
						<q-item-section avatar>
							<q-icon name="diamond" />
						</q-item-section>

						<q-item-section>
							Inventar
						</q-item-section>
					</q-item>

					<q-item v-show="hasPenAndPaperSheet" clickable v-ripple :active="tab === 'pen-and-paper'" :aria-current="tab === 'pen-and-paper' ? 'page' : undefined" @click="onTab('pen-and-paper')">
						<q-item-section avatar>
							<q-icon name="casino" />
						</q-item-section>

						<q-item-section>
							Pen &amp; Paper
						</q-item-section>
					</q-item>
			
					<q-item v-if="character.mine" class="edit-profile" clickable v-ripple :to="`/edit-character/${character.id}/profile`">
						<q-item-section avatar>
							<q-icon class="edit-profile" name="edit" />
						</q-item-section>

						<q-item-section class="edit-profile">
							Bearbeiten
						</q-item-section>
					</q-item>


				</q-list>
			</q-scroll-area>
		</q-drawer>
		<q-page class="page-character mat-vellum">
			<q-page-container>
			<template v-if="notFound">
				<h2>Charakter konnte nicht gefunden werden.</h2>
				<p>Der Charakter {{ name }} ({{ server }}) ist nicht auf <strong>Elpisgarten</strong> registriert.</p>
			</template>
			<template v-if="character && character.id">
				<character-profile v-if="tab==='profile'" :character="character" />				
				<character-appearance v-if="tab==='appearance'" :character="character" />		
				<character-personality v-if="tab==='personality'" :character="character" />		
				<character-contacts v-if="tab==='contacts'" :character="character" />	
				<character-rumors v-if="tab==='rumors'" :character="character" />	
				<character-diary v-if="tab==='diary'" :content="content" :character="character" />	
				<character-gallery v-if="tab==='gallery'" :content="content" />	
				<character-inventory v-if="tab==='inventory'" :character="character" />
				<character-pen-and-paper v-if="tab==='pen-and-paper'" :character="character" />
			</template>
			<template v-if="content.stories.length > 0 && !displayDrawer()">
				<h3>{{ name }}'s Geschichten</h3>
				<story-list :stories="content.stories" />
			</template>
			<template v-if="content.images && content.images.length > 0 && !displayDrawer()">
				<h3>{{ name }}'s Galerie</h3>
				<thumb-gallery :images="content.images" />
			</template>
			<report-violation-section v-if="character && character.id" :pageType="PageType.PROFILE"
				:pageId="character.id" />
			</q-page-container>
		</q-page>
	</q-layout>
</template>

<script lang="ts">
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import CharacterProfile from 'components/character/CharacterProfile.vue';
import StoryList from 'components/stories/StoryList.vue';
import { createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import { useApi } from 'src/boot/axios';
import { notifyError } from 'src/common/notify';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import ThumbGallery from '../components/images/ThumbGallery.vue';
import { ref } from 'vue';
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
	character: CharacterProfileDto;
	content: CharacterContentDto;
	notFound: boolean;
}

async function load(params: RouteParams): Promise<Content> {
	const server = params.server as string;
	let name = params.character as string;

	if (!name || !server) {
		void $router.replace('/');
		throw new Error();
	}

	name = name.replace(/_/g, ' ');

	try {
		const character = await $api.characters.getCharacterProfile(name, server);

		return {
			name,
			server,
			character,
			content: await $api.characters.getCharacterContent(character.id),
			notFound: false
		}
	} catch (e) {
		if (errors.getStatusCode(e) === 404) {
			return {
				name,
				server,
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
		CharacterProfile,
		CharacterAppearance,
		CharacterPersonality,
		CharacterContacts,
		CharacterRumors,
		CharacterDiary,
		CharacterGallery,
		CharacterInventory,
		CharacterPenAndPaper,
		StoryList,
		ThumbGallery,
		ReportViolationSection,
	},
	async beforeRouteEnter(to, _, next) {
		const content = await load(to.params);
		next(vm => (vm as PageCharacter).setContent(content));
	},
	async beforeRouteUpdate(to) {
		const content = await load(to.params);
		(this as PageCharacter).setContent(content);
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

	tab = 'profile';
	drawer = ref(false);
	miniState = true;
	name = '';
	server = '';
	character: CharacterProfileDto = new CharacterProfileDto();
	content: CharacterContentDto = { stories: [], images: [] };
	notFound = false;

	get isMobileSidebar(): boolean {
		return this.$q.screen.lt.md;
	}

	get hasPenAndPaperSheet(): boolean {
		return [
			this.character.title,
			this.character.nickname,
			this.character.profession,
			this.character.deity,
			this.character.family,
			this.character.age,
			this.character.apparentage,
			this.character.pronouns,
			this.character.birthplace,
			this.character.birthday,
			this.character.residence,
			this.character.relationsshipstatus,
			this.character.background,
			this.character.personality,
			this.character.currently,
			this.character.oocInfo,
			this.character.openinformation,
			this.character.commonrumors,
			this.character.rarerumors,
			this.character.loves,
			this.character.hates,
			this.character.wishes,
			this.character.fears,
			this.character.slogan,
			this.character.motivation,
			this.character.strengths,
			this.character.weaknesses,
			this.character.ticks,
			this.character.haircolor,
			this.character.eyecolor,
			this.character.skintone,
			this.character.build,
			this.character.height,
			this.character.weight,
			this.character.voice,
			this.character.specialfeatures,
			this.character.possession,
			this.character.specialitems,
			this.character.partners,
			this.character.parents,
			this.character.children,
			this.character.relatives,
			this.character.friends,
			this.character.acquaintances,
			this.character.enemies,
			this.character.freecompanies,
			this.character.meetingplaces,
			this.character.communities,
			this.character.mentioned,
			this.character.past,
		].some(value => !!value);
	}

	setContent(content: Content) {
		if ((content.content.images.length > 0) && (content.character.banner?.url != undefined))  {
			content.content.images = content.content.images.filter(x => !x.url.includes(content.character.banner!.url));
		}
		Object.assign(this, content);
	}

	onTab(tab: string) {
		this.tab = tab;
	}

	onDrawerMouseOver() {
		if (!this.isMobileSidebar) {
			this.miniState = false;
		}
	}

	onDrawerMouseOut() {
		if (!this.isMobileSidebar) {
			this.miniState = true;
		}
	}

	displayDrawer(): boolean {
		return !!this.character.showAppearance || !!this.character.showPersonality || !!this.character.showContacts || !!this.character.showRumors || !!this.character.showDiary || !!this.character.showGallery || !!this.character.showInventory || this.hasPenAndPaperSheet;
	}
}



</script>

<style lang="scss">
.page-character-layout {
	--character-edit-bg: #9f848d;
	--character-edit-bg-hover: #615056;
	--character-edit-color: #1b1b1b;
	--character-edit-color-hover: #000000;
}

body.body--dark .page-character-layout {
	--character-edit-bg: rgba(141, 181, 223, 0.22);
	--character-edit-bg-hover: rgba(141, 181, 223, 0.34);
	--character-edit-color: rgba(226, 237, 248, 0.95);
	--character-edit-color-hover: #f2f7ff;
}

.page-character-layout .q-item.edit-profile {
	background-color: var(--character-edit-bg);
	color: var(--character-edit-color);
	transition: background-color 0.25s ease, color 0.25s ease;
}

.page-character-layout .q-item.edit-profile:hover {
	background-color: var(--character-edit-bg-hover);
	color: var(--character-edit-color-hover);
}

.page-character-layout .q-item.edit-profile:hover .q-icon {
	color: var(--character-edit-color-hover);
}

.page-character-layout .q-item.edit-profile .q-icon,
.page-character-layout .q-item.edit-profile .q-item-section {
	transition: color 0.25s ease;
}

// ELPIS-201 — neutralize the global MainLayout drawer chrome for this nested
// drawer so .mat-aetherglass paints cleanly. MainLayout's `.q-drawer--left`
// rule uses `background:` shorthand (resetting background-color), sets a
// 12 px blur, a hairline border, and a top-glow `::before` overlay. Those tie
// on specificity with `.mat-aetherglass`, so the SFC source order picks the
// winner — to be deterministic we restate Aetherglass's surface values at
// higher specificity (.q-drawer.q-drawer--left.mat-aetherglass = 0,3,0).
.page-character-layout .q-drawer.q-drawer--left.mat-aetherglass {
	background-image: none;
	background-color: rgba(245, 239, 226, 0.88);
	border-right: none;
	-webkit-backdrop-filter: blur(14px) saturate(1.05);
	backdrop-filter: blur(14px) saturate(1.05);
}

body.body--dark .page-character-layout .q-drawer.q-drawer--left.mat-aetherglass {
	background-color: rgba(21, 11, 35, 0.78);
}

.page-character-layout .q-drawer.q-drawer--left.mat-aetherglass::before {
	display: none;
}

// ER2-110 — interim active state for the section drawer (until ER2-401),
// matching the venue drawer (ELPIS-406): 3 px gold rail plus a soft tint.
// The transition collapses under the global reduced-motion guard.
.page-character-layout__menu .q-item {
	transition:
		background-color var(--motion-base) var(--ease-elpis),
		color var(--motion-base) var(--ease-elpis);
}

.page-character-layout__menu .q-item.q-item--active {
	background-color: rgba(186, 155, 91, 0.14);
	color: var(--surface-ink);
	box-shadow: inset 3px 0 0 var(--rule-gold);
}

.page-character-layout__menu .q-item.q-item--active .q-item__section--avatar .q-icon {
	color: var(--rule-gold);
}

body.body--dark .page-character-layout__menu .q-item.q-item--active {
	background-color: rgba(193, 155, 255, 0.16);
	color: var(--ink-luminous);
	box-shadow: inset 3px 0 0 var(--rule-arcane);
}

body.body--dark .page-character-layout__menu .q-item.q-item--active .q-item__section--avatar .q-icon {
	color: var(--glow-aether-d);
}

// Page chrome: vellum is full-bleed against the q-layout edges, so drop the
// material's default 6 px radius and border so it reads as a panel, not a
// card. The cream surface, noise overlay, and warm shadow stay.
.page-character-layout .q-page.mat-vellum {
	border-radius: 0;
	border: none;
	min-height: 100%;
}
</style>
