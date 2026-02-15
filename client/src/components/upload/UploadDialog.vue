<template>
  <q-dialog ref="dialog" no-backdrop-dismiss @hide="onDialogHide">
    <q-card
      ref="card"
      class="upload-dialog q-dialog-plugin"
      :class="{ 'upload-dialog_dragging': dragging }"
      @dragenter.capture="onDragEnter"
      @dragover.capture="onDragOver"
      @drop.capture="onDrop"
    >
      <q-stepper
        class="upload-dialog__stepper"
        v-model="step"
        color="primary"
        animated
        :contracted="$q.screen.lt.lg"
      >
        <q-step
          :name="Step.SELECT_IMAGE"
          title="Hochladen"
          icon="folder_open"
          active-icon="folder_open"
          :done="step !== Step.SELECT_IMAGE"
        >
          <step-select-image
            :banner="banner"
            :min-aspect-ratio="minAspectRatio"
            :allow-aspect-ratio-crop="requiresBannerCropStep"
            :model-value="fileModel"
            @update:model-value="onFileModelUpdated"
          />
        </q-step>
        <q-step
          v-if="requiresBannerCropStep"
          :name="Step.BANNER_CROP"
          title="Zuschneiden"
          icon="crop"
          active-icon="crop"
          :done="step === Step.THUMBNAIL || step === Step.IMAGE_DETAILS"
        >
          <step-banner-crop
            v-if="fileModel.image"
            :image="fileModel.image"
            :aspect-ratio="bannerAspectRatio"
            :output-width="bannerOutputWidth"
            v-model="bannerCropModel"
          />
        </q-step>
        <q-step
          :name="Step.THUMBNAIL"
          title="Thumbnail"
          icon="image"
          active-icon="image"
          :done="step === Step.IMAGE_DETAILS"
        >
          <step-thumbnail
            v-if="thumbnailSourceImage"
            :image="thumbnailSourceImage"
            v-model="thumbModel"
          />
        </q-step>
        <q-step :name="Step.IMAGE_DETAILS" title="Details" icon="edit" active-icon="edit">
          <step-image-details v-model="detailsModel" />
        </q-step>
      </q-stepper>
      <q-card-actions align="right">
        <q-btn flat color="secondary" label="Abbrechen" @click="onCancelClick" />
        <q-btn
          v-if="canGoBack"
          flat
          color="secondary"
          label="< Zurück"
          @click="goBack"
        />
        <q-btn
          v-if="step !== Step.IMAGE_DETAILS"
          :disable="!canGoNext || transitioning"
          flat
          color="primary"
          label="Weiter >"
          @click="goNext"
        />
        <q-btn
          v-else
          :disable="!canUpload || transitioning"
          color="primary"
          label="Hochladen"
          @click="onUploadClick"
        />
      </q-card-actions>
      <div
        class="upload-dialog__drag-overlay"
        v-show="dragging"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop.capture="onDrop"
      >
        Datei hier einfügen
      </div>
      <q-inner-loading :showing="uploading || transitioning" />
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { ImageUploadRequestDto } from '@app/shared/dto/image/image-upload-request.dto';
import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { ImageFormat } from '@app/shared/enums/image-format.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { cropImageElementForUpload, readImage } from 'src/common/images';
import { notifyError, notifySuccess } from 'src/common/notify';
import { Options, prop, Vue } from 'vue-class-component';
import { ImageBannerCropModel } from './image-banner-crop-model';
import { ImageDetailsModel } from './image-details-model';
import { ImageSelectModel } from './image-select-model';
import { ImageThumbModel } from './image-thumb-model';
import StepBannerCrop from './StepBannerCrop.vue';
import StepImageDetails from './StepImageDetails.vue';
import StepSelectImage from './StepSelectImage.vue';
import StepThumbnail from './StepThumbnail.vue';

enum Step {
  SELECT_IMAGE = 'SELECT_IMAGE',
  BANNER_CROP = 'BANNER_CROP',
  THUMBNAIL = 'THUMBNAIL',
  IMAGE_DETAILS = 'IMAGE_DETAILS',
}

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  banner = prop<boolean>({
    default: false,
  });

  minAspectRatio = prop<number | null>({
    default: null,
  });
}

const MIN_BANNER_ASPECT_RATIO = SharedConstants.MIN_BANNER_ASPECT_RATIO;

@Options({
  components: {
    StepBannerCrop,
    StepSelectImage,
    StepThumbnail,
    StepImageDetails,
  },
  emits: ['ok', 'hide'],
})
export default class UploadDialog extends Vue.with(Props) {
  readonly Step = Step;

