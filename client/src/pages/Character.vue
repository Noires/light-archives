<template>
	<q-layout class="rounded-borders no-outline">
		<q-drawer class="border-radius-inherit" v-model="drawer" show-if-above
			:mini="miniState" @mouseover="miniState = false" @mouseout="miniState = true" :width="200" :breakpoint="0">
			<q-scroll-area class="fit" :horizontal-thumb-style="{ opacity: 0 }">
				<q-list padding>
					<q-item clickable v-ripple @click="onTab('profile')">
						<q-item-section avatar>
							<q-icon name="account_circle" />
						</q-item-section>

						<q-item-section>
							Profil
						</q-item-section>
					</q-item>

					<q-item v-show="character.showAppearance" clickable v-ripple @click="onTab('appearance')">
						<q-item-section avatar>
							<q-icon name="curtains" />
						</q-item-section>

						<q-item-section>
							Aussehen
						</q-item-section>
					</q-item>

					<q-item v-show="character.showPersonality" clickable v-ripple @click="onTab('personality')">
						<q-item-section avatar>
							<q-icon name="psychology" />
						</q-item-section>

						<q-item-section>
							Persönlichkeit
						</q-item-section>
					</q-item>

					<q-item v-show="character.showContacts" clickable v-ripple @click="onTab('contacts')">
						<q-item-section avatar>
							<q-icon name="diversity_3" />
						</q-item-section>

						<q-item-section>
							Kontakte
						</q-item-section>
					</q-item>

					<q-item v-show="character.showRumors" clickable v-ripple @click="onTab('rumors')">
						<q-item-section avatar>
							<q-icon name="sms" />
						</q-item-section>

						<q-item-section>
							Gerüchte
						</q-item-section>
					</q-item>

					<q-item v-show="character.showDiary" clickable v-ripple @click="onTab('diary')">
						<q-item-section avatar>
							<q-icon name="auto_stories" />
						</q-item-section>

						<q-item-section>
							Tagebuch
						</q-item-section>
					</q-item>

					<q-item v-show="character.showGallery" clickable v-ripple @click="onTab('gallery')">
						<q-item-section avatar>
							<q-icon name="collections" />
						</q-item-section>

						<q-item-section>
							Galerie
						</q-item-section>
					</q-item>
					
					<q-item v-show="character.showInventory" clickable v-ripple @click="onTab('inventory')">
						<q-item-section avatar>
							<q-icon name="diamond" />
						</q-item-section>

						<q-item-section>
							Inventar
						</q-item-section>
					</q-item>
			
					<q-item v-if="character.mine" class="edit-profile" clickable v-ripple :to="`/edit-character/${character.id}/profile`">
						<q-item-section avatar>
							<q-icon class="edit-profile" name="edit" />
						</q-item-section>

						<q-item-section class="edit-profile">
							Profil bearbeiten
						</q-item-section>
					</q-item>


				</q-list>
			</q-scroll-area>
		</q-drawer>
		<q-page class="page-character">
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
	setContent(content: Content) {
		if ((content.content.images.length > 0) && (content.character.banner?.url != undefined))  {
			content.content.images = content.content.images.filter(x => !x.url.includes(content.character.banner!.url));
		}
		Object.assign(this, content);
	}

	onTab(tab: string) {
		this.tab = tab;
		console.log(tab);
	}

	displayDrawer(): boolean {
		return !!this.character.showAppearance || !!this.character.showPersonality || !!this.character.showContacts || !!this.character.showRumors || !!this.character.showDiary || !!this.character.showGallery;
	}
}



</script>

<style lang="scss">
.edit-profile {
	background-color: #9F848D;
	color: #1b1b1b;
}
</style>
