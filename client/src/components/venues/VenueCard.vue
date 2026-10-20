<template>
  <article class="venue-card" :class="{ 'venue-card--closed': status.state === 'closed' }">
    <div class="venue-card__media" :class="`venue-card__media--${areaKey}`">
      <img v-if="imageSrc" class="venue-card__img" :src="imageSrc" alt="" loading="lazy" />
      <q-icon v-else class="venue-card__placeholder" :name="placeholderIcon" aria-hidden="true" />
      <span v-if="status.state !== 'unknown'" class="venue-card__status">
        <status-badge :type="badgeType" :label="status.label" />
      </span>
      <span v-if="venue.adultOnly" class="venue-card__adult" title="Nur für Erwachsene">18+</span>
      <!-- ER2 social: bookmark -->
      <span v-if="venue.id" class="venue-card__bookmark">
        <bookmark-button target-type="venue" :target-id="venue.id" variant="icon" />
      </span>
      <!-- /ER2 social: bookmark -->
    </div>
    <div class="venue-card__body">
      <h2 class="venue-card__title">
        <router-link class="venue-card__link" :to="link">{{ venue.name }}</router-link>
      </h2>
      <p class="venue-card__address">
        <q-icon name="place" aria-hidden="true" />
        <span>{{ addressLabel }}</span>
      </p>
      <p v-if="venue.purpose" class="venue-card__purpose">{{ venue.purpose }}</p>
      <div v-if="hoursText || status.detail" class="venue-card__hours">
        <q-icon name="schedule" aria-hidden="true" />
        <span>{{ hoursText || status.detail }}</span>
      </div>
      <p v-if="nextEventLabel" class="venue-card__next">
        <q-icon name="event" aria-hidden="true" />
        <span>
          Nächstes Event:
          <router-link class="venue-card__next-link" :to="nextEventLink">{{ nextEventTitle }}</router-link>
          · {{ nextEventLabel }}
        </span>
      </p>
      <div v-if="showServer || shownTags.length" class="venue-card__tags">
        <span v-for="tag in shownTags" :key="tag" class="venue-card__tag">{{ tag }}</span>
        <span v-if="showServer" class="venue-card__tag">{{ venue.server }}</span>
      </div>
    </div>
  </article>
</template>

<script lang="ts">
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { DateTime } from 'luxon';
import StatusBadge from 'components/vision/StatusBadge.vue';
import BookmarkButton from 'components/social/BookmarkButton.vue'; // ER2 social: bookmark
import type { StatusBadgeType } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';
import { formatEventStart } from 'components/mainpage/home-data';
import { HOUSING_AREA_LABELS } from './venue-location';
import { VenueStatus, getVenueStatus, shortHours, statusBadgeType } from './venue-status';

// ER2-507 — venue directory card: 200 px media with the open-state badge,
// name, address, purpose, short opening hours and tags. Closed venues are
// dimmed, not hidden. ER2 round 2: banner, tags (max 3), 18+ badge and the
// next event come from the summary when the API sends them; without a banner
// the media shows the district-tinted placeholder (or `imageUrl` if passed).

const MAX_TAGS = 3;

class Props {
  venue = prop<VenueSummaryDto>({ required: true });
  imageUrl = prop<string>({ default: '' });
  showServer = prop<boolean>({ type: Boolean, default: true });
  /** Re-evaluation tick from the parent (epoch millis). */
  now = prop<number>({ default: 0 });
}

@Options({
  name: 'VenueCard',
  components: {
    BookmarkButton, // ER2 social: bookmark
    StatusBadge,
  },
})
export default class VenueCard extends Vue.with(Props) {
  get link(): string {
    return `/venue/${this.venue.server}/${this.venue.name.replace(/ /g, '_')}`;
  }

  get status(): VenueStatus {
    return getVenueStatus(this.venue, this.now ? DateTime.fromMillis(this.now) : undefined);
  }

  get badgeType(): StatusBadgeType {
    return statusBadgeType(this.status.state);
  }

  get hoursText(): string {
    return shortHours(this.venue);
  }

  get areaKey(): string {
    return this.venue.housingArea || 'open';
  }

  get areaLabel(): string {
    return this.venue.housingArea ? HOUSING_AREA_LABELS[this.venue.housingArea] || '' : 'Offene Welt';
  }

  get addressLabel(): string {
    return this.venue.address || this.areaLabel;
  }

  get imageSrc(): string {
    return this.imageUrl || this.venue.bannerUrl || '';
  }

