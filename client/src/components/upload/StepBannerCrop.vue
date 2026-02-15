<template>
  <div class="step-banner-crop">
    <section class="step-banner-crop__description">
      <h6>Banner zuschneiden</h6>
      <div class="step-banner-crop__label">
        Wähle den Ausschnitt im Verhältnis {{ aspectRatioHint }}. Ausgabe: {{ outputWidth }}x{{ outputHeight }}.
      </div>
    </section>
    <section class="step-banner-crop__image">
      <img ref="cropper" :src="image.src" />
    </section>
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
      },
      crop: event => {
        const { x, y, width, height } = event.detail;
        this.$emit('update:model-value', {
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        });
      },
    });
  }

  unmounted() {
    if (this.cropper) {
      this.cropper.destroy();
      this.cropper = null;
    }
  }
}
</script>

<style lang="scss">
.step-banner-crop {
  width: 100%;
}

.step-banner-crop img {
  display: block;
  max-height: 62vh;
  max-width: 100%;
}

.step-banner-crop__description {
  margin-bottom: 10px;
}

.step-banner-crop__label {
  margin-bottom: 8px;
}

.step-banner-crop__image {
  width: 100%;
}
</style>
