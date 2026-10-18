<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card class="image-slides-dialog">
      <q-carousel
        v-model="index"
        swipeable
        animated
        arrows
        navigation
        padding
        control-type="regular"
        control-color="accent"
        transition-prev="fade"
        transition-next="fade"
        :transition-duration="220"
      >
        <template v-for="(image, i) in images" :key="image.id">
          <q-carousel-slide :name="i" :img-src="image.url">
            <div class="image-slides-dialog__caption-wrapper absolute-top text-center custom-caption">
              <div class="image-slides-dialog__caption">
                <router-link :to="`/image/${image.id}`" class="image-slides-dialog__title"
                  ><h6>{{ image.title }}</h6></router-link
                >
                <template v-if="image.owner">
                  <router-link v-if="image.ownerServer" :to="getOwnerLink(image)" class="image-slides-dialog__owner">{{
                    image.owner
                  }}</router-link>
                  <span v-else class="image-slides-dialog__owner">{{ image.owner }}</span>
                </template>
              </div>
            </div>
            <div
              v-if="image.description"
              class="image-slides-dialog__description-wrapper absolute-bottom custom-caption"
            >
              <div class="image-slides-dialog__description image-slides-dialog__caption">
                {{ image.description }}
                <q-tooltip v-if="image.description" anchor="top middle" self="bottom middle">{{
                  image.description
                }}</q-tooltip>
              </div>
            </div>
          </q-carousel-slide>
        </template>

        <template v-slot:control>
          <q-carousel-control position="bottom-right" :offset="[18, 18]">
            <q-btn
              :to="`/image/${images[index].id}`"
              title="Gehe zur Bildseite"
              push
              round
              dense
              color="accent"
              icon="image"
            />
          </q-carousel-control>
        </template>
      </q-carousel>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import { wikify } from '@common/common/wikilinks';
import { Options, prop, Vue } from 'vue-class-component';

interface DialogRef {
  show(): void;
  hide(): void;
}

class Props {
  images = prop<ImageSummaryDto[]>({
    required: true,
  });

  initialIndex = prop<number>({
    required: true,
  });
}

@Options({
  emits: ['ok', 'hide'],
})
export default class ImageSlidesDialog extends Vue.with(Props) {
  index = 0;
  fullscreen = false;

  created() {
    this.index = this.initialIndex;
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

  getOwnerLink(image: ImageSummaryDto): string {
    return `/${image.ownerServer!}/${wikify(image.owner!)}`;
  }
}
</script>

<style lang="scss">
.q-dialog__inner--minimized > div.image-slides-dialog {
  width: 90vw;
  max-width: 90vw;
  height: 90vh;
}

.image-slides-dialog .q-carousel {
  width: 100%;
  height: 100%;
}

.image-slides-dialog .q-carousel__slide {
  background-color: #1a1f2a;
  background-size: contain;
  background-repeat: no-repeat;
}

// ELPIS-610 — Crystal-faceted chevron arrows. Round 44 px Aetherglass disc,
// gold-ring border, warm radial inner highlight, and an aether halo on hover.
// Sits over the dark carousel slide so the gold reads cleanly.
.image-slides-dialog .q-carousel__prev-arrow .q-btn,
.image-slides-dialog .q-carousel__next-arrow .q-btn {
  width: 44px;
  height: 44px;
  min-height: 44px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 235, 192, 0.55) 0%, rgba(255, 235, 192, 0) 60%),
    linear-gradient(135deg, rgba(245, 213, 133, 0.92) 0%, var(--rule-gold) 55%, rgba(138, 106, 44, 0.85) 100%);
  color: var(--surface-pearl);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 0 -1px 0 rgba(80, 50, 18, 0.45),
    0 0 0 1px var(--rule-gold-soft),
    0 6px 14px rgba(43, 36, 24, 0.32);
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    background var(--motion-fast) var(--ease-elpis);
}

.image-slides-dialog .q-carousel__prev-arrow .q-btn .q-icon,
.image-slides-dialog .q-carousel__next-arrow .q-btn .q-icon {
  font-size: 24px;
  filter: drop-shadow(0 1px 0 rgba(80, 50, 18, 0.35));
}

