<template>
	<div class="step-thumbnail">
		<div class="step-thumbnail__col">
			<section class="step-thumbnail__description">
				<h6>Gesamtes Bild</h6>
				<div class="step-thumbnail__label">{{ originalLabel }}</div>
			</section>
			<section><img :src="image.src" /></section>
		</div>
		<div class="step-thumbnail__col">
			<section class="step-thumbnail__description">
				<h6>{{ thumbnailTitle }}</h6>
				<div class="step-thumbnail__label">{{ thumbnailLabel }}</div>
			</section>
			<section style="display: inline-block"><img ref="cropper" :src="image.src" /></section>
			<section v-if="isEventIconMode" class="step-thumbnail__event-preview">
				<div class="step-thumbnail__event-preview-label">50x50 Vorschau</div>
				<div class="step-thumbnail__event-preview-box">
					<img v-if="eventIconPreviewUrl" :src="eventIconPreviewUrl" alt="50x50 Event Icon Vorschau" />
					<q-icon v-else name="event" />
				</div>
			</section>
		</div>
	</div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import { ImageThumbModel } from './image-thumb-model';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

class Props {
	image = prop<HTMLImageElement>({
		required: true
	});

	modelValue = prop<ImageThumbModel>({
		default: null
	});

	mode = prop<string>({
		default: 'default'
	});
}

@Options({
	emits: [
		'update:model-value'
	]
})
export default class StepThumbnail extends Vue.with(Props) {
	private cropper: Cropper | null = null;
	eventIconPreviewUrl = '';

	get isEventIconMode() {
		return this.mode === 'event-icon';
	}

	get originalLabel() {
		if (this.isEventIconMode) {
			return 'Das gesamte Bild wird hochgeladen. Fuer das Event-Icon zaehlt der quadratische Ausschnitt.';
		}

		return 'Das gesamte Bild wird hochgeladen.';
	}

	get thumbnailTitle() {
		if (this.isEventIconMode) {
			return 'Event-Icon Ausschnitt';
		}

		return 'Thumbnail';
	}

	get thumbnailLabel() {
		if (this.isEventIconMode) {
			return 'Waehle den Bereich, der als Event-Icon sichtbar sein soll (Darstellung ca. 50x50).';
		}

		return 'Das Thumbnail wird in deinen Inhalten und den Galerien angezeigt.';
	}

	mounted() {
		this.cropper = new Cropper(this.$refs.cropper as HTMLImageElement, {
			viewMode: 2,
			aspectRatio: 1,
			autoCropArea: 0.5,
			zoomable: false,

			ready: () => {
				if (this.modelValue.left !== -1) {
					const { left, top, width } = this.modelValue;
					this.cropper!.setData({
						x: left,
						y: top,
						width,
						height: width,
					});
				}

				this.refreshEventIconPreview();
			},

			crop: event => {
				const { x, y, width } = event.detail;
				const roundedX = Math.round(x);
				const roundedY = Math.round(y);
				const roundedWidth = Math.round(width);

				this.$emit('update:model-value', {
					left: roundedX,
					top: roundedY,
					width: roundedWidth
				});

				if (this.isEventIconMode) {
					this.updateEventIconPreview(roundedX, roundedY, roundedWidth);
				}
			}
		});
	}

	unmounted() {
		if (this.cropper !== null) {
			this.cropper.destroy();
			this.cropper = null;
		}
	}

	private refreshEventIconPreview() {
		if (!this.isEventIconMode || this.cropper === null) {
			return;
		}

		const cropData = this.cropper.getData(true);

		if (!cropData.width || cropData.width <= 0) {
			this.eventIconPreviewUrl = '';
			return;
		}

		this.updateEventIconPreview(cropData.x, cropData.y, cropData.width);
	}

	private updateEventIconPreview(x: number, y: number, width: number) {
		if (width <= 0) {
			this.eventIconPreviewUrl = '';
			return;
		}

		const sourceImage = this.image;
		const maxX = Math.max(0, sourceImage.width - width);
		const maxY = Math.max(0, sourceImage.height - width);
		const clampedX = Math.max(0, Math.min(Math.round(x), maxX));
		const clampedY = Math.max(0, Math.min(Math.round(y), maxY));
		const clampedWidth = Math.min(Math.round(width), sourceImage.width, sourceImage.height);

		if (clampedWidth <= 0) {
			this.eventIconPreviewUrl = '';
			return;
		}

		const canvas = document.createElement('canvas');
		canvas.width = 50;
		canvas.height = 50;

		const context = canvas.getContext('2d');

		if (!context) {
			this.eventIconPreviewUrl = '';
			return;
		}

		context.imageSmoothingEnabled = true;
		context.clearRect(0, 0, 50, 50);
		context.drawImage(sourceImage, clampedX, clampedY, clampedWidth, clampedWidth, 0, 0, 50, 50);
		this.eventIconPreviewUrl = canvas.toDataURL('image/png');
	}
}
</script>

<style lang="scss">
.step-thumbnail {
	display: flex;
}

.step-thumbnail img {
	max-height: 50vh;
}

.step-thumbnail__col {
	padding-left: 8px;
	padding-right: 8px;
	display: flex;
	flex-direction: column;
}

.step-thumbnail__description {
	flex-basis: 0;
	flex-grow: 1;
}

.step-thumbnail__label {
	margin-bottom: 6px;
}

.step-thumbnail__event-preview {
	margin-top: 10px;
}

.step-thumbnail__event-preview-label {
	margin-bottom: 6px;
	font-size: 0.8rem;
	font-weight: 600;
}

.step-thumbnail__event-preview-box {
	width: 50px;
	height: 50px;
	border-radius: 10px;
	border: 1px solid rgba(0, 0, 0, 0.15);
	background: rgba(0, 0, 0, 0.05);
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
}

.step-thumbnail__event-preview-box img {
	width: 50px;
	height: 50px;
	max-height: none;
	object-fit: cover;
}
</style>
