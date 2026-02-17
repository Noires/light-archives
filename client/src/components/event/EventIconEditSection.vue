<template>
  <section class="event-icon-edit-section">
    <h6>Icon</h6>
    <p class="text-caption">
      Optionales Event-Icon. Es wird in der Eventansicht auf ca. 50x50 und in Kalenderlisten kleiner dargestellt.
      Empfohlen: quadratisch (z.B. 128x128 oder groesser) mit klarem Motiv.
    </p>
    <q-responsive v-if="!modelValue" class="event-icon-edit-section__placeholder" :ratio="1">
      <div class="event-icon-edit-section__placeholder-content">
        <q-icon name="event" size="16px" />
        <div class="event-icon-edit-section__placeholder-text">Kein Icon</div>
      </div>
    </q-responsive>
    <q-img
      v-else
      class="event-icon-edit-section__image"
      :src="iconUrl"
      :ratio="1"
      fit="cover"
    />
    <div class="text-right">
      <q-btn
        v-if="modelValue"
        flat
        label="Entfernen"
        icon="remove"
        color="negative"
        @click="onIconRemoveClick"
      />&nbsp;
      <q-btn flat label="Auswaehlen" icon="collections" color="secondary" @click="onIconSelectClick" />&nbsp;
      <q-btn flat label="Hochladen" icon="upload" color="secondary" @click="onIconUploadClick" />
    </div>
  </section>
</template>

<script lang="ts">
import { EventIconDto } from '@app/shared/dto/events/event-icon.dto';
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';

class Props {
  modelValue = prop<EventIconDto>({
    required: false
  });
}

@Options({
  emits: ['update:model-value']
})
export default class EventIconEditSection extends Vue.with(Props) {
  get iconUrl() {
    return this.modelValue?.previewUrl || this.modelValue?.thumbUrl || this.modelValue?.url || '';
  }

  async onIconSelectClick() {
    const GalleryDialog = (await import('components/common/GalleryDialog.vue')).default;

    this.$q
      .dialog({
        component: GalleryDialog,
        componentProps: {
          mode: 'event-icon',
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setModel(this.toIconDto(image));
      });
  }

  async onIconUploadClick() {
    const UploadDialog = (await import('components/upload/UploadDialog.vue')).default;

    this.$q
      .dialog({
        component: UploadDialog,
        componentProps: {
          mode: 'event-icon',
        },
      })
      .onOk((image: ImageSummaryDto) => {
        this.setModel(this.toIconDto(image));
      });
  }

  onIconRemoveClick() {
    this.setModel(null);
  }

  private toIconDto(image: ImageSummaryDto) {
    return new EventIconDto({
      id: image.id,
      previewUrl: image.thumbUrl,
      url: image.url,
      thumbUrl: image.thumbUrl,
      width: image.width,
      height: image.height,
    });
  }

  private setModel(model: EventIconDto | null) {
    this.$emit('update:model-value', model);
  }
}
</script>

<style lang="scss">
.event-icon-edit-section__image {
  margin-bottom: 16px;
  border-radius: 12px;
  width: 50px;
  max-width: 100%;
}

.event-icon-edit-section__placeholder {
  margin-bottom: 16px;
  background: #f0f2f6;
  border-radius: 12px;
  color: #6a7a8c;
  width: 50px;
  max-width: 100%;
}

.event-icon-edit-section__placeholder-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.event-icon-edit-section__placeholder-text {
  font-size: 0.55rem;
  line-height: 1;
  text-align: center;
}
</style>
