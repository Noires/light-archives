<template>
  <q-page class="page-story">
		<scroll-progress-rule />
		<transition name="page-turn">
			<div v-if="story.id" :key="story.id" class="page-story__pane">
				<section v-if="story.mine" class="edit-bar">
					<q-btn flat color="secondary" label="Geschichte bearbeiten" :to="`/edit-story/${story.id}`" />
					<q-btn flat color="negative" label="Geschichte löschen" @click="onDeleteClick" />
				</section>
				<story-view :story="story" />
				<report-violation-section :pageType="PageType.STORY" :pageId="story.id" />
			</div>
		</transition>
	</q-page>
</template>

<script lang="ts">
import { StoryDto } from '@app/shared/dto/stories/story.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import StoryView from 'components/stories/StoryView.vue';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import ScrollProgressRule from 'src/components/common/ScrollProgressRule.vue';

const $api = useApi();
const $router = useRouter();

async function load(params: RouteParams): Promise<StoryDto> {
	const id = parseInt(params.id as string, 10);

	if (!id) {
		void $router.replace('/');
		throw new Error();
	}

	try {
		const story = await $api.stories.getStory(id);
		document.title = `${story.title} — Elpisgarten`;
		return story;
	} catch (e) {
		if (errors.getStatusCode(e) === 404) {
			notifyError('Geschichte konnte nicht gefunden werden.');
			void $router.replace('/');
		} else {
			notifyError(e);
		}

		throw e;
	}
}

@Options({
	name: 'PageStory',
	components: {
		StoryView,
		ReportViolationSection,
		ScrollProgressRule,
	},
	async beforeRouteEnter(to, _, next) {
		const story = await load(to.params);
		next(vm => (vm as PageStory).setContent(story));
	},
	async beforeRouteUpdate(to) {
		const story = await load(to.params);
		(this as PageStory).setContent(story);
	}
})
export default class PageStory extends Vue {
	readonly PageType = PageType;
	
	story: StoryDto = new StoryDto();
	
	setContent(story: StoryDto) {
		this.story = story;
	}

	onDeleteClick() {
		this.$q.dialog({
        title: 'Löschbestätigung',
        message: `Möchtest du “${this.story.title}” wirklich löschen?`,
				ok: {
					label: 'Löschen',
					color: 'negative',
					flat: true
				},
        cancel: 'Abbrechen',
      }).onOk(async () => {
        try {
					await this.$api.stories.deleteStory(this.story.id!);

					notifySuccess('Geschichte gelöscht.');
					void this.$router.replace('/');
				} catch (e) {
					notifyError(e);
				}
      });
	}
}
</script>

<style lang="scss">
// ELPIS-504 — Page-turn transition between stories. The key on
// `.page-story__pane` is the story id, so navigating to a sibling story (e.g.
// via a series-next link or any internal /story/:id router-link) triggers
// Vue's <Transition> over a 380 ms left fold-out. First arrival at /story/:id
// has no prior pane, so Vue does not run the enter animation — the AC's
// "single article = no animation" clause is satisfied by Vue's default
// mount-without-appear behaviour.
.page-story {
	position: relative;
	overflow: hidden;
}

.page-story__pane {
	transform-origin: left center;
	will-change: transform, opacity;
	backface-visibility: hidden;
}

.page-turn-enter-active,
.page-turn-leave-active {
	transition:
		transform 380ms cubic-bezier(0.43, 0.13, 0.23, 0.96),
		opacity 380ms ease-out;
}

.page-turn-leave-active {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
}

.page-turn-enter-from {
	opacity: 0;
	transform: perspective(1200px) rotateY(8deg) translateX(10px);
}

.page-turn-leave-to {
	opacity: 0;
	transform: perspective(1200px) rotateY(-26deg) translateX(-14px);
	box-shadow: -18px 0 32px rgba(43, 36, 24, 0.18);
}

@media (prefers-reduced-motion: reduce) {
	.page-turn-enter-active,
	.page-turn-leave-active {
		transition: none;
	}
	.page-turn-enter-from,
	.page-turn-leave-to {
		opacity: 1;
		transform: none;
		box-shadow: none;
	}
	.page-turn-leave-active {
		position: static;
	}
}
</style>
