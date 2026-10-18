<template>
	<div>
		<a class="thumb-link" :href="modelValue.url" target="_blank"><img :src="modelValue.thumbUrl" alt="Vorschau" /></a>
		<step-image-details v-model="imageDetails" :album-character-id="ownerCharacterId" />
		<div class="image-editor__button-bar">
			<q-btn v-if="!fullPage" flat color="secondary" label="Abbrechen" @click="onCancelClick" />
			<q-btn :flat="!fullPage" :disable="!isValid" color="primary" label="Änderungen speichern" @click="onSaveClick" />
		</div>
		<q-inner-loading :showing="saving" />
	</div>
</template>

<script lang="ts">
import { ImageDescriptionDto } from '@app/shared/dto/image/image-desciption.dto';
import { ImageDto } from '@app/shared/dto/image/image.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { notifyError } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { ImageDetailsModel } from '../upload/image-details-model';
import StepImageDetails from '../upload/StepImageDetails.vue';

class Props {
	modelValue = prop<ImageDto>({
		required: true
	});
	fullPage = prop<boolean>({
		default: false
	});
}

@Options({
	name: 'ImageEditor',
	components: {
		StepImageDetails,
	},
	emits: [ 'update:model-value', 'cancel' ]
})
export default class ImageEditor extends Vue.with(Props) {
	imageDetails = {} as ImageDetailsModel;
	saving = false;

	created() {
		this.imageDetails = {
			characterId: null, // Not used for editing existing images
			title: this.modelValue.title,
			description: this.modelValue.description,
			category: this.modelValue.category,
			credits: this.modelValue.credits,
			event: this.modelValue.eventId ? {
				id: this.modelValue.eventId,
				title: this.modelValue.eventTitle!,
				startDateTime: -1
			} : null,
      venue: this.modelValue.venueId ? {
        id: this.modelValue.venueId,
        name: this.modelValue.venueName || '',
        server: this.modelValue.venueServer || '',
        purpose: '',
        housingArea: null,
        address: '',
      } : null,
		};
	}

	/** The user's character that owns the image (for its albums). */
	get ownerCharacterId(): number | null {
		const owner = this.$store.getters.characters.find(
			(character) => character.name === this.modelValue.author && character.server === this.modelValue.authorServer,
		);
		return owner ? owner.id : null;
	}

	mounted() {
		void this.loadOwnerDetails();
	}

	/** ER2 round 2: album membership is only on GET /images/:id (owner only). */
	async loadOwnerDetails() {
		try {
			const full = this.modelValue.albumIds ? this.modelValue : await this.$api.images.getImage(this.modelValue.id);

			if (full.albumIds && !this.imageDetails.albumIds) {
				this.imageDetails = { ...this.imageDetails, albumIds: [...full.albumIds] };
			}
		} catch {
			// Not critical: without album data the album field keeps membership unchanged.
		}
	}

	get isValid() {
		return (this.imageDetails.category === ImageCategory.UNLISTED || !!this.imageDetails.title)
      && !!this.imageDetails.credits;
	}

	onCancelClick() {
		this.$emit('cancel');
	}

	async onSaveClick() {
		try {
      this.saving = true;

			const imageDescriptionDto = new ImageDescriptionDto({
				title: this.imageDetails.title,
				description: this.imageDetails.description,
				category: this.imageDetails.category,
				credits: this.imageDetails.credits,
			});

			if (this.imageDetails.event) {
				Object.assign(imageDescriptionDto, { eventId: this.imageDetails.event.id });
			}

      if (this.imageDetails.venue) {
        Object.assign(imageDescriptionDto, { venueId: this.imageDetails.venue.id });
      }

      // Only when known; omitted keeps the current album membership.
      if (this.imageDetails.albumIds) {
        Object.assign(imageDescriptionDto, { albumIds: this.imageDetails.albumIds });
      }

      await this.$api.images.saveImage(this.modelValue.id, imageDescriptionDto);
			Object.assign(this.modelValue, imageDescriptionDto);
			
			if (this.imageDetails.event) {
				this.modelValue.eventTitle = this.imageDetails.event.title;
			} else {
				this.modelValue.eventId = null;
				this.modelValue.eventTitle = null;
			}

      if (this.imageDetails.venue) {
        this.modelValue.venueId = this.imageDetails.venue.id;
        this.modelValue.venueName = this.imageDetails.venue.name;
        this.modelValue.venueServer = this.imageDetails.venue.server;
      } else {
        this.modelValue.venueId = null;
        this.modelValue.venueName = null;
        this.modelValue.venueServer = null;
      }

			this.$emit('update:model-value', this.modelValue);
    } catch (e) {
      notifyError(e);
    } finally {
      this.saving = false;
    }
	}
}
</script>

<style lang="scss">
.image-editor__button-bar {
	margin-top: 8px;
	text-align: right;
}
</style>
