<template>
	<section v-html="sanitizedContent" @click.capture="onClickCapture"></section>
</template>

<script lang="ts">
import html from '@app/shared/html';
import { onHtmlViewClickCapture } from 'src/common/html-view-utils';
import { bindHoverCards } from 'src/components/vision/hover-card';
import { parseWikilinksInHtml } from '@common/common/wikilinks';
import { initializeFandomTabs } from 'src/common/fandom-tabs';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
	content = prop<string>({
		required: true
	});
}

@Options({
	name: 'HtmlViewer',
})
export default class HtmlViewer extends Vue.with(Props) {
	get sanitizedContent() {
		return parseWikilinksInHtml(html.sanitize(this.content));
	}

	// ER2-208: hover cards for character, venue, event and wikilink anchors.
	private unbindHoverCards: (() => void) | null = null;

	mounted() {
		this.initializeTabs();
		this.unbindHoverCards = bindHoverCards(this.$el as HTMLElement);
	}

	beforeUnmount() {
		this.unbindHoverCards?.();
		this.unbindHoverCards = null;
	}

	updated() {
		this.initializeTabs();
	}

	initializeTabs() {
		// Initialize Fandom tabs after content is rendered
		void this.$nextTick(() => {
			const container = this.$el as HTMLElement;
			if (container) {
				initializeFandomTabs(container);
			}
		});
	}

	onClickCapture(event: Event) {
    onHtmlViewClickCapture(event, { links: true });
  }
}
</script>
