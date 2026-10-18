<template>
  <section class="event-location" :aria-labelledby="headingId">
    <img v-if="imageUrl" class="event-location__image" :src="imageUrl" alt="" loading="lazy" />
    <div class="event-location__body">
      <div class="event-location__head">
        <h2 :id="headingId" class="event-location__title">{{ index === 0 ? 'Ort' : `Ort ${index + 1}` }}</h2>
        <status-badge v-if="status.state !== 'unknown'" :type="badgeType" :label="status.label" />
      </div>
      <p class="event-location__name">
        <router-link v-if="venueLink" :to="venueLink">{{ name }}</router-link>
        <template v-else>{{ name }}</template>
      </p>

      <dl v-if="rows.length" class="event-location__rows">
        <template v-for="row in rows" :key="row.label">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </template>
      </dl>

      <div v-if="command" class="event-location__command">
        <code class="event-location__code">{{ command }}</code>
        <q-btn
          flat
          dense
          class="elpis-btn elpis-btn--secondary"
          icon="content_copy"
          label="Kopieren"
          :aria-label="`Teleport-Befehl ${command} kopieren`"
          @click="copyCommand"
        />
      </div>

      <p v-if="location.link" class="event-location__row">
        <q-icon name="link" aria-hidden="true" />
        <a :href="location.link" target="_blank" rel="noopener">{{ (location.linkText || '').trim() || location.link }}</a>
      </p>
      <router-link v-if="venueLink" class="event-location__more" :to="venueLink">Zum Treffpunkt</router-link>
    </div>
  </section>
</template>

<script lang="ts">
import { EventLocationDto } from '@app/shared/dto/events/event-location.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { copyToClipboard } from 'quasar';
import { notifyError, notifySuccess } from 'src/common/notify';
import StatusBadge from 'components/vision/StatusBadge.vue';
import type { StatusBadgeType } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';
import { LocationRow, hasHousing, locationRows, teleportCommand } from '../venues/venue-location';
import { VenueStatus, getVenueStatus, statusBadgeType } from '../venues/venue-status';

// ER2-505 — event location. With a linked venue that has housing data it
// shows Welt / Wohngebiet / Bezirk / Haus, the venue's open state and a
// copyable `/li` teleport command; otherwise the free-text address.

class Props {
  location = prop<EventLocationDto>({ required: true });
  venue = prop<VenueDto | null>({ default: null });
  index = prop<number>({ default: 0 });
}

@Options({
  name: 'EventLocationCard',
  components: { StatusBadge },
})
export default class EventLocationCard extends Vue.with(Props) {
  get headingId(): string {
    return `event-location-${this.index}`;
  }

  get imageUrl(): string {
    return this.venue?.banner?.url || '';
  }

  get name(): string {
    return this.location.name || this.venue?.name || this.location.address || this.location.server || 'Unbekannter Ort';
  }

  get venueLink(): string {
    return this.location.venueId ? `/venue/${this.location.venueId}` : '';
  }

  get status(): VenueStatus {
    return getVenueStatus(this.venue);
  }

  get badgeType(): StatusBadgeType {
    return statusBadgeType(this.status.state);
  }

  get rows(): LocationRow[] {
    if (this.venue && hasHousing(this.venue)) {
      return locationRows(this.venue);
    }
    const rows: LocationRow[] = [];
    if (this.location.server) {
      rows.push({ label: 'Welt', value: this.location.server });
    }
    const address = this.location.address || (this.venue ? this.venue.address : '');
    if (address && address !== this.location.name) {
      rows.push({ label: 'Adresse', value: address });
    }
    return rows;
  }

  get command(): string {
    return teleportCommand(this.venue);
  }

  async copyCommand() {
    try {
      await copyToClipboard(this.command);
      notifySuccess('Teleport-Befehl kopiert.');
    } catch (e) {
      notifyError('Kopieren hat nicht geklappt.');
    }
  }
}
</script>

<style lang="scss" scoped>
.event-location {
  overflow: hidden;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.event-location__image {
  display: block;
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.event-location__body {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.event-location__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.event-location__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.event-location__name {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 600;

  a {
    color: var(--ink-primary) !important;
  }
}

.event-location__rows {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 6px 14px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;

  dt {
    color: var(--ink-muted);
  }

  dd {
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
}

.event-location__command {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.event-location__code {
  flex: 1 1 160px;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--rule-soft);
  border-radius: 8px;
  background-color: var(--rule-tint);
  color: var(--ink-primary);
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.event-location__row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;

  a {
    color: var(--ink-link) !important;
    overflow-wrap: anywhere;
  }
}

.event-location__more {
  justify-self: start;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-link) !important;
}
</style>