.image-slides-dialog .q-carousel__prev-arrow .q-btn:hover,
.image-slides-dialog .q-carousel__next-arrow .q-btn:hover {
  transform: scale(1.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 0 rgba(80, 50, 18, 0.45),
    0 0 0 1px var(--rule-gold),
    0 0 18px rgba(186, 155, 91, 0.55),
    0 8px 18px rgba(43, 36, 24, 0.4);
}

.image-slides-dialog .q-carousel__prev-arrow .q-btn:focus-visible,
.image-slides-dialog .q-carousel__next-arrow .q-btn:focus-visible {
  outline: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 0 rgba(80, 50, 18, 0.45),
    0 0 0 1px var(--rule-gold),
    0 0 0 4px rgba(186, 155, 91, 0.36),
    0 6px 14px rgba(43, 36, 24, 0.4);
}

// Navigation dots reskinned to soft pearl / gold-on-active.
.image-slides-dialog .q-carousel__navigation-icon {
  color: rgba(255, 255, 255, 0.55);
  opacity: 1;
  transition: color var(--motion-fast) var(--ease-elpis);
}

.image-slides-dialog .q-carousel__navigation-icon--active {
  color: var(--rule-gold);
}

// Zodiark variant — chevrons flip onto an arcane-violet facet, dots onto luminous.
body.body--dark .image-slides-dialog .q-carousel__prev-arrow .q-btn,
body.body--dark .image-slides-dialog .q-carousel__next-arrow .q-btn {
  background:
    radial-gradient(circle at 30% 30%, rgba(213, 196, 255, 0.5) 0%, rgba(213, 196, 255, 0) 60%),
    linear-gradient(135deg, rgba(193, 155, 255, 0.92) 0%, var(--rule-arcane) 55%, rgba(60, 32, 110, 0.9) 100%);
  color: var(--ink-luminous);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 0 0 1px var(--rule-arcane-soft),
    0 6px 14px rgba(0, 0, 0, 0.5);
}

body.body--dark .image-slides-dialog .q-carousel__prev-arrow .q-btn:hover,
body.body--dark .image-slides-dialog .q-carousel__next-arrow .q-btn:hover {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 0 0 1px var(--rule-arcane),
    0 0 20px rgba(184, 165, 255, 0.55),
    0 8px 18px rgba(0, 0, 0, 0.55);
}

body.body--dark .image-slides-dialog .q-carousel__navigation-icon--active {
  color: var(--ink-luminous);
}

@media (prefers-reduced-motion: reduce) {
  .image-slides-dialog .q-carousel__prev-arrow .q-btn,
  .image-slides-dialog .q-carousel__next-arrow .q-btn {
    transition: none;
  }
  .image-slides-dialog .q-carousel__prev-arrow .q-btn:hover,
  .image-slides-dialog .q-carousel__next-arrow .q-btn:hover {
    transform: none;
  }
}

.image-slides-dialog__caption-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.image-slides-dialog__caption {
  background-color: rgba(13, 17, 24, 0.78);
  color: var(--surface-pearl);
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--rule-gold-soft);
  font-family: var(--font-display);
}

.image-slides-dialog__caption a {
  color: var(--surface-pearl);
}

.image-slides-dialog__caption h6 {
  margin: 0;
}

.image-slides-dialog__caption a:hover {
  color: var(--rule-gold);
}

.image-slides-dialog__description-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: calc(2em + 32px);
}

.image-slides-dialog__description {
  max-width: 90%;
  max-height: calc(1.2em + 16px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-section);
  font-style: italic;
}

body.body--dark .image-slides-dialog__caption {
  border-color: var(--rule-arcane-soft);
}

body.body--dark .image-slides-dialog__caption a:hover {
  color: var(--glow-aether-d);
}

.image-slides-dialog .q-carousel__navigation--bottom::-webkit-scrollbar {
  height: 6px;
}
</style>
