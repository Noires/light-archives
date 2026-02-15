<template>
  <section class="banner-edit-section">
    <h6>{{ title }}</h6>
    <p class="text-caption">{{ effectiveHint }}</p>
    <q-responsive v-if="!modelValue" class="banner-edit-section__placeholder" :ratio="ratio">
      <div>Kein Banner</div>
    </q-responsive>
    <q-img
      v-else
      class="banner-edit-section__banner"
      :src="modelValue.url"
      :initial-ratio="modelValue.width / modelValue.height"
    />
    <div class="text-right">
      <q-btn
        v-if="modelValue"
        flat
        label="Entfernen"
        icon="remove"
        color="negative"
        @click="onBannerRemoveClick"
      />&nbsp;
      <q-btn flat label="Auswählen" icon="collections" color="secondary" @click="onBannerSelectClick" />&nbsp;
      <q-btn flat label="Hochladen" icon="upload" color="secondary" @click="onBannerUploadClick" />
    </div>
  </section>
</template>

<script lang="ts">
import { BannerDto } from '@app/shared/dto/characters/banner.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  modelValue = prop<BannerDto>({
    required: false,
  });

  title = prop<string>({
    default: 'Banner',
  });

  hint = prop<string>({
    default: '',
  });

  ratio = prop<number>({
    default: 4 / 1,
  });

  minAspectRatio = prop<number>({
    default: SharedConstants.MIN_BANNER_ASPECT_RATIO,
  });
}

@Options({
  emits: ['update:model-value'],
})
export default class BannerEditSection extends Vue.with(Props) {
  get effectiveHint() {
    if (this.hint) {
      return this.hint;
    }

    return `Mindestens ${this.aspectRatioHint} (Breite:Höhe), empfohlen ${this.recommendedSize}. Formate: JPG/PNG, max. ${this.maxUploadSizeMiB} MiB. Beim Hochladen kannst du den Banner-Ausschnitt zuschneiden.`;
  }

  get aspectRatioHint() {
    if (this.minAspectRatio === SharedConstants.MIN_BANNER_ASPECT_RATIO) {
      return '4:1';
    }

    if (this.minAspectRatio === SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
      return '5:2';
    }

    return `${this.minAspectRatio.toFixed(2)}:1`;
  }

  get recommendedSize() {
    if (this.minAspectRatio === SharedConstants.MIN_BANNER_ASPECT_RATIO) {
      return `${SharedConstants.RECOMMENDED_BANNER_WIDTH}x${SharedConstants.RECOMMENDED_BANNER_HEIGHT}`;
    }

    if (this.minAspectRatio === SharedConstants.MIN_DISCORD_BANNER_ASPECT_RATIO) {
      return `${SharedConstants.RECOMMENDED_DISCORD_BANNER_WIDTH}x${SharedConstants.RECOMMENDED_DISCORD_BANNER_HEIGHT}`;
    }

    const width = SharedConstants.RECOMMENDED_BANNER_WIDTH;
    const height = Math.round(width / this.minAspectRatio);
    return `${width}x${height}`;
  }

  get maxUploadSizeMiB() {
    const value = SharedConstants.MAX_UPLOAD_SIZE / (1024 * 1024);

    if (Number.isInteger(value)) {
      return value.toString();
    }

    return value.toFixed(1);
  }

  async onBannerSelectClick() {
    const GalleryDialog = (await import('components/common/GalleryDialog.vue')).default;

    this.$q
      .dialog({
        component: GalleryDialog,
        componentProps: {
          banner: true,
          minAspectRatio: this.minAspectRatio,
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setModel(new BannerDto({
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
        }));
      });
  }

  async onBannerUploadClick() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q
      .dialog({
        component: UploadDialog,
        componentProps: {
          banner: true,
          minAspectRatio: this.minAspectRatio,
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setModel(new BannerDto({
          id: image.id,
          url: image.url,
          width: image.width,
          height: image.height,
        }));
      });
  }

  onBannerRemoveClick() {
    this.setModel(null);
  }

  private setModel(model: BannerDto | null) {
    this.$emit('update:model-value', model);
  }
}
</script>

<style lang="scss">
.banner-edit-section__banner {
  margin-bottom: 16px;
}

.banner-edit-section__placeholder {
  background: #80a0c0;
  color: white;
  margin-bottom: 16px;
}

.banner-edit-section__placeholder div {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
