<template>
	<div class="thumb-gallery">
		<div v-for="(image, index) in images" :key="image.id">
			<a v-if="links" class="thumb-gallery__image-wrapper thumb-link" :href="`/image/${image.id}`" :title="image.title" @click.prevent="openSlides(index)">
				<img :src="image.thumbUrl" :alt="image.title" />
			</a>
			<div v-else class="thumb-gallery__image-wrapper thumb-link" @click="select(image)">
				<img :src="image.thumbUrl" :alt="image.title" />
			</div>
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
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	margin-right: -12px;
}

.thumb-gallery__image-wrapper {
	display: flex;
	margin-right: 12px;
	margin-bottom: 12px;
	cursor: pointer;
	position: relative;
	border-radius: 0;
	overflow: hidden;
	background: linear-gradient(135deg, rgba(24, 32, 48, 0.08), rgba(24, 32, 48, 0.02));
	box-shadow: 0 14px 28px rgba(0, 0, 0, 0.12);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.thumb-gallery__image-wrapper:hover {
	transform: translateY(-3px);
	box-shadow: 0 18px 32px rgba(0, 0, 0, 0.16);
}

.thumb-gallery__image-wrapper::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0));
	opacity: 0;
	transition: opacity 0.2s ease;
	pointer-events: none;
}

.thumb-gallery img {
	background: #80a0c0;
	width: 174px;
	height: 174px;
	display: block;
	object-fit: cover;
	transition: transform 0.25s ease, filter 0.25s ease;
}

.thumb-gallery img:hover {
	filter: brightness(1.05) saturate(1.05);
	transform: scale(1.04);
}

.thumb-gallery__image-wrapper:hover::after {
	opacity: 1;
}

@media screen and (max-width: $breakpoint-sm) {
	.thumb-gallery > div {
		width: calc(((100% - 48px) / 4) + 12px);
	}

	.thumb-gallery img {
		width: 100%;
		height: auto;
	}
}

@media screen and (max-width: $breakpoint-xs) {
	.thumb-gallery {
		margin-right: -6px;
	}

	.thumb-gallery__image-wrapper {
		margin-right: 6px;
		margin-bottom: 6px;
	}

	.thumb-gallery > div {
		width: calc(((100% - 24px) / 4) + 6px);
	}

	.thumb-gallery img {
		width: 100%;
		height: auto;
	}
}

@media (prefers-reduced-motion: reduce) {
	.thumb-gallery__image-wrapper,
	.thumb-gallery img,
	.thumb-gallery__image-wrapper::after {
		transition: none;
	}

	.thumb-gallery__image-wrapper:hover {
		transform: none;
	}

	.thumb-gallery img:hover {
		transform: none;
	}
}
</style>