  dragging = false;
  uploading = false;
  transitioning = false;

  step = Step.SELECT_IMAGE;
  fileModel: ImageSelectModel = {
    file: null,
    filename: null,
    image: null,
    originalFormat: null,
    format: null,
    convertedFile: null,
    hasTransparency: false,
  };
  thumbModel: ImageThumbModel = {
    left: -1,
    top: -1,
    width: -1,
  };
  bannerCropModel: ImageBannerCropModel = {
    left: -1,
    top: -1,
    width: -1,
    height: -1,
  };
  bannerCroppedFile: Blob | null = null;
  bannerCroppedFilename: string | null = null;
  bannerCroppedImage: HTMLImageElement | null = null;
  detailsModel: ImageDetailsModel = {
    characterId: null,
    category: ImageCategory.UNLISTED,
    title: '',
    description: '',
    credits: '',
    event: null,
  };

  created() {
    this.detailsModel.characterId = this.$store.getters.characterId || null;
  }

  show() {
    (this.$refs.dialog as DialogRef).show();
  }

  hide() {
    (this.$refs.dialog as DialogRef).hide();
  }

  onDragEnter(e: DragEvent) {
    const files = e.dataTransfer?.items || null;

    if (files && files.length > 0 && files[0].kind === 'file') {
      this.dragging = true;
    }

    e.stopPropagation();
    e.preventDefault();
  }

