<template>
  <div class="step-select-image">
    <div
      class="step-select-image__dropzone elpis-drop-zone elpis-form"
      :class="{ 'elpis-drop-zone--dragging': isDragging }"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <q-file
        filled
        label="Bild auswählen"
        :model-value="modelValue.file"
        @update:model-value="selectFile"
      >
        <template v-slot:prepend>
          <q-icon name="image" @click.stop />
        </template>
        <template v-slot:append>
          <q-icon
            name="close"
            @click.stop.prevent="selectFile(null)"
            class="cursor-pointer"
          />
        </template>
      </q-file>
      <div v-show="isDragging" class="step-select-image__dropzone-overlay">
        <q-icon name="cloud_upload" size="44px" />
        <div class="step-select-image__dropzone-label">Bilddatei hier ablegen</div>
      </div>
    </div>
    <q-banner
      v-if="isEventIconMode"
      class="step-select-image__mode-hint bg-info text-black"
    >
      Event-Icon-Modus: Das Icon wird in der Eventansicht auf ca. 50x50 dargestellt.
      Waehle im naechsten Schritt einen klaren quadratischen Ausschnitt.
    </q-banner>
    <section v-if="!modelValue.file" class="step-select-image__hint">
      Du kannst deine Bilddatei auch per Drag &amp; Drop hier hochladen.
    </section>
    <template v-if="modelValue.image">
      <h6>Vorschau</h6>
      <img :src="modelValue.image.src" />
    </template>
    <q-banner
      v-if="modelValue.file && !modelValue.image"
      class="step-select-image__not-image bg-negative text-white"
    >
      Keine Bilddatei.
    </q-banner>
    <q-banner
      v-if="modelValue.image && !isValidAspectRatio && !allowAspectRatioCrop"
      class="step-select-image__not-image bg-negative text-white"
    >
      Banner müssen ein Seitenverhältnis von mindestens {{ aspectRatioHint }} haben.
    </q-banner>
    <q-banner
      v-if="modelValue.image && !isValidAspectRatio && allowAspectRatioCrop"
      class="step-select-image__not-image bg-info text-black"
    >
      Das Bild wird im nächsten Schritt auf {{ aspectRatioHint }} zugeschnitten.
    </q-banner>
    <template v-if="modelValue.file && modelValue.image">
      <section class="step-select-image__conversion">
        <div
          class="step-select-image__conversion-switches"
          v-if="canChooseFormat"
        >
          <q-radio
            v-model="modelValue.format"
            :val="ImageFormat.PNG"
            :label="
              modelValue.originalFormat === ImageFormat.PNG
                ? 'Als PNG beibehalten'
                : 'Zu PNG umwandeln'
            "
          />
          <q-radio
            v-model="modelValue.format"
            :val="ImageFormat.JPEG"
            label="Zu JPEG umwandeln"
          />
        </div>
        <div
          class="step-select-image__file-size"
          :class="{ 'text-negative': exceedsMaxFileSize && !allowAspectRatioCrop }"
        >
          <q-icon v-if="exceedsMaxFileSize && !allowAspectRatioCrop" name="error" />
          <template v-if="allowAspectRatioCrop">
            Originalgröße: {{ fileSize }} (finale Größe wird nach dem Zuschneiden berechnet)
          </template>
          <template v-else>
            Dateigröße: {{ fileSize }} (Maximum: {{ maxFileSize }})
          </template>
        </div>
      </section>
      <section v-if="allowAspectRatioCrop && exceedsMaxFileSize" class="text-caption">
        Du kannst trotzdem fortfahren. Für Banner zählt die Größe nach dem Zuschnitt.
      </section>
      <section v-if="canChooseFormat" class="text-caption">
        PNG-Dateien sind größer, erhalten aber die ursprünglichen Pixel. JPEG-Dateien
        sind kleiner und schneller herunterzuladen, können aber leichte, oftmals
        unauffällige Abweichungen zum Original aufweisen.
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { ImageFormat } from '@app/shared/enums/image-format.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { convertImageElementForUpload, hasTransparency, readImage } from 'src/common/images';
import { Options, prop, Vue } from 'vue-class-component';
import { ImageSelectModel } from './image-select-model';

