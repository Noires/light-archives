<template>
	<span v-html="html" @click.capture="onClickCapture" />
</template>

<script lang="ts">
import html from '@app/shared/html';
import { onHtmlViewClickCapture } from 'src/common/html-view-utils';
import { bindHoverCards } from 'src/components/vision/hover-card';
import { parseWikilinksInHtml } from '@common/common/wikilinks';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
	content = prop<string>({
		required: true
	});
};

@Options({
	name: 'LinkField'
})
export default class LinkField extends Vue.with(Props) {
	get html() {
		return parseWikilinksInHtml(html.escape(this.content));
	}

	// ER2-208: hover cards for character, venue, event and wikilink anchors.
	private unbindHoverCards: (() => void) | null = null;

	mounted() {
		this.unbindHoverCards = bindHoverCards(this.$el as HTMLElement);
	}

	beforeUnmount() {
		this.unbindHoverCards?.();
		this.unbindHoverCards = null;
	}

	onClickCapture(event: Event) {
		onHtmlViewClickCapture(event, { links: true });
	}
}
</script>

<style lang="scss">
</style>
