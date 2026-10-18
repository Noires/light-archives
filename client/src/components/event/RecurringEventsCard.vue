<template>
	<section class="recurring" aria-labelledby="recurring-title">
		<h2 id="recurring-title" class="recurring__title">Wiederkehrende Abende</h2>
		<p v-if="groups.length === 0" class="recurring__empty">
			Gerade sind keine wiederkehrenden Events eingetragen.
		</p>
		<ul v-else class="recurring__list">
			<li v-for="group in groups" :key="group.key" class="recurring__item">
				<router-link class="recurring__name" :to="`/event/${group.firstId}`">{{ group.title }}</router-link>
				<div class="recurring__rule">
					<q-icon name="repeat" aria-hidden="true" />
					<span>{{ group.rule }}</span>
				</div>
				<ul class="recurring__dates" aria-label="Nächste Termine">
					<li v-for="date in group.dates" :key="date.millis">
						<router-link v-if="date.id" class="recurring__date" :to="`/event/${date.id}`">{{ date.label }}</router-link>
						<span v-else class="recurring__date recurring__date--plain">{{ date.label }}</span>
					</li>
				</ul>
			</li>
		</ul>
	</section>
</template>

<script lang="ts">
import { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import { Options, prop, Vue } from 'vue-class-component';
import { serverDateTime } from './event-display';
import { WEEKDAYS_LONG } from '../venues/venue-status';

// ER2-503 — groups upcoming events by series (`seriesId` / `seriesLabel`,
// ER2-804) or, on older APIs, by repeating title + weekday + start time (how
// events created from a venue's weekly template look). Shows the rule and the
// next three dates; series with fewer than three loaded dates ask
// `eventSeries.getNextOccurrences` for more.

interface RecurringDate {
	millis: number;
	label: string;
	id: number | null;
}

interface RecurringGroup {
	key: string;
	title: string;
	rule: string;
	firstId: number;
	seriesId: number | null;
	dates: RecurringDate[];
}

const MAX_GROUPS = 5;
const MAX_DATES = 3;

function dateLabel(millis: number): string {
	return serverDateTime(millis).toFormat('ccc., d. LLL · HH:mm');
}

class Props {
	/** Upcoming events, already filtered and sorted by start. */
	events = prop<EventSummaryDto[]>({ default: () => [] });
}

@Options({
	name: 'RecurringEventsCard',
	watch: {
		baseGroups() {
			void (this as RecurringEventsCard).loadOccurrences();
		},
	},
})
export default class RecurringEventsCard extends Vue.with(Props) {
	extraDates: Record<number, RecurringDate[]> = {};
	private requested = new Set<number>();

	mounted() {
		void this.loadOccurrences();
	}

	get baseGroups(): RecurringGroup[] {
		const map = new Map<string, RecurringGroup & { count: number }>();
		for (const event of this.events) {
			const start = serverDateTime(event.startDateTime);
			const key = event.seriesId
				? `series-${event.seriesId}`
				: `${event.title.trim().toLowerCase()}|${start.weekday}|${start.toFormat('HH:mm')}`;
			let group = map.get(key);
			if (!group) {
				group = {
					key,
					title: event.title,
					rule: event.seriesLabel || `Jeden ${WEEKDAYS_LONG[start.weekday - 1]} · ${start.toFormat('HH:mm')}`,
					firstId: event.id,
					seriesId: event.seriesId || null,
					dates: [],
					count: 0,
				};
				map.set(key, group);
			}
			group.count++;
			if (group.dates.length < MAX_DATES) {
				group.dates.push({ millis: event.startDateTime, label: dateLabel(event.startDateTime), id: event.id });
			}
		}
		return Array.from(map.values())
			.filter((group) => group.seriesId || group.count >= 2)
			.slice(0, MAX_GROUPS);
	}

	get groups(): RecurringGroup[] {
		return this.baseGroups.map((group) => {
			if (!group.seriesId || group.dates.length >= MAX_DATES) {
				return group;
			}
			const known = new Set(group.dates.map((date) => date.millis));
			const extra = (this.extraDates[group.seriesId] || []).filter((date) => !known.has(date.millis));
			const dates = [ ...group.dates, ...extra ]
				.sort((a, b) => a.millis - b.millis)
				.slice(0, MAX_DATES);
			return { ...group, dates };
		});
	}

	async loadOccurrences() {
		const missing = this.baseGroups.filter((group) =>
			group.seriesId && group.dates.length < MAX_DATES && !this.requested.has(group.seriesId));
		for (const group of missing) {
			const seriesId = group.seriesId as number;
			this.requested.add(seriesId);
			try {
				const occurrences = await this.$api.eventSeries.getNextOccurrences(seriesId, MAX_DATES);
				this.extraDates = {
					...this.extraDates,
					[seriesId]: occurrences.map((occurrence) => ({
						millis: occurrence.startDateTime,
						label: dateLabel(occurrence.startDateTime),
						id: null,
					})),
				};
			} catch (e) {
				// Optional data: older APIs have no series endpoint.
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.recurring__title {
	margin: 0 0 12px;
	font-family: var(--font-display);
	font-size: 17px;
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.recurring__empty {
	margin: 0;
	font-size: 14px;
	color: var(--ink-muted);
}

.recurring__list {
	display: grid;
	gap: 14px;
	margin: 0;
	padding: 0;
	list-style: none;
}

.recurring__item {
	display: grid;
	gap: 4px;
	padding-bottom: 14px;
	border-bottom: 1px solid var(--rule-soft);

	&:last-child {
		padding-bottom: 0;
		border-bottom: 0;
	}
}

.recurring__name {
	font-family: var(--font-ui);
	font-size: 15px;
	font-weight: 600;
	color: var(--ink-primary) !important;
	overflow-wrap: anywhere;
}

.recurring__rule {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: var(--ink-muted);
}

.recurring__dates {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 4px 0 0;
	padding: 0;
	list-style: none;
}

.recurring__date {
	display: inline-block;
	padding: 2px 8px;
	border: 1px solid var(--rule-soft);
	border-radius: 999px;
	font-size: 12px;
	line-height: 18px;
	font-variant-numeric: tabular-nums;
	color: var(--ink-primary) !important;
	text-decoration: none !important;

	&:hover {
		background-color: var(--rule-tint);
		border-color: var(--rule-strong);
	}
}

.recurring__date--plain:hover {
	background-color: transparent;
	border-color: var(--rule-soft);
}
</style>