interface ConversionResult {
  blob: Blob;
  filename: string;
  originalFormat: ImageFormat | null;
  newFormat: ImageFormat;
  hasTransparency: boolean;
}

class Props {
  modelValue = prop<ImageSelectModel>({
    default: {
      file: null,
      filename: null,
      image: null,
      convertedFile: null,
      originalFormat: null,
      format: null,
      hasTransparency: false,
    },
  });

  banner = prop<boolean>({
    default: false,
  });

  minAspectRatio = prop<number | null>({
    default: null,
  });

  allowAspectRatioCrop = prop<boolean>({
    default: false,
  });

  mode = prop<string>({
    default: 'default',
  });
}

@Options({
  emits: ['update:model-value'],
  watch: {
    modelValue: {
      handler(newValue: ImageSelectModel, oldValue: ImageSelectModel) {
        if (newValue.file && (!oldValue || newValue.file !== oldValue.file)) {
          void (this as StepSelectImage).selectFile(
            newValue.file,
            newValue.format
          );
        } else if (
          newValue.format &&
          (!oldValue || newValue.format !== oldValue.format)
        ) {
          void (this as StepSelectImage).selectFile(
            newValue.file,
            newValue.format
          );
        }
      },
    },
    'modelValue.format': {
      handler(newValue: ImageFormat | null, oldValue: ImageFormat | null) {
        if (newValue !== oldValue) {
          void (this as StepSelectImage).selectFile(
            (this as StepSelectImage).modelValue.file,
            newValue
          );
        }
      },
    },
  },
})
export default class StepSelectImage extends Vue.with(Props) {
  readonly ImageFormat = ImageFormat;

  isDragging = false;
  private dragCounter = 0;

  onDragEnter(event: DragEvent) {
    if (!event.dataTransfer || !Array.from(event.dataTransfer.types).includes('Files')) {
      return;
    }
    this.dragCounter += 1;
    this.isDragging = true;
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDragLeave() {
    this.dragCounter = Math.max(0, this.dragCounter - 1);
    if (this.dragCounter === 0) {
      this.isDragging = false;
    }
  }

  onDrop(event: DragEvent) {
    this.dragCounter = 0;
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      void this.selectFile(files[0]);
    }
  }

  async selectFile(file: File | null, format?: ImageFormat | null) {
    try {
      const image = await this.readImage(file);
      let blob: Blob | null = null;
      let originalFormat: ImageFormat | null = null;
      let newFormat: ImageFormat | null = null;
      let filename: string | null = null;
      let hasTransparencyValue = false;

      if (file !== null && image !== null) {
        const result = await this.convertImage(file, image, format || null);
        blob = result.blob;
        originalFormat = result.originalFormat;
        newFormat = result.newFormat;
        filename = result.filename;
        hasTransparencyValue = result.hasTransparency;
      }

      this.$emit('update:model-value', {
        file,
        filename,
        convertedFile: blob,
        originalFormat,
        format: newFormat,
        image,
        hasTransparency: hasTransparencyValue,
      });
    } catch (e) {
      console.log(e);
      this.$emit('update:model-value', {
        file,
        filename: null,
        image: null,
        convertedFile: null,
        originalFormat: null,
        format: null,
        hasTransparency: false,
      });
    }
  }

  async readImage(file: File | null): Promise<HTMLImageElement | null> {
    if (!file) {
      return null;
    }

    return readImage(file);
  }

