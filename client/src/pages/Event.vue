<template>
  <q-page class="page-event">
    <section v-if="event.mine" class="page-event__owner-bar" aria-label="Event verwalten">
      <q-btn flat class="elpis-btn elpis-btn--secondary" icon="edit" label="Event bearbeiten" :to="`/edit-event/${eventId}`" />
      <q-btn flat class="elpis-btn elpis-btn--ghost" icon="delete" label="Event löschen" @click="onDeleteClick" />
    </section>

    <event-view v-if="event.title" :event="event" :venues="venues">
      <template #actions>
        <div class="page-event__actionbar" role="region" aria-label="Teilnahme">
          <div class="page-event__actions">
            <template v-if="canRespond">
              <q-btn
                v-if="showGoingButton"
                unelevated
                class="elpis-btn"
                :class="myKind === 'going' ? 'elpis-btn--secondary' : 'elpis-btn--primary'"
                :icon="myKind === 'going' ? 'check' : 'how_to_reg'"
                :label="goingLabel"
                :aria-pressed="myKind === 'going' ? 'true' : 'false'"
                :loading="pendingKind === 'going'"
                :disable="!!pendingKind"
                @click="toggleKind('going')"
              />
              <q-btn
                v-if="showInterestedButton"
                flat
                class="elpis-btn elpis-btn--secondary"
                :icon="myKind === 'interested' ? 'check' : 'star_outline'"
                label="Interessiert"
                :aria-pressed="myKind === 'interested' ? 'true' : 'false'"
                :loading="pendingKind === 'interested'"
                :disable="!!pendingKind"
                @click="toggleKind('interested')"
              />
            </template>
            <q-btn
              v-if="icsUrl"
              flat
              class="elpis-btn elpis-btn--secondary"
              icon="event"
              label="In Kalender (.ics)"
              type="a"
              :href="icsUrl"
              download
            />
            <!-- ER2 social: bookmark -->
            <bookmark-button v-if="event.id" target-type="event" :target-id="event.id" />
            <!-- /ER2 social: bookmark -->
            <q-btn flat class="elpis-btn elpis-btn--ghost" icon="share" label="Teilen" @click="share" />
          </div>
          <avatar-stack
            class="page-event__stack"
            :avatars="goingAvatars"
            :max="4"
            :label="attendanceLabel"
          />
          <p v-if="actionHint" class="page-event__hint">{{ actionHint }}</p>
        </div>
      </template>

      <template #attendees>
        <section v-if="participants.length || event.canManageParticipants" class="page-event__card" aria-labelledby="who-comes">
          <h2 id="who-comes" class="page-event__card-title">Wer kommt</h2>
          <ul v-if="participants.length" class="page-event__people">
            <li v-for="participant in participants" :key="participant.characterId">
              <router-link class="page-event__person" :to="characterLink(participant)">
                <q-avatar size="48px" class="page-event__person-avatar">
                  <img v-if="participant.avatar" :src="participant.avatar" alt="" />
                  <q-icon v-else name="person" aria-hidden="true" />
                </q-avatar>
                <span class="page-event__person-name">{{ participant.name }}</span>
                <span class="page-event__person-meta">
                  {{ participant.kind === 'interested' ? 'Interessiert' : 'Zugesagt' }}
                </span>
              </router-link>
              <q-tooltip v-if="event.canManageParticipants">
                Angemeldet am {{ formatRegistrationDate(participant.registeredAt) }}
              </q-tooltip>
            </li>
          </ul>
          <p v-else class="page-event__muted">Noch keine Anmeldungen.</p>
        </section>
      </template>
    </event-view>

    <section v-if="event.images && event.images.length > 0" class="page-event__gallery" aria-labelledby="event-images">
      <h2 id="event-images" class="page-event__gallery-title">Bilder zu diesem Event</h2>
      <thumb-gallery :images="event.images" />
    </section>
    <report-violation-section :pageType="PageType.EVENT" :pageId="eventId" />
  </q-page>
</template>

<script lang="ts">
import { EventDto } from '@app/shared/dto/events/event.dto';
import { EventParticipantDto } from '@app/shared/dto/events/event-participant.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import { copyToClipboard, createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import EventView from 'src/components/event/EventView.vue';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import AvatarStack from 'components/vision/AvatarStack.vue';
import type { AvatarItem } from 'components/vision/types';
import { countLabel, isEventOver } from 'components/event/event-display';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';
import BookmarkButton from 'components/social/BookmarkButton.vue'; // ER2 social: bookmark

// ER2-504 — event detail page: hero (EventView) plus a sticky glass action
// bar. "Ich bin dabei" uses the registration endpoints: closed events keep
// their registration rules and deadline; open events only get RSVP buttons
// when the API reports counts (ER2-801), which also gates "Interessiert" and
// the .ics link.

const $api = useApi();
const $router = useRouter();

type Kind = 'going' | 'interested';

