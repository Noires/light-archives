<template>
  <header class="venue-hero">
    <img v-if="bannerUrl" class="venue-hero__img" :src="bannerUrl" alt="" />
    <div class="venue-hero__scrim" aria-hidden="true"></div>
    <div class="venue-hero__inner">
      <breadcrumbs
        v-if="!preview"
        class="venue-hero__crumbs"
        :items="[{ label: 'Treffpunkte', to: '/venues' }, { label: venue.name || 'Treffpunkt' }]"
      />
      <div class="venue-hero__chips">
        <span v-if="status.state !== 'unknown'" class="venue-hero__chip" :class="`venue-hero__chip--${status.state}`">
          <span v-if="status.state === 'open'" class="venue-hero__dot" aria-hidden="true"></span>
          {{ status.label }}
        </span>
        <span v-if="venue.server" class="venue-hero__chip">
          <q-icon name="dns" aria-hidden="true" />
          {{ venue.server }}
        </span>
        <span v-for="tag in tags" :key="tag" class="venue-hero__chip">{{ tag }}</span>
      </div>
      <h1 class="venue-hero__title">{{ venue.name }}</h1>
      <p v-if="venue.purpose" class="venue-hero__motto">{{ venue.purpose }}</p>
      <p v-if="address" class="venue-hero__address">
        <q-icon name="place" aria-hidden="true" />
        {{ address }}
      </p>
      <div v-if="command || $slots.actions || showSocial" class="venue-hero__actions">
        <q-btn
          v-if="command"
          unelevated
          class="elpis-btn elpis-btn--primary"
          icon="content_copy"
          label="Teleport-Befehl kopieren"
          @click="copyCommand"
        >
          <q-tooltip>{{ command }}</q-tooltip>
        </q-btn>
        <slot name="actions" />
        <!-- ER2 social: follow/bookmark -->
        <template v-if="showSocial">
          <follow-button target-type="venue" :target-key="String(venue.id)" variant="on-media" />
          <bookmark-button target-type="venue" :target-id="venue.id" variant="on-media" />
        </template>
        <!-- /ER2 social: follow/bookmark -->
      </div>
    </div>
  </header>
</template>

<script lang="ts">
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import Breadcrumbs from 'components/vision/Breadcrumbs.vue';
import FollowButton from 'components/social/FollowButton.vue'; // ER2 social: follow/bookmark
import BookmarkButton from 'components/social/BookmarkButton.vue'; // ER2 social: follow/bookmark
import { canUseSocial, socialState } from 'components/social/social-state'; // ER2 social: follow/bookmark
import { Options, prop, Vue } from 'vue-class-component';
import { addressText, teleportCommand } from './venue-location';
import { VenueStatus, getVenueStatus } from './venue-status';

// ER2-509 — venue hero: banner (or gradient) with a left-to-right scrim,
// breadcrumb pill, open state, server and tags, Cinzel name, motto in IM Fell,
// address and the primary "Teleport-Befehl kopieren" action.

class Props {
  venue = prop<VenueDto>({ required: true });
  preview = prop<boolean>({ type: Boolean, default: false });
}

@Options({
  name: 'VenueHero',
  components: {
    Breadcrumbs,
    FollowButton, // ER2 social: follow/bookmark
    BookmarkButton, // ER2 social: follow/bookmark
  },
})
export default class VenueHero extends Vue.with(Props) {
  // ER2 social: follow/bookmark (the buttons hide themselves for guests or without the endpoints)
  get showSocial(): boolean {
    return !this.preview && !!this.venue.id && canUseSocial(this.$store.getters.realRole)
      && (!socialState.unavailable.follows || !socialState.unavailable.bookmarks);
  }

  get bannerUrl(): string {
    return this.venue.banner?.url || '';
  }

  get status(): VenueStatus {
    return getVenueStatus(this.venue);
  }

  get tags(): string[] {
    return (this.venue.tags || []).filter((tag) => !!tag).slice(0, 6);
  }

  get address(): string {
    return addressText(this.venue);
  }

  get command(): string {
    return teleportCommand(this.venue);
  }

  async copyCommand() {
    try {
      await copyToClipboard(this.command);
      notifySuccess(`Kopiert: ${this.command}`);
    } catch (e) {
      notifyError('Kopieren hat nicht geklappt.');
    }
  }
}
</script>

<style lang="scss" scoped>
// Hero text sits on a dark scrim in both themes: fixed light ink.
$hero-ink: #FFFFFF;
$hero-ink-soft: rgba(255, 255, 255, 0.86);

.venue-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 360px;
  margin-bottom: 16px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(120deg, #2B2418 0%, #3D2A55 55%, #6B4FA8 100%);
  color: $hero-ink;

  @media (max-width: 599px) {
    min-height: 300px;
    border-radius: 12px;
  }
}

.venue-hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.venue-hero__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(13, 17, 24, 0.9) 0%, rgba(13, 17, 24, 0.68) 50%, rgba(13, 17, 24, 0.2) 100%),
    linear-gradient(0deg, rgba(13, 17, 24, 0.55) 0%, rgba(13, 17, 24, 0) 60%);
}

.venue-hero__inner {
  position: relative;
  display: grid;
  gap: 10px;
  width: 100%;
  padding: 22px 32px 30px;

  @media (max-width: 599px) {
    padding: 16px 18px 22px;
  }
}

.venue-hero__crumbs {
  justify-self: start;
  margin-bottom: auto;
  padding: 4px 12px;
  border-radius: 999px;
  background-color: rgba(13, 17, 24, 0.55);
  backdrop-filter: blur(6px);

  :deep(*) {
    color: $hero-ink-soft !important;
  }

  :deep(a:hover) {
    color: $hero-ink !important;
  }
}

.venue-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 40px;
}

.venue-hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background-color: rgba(13, 17, 24, 0.45);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: $hero-ink;
}

.venue-hero__chip--open {
  border-color: #6EDCA8;
  color: #B9F2D6;
}

.venue-hero__chip--soon {
  border-color: #F3D9A4;
  color: #F3D9A4;
}

.venue-hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #6EDCA8;
  animation: venue-hero-pulse 2s ease-out infinite;
}

@keyframes venue-hero-pulse {
  0% { box-shadow: 0 0 0 0 rgba(110, 220, 168, 0.6); }
  70% { box-shadow: 0 0 0 8px rgba(110, 220, 168, 0); }
  100% { box-shadow: 0 0 0 0 rgba(110, 220, 168, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .venue-hero__dot {
    animation: none;
  }
}

.venue-hero__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 52px;
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: 0;
  color: $hero-ink;
  overflow-wrap: anywhere;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);

  @media (max-width: 599px) {
    font-size: 34px;
  }
}

.venue-hero__motto {
  margin: 0;
  max-width: 640px;
  font-family: var(--font-lore);
  font-size: 20px;
  font-style: italic;
  line-height: 1.35;
  color: $hero-ink-soft;
}

.venue-hero__address {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 15px;
  color: $hero-ink-soft;
}

.venue-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  // Secondary buttons from the slot read on the scrim.
  :slotted(.elpis-btn--secondary) {
    border-color: rgba(255, 255, 255, 0.6);
    color: $hero-ink;
  }
}
</style>
