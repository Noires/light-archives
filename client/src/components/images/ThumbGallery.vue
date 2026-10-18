<template>
	<div class="thumb-gallery">
		<div v-for="(image, index) in images" :key="image.id">
			<a v-if="links" class="thumb-gallery__image-wrapper thumb-link" :href="`/image/${image.id}`" :title="image.title" @click.prevent="openSlides(index)">
				<img :src="image.thumbUrl" :alt="image.title" />
				<div v-if="image.title" class="thumb-gallery__caption">{{ image.title }}</div>
			</a>
			<button v-else type="button" class="thumb-gallery__image-wrapper thumb-link" :title="image.title" @click="select(image)">
				<img :src="image.thumbUrl" :alt="image.title" />
				<div v-if="image.title" class="thumb-gallery__caption">{{ image.title }}</div>
			</button>
		</div>
	</div>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
	images = prop<ImageSummaryDto[]>({
		required: true
	});
	
	links = prop<boolean>({
		default: true
	});
}

@Options({
	emits: 'select'
})
export default class ThumbGallery extends Vue.with(Props) {
	select(image: ImageSummaryDto) {
		this.$emit('select', image);
	}

	async openSlides(index: number) {
		const ImageSlidesDialog = (await import('./ImageSlidesDialog.vue')).default;

		this.$q.dialog({
			component: ImageSlidesDialog,
			componentProps: {
				images: this.images,
				initialIndex: index,
			}
		});
	}
}
</script>

<style lang="scss">
.thumb-gallery {
	// ER2-703 — grid instead of a centred flex row: the last row stays
	// left-aligned and tiles share the available width.
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	gap: 12px;
}

.thumb-gallery__image-wrapper {
	display: flex;
	width: 100%;
	aspect-ratio: 1 / 1;
	padding: 0;
	cursor: pointer;
	position: relative;
	border-radius: 6px;
	overflow: hidden;
	background: linear-gradient(135deg, rgba(24, 32, 48, 0.08), rgba(24, 32, 48, 0.02));
	border: 1px solid var(--rule-gold-soft);
	box-shadow: 0 6px 14px rgba(43, 36, 24, 0.08);
	font: inherit;
	transition:
		transform var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis);
}

.thumb-gallery__image-wrapper:focus-visible {
	outline: none;
	box-shadow:
		0 0 0 2px var(--glow-aether),
		0 0 0 3px var(--vision-focus-edge);
}

.thumb-gallery__image-wrapper:hover {
	transform: translateY(-4px);
	border-color: var(--rule-gold);
	box-shadow:
		0 1px 2px rgba(43, 36, 24, 0.06),
		0 14px 30px rgba(43, 36, 24, 0.16);
}

.thumb-gallery img {
	background: #80a0c0;
	width: 100%;
	height: 100%;
	display: block;
	object-fit: cover;
	transition:
		transform var(--motion-base) var(--ease-elpis),
		filter var(--motion-base) var(--ease-elpis);
}

.thumb-gallery__image-wrapper:hover img {
	filter: brightness(1.05) saturate(1.05);
	transform: scale(1.04);
}

// ELPIS-612 — lower-third caption: gradient backdrop so the title reads on
// any image; opacity 0 → 1 over 140 ms on hover. transform-Y nudge makes the
// caption slide up subtly. Reduced-motion guard zeroes the transition.
.thumb-gallery__caption {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 16px 10px 8px;
	background: linear-gradient(
		to top,
		rgba(13, 17, 24, 0.78) 0%,
		rgba(13, 17, 24, 0.55) 55%,
		rgba(13, 17, 24, 0) 100%
	);
	color: rgba(255, 255, 255, 0.96);
	font-family: var(--font-ui);
	font-size: var(--type-scale-0);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	font-weight: 600;
	line-height: 1.25;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	opacity: 0;
	transform: translateY(4px);
	transition:
		opacity var(--motion-fast) var(--ease-elpis),
		transform var(--motion-fast) var(--ease-elpis);
	pointer-events: none;
}

.thumb-gallery__image-wrapper:hover .thumb-gallery__caption,
.thumb-gallery__image-wrapper:focus-visible .thumb-gallery__caption {
	opacity: 1;
	transform: translateY(0);
}

@media screen and (max-width: $breakpoint-xs) {
	.thumb-gallery {
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: 6px;
	}
}

// ELPIS-612 — body-dark variant: thumbs sit on Obsidian. Hairline arcane-soft
// border + violet drop on hover; caption keeps the dark gradient backdrop so
// luminous ink reads cleanly.
body.body--dark .thumb-gallery__image-wrapper {
	border-color: var(--rule-arcane-soft);
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32);
}

body.body--dark .thumb-gallery__image-wrapper:hover {
	border-color: var(--rule-arcane);
	box-shadow:
		0 1px 2px rgba(0, 0, 0, 0.24),
		0 14px 30px rgba(0, 0, 0, 0.42);
}

body.body--dark .thumb-gallery__caption {
	color: var(--ink-luminous);
	background: linear-gradient(
		to top,
		rgba(0, 0, 0, 0.84) 0%,
		rgba(0, 0, 0, 0.6) 55%,
		rgba(0, 0, 0, 0) 100%
	);
}

@media (prefers-reduced-motion: reduce) {
	.thumb-gallery__image-wrapper,
	.thumb-gallery img,
	.thumb-gallery__caption {
		transition: none;
	}

	.thumb-gallery__image-wrapper:hover {
		transform: none;
	}

	.thumb-gallery__image-wrapper:hover img {
		transform: none;
	}

	.thumb-gallery__image-wrapper:hover .thumb-gallery__caption,
	.thumb-gallery__image-wrapper:focus-visible .thumb-gallery__caption {
		transform: none;
	}
}
</style>
