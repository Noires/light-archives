<template>
	<section class="mini-cal" aria-labelledby="mini-cal-title">
		<header class="mini-cal__head">
			<router-link class="mini-cal__nav" :to="prevLink" aria-label="Vorheriger Monat">
				<q-icon name="chevron_left" aria-hidden="true" />
			</router-link>
			<h2 id="mini-cal-title" class="mini-cal__title">{{ monthLabel }}</h2>
			<router-link class="mini-cal__nav" :to="nextLink" aria-label="Nächster Monat">
				<q-icon name="chevron_right" aria-hidden="true" />
			</router-link>
		</header>

		<div class="mini-cal__grid">
			<div class="mini-cal__row" aria-hidden="true">
				<span v-for="day in weekdays" :key="day.short" class="mini-cal__weekday">
					{{ day.short }}
				</span>
			</div>
			<div v-for="(week, index) in weeks" :key="index" class="mini-cal__row">
				<template v-for="(cell, cellIndex) in week" :key="cellIndex">
					<span v-if="!cell" class="mini-cal__blank"></span>
					<span v-else>
						<button
							type="button"
							class="mini-cal__day"
							:class="{
								'mini-cal__day--today': cell.iso === todayIso,
								'mini-cal__day--selected': cell.iso === selected,
								'mini-cal__day--has-events': cell.count > 0,
							}"
							:aria-pressed="cell.iso === selected ? 'true' : 'false'"
							:aria-label="cell.ariaLabel"
							@click="$emit('select', cell.iso)"
						>
							<span>{{ cell.day }}</span>
							<span v-if="cell.count > 0" class="mini-cal__dot" aria-hidden="true"></span>
						</button>
					</span>
				</template>
			</div>
		</div>

		<router-link v-if="!isCurrentMonth" class="mini-cal__today-link" to="/calendar">Zum aktuellen Monat</router-link>
	</section>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Options, prop, Vue } from 'vue-class-component';
import { SERVER_ZONE } from './event-display';
import { WEEKDAYS_LONG, WEEKDAYS_SHORT } from '../venues/venue-status';

// ER2-501 — compact month grid for the events page: dots on event days,
// today ringed, click selects a date (emits `select` with an ISO date).

interface DayCell {
	iso: string;
	day: number;
	count: number;
	ariaLabel: string;
}

class Props {
	/** Any date in the month to show (server zone). */
	month = prop<DateTime>({ required: true });
	/** Number of events per ISO date. */
	counts = prop<Record<string, number>>({ default: () => ({}) });
	selected = prop<string>({ default: '' });
	prevLink = prop<string>({ required: true });
	nextLink = prop<string>({ required: true });
}

@Options({
	name: 'EventMiniCalendar',
	emits: [ 'select' ],
})
export default class EventMiniCalendar extends Vue.with(Props) {
	readonly weekdays = WEEKDAYS_SHORT.map((short, index) => ({ short, long: WEEKDAYS_LONG[index] }));

	get todayIso(): string {
		return DateTime.now().setZone(SERVER_ZONE).toISODate() || '';
	}

	get isCurrentMonth(): boolean {
		return this.month.hasSame(DateTime.now().setZone(SERVER_ZONE), 'month');
	}

	get monthLabel(): string {
		return this.month.setLocale('de').toFormat('LLLL yyyy');
	}

	get weeks(): (DayCell | null)[][] {
		const first = this.month.startOf('month');
		const cells: (DayCell | null)[] = [];
		for (let i = 1; i < first.weekday; i++) {
			cells.push(null);
		}
		const days = first.daysInMonth || 30;
		for (let day = 1; day <= days; day++) {
			const date = first.set({ day }).setLocale('de');
			const iso = date.toISODate() || '';
			const count = this.counts[iso] || 0;
			const eventText = count === 0 ? 'keine Events' : count === 1 ? '1 Event' : `${count} Events`;
			cells.push({ iso, day, count, ariaLabel: `${date.toFormat('cccc, d. LLLL')}: ${eventText}` });
		}
		while (cells.length % 7 !== 0) {
			cells.push(null);
		}
		const weeks: (DayCell | null)[][] = [];
		for (let i = 0; i < cells.length; i += 7) {
			weeks.push(cells.slice(i, i + 7));
		}
		return weeks;
	}
}
</script>

<style lang="scss" scoped>
.mini-cal {
	font-family: var(--font-ui);
	color: var(--ink-primary);
}

.mini-cal__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	margin-bottom: 10px;
}

.mini-cal__title {
	margin: 0;
	font-family: var(--font-display);
	font-size: 17px;
	font-weight: 500;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
}

.mini-cal__nav {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	color: var(--ink-primary) !important;
	font-size: 20px;
	text-decoration: none !important;

	&:hover {
		background-color: var(--rule-tint);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
	}
}

.mini-cal__grid {
	display: grid;
	gap: 2px;
}

.mini-cal__row {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 2px;
}

.mini-cal__weekday {
	padding: 4px 0;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-align: center;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.mini-cal__day {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	aspect-ratio: 1;
	max-height: 40px;
	padding: 0;
	border: 1px solid transparent;
	border-radius: 8px;
	background: transparent;
	color: var(--ink-primary);
	font: inherit;
	font-size: 13px;
	font-variant-numeric: tabular-nums;
	cursor: pointer;

	&:hover {
		background-color: var(--rule-tint);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
	}
}

.mini-cal__day--has-events {
	font-weight: 600;
}

.mini-cal__day--today {
	border-color: var(--rule-strong);
}

.mini-cal__day--selected {
	background-color: var(--vision-primary);
	color: var(--vision-on-primary);

	&:hover {
		background-color: var(--vision-primary-hover);
	}

	.mini-cal__dot {
		background-color: var(--vision-on-primary);
	}
}

.mini-cal__dot {
	position: absolute;
	bottom: 4px;
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background-color: var(--ink-link);
}

.mini-cal__today-link {
	display: inline-block;
	margin-top: 10px;
	font-size: 13px;
	font-weight: 600;
	color: var(--ink-link) !important;
}
</style>
