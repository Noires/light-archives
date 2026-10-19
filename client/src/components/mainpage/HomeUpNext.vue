<template>
	<section v-if="cards.length" class="home-up-next" aria-label="Nächste Events">
		<ol class="home-up-next__list">
			<li v-for="card in cards" :key="card.id">
				<event-card :event="card" :state="card.live ? 'live' : 'default'" />
			</li>
		</ol>
	</section>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import EventCard from 'components/vision/EventCard.vue';
import type { EventCardEvent } from 'components/vision/types';
import { Options, prop, Vue } from 'vue-class-component';
import { toEventCard, upcomingEvents } from './home-data';

// ER2-303 — the next three events (running ones first, in Live state).

class Props {
	events = prop<EventSummaryDto[]>({ default: () => [] });
	now = prop<number>({ required: true });
	limit = prop<number>({ default: 3 });
}

@Options({
	name: 'HomeUpNext',
	components: { EventCard },
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

.home-up-next__list {
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 0;
	padding: 0;
	list-style: none;
}
</style>
