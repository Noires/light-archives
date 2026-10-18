<template>
	<section class="home-up-next" aria-labelledby="home-up-next-title">
		<div class="home-up-next__head">
			<h2 id="home-up-next-title" class="home-up-next__title">Gleich &amp; gerade</h2>
			<q-btn
				v-if="tonightCount > 0"
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				to="/calendar"
				icon-right="arrow_forward"
				:label="tonightCount === 1 ? 'Das eine Event heute Abend' : `Alle ${tonightCount} heute Abend`"
			/>
			<q-btn
				v-else
				class="elpis-btn elpis-btn--ghost"
				flat
				dense
				no-caps
				to="/calendar"
				icon-right="arrow_forward"
				label="Zum Kalender"
			/>
		</div>

		<p v-if="!available" class="home-up-next__note">Die Events konnten gerade nicht geladen werden.</p>

		<ol v-else-if="cards.length" class="home-up-next__list">
			<li v-for="card in cards" :key="card.id">
				<event-card :event="card" :state="card.live ? 'live' : 'default'" />
			</li>
		</ol>

		<empty-state
			v-else
			icon="event"
			title="Heute noch nichts geplant"
			text="Trag dein Event ein, damit andere es heute Abend finden."
			action-label="Event eintragen"
			action-to="/create-event"
		/>
	</section>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import EmptyState from 'components/vision/EmptyState.vue';
import EventCard from 'components/vision/EventCard.vue';
import type { EventCardEvent } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';
import { toEventCard, upcomingEvents } from './home-data';

// ER2-303 — the next three events (running ones first, in Live state).

class Props {
	events = prop<EventSummaryDto[]>({ default: () => [] });
	now = prop<number>({ required: true });
	tonightCount = prop<number>({ default: 0 });
	available = prop<boolean>({ default: true });
	limit = prop<number>({ default: 3 });
}

@Options({
	name: 'HomeUpNext',
	components: { EmptyState, EventCard },
})
export default class HomeUpNext extends Vue.with(Props) {
	get cards(): EventCardEvent[] {
		return upcomingEvents(this.events, this.now)
			.slice(0, this.limit)
			.map((event) => toEventCard(event, this.now));
	}
}
</script>

<style lang="scss" scoped>
.home-up-next {
	display: flex;
	flex-direction: column;
	gap: 12px;
	min-width: 0;
}

.home-up-next__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	flex-wrap: wrap;
	min-height: 36px;
}

.home-up-next__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: var(--type-scale-3);
	font-weight: 600;
	line-height: var(--lh-heading);
	color: var(--ink-primary);
}

.home-up-next__list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.home-up-next__note {
	margin: 0;
	padding: 16px;
	font-family: var(--font-section);
	font-style: italic;
	color: var(--ink-muted);
}
</style>