  onDragOver(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  onDragLeave(e: DragEvent) {
    this.dragging = false;
    e.stopPropagation();
    e.preventDefault();
  }

  onDrop(e: DragEvent) {
    this.dragging = false;
    e.stopPropagation();
    e.preventDefault();

    const files = e.dataTransfer?.items || null;

    if (files && files.length > 0 && files[0].kind === 'file') {
      this.fileModel = {
        file: files[0].getAsFile(),
        filename: null,
        image: null,
        originalFormat: null,
        format: null,
        convertedFile: null,
        hasTransparency: false,
      };
      this.resetImageDependentState();
      this.step = Step.SELECT_IMAGE;
    }
  }

  get canGoBack() {
    return this.step !== Step.SELECT_IMAGE;
  }

  get bannerAspectRatio() {
    return this.minAspectRatio ?? MIN_BANNER_ASPECT_RATIO;
  }

  get requiresBannerCropStep() {
    return this.banner;
  }

  get bannerOutputWidth() {
    if (this.bannerAspectRatio === SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
      return SharedConstants.RECOMMENDED_DISCORD_BANNER_WIDTH;
    }

    return SharedConstants.RECOMMENDED_BANNER_WIDTH;
  }

  get thumbnailSourceImage() {
    return this.bannerCroppedImage || this.fileModel.image;
  }

  goBack() {
    switch (this.step) {
      case Step.SELECT_IMAGE:
        return;
      case Step.BANNER_CROP:
        this.resetBannerCropOutput();
        this.step = Step.SELECT_IMAGE;
        return;
      case Step.THUMBNAIL:
        this.resetThumbModel();
        this.step = this.requiresBannerCropStep ? Step.BANNER_CROP : Step.SELECT_IMAGE;
        return;
      case Step.IMAGE_DETAILS:
        this.step = Step.THUMBNAIL;
        return;
    }
  }

  get canGoNext() {
    const minAspectRatio = this.minAspectRatio ?? (this.banner ? MIN_BANNER_ASPECT_RATIO : null);
    const convertedFile = this.fileModel.convertedFile;
    const image = this.fileModel.image;

    switch (this.step) {
      case Step.SELECT_IMAGE:
        if (!image) {
          return false;
        }

        if (this.requiresBannerCropStep) {
          return true;
        }

        if (!convertedFile || convertedFile.size > SharedConstants.MAX_UPLOAD_SIZE) {
          return false;
        }

        if (minAspectRatio && image.width / image.height < minAspectRatio) {
          return false;
        }

        return true;
      case Step.BANNER_CROP:
        return this.bannerCropModel.left !== -1;
      case Step.THUMBNAIL:
        return !!this.thumbnailSourceImage && this.thumbModel.left !== -1;
      case Step.IMAGE_DETAILS:
        return false;
    }
  }

  async goNext() {
    switch (this.step) {
      case Step.SELECT_IMAGE:
        this.step = this.requiresBannerCropStep ? Step.BANNER_CROP : Step.THUMBNAIL;
        return;
      case Step.BANNER_CROP:
        this.transitioning = true;

        try {
          await this.applyBannerCrop();
          this.step = Step.THUMBNAIL;
        } catch (e) {
          notifyError(e);
        } finally {
          this.transitioning = false;
        }

        return;
      case Step.THUMBNAIL:
        this.step = Step.IMAGE_DETAILS;
        return;
      case Step.IMAGE_DETAILS:
        return;
    }
  }

  get canUpload() {
    return this.step === Step.IMAGE_DETAILS
      && !!this.detailsModel.characterId
      && (this.detailsModel.category === ImageCategory.UNLISTED || !!this.detailsModel.title)
      && !!this.detailsModel.credits;
  }

  onDialogHide() {
    this.$emit('hide');
  }

  async onUploadClick() {
    try {
      this.uploading = true;

      const imageDto = await this.upload();

      notifySuccess('Bild hochgeladen.');
      this.$emit('ok', imageDto);
      this.hide();
    } catch (e) {
      notifyError(e);
    } finally {
      this.uploading = false;
    }
  }

  private async upload(): Promise<ImageSummaryDto> {
    const convertedFile = this.bannerCroppedFile || this.fileModel.convertedFile;
    const filename = this.bannerCroppedFilename || this.fileModel.filename;
    const { characterId } = this.detailsModel;

    if (!characterId || !convertedFile || !filename) {
      throw new Error('Missing required upload data');
    }

    const imageDto: ImageUploadRequestDto = {
      characterId,
      title: this.detailsModel.title,
      description: this.detailsModel.description,
      category: this.detailsModel.category,
      credits: this.detailsModel.credits,
      thumbLeft: this.thumbModel.left,
      thumbTop: this.thumbModel.top,
      thumbWidth: this.thumbModel.width,
    };

    if (this.detailsModel.event) {
      Object.assign(imageDto, { eventId: this.detailsModel.event.id });
    }

    return this.$api.images.uploadImage(imageDto, convertedFile, filename);
  }

  onCancelClick() {
    this.hide();
  }

  onFileModelUpdated(model: ImageSelectModel) {
    const fileChanged = this.fileModel.file !== model.file;
    const formatChanged = this.fileModel.format !== model.format;

    this.fileModel = model;

    if (fileChanged || formatChanged) {
      this.resetImageDependentState();
    }
  }

  private resetThumbModel() {
    this.thumbModel = {
      left: -1,
      top: -1,
      width: -1,
    };
  }

  private resetBannerCropOutput() {
    this.bannerCroppedFile = null;
    this.bannerCroppedFilename = null;
    this.bannerCroppedImage = null;
  }

  private resetImageDependentState() {
    this.resetThumbModel();
    this.bannerCropModel = {
      left: -1,
      top: -1,
      width: -1,
      height: -1,
    };
    this.resetBannerCropOutput();
  }

  private async applyBannerCrop() {
    const { image, filename, format } = this.fileModel;

    if (!image || !filename || this.bannerCropModel.left === -1) {
      throw new Error('Missing required crop data');
    }

    const cropResult = await cropImageElementForUpload(
      image,
      filename,
      format || ImageFormat.PNG,
      this.bannerCropModel,
      this.bannerOutputWidth
    );

    this.bannerCroppedFile = cropResult.blob;
    this.bannerCroppedFilename = cropResult.filename;
    this.bannerCroppedImage = await readImage(cropResult.blob);

    if (this.bannerCroppedFile.size > SharedConstants.MAX_UPLOAD_SIZE) {
      throw new Error(
        `Der zugeschnittene Banner ist zu groß (${this.$display.formatFileSize(this.bannerCroppedFile.size)}). Maximum ist ${this.$display.formatFileSize(SharedConstants.MAX_UPLOAD_SIZE)}. Bitte wähle einen kleineren Ausschnitt oder nutze JPEG.`,
      );
    }

    this.resetThumbModel();
  }
}
</script>

<style lang="scss">
.upload-dialog {
  width: 800px;
}

@media (min-width: 1280px) {
  .q-dialog__inner--minimized > .upload-dialog {
    max-width: 800px;
  }
}

.upload-dialog .q-stepper--horizontal .q-stepper__step-inner {
  padding: 16px 24px 0px 24px;
}

.upload-dialog__stepper .q-panel.scroll {
  overflow: hidden;
}

.upload-dialog img {
  max-width: 100%;
  height: auto;
}

.upload-dialog h6 {
  font-family: $form-header-font;
  font-size: 1.2em;
}

.upload-dialog_dragging > * {
  visibility: hidden;
}

.upload-dialog__drag-overlay {
  visibility: visible;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  background: white;
  color: #777;
  outline: 2px dashed #aaa;
  outline-offset: -5px;
}

.upload-dialog .q-inner-loading {
  z-index: 2;
}
</style>