async function load(params: RouteParams): Promise<{ event: EventDto, eventId: number }> {
  const id = parseInt(params.id as string, 10);

  if (!id) {
    void $router.replace('/');
    throw new Error();
  }

  try {
    const event = await $api.events.getEvent(id);
    return { event, eventId: id };
  } catch (e) {
    if (errors.getStatusCode(e) === 404) {
      notifyError('Event konnte nicht gefunden werden.');
      void $router.replace('/');
    } else {
      notifyError(e);
    }

    throw e;
  }
}

@Options({
  name: 'PageEvent',
  components: {
    EventView,
    ThumbGallery,
    ReportViolationSection,
    AvatarStack,
    BookmarkButton, // ER2 social: bookmark
  },
  async beforeRouteEnter(to, _, next) {
    const { event, eventId } = await load(to.params);
    next(vm => (vm as PageEvent).setContent(event, eventId));
  },
  async beforeRouteUpdate(to) {
    const { event, eventId } = await load(to.params);
    (this as PageEvent).setContent(event, eventId);
  },
  mixins: [
    createMetaMixin(function(this: PageEvent) {
      const result: MetaOptions = {
        title: `${this.event.title || 'Event'} - Elpisgarten`,
        meta: {}
      };

      if (this.event.banner) {
        Object.assign(result.meta, {
          ogImage: {
            property: 'og:image',
            content: this.event.banner.url,
          },
          twitterCard: {
            property: 'twitter:card',
            content: 'summary_large_image',
          },
        });
      }

      return result;
    }),
  ],
})
export default class PageEvent extends Vue {
  readonly PageType = PageType;

  eventId = -1;
  event = {} as EventDto;
  pendingKind: Kind | null = null;
  venues: Record<number, VenueDto> = {};

  setContent(event: EventDto, eventId: number) {
    const changed = eventId !== this.eventId;
    this.eventId = eventId;
    this.event = event;
    if (changed) {
      this.venues = {};
    }
    void this.loadVenues();
  }

  /** ER2-505: linked venues for the structured location card. */
  private async loadVenues() {
    const ids = Array.from(new Set((this.event.locations || [])
      .map((location) => location.venueId)
      .filter((id): id is number => !!id && !this.venues[id])));
    for (const id of ids) {
      try {
        const venue = await this.$api.venues.getVenue(id);
        this.venues = { ...this.venues, [id]: venue };
      } catch (e) {
        // Optional: the card falls back to the free-text address.
      }
    }
  }

  get selectedCharacterId(): number | null {
    return this.$store.getters.characterId;
  }

  /** ER2-801 fields present: RSVP kinds, open-event RSVPs and .ics exist. */
  get apiSupportsKinds(): boolean {
    return typeof this.event.goingCount === 'number';
  }

  get isOver(): boolean {
    return !!this.event.startDateTime && isEventOver(this.event, Date.now());
  }

  get participants(): EventParticipantDto[] {
    return this.event.participants || [];
  }

  get goingCount(): number {
    if (typeof this.event.goingCount === 'number') {
      return this.event.goingCount;
    }
    return this.event.participantCount || 0;
  }

  get interestedCount(): number {
    return this.event.interestedCount || 0;
  }

  get goingAvatars(): AvatarItem[] {
    return this.participants
      .filter((participant) => participant.kind !== EventRegistrationKind.INTERESTED && !!participant.avatar)
      .map((participant) => ({ src: participant.avatar as string, alt: participant.name }));
  }

  get attendanceLabel(): string {
    const parts = [ countLabel(this.goingCount, 'Zusage', 'Zusagen') ];
    if (this.interestedCount > 0) {
      parts.push(`${this.interestedCount} interessiert`);
    }
    return parts.join(' · ');
  }

  get myKind(): Kind | null {
    const id = this.selectedCharacterId;
    if (!id) {
      return null;
    }
    const kinds = this.event.myRegistrationKinds;
    if (kinds && kinds[id]) {
      return kinds[id] === EventRegistrationKind.INTERESTED ? 'interested' : 'going';
    }
    return (this.event.myRegistrationCharacterIds || []).includes(id) ? 'going' : null;
  }

  /** Whether the current character can change its response at all. */
  get canRespond(): boolean {
    if (!this.selectedCharacterId || this.isOver) {
      return false;
    }
    if (this.event.closedEvent) {
      return !!this.event.registrationOpen;
    }
    return this.apiSupportsKinds;
  }

  get showGoingButton(): boolean {
    return this.canRespond;
  }

  get showInterestedButton(): boolean {
    return this.canRespond && this.apiSupportsKinds;
  }

  get goingLabel(): string {
    if (this.event.closedEvent) {
      return this.myKind === 'going' ? 'Angemeldet' : 'Ich bin dabei';
    }
    return this.myKind === 'going' ? 'Bin dabei' : 'Ich bin dabei';
  }

  get registrationDeadlineDisplay(): string {
    if (!this.event.registrationDeadlineAt) {
      return '';
    }
    return this.$display.formatDateTimeServer(this.event.registrationDeadlineAt);
  }

