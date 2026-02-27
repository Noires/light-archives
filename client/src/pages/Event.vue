<template>
  <q-page class="page-event">
		<section v-if="event.mine" class="edit-bar">
			<q-btn flat color="secondary" label="Event bearbeiten" :to="`/edit-event/${eventId}`" />
			<q-btn flat color="negative" label="Event löschen" @click="onDeleteClick" />
		</section>
		<event-view v-if="event.title" :event="event" />
    <section v-if="event.closedEvent" class="event-registration">
      <h3>Anmeldung</h3>
      <p v-if="registrationDeadlineDisplay"><strong>Anmeldefrist:</strong> {{ registrationDeadlineDisplay }}</p>
      <p><strong>Status:</strong> {{ event.registrationOpen ? 'Anmeldung offen' : 'Anmeldung geschlossen' }}</p>
      <p><strong>Angemeldet:</strong> {{ participantCount }}</p>

      <div class="event-registration__actions">
        <q-btn
          v-if="selectedCharacterId && event.registrationOpen && !isSelectedCharacterRegistered"
          color="primary"
          label="Für Event anmelden"
          :loading="registrationActionPending"
          @click="registerSelectedCharacter"
        />
        <q-btn
          v-if="selectedCharacterId && event.registrationOpen && isSelectedCharacterRegistered"
          color="negative"
          label="Vom Event abmelden"
          :loading="registrationActionPending"
          @click="unregisterSelectedCharacter"
        />
      </div>

      <p v-if="!selectedCharacterId">Wähle einen Charakter aus, um dich anzumelden.</p>

      <section v-if="event.canManageParticipants" class="event-registration__participants">
        <h4>Teilnehmerliste</h4>
        <q-list bordered separator v-if="participants.length">
          <q-item v-for="participant in participants" :key="participant.characterId">
            <q-item-section avatar>
              <q-avatar>
                <img v-if="participant.avatar" :src="participant.avatar" alt="avatar" />
                <q-icon v-else name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ participant.name }} ({{ participant.server }})</q-item-label>
              <q-item-label caption>{{ formatRegistrationDate(participant.registeredAt) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <p v-else>Noch keine Anmeldungen.</p>
      </section>
    </section>
		<template v-if="event.images && event.images.length > 0">
			<h3>Bilder zu diesem Event</h3>
			<thumb-gallery :images="event.images" />
		</template>
		<report-violation-section :pageType="PageType.EVENT" :pageId="eventId" />
	</q-page>	
</template>

<script lang="ts">
import { EventDto } from '@app/shared/dto/events/event.dto';
import { EventParticipantDto } from '@app/shared/dto/events/event-participant.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import errors from '@app/shared/errors';
import { createMetaMixin } from 'quasar';
import { MetaOptions } from 'quasar/dist/types/meta';
import { useApi } from 'src/boot/axios';
import { notifyError, notifySuccess } from 'src/common/notify';
import EventView from 'src/components/event/EventView.vue';
import ThumbGallery from 'src/components/images/ThumbGallery.vue';
import { useRouter } from 'src/router';
import { Options, Vue } from 'vue-class-component';
import { RouteParams } from 'vue-router';
import ReportViolationSection from 'src/components/common/ReportViolationSection.vue';

const $api = useApi();
const $router = useRouter();

async function load(params: RouteParams): Promise<{event: EventDto, eventId: number}> {
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
				title: `${this.event.title} — Chaos Archives`,
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
  registrationActionPending = false;

	setContent(event: EventDto, eventId: number) {
		this.eventId = eventId;
		this.event = event;
	}

  get selectedCharacterId(): number | null {
    return this.$store.getters.characterId;
  }

  get participantCount(): number {
    return this.event.participantCount || 0;
  }

  get participants(): EventParticipantDto[] {
    return this.event.participants || [];
  }

  get registrationDeadlineDisplay(): string {
    if (!this.event.registrationDeadlineAt) {
      return '';
    }

    return this.$display.formatDateTimeServer(this.event.registrationDeadlineAt);
  }

  get isSelectedCharacterRegistered(): boolean {
    const selectedCharacterId = this.selectedCharacterId;
    if (!selectedCharacterId) {
      return false;
    }

    return (this.event.myRegistrationCharacterIds || []).includes(selectedCharacterId);
  }

  formatRegistrationDate(millis: number): string {
    return this.$display.formatDateTimeServer(millis);
  }

  async registerSelectedCharacter() {
    if (!this.selectedCharacterId || !this.eventId) {
      return;
    }

    this.registrationActionPending = true;
    try {
      await this.$api.events.registerForEvent(this.eventId, this.selectedCharacterId);
      notifySuccess('Anmeldung gespeichert.');
      await this.reloadEvent();
    } catch (e) {
      notifyError(e);
    } finally {
      this.registrationActionPending = false;
    }
  }

  async unregisterSelectedCharacter() {
    if (!this.selectedCharacterId || !this.eventId) {
      return;
    }

    this.registrationActionPending = true;
    try {
      await this.$api.events.unregisterForEvent(this.eventId, this.selectedCharacterId);
      notifySuccess('Abmeldung gespeichert.');
      await this.reloadEvent();
    } catch (e) {
      notifyError(e);
    } finally {
      this.registrationActionPending = false;
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
        message: `Möchtest du “${this.event.title}” wirklich löschen?`,
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

<style lang="scss">
.event-registration {
  margin: 20px 0 28px;
}

.event-registration__actions {
  display: flex;
  gap: 10px;
  margin: 8px 0 10px;
}

.event-registration__participants {
  margin-top: 16px;
}

@media screen and (max-width: $breakpoint-sm) {
  .event-registration__actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
