<template>
	<q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="gallery-dialog">
			<h5>Bild auswählen</h5>
      <p v-if="isEventIconMode" class="text-caption">
        Bestehende Bilder nutzen ihren bereits gespeicherten Thumbnail-Ausschnitt.
        Falls der Fokus fuer das Event-Icon nicht passt, lade das Bild neu hoch und waehle den Ausschnitt im 50x50-Preview-Schritt.
      </p>
			<section class="gallery-dialog__image-list">
				<thumb-gallery :images="images" :links="false" @select="onImageSelect" />
			</section>
			<q-card-actions class="gallery-dialog__buttons">
				<q-btn flat color="secondary" icon="upload" label="Hochladen" @click="onUploadClick" />
				<q-btn flat color="primary" label="Abbrechen" @click="onCancelClick" />
			</q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { Options, prop, Vue } from 'vue-class-component';
import ThumbGallery from '../images/ThumbGallery.vue';

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
	banner = prop<boolean>({
		default: false
	});

  minAspectRatio = prop<number | null>({
    default: null,
  });

  mode = prop<string>({
    default: 'default',
  });

  characterId = prop<number | null>({
    default: null,
  });
}

@Options({
	components: {
		ThumbGallery,
	},
  emits: ['ok', 'hide'],
})
export default class ConfirmImageDeleteDialog extends Vue.with(Props) {
	images: ImageSummaryDto[] = [];

  get isEventIconMode() {
    return this.mode === 'event-icon';
  }

	async created() {
		const characterId = this.characterId || this.$store.getters.characterId;

		if (!characterId) {
			return;
		}

		this.images = (await this.$api.characters.getMyImages(characterId)).map(image => ({
			id: image.id,
			title: image.title,
			filename: image.filename,
			thumbUrl: image.thumbUrl,
			url: image.url,
			createdAt: image.createdAt,
			width: image.width,
			height: image.height,
			owner: null,
			ownerServer: null,
			description: null,
		}));

    const minAspectRatio = this.minAspectRatio ?? (this.banner ? SharedConstants.MIN_BANNER_ASPECT_RATIO : null);

		if (minAspectRatio) {
			this.images = this.images.filter(image => image.width / image.height >= minAspectRatio);
		}
	}

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDialogHide() {
    this.$emit('hide');
  }

  async onUploadClick() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q.dialog({
      component: UploadDialog,
			componentProps: {
				banner: this.banner,
        minAspectRatio: this.minAspectRatio,
        mode: this.mode,
        characterId: this.characterId,
			}
    }).onOk((image: ImageSummaryDto) => {
      this.onImageSelect(image);
    });
  }

  onCancelClick() {
    this.hide();
  }

	onImageSelect(image: ImageSummaryDto) {
		this.$emit('ok', image);
		this.hide();
	}
}
</script>

<style lang="scss">
.gallery-dialog {
  width: 800px;
	padding: 8px 24px;
}

.gallery-dialog__buttons {
	justify-content: space-between;
}

@media (min-width: 1280px) {
	.q-dialog__inner--minimized > .gallery-dialog {
		max-width: 800px;
	}
}

.gallery-dialog__image-list {
	height: 50vh;
	overflow-x: hidden;
	overflow-y: auto;
}
</style>