  get actionHint(): string {
    if (this.isOver) {
      return 'Dieses Event ist vorbei.';
    }
    if (this.event.closedEvent) {
      const deadline = this.registrationDeadlineDisplay;
      if (!this.event.registrationOpen) {
        return deadline ? `Anmeldung geschlossen seit ${deadline}.` : 'Die Anmeldung ist geschlossen.';
      }
      const base = deadline ? `Geschlossenes Event, Anmeldung bis ${deadline}.` : 'Geschlossenes Event mit Anmeldung.';
      return this.selectedCharacterId ? base : `${base} Melde dich an und wähle einen Charakter, um teilzunehmen.`;
    }
    if (!this.selectedCharacterId && this.apiSupportsKinds) {
      return 'Melde dich an und wähle einen Charakter, um zuzusagen.';
    }
    return '';
  }

  get icsUrl(): string {
    return this.apiSupportsKinds && this.eventId > 0 ? this.$api.events.getEventIcsUrl(this.eventId) : '';
  }

  characterLink(participant: EventParticipantDto): string {
    return `/${participant.server}/${participant.name.replace(/ /g, '_')}`;
  }

  formatRegistrationDate(millis: number): string {
    return this.$display.formatDateTimeServer(millis);
  }

  async toggleKind(kind: Kind) {
    const characterId = this.selectedCharacterId;
    if (!characterId || !this.eventId || this.pendingKind) {
      return;
    }

    this.pendingKind = kind;
    try {
      if (this.myKind === kind) {
        await this.$api.events.unregisterForEvent(this.eventId, characterId);
        notifySuccess(this.event.closedEvent ? 'Abmeldung gespeichert.' : 'Zusage zurückgenommen.');
      } else {
        const apiKind = kind === 'interested' ? EventRegistrationKind.INTERESTED : EventRegistrationKind.GOING;
        // Older APIs know no kinds; send none for a plain registration.
        await this.$api.events.registerForEvent(this.eventId, characterId, this.apiSupportsKinds ? apiKind : undefined);
        notifySuccess(kind === 'interested' ? 'Als interessiert vermerkt.' : (this.event.closedEvent ? 'Anmeldung gespeichert.' : 'Zusage gespeichert.'));
      }
      await this.reloadEvent();
    } catch (e) {
      notifyError(e);
    } finally {
      this.pendingKind = null;
    }
  }

  async share() {
    const url = window.location.href;
    const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: this.event.title, url });
        return;
      } catch (e) {
        // Cancelled or unsupported: fall back to copying.
      }
    }
    try {
      await copyToClipboard(url);
      notifySuccess('Link kopiert.');
    } catch (e) {
      notifyError('Link konnte nicht kopiert werden.');
    }
  }

  private async reloadEvent() {
    const event = await this.$api.events.getEvent(this.eventId);
    this.setContent(event, this.eventId);
    void this.$store.dispatch('updateEvents');
  }

  onDeleteClick() {
    this.$q.dialog({
      title: 'Löschbestätigung',
      message: `Möchtest du „${this.event.title}“ wirklich löschen?`,
      ok: {
        label: 'Löschen',
        color: 'negative',
        flat: true
      },
      cancel: 'Abbrechen',
    }).onOk(async () => {
      try {
        await this.$api.events.deleteEvent(this.eventId);

        notifySuccess('Event gelöscht.');
        void this.$router.replace('/');
        void this.$store.dispatch('updateEvents');
      } catch (e) {
        notifyError(e);
      }
    });
  }
}
</script>

<style lang="scss" scoped>
.page-event__owner-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.page-event__actionbar {
  position: sticky;
  top: 76px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-top: 14px;
  padding: 12px 16px;
  border: 1px solid var(--rule-soft);
  border-radius: 14px;
  background-color: var(--surface-glass);
  backdrop-filter: blur(14px) saturate(1.2);
  box-shadow: 0 8px 24px var(--rule-tint);

  @supports not (backdrop-filter: blur(1px)) {
    background-color: var(--vision-card);
  }

  @media (max-width: 1023px) {
    top: 72px;
  }
}

.page-event__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.page-event__stack {
  margin-left: auto;
}

.page-event__hint {
  flex-basis: 100%;
  margin: 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-muted);
}

.page-event__card {
  padding: 18px;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background-color: var(--vision-card);
  color: var(--ink-primary);
}

.page-event__card-title {
  text-align: left;
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  color: var(--ink-primary);
}

.page-event__people {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 12px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.page-event__person {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  border-radius: 10px;
  text-align: center;
  color: var(--ink-primary) !important;
  text-decoration: none !important;

  &:hover {
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.page-event__person-avatar {
  border: 2px solid var(--rule-soft);
  background-color: var(--rule-tint);
  color: var(--ink-muted);
}

.page-event__person-name {
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.page-event__person-meta {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--ink-muted);
}

.page-event__muted {
  margin: 0;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--ink-muted);
}

.page-event__gallery {
  margin-top: 32px;
}

.page-event__gallery-title {
  text-align: left;
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--ink-primary);
}
</style>
