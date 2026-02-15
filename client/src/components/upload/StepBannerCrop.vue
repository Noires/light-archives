<template>
  <div class="step-banner-crop">
    <div class="step-banner-crop__col">
      <section class="step-banner-crop__description">
        <h6>Banner zuschneiden</h6>
        <div class="step-banner-crop__label">
          Wähle den Ausschnitt im Verhältnis {{ aspectRatioHint }}.
        </div>
      </section>
      <section style="display: inline-block"><img ref="cropper" :src="image.src" /></section>
    </div>
    <div class="step-banner-crop__col">
      <section class="step-banner-crop__description">
        <h6>Live-Vorschau</h6>
        <div class="step-banner-crop__label">
          Ausgabe: {{ outputWidth }}x{{ outputHeight }} ({{ aspectRatioHint }})
        </div>
      </section>
      <section class="step-banner-crop__preview">
        <img v-if="previewUrl" :key="previewRevision" :src="previewUrl" alt="Banner preview" />
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { ImageBannerCropModel } from './image-banner-crop-model';

class Props {
  image = prop<HTMLImageElement>({
    required: true,
  });

  aspectRatio = prop<number>({
    required: true,
  });

  outputWidth = prop<number>({
    default: 1600,
  });

  modelValue = prop<ImageBannerCropModel>({
    default: null,
  });
}

@Options({
  emits: ['update:model-value'],
})
export default class StepBannerCrop extends Vue.with(Props) {
  private cropper: Cropper | null = null;
  private previewFrameId: number | null = null;

  previewUrl = '';
  previewRevision = 0;

  get outputHeight() {
    return Math.round(this.outputWidth / this.aspectRatio);
  }

  get aspectRatioHint() {
    if (this.aspectRatio === 4 / 1) {
      return '4:1';
    }

    if (this.aspectRatio === 5 / 2) {
      return '5:2';
    }

    return `${this.aspectRatio.toFixed(2)}:1`;
  }

  mounted() {
    this.cropper = new Cropper(this.$refs.cropper as HTMLImageElement, {
      viewMode: 2,
      aspectRatio: this.aspectRatio,
      autoCropArea: 0.8,
      zoomable: false,
      ready: () => {
        if (this.modelValue && this.modelValue.left !== -1) {
          this.cropper?.setData({
            x: this.modelValue.left,
            y: this.modelValue.top,
            width: this.modelValue.width,
            height: this.modelValue.height,
          });
        }

        this.schedulePreviewUpdate();
      },
      crop: event => {
        const { x, y, width, height } = event.detail;
        this.$emit('update:model-value', {
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        });
        this.schedulePreviewUpdate();
      },
      cropmove: () => this.schedulePreviewUpdate(),
      cropend: () => this.schedulePreviewUpdate(),
    });
  }

  unmounted() {
    if (this.previewFrameId !== null) {
      cancelAnimationFrame(this.previewFrameId);
      this.previewFrameId = null;
    }

    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }

  private schedulePreviewUpdate() {
    if (this.previewFrameId !== null) {
      cancelAnimationFrame(this.previewFrameId);
    }

    this.previewFrameId = requestAnimationFrame(() => {
      this.previewFrameId = null;
      this.updatePreview();
    });
  }

  private updatePreview() {
    if (!this.cropper) {
      return;
    }

    const canvas = this.cropper.getCroppedCanvas({
      width: this.outputWidth,
      height: this.outputHeight,
    });

    if (!canvas) {
      return;
    }

    this.previewUrl = canvas.toDataURL('image/jpeg', 0.9);
    this.previewRevision += 1;
  }
}
</script>

<style lang="scss">
.step-banner-crop {
  display: flex;
}

.step-banner-crop img {
  max-height: 50vh;
  max-width: 100%;
}

.step-banner-crop__col {
  padding-left: 8px;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  width: 50%;
}

.step-banner-crop__description {
  flex-basis: 0;
  flex-grow: 1;
}

.step-banner-crop__label {
  margin-bottom: 6px;
}

.step-banner-crop__preview {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #111;
}
</style>
