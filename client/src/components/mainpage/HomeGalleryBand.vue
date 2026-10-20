<template>
	<section class="home-gallery" aria-labelledby="home-gallery-title">
		<div class="home-gallery__head">
			<div>
				<p class="home-gallery__eyebrow">Galerie</p>
				<h2 id="home-gallery-title" class="home-gallery__title">Momente der Woche</h2>
			</div>
			<q-btn
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				to="/gallery/screenshot"
				icon-right="arrow_forward"
				label="Zur Galerie"
			/>
		</div>

		<ul class="home-gallery__grid" :class="`home-gallery__grid--n${tiles.length}`">
			<li
				v-for="(image, index) in tiles"
				:key="image.id"
				class="home-gallery__tile"
				:class="{ 'home-gallery__tile--large': isLarge(index) }"
			>
				<a
					class="home-gallery__link"
					:href="`/image/${image.id}`"
					:aria-label="tileLabel(image)"
					@click.prevent="open(index)"
				>
					<img :src="isLarge(index) ? image.url : image.thumbUrl" alt="" loading="lazy" />
					<span class="home-gallery__caption" aria-hidden="true">
						<span class="home-gallery__caption-title">{{ image.title || 'Ohne Titel' }}</span>
						<span v-if="image.owner" class="home-gallery__caption-author">{{ image.owner }}</span>
					</span>
				</a>
			</li>
		</ul>
	</section>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';

// ER2-306 — "Momente der Woche": one large tile, a 2×2 block and one large
// tile from the newest screenshots and artwork. Tiles open the Lightbox;
// without JavaScript they link to the image page.

class Props {
	images = prop<ImageSummaryDto[]>({ default: () => [] });
}

@Options({
	name: 'HomeGalleryBand',
})
export default class HomeGalleryBand extends Vue.with(Props) {
	get tiles(): ImageSummaryDto[] {
		return this.images.slice(0, 6);
	}

	isLarge(index: number): boolean {
		return this.tiles.length === 6 && (index === 0 || index === 5);
	}

	tileLabel(image: ImageSummaryDto): string {
		const title = image.title || 'Ohne Titel';
		return image.owner ? `${title} von ${image.owner}` : title;
	}

	async open(index: number) {
		const Lightbox = (await import('components/vision/Lightbox.vue')).default;
		this.$q.dialog({
			component: Lightbox,
			componentProps: {
				images: this.tiles,
				initialIndex: index,
			},
		});
	}
}
</script>

<style lang="scss" scoped>
.home-gallery {
	position: relative;
	z-index: 1;
}

.home-gallery__head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 16px;
}

.home-gallery__eyebrow {
	margin: 0 0 6px;
	font-family: var(--font-ui);
	font-size: 12px;
	font-weight: 600;
	line-height: 16px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--ink-link);
}

.home-gallery__title {
	text-align: left;
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-5);
	font-weight: 600;
	line-height: var(--lh-heading);
	color: var(--ink-primary);
}

.home-gallery__grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	grid-auto-rows: 180px;
	gap: 12px;
	margin: 0;
	padding: 0;
	list-style: none;
}

// Six tiles: large | 2×2 | large.
.home-gallery__grid--n6 {
	grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
	grid-template-rows: repeat(2, 170px);
	grid-auto-rows: auto;

	.home-gallery__tile--large {
		grid-row: span 2;
	}
}

.home-gallery__tile {
	min-width: 0;
}

.home-gallery__link {
	position: relative;
	display: block;
	width: 100%;
	height: 100%;
	overflow: hidden;
	border-radius: 14px;
	border: 1px solid var(--rule-soft);
	background-color: var(--rule-tint);

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform var(--motion-base) var(--ease-elpis);
	}

	&:hover img {
		transform: scale(1.03);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

// Caption on a fixed dark gradient (the image underneath is unknown), so the
// text is white in both themes.
.home-gallery__caption {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
	padding: 28px 12px 10px;
	background: linear-gradient(to top, rgba(13, 17, 24, 0.86) 0%, rgba(13, 17, 24, 0.6) 55%, rgba(13, 17, 24, 0) 100%);
	color: #FFFFFF;
	font-family: var(--font-ui);
	opacity: 0;
	transition: opacity var(--motion-fast) var(--ease-elpis);
	pointer-events: none;
}

.home-gallery__link:hover .home-gallery__caption,
.home-gallery__link:focus-visible .home-gallery__caption {
	opacity: 1;
}

.home-gallery__caption-title,
.home-gallery__caption-author {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.home-gallery__caption-title {
	font-size: 14px;
	font-weight: 600;
	line-height: 18px;
}

.home-gallery__caption-author {
	font-size: 12px;
	line-height: 16px;
}

@media (hover: none) {
	.home-gallery__caption {
		opacity: 1;
	}
}

@media (max-width: 767px) {
	.home-gallery__grid--n6 {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: none;
		grid-auto-rows: 140px;

		.home-gallery__tile--large {
			grid-column: span 2;
			grid-row: span 2;
		}
	}
}

@media (prefers-reduced-motion: reduce) {
	.home-gallery__link img,
	.home-gallery__caption {
		transition: none;
	}

	.home-gallery__link:hover img {
		transform: none;
	}
}
</style>