  /** Own tags (they already include location type and district); else the district. */
  get shownTags(): string[] {
    const tags = (this.venue.tags || []).filter((tag) => !!tag && tag.trim());
    if (tags.length > 0) {
      return tags.slice(0, MAX_TAGS);
    }
    return this.areaLabel ? [this.areaLabel] : [];
  }

  get nextEventLabel(): string {
    const event = this.venue.nextEvent;
    if (!event || !event.title || !event.startDateTime) {
      return '';
    }
    return formatEventStart(event.startDateTime, this.now || Date.now());
  }

  get nextEventTitle(): string {
    return this.venue.nextEvent?.title || '';
  }

  get nextEventLink(): string {
    return `/event/${this.venue.nextEvent?.id || ''}`;
  }

  get placeholderIcon(): string {
    return this.venue.housingArea ? 'cottage' : 'storefront';
  }
}
</script>

<style lang="scss" scoped>
.venue-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
  transition:
    transform var(--motion-fast) var(--ease-elpis),
    border-color var(--motion-fast) var(--ease-elpis),
    box-shadow var(--motion-fast) var(--ease-elpis),
    opacity var(--motion-fast) var(--ease-elpis);

  &:hover,
  &:focus-within {
    transform: translateY(-2px);
    border-color: var(--rule-strong);
    box-shadow: 0 8px 22px var(--rule-tint);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover,
    &:focus-within {
      transform: none;
    }
  }
}

.venue-card--closed {
  opacity: 0.72;

  .venue-card__media {
    filter: saturate(0.4);
  }

  &:hover,
  &:focus-within {
    opacity: 1;
  }
}

.venue-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 384 / 200;
  overflow: hidden;
  // District tints: decorative only, no text sits on them except the badge,
  // which brings its own surface.
  background: linear-gradient(135deg, #3D2A55 0%, #6B4FA8 100%);
  color: rgba(255, 255, 255, 0.55);
}

.venue-card__media--mist { background: linear-gradient(135deg, #1F3B4D 0%, #4F7FA0 100%); }
.venue-card__media--lavender_beds { background: linear-gradient(135deg, #3B2A55 0%, #8A6BBE 100%); }
.venue-card__media--goblet { background: linear-gradient(135deg, #4D2F1F 0%, #B07A4A 100%); }
.venue-card__media--shirogane { background: linear-gradient(135deg, #4D1F2C 0%, #B05A6E 100%); }
.venue-card__media--empyreum { background: linear-gradient(135deg, #2B3346 0%, #8193B8 100%); }
.venue-card__media--open { background: linear-gradient(135deg, #2B2418 0%, #8A6A34 100%); }

.venue-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.venue-card__placeholder {
  font-size: 56px;
}

.venue-card__status {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  border-radius: 999px;
  background-color: var(--vision-card);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

// 18+ marker: danger fill with its paired ink (white on #B3363E in Hydaelyn,
// #0F1824 on #F08A93 in Zodiark), both above 4.5:1.
.venue-card__adult {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 2px 9px;
  border-radius: 999px;
  background-color: var(--vision-danger);
  color: var(--vision-on-danger);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

// ER2 social: bookmark — above the stretched card link (z-index 1).
.venue-card__bookmark {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  display: inline-flex;
}

.venue-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 16px;
}

.venue-card__title {
  text-align: left;
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.venue-card__link {
  color: var(--ink-primary) !important;
  text-decoration: none !important;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: 12px;
  }

  &:hover {
    text-decoration: underline !important;
  }

  &:focus-visible {
    outline: none;

    &::after {
      box-shadow: inset 0 0 0 2px var(--glow-aether), inset 0 0 0 3px var(--vision-focus-edge);
    }
  }
}

.venue-card__address,
.venue-card__hours,
.venue-card__next {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 13px;
  line-height: 18px;
  color: var(--ink-muted);

  .q-icon {
    margin-top: 1px;
    font-size: 15px;
  }
}

.venue-card__next-link {
  position: relative;
  z-index: 2;
  color: var(--ink-link);
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: none;
    border-radius: 2px;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.venue-card__purpose {
  margin: 0;
  font-family: var(--font-lore);
  font-size: 15px;
  font-style: italic;
  line-height: 1.4;
  color: var(--ink-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.venue-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
}

.venue-card__tag {
  padding: 1px 8px;
  border: 1px solid var(--rule-soft);
  border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 18px;
  color: var(--ink-muted);
}
</style>