  async convertImage(
    file: File,
    image: HTMLImageElement,
    format: ImageFormat | null
  ): Promise<ConversionResult> {
    if (this.allowAspectRatioCrop) {
      const originalFormat =
        file.type === 'image/png'
          ? ImageFormat.PNG
          : file.type === 'image/jpeg'
            ? ImageFormat.JPEG
            : null;
      const newFormat =
        format || (originalFormat === ImageFormat.JPEG ? ImageFormat.JPEG : ImageFormat.PNG);

      return {
        blob: file,
        filename: file.name,
        originalFormat,
        newFormat,
        hasTransparency: false,
      };
    }

    if (file.type === 'image/jpeg') {
      return {
        blob: file,
        filename: file.name,
        originalFormat: ImageFormat.JPEG,
        newFormat: ImageFormat.JPEG,
        hasTransparency: false,
      };
    }

    let originalFormat: ImageFormat | null = null;

    if (file.type === 'image/png') {
      originalFormat = ImageFormat.PNG;

      if (format === ImageFormat.PNG || !format) {
        return {
          blob: file,
          filename: file.name,
          originalFormat: ImageFormat.PNG,
          newFormat: ImageFormat.PNG,
          hasTransparency: hasTransparency(image),
        };
      }
    }

    const newFormat = format || ImageFormat.PNG;
    const result = await convertImageElementForUpload(
      image,
      file.name,
      newFormat
    );

    return {
      blob: result.blob,
      filename: result.filename,
      originalFormat,
      newFormat,
      hasTransparency: result.hasTransparency,
    };
  }

  get fileSize(): string {
    if (this.modelValue.convertedFile === null) {
      return '';
    }

    return this.$display.formatFileSize(this.modelValue.convertedFile.size);
  }

  get maxFileSize(): string {
    return this.$display.formatFileSize(SharedConstants.MAX_UPLOAD_SIZE);
  }

  get exceedsMaxFileSize(): boolean {
    return (
      !!this.modelValue.convertedFile &&
      this.modelValue.convertedFile.size > SharedConstants.MAX_UPLOAD_SIZE
    );
  }

  get canChooseFormat(): boolean {
    return this.modelValue.originalFormat !== ImageFormat.JPEG && !this.modelValue.hasTransparency;
  }

  get isValidAspectRatio() {
    if (!this.modelValue.image) {
      return true;
    }

    const minAspectRatio = this.minAspectRatio ?? (this.banner ? SharedConstants.MIN_BANNER_ASPECT_RATIO : null);

    if (!minAspectRatio) {
      return true;
    }

    return this.modelValue.image.width / this.modelValue.image.height >= minAspectRatio;
  }

  get aspectRatioHint() {
    const minAspectRatio = this.minAspectRatio ?? (this.banner ? SharedConstants.MIN_BANNER_ASPECT_RATIO : null);

    if (!minAspectRatio || minAspectRatio === 4 / 1) {
      return '4:1';
    }

    if (minAspectRatio === 5 / 2) {
      return '5:2';
    }

    return `${minAspectRatio.toFixed(2)}:1`;
  }

  get isEventIconMode() {
    return this.mode === 'event-icon';
  }
}
</script>

<style lang="scss">
.step-select-image img {
  max-height: 50vh;
}

.step-select-image__dropzone {
  position: relative;
  padding: 4px;
}

.step-select-image__dropzone-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  background: rgba(186, 155, 91, 0.16);
  color: var(--rule-gold);
  pointer-events: none;
  z-index: 2;
}

.step-select-image__dropzone-label {
  font-family: var(--font-ui);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  font-size: var(--type-scale-1);
  color: var(--rule-gold);
}

.step-select-image__hint {
  margin-top: 8px;
  font-family: var(--font-section);
  font-style: italic;
  color: var(--ink-muted);
  font-size: var(--type-scale-1);
}

.step-select-image__mode-hint {
  margin-top: 8px;
  margin-bottom: 8px;
}

.step-select-image__not-image {
  margin-top: 8px;
  margin-bottom: 8px;
}

.step-select-image__conversion {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

body.body--dark .step-select-image__dropzone-overlay {
  background: rgba(107, 79, 168, 0.28);
  color: var(--ink-luminous);
}

body.body--dark .step-select-image__dropzone-label {
  color: var(--ink-luminous);
}

body.body--dark .step-select-image__hint {
  color: rgba(236, 227, 247, 0.74);
}
</style>
