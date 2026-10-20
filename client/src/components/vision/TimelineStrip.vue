<template>
	<div class="vision-timeline" :class="{ 'vision-timeline--days': days > 1 }" role="region" :aria-label="ariaLabel">
		<div class="vision-timeline__controls">
			<q-btn
				class="elpis-btn elpis-btn--secondary vision-timeline__pan"
				flat
				dense
				no-caps
				icon="chevron_left"
				label="Früher"
				:aria-label="`Zeitleiste ${panStepHours} Stunden früher`"
				:disable="offsetHours <= minOffsetHours"
				@click="pan(-panStepHours)"
			/>
			<span class="vision-timeline__range" aria-live="polite">{{ rangeLabel }}</span>
			<q-btn
				class="elpis-btn elpis-btn--secondary vision-timeline__pan"
				flat
				dense
				no-caps
				icon-right="chevron_right"
				label="Später"
				:aria-label="`Zeitleiste ${panStepHours} Stunden später`"
				:disable="offsetHours >= maxOffsetHours"
				@click="pan(panStepHours)"
			/>
			<q-btn
				v-if="offsetHours !== 0"
				class="elpis-btn elpis-btn--secondary vision-timeline__pan"
				flat
				dense
				no-caps
				icon="my_location"
				label="Jetzt"
				aria-label="Zurück zur aktuellen Zeit"
				@click="offsetHours = 0"
			/>
		</div>
		<!-- Scrolls sideways on narrow screens. Without event links inside there
		     is nothing to tab to, so the scroller itself takes focus (arrow keys
		     scroll it). -->
		<div class="vision-timeline__scroller" :tabindex="hasLinks ? undefined : 0">
			<div class="vision-timeline__inner">
				<div class="vision-timeline__axis" aria-hidden="true">
					<span v-if="days > 1" class="vision-timeline__day-spacer" />
					<div class="vision-timeline__hours">
						<span
							v-for="(tick, i) in ticks"
							:key="tick"
							class="vision-timeline__hour"
							:style="{ left: `${(i / (ticks.length - 1)) * 100}%` }"
						>{{ tick }}</span>
					</div>
				</div>

				<div
					v-for="row in rows"
					:key="row.key"
					class="vision-timeline__row"
					:class="{ 'vision-timeline__row--today': row.isToday }"
				>
					<span v-if="days > 1" class="vision-timeline__day">{{ row.label }}</span>
					<div
						class="vision-timeline__track"
						:style="{ height: `${trackHeight(row.laneCount)}px`, backgroundSize: gridSize }"
					>
						<ul class="vision-timeline__bars" :aria-label="row.ariaLabel">
							<li
								v-for="bar in row.bars"
								:key="bar.key"
								class="vision-timeline__bar"
								:class="{
									'vision-timeline__bar--live': bar.live,
									'vision-timeline__bar--past': bar.past,
									'vision-timeline__bar--dim': bar.dim,
									'vision-timeline__bar--cut-start': bar.cutStart,
									'vision-timeline__bar--cut-end': bar.cutEnd,
								}"
								:style="{
									left: `${bar.left}%`,
									width: `${bar.width}%`,
									top: `${bar.lane * (laneHeight + laneGap) + trackPadding}px`,
									height: `${laneHeight}px`,
								}"
							>
								<router-link
									v-if="bar.to"
									class="vision-timeline__bar-link"
									:to="bar.to"
									:title="bar.tooltip"
									:aria-label="bar.ariaLabel"
								>
									<span class="vision-timeline__bar-title">{{ bar.title }}</span>
									<span class="vision-timeline__bar-time">{{ bar.timeLabel }}</span>
								</router-link>
								<span v-else class="vision-timeline__bar-link" :title="bar.tooltip" :aria-label="bar.ariaLabel">
									<span class="vision-timeline__bar-title">{{ bar.title }}</span>
									<span class="vision-timeline__bar-time">{{ bar.timeLabel }}</span>
								</span>
							</li>
						</ul>

						<div
							v-if="row.nowLeft !== null"
							class="vision-timeline__now"
							:style="{ left: `${row.nowLeft}%` }"
						>
							<span class="vision-timeline__now-label">Jetzt {{ nowClock }}</span>
						</div>

						<p v-if="row.bars.length === 0 && days === 1" class="vision-timeline__empty">
							{{ emptyText }}
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime } from 'luxon';
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';
import type { TimelineEvent } from './timeline';

// ER2-302 — "Heute Abend" timeline: one row per day across a window that
// follows the clock (default 2 h before the current hour until 6 h after,
// server time) and can be moved earlier/later in 2 h steps. Every day row
// uses the same hours. Events become bars sized by duration and packed into
// lanes; running events use the live colours, past ones are muted, and a
// "Jetzt HH:MM" marker moves every minute. No animation, so reduced motion
// needs nothing beyond the hover guard below.

interface Bar {
	key: string;
	title: string;
	to: RouteLocationRaw | null;
	left: number;
	width: number;
	lane: number;
	live: boolean;
	past: boolean;
	dim: boolean;
	cutStart: boolean;
	cutEnd: boolean;
	timeLabel: string;
	tooltip: string;
	ariaLabel: string;
}

interface Row {
	key: string;
	label: string;
	ariaLabel: string;
	isToday: boolean;
	bars: Bar[];
	laneCount: number;
	nowLeft: number | null;
}

class Props {
	events = prop<TimelineEvent[]>({ default: () => [] });
	/** Number of day rows, starting with today. */
	days = prop<number>({ default: 1 });
	/** Hours shown before the current (full) hour. */
	hoursBefore = prop<number>({ default: 2 });
	/** Hours shown after the current (full) hour. */
	hoursAfter = prop<number>({ default: 6 });
	zone = prop<string>({ default: SharedConstants.FFXIV_SERVER_TIMEZONE });
	/** Mute every bar that is not running right now ("Jetzt" view). */
	dimNonLive = prop<boolean>({ type: Boolean, default: false });
	/** Assumed duration of events without an end. */
	defaultDurationMinutes = prop<number>({ default: 120 });
	emptyText = prop<string>({ default: 'In diesem Zeitraum ist nichts eingetragen.' });
	ariaLabel = prop<string>({ default: 'Zeitleiste heute Abend' });
}

function toMillis(value: string | number | Date | null | undefined): number | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}
	if (value instanceof Date) {
		return value.getTime();
	}
	if (typeof value === 'number') {
		return value;
	}
	const dt = DateTime.fromISO(value);
	return dt.isValid ? dt.toMillis() : null;
}

@Options({
	name: 'TimelineStrip',
})
export default class TimelineStrip extends Vue.with(Props) {
	nowMillis = Date.now();
	/** Pan offset in hours, moved by the Früher/Später buttons. */
	offsetHours = 0;
	readonly panStepHours = 2;
	readonly minOffsetHours = -12;
	readonly maxOffsetHours = 24;

	readonly laneHeight = 44;
	readonly laneGap = 6;
	readonly trackPadding = 8;

	private timeout: number | null = null;
	private interval: number | null = null;

	mounted() {
		// Tick on the minute boundary so "Jetzt HH:MM" matches the clock.
		const untilNextMinute = 60000 - (Date.now() % 60000);
		this.timeout = window.setTimeout(() => {
			this.nowMillis = Date.now();
			this.interval = window.setInterval(() => {
				this.nowMillis = Date.now();
			}, 60000);
		}, untilNextMinute);
	}

	beforeUnmount() {
		if (this.timeout !== null) {
			window.clearTimeout(this.timeout);
		}
		if (this.interval !== null) {
			window.clearInterval(this.interval);
		}
	}

	get spanHours(): number {
		return Math.max(1, this.hoursBefore + this.hoursAfter);
	}

	/** Start of the first row's window: the current full hour, shifted. */
	get windowBase(): DateTime {
		return this.now.startOf('hour').plus({ hours: this.offsetHours - this.hoursBefore });
	}

	get rangeLabel(): string {
		const start = this.windowBase;
		const end = start.plus({ hours: this.spanHours });
		const range = `${start.toFormat('HH:mm')}–${end.toFormat('HH:mm')}`;
		if (this.days > 1 || start.hasSame(this.now, 'day')) {
			return range;
		}
		return `${start.setLocale('de').toFormat('ccc d.')} ${range}`;
	}

	pan(hours: number) {
		this.offsetHours = Math.min(this.maxOffsetHours, Math.max(this.minOffsetHours, this.offsetHours + hours));
	}

	get gridSize(): string {
		return `calc(100% / ${this.spanHours}) 100%`;
	}

	get ticks(): string[] {
		const result: string[] = [];
		for (let h = 0; h <= this.spanHours; h++) {
			result.push(this.windowBase.plus({ hours: h }).toFormat('HH:00'));
		}
		return result;
	}

	get now(): DateTime {
		return DateTime.fromMillis(this.nowMillis, { zone: this.zone });
	}

	get nowClock(): string {
		return this.now.toFormat('HH:mm');
	}

	trackHeight(laneCount: number): number {
		const lanes = Math.max(1, laneCount);
		return lanes * this.laneHeight + (lanes - 1) * this.laneGap + 2 * this.trackPadding;
	}

	dayLabel(day: DateTime, index: number): string {
		if (index === 0) {
			return 'Heute';
		}
		if (index === 1) {
			return 'Morgen';
		}
		return day.setLocale('de').toFormat('ccc d.');
	}

	get hasLinks(): boolean {
		return this.rows.some((row) => row.bars.some((bar) => !!bar.to));
	}

	get rows(): Row[] {
		const rows: Row[] = [];
		const spanMs = this.spanHours * 3600000;
		const nowMs = this.nowMillis;
		const normalized = this.events
			.map((event) => {
				const start = toMillis(event.start);
				if (start === null) {
					return null;
				}
				const rawEnd = toMillis(event.end ?? null);
				const end = rawEnd !== null && rawEnd > start ? rawEnd : start + this.defaultDurationMinutes * 60000;
				return { event, start, end };
			})
			.filter((item): item is { event: TimelineEvent; start: number; end: number } => item !== null)
			.sort((a, b) => a.start - b.start || b.end - a.end);

		for (let d = 0; d < Math.max(1, this.days); d++) {
			const day = this.windowBase.plus({ days: d });
			const windowStart = day.toMillis();
			const windowEnd = windowStart + spanMs;
			const laneEnds: number[] = [];
			const bars: Bar[] = [];

			for (const { event, start, end } of normalized) {
				if (end <= windowStart || start >= windowEnd) {
					continue;
				}
				const clippedStart = Math.max(start, windowStart);
				const clippedEnd = Math.min(end, windowEnd);

				let lane = laneEnds.findIndex((laneEnd) => laneEnd <= clippedStart);
				if (lane === -1) {
					lane = laneEnds.length;
					laneEnds.push(clippedEnd);
				} else {
					laneEnds[lane] = clippedEnd;
				}

				const live = !!event.live || (start <= nowMs && nowMs < end);
				const past = !live && end <= nowMs;
				const startClock = DateTime.fromMillis(start, { zone: this.zone }).toFormat('HH:mm');
				const endClock = DateTime.fromMillis(end, { zone: this.zone }).toFormat('HH:mm');
				const timeLabel = `${startClock}–${endClock}`;
				const state = live ? ', läuft gerade' : past ? ', vorbei' : '';

				bars.push({
					key: `${event.id}-${d}`,
					title: event.title,
					to: event.to === undefined ? `/event/${event.id}` : event.to,
					left: ((clippedStart - windowStart) / spanMs) * 100,
					width: Math.max(((clippedEnd - clippedStart) / spanMs) * 100, 2),
					lane,
					live,
					past,
					dim: this.dimNonLive && !live,
					cutStart: start < windowStart,
					cutEnd: end > windowEnd,
					timeLabel,
					tooltip: `${event.title} · ${timeLabel}`,
					ariaLabel: `${event.title}, ${startClock} bis ${endClock} Uhr${state}`,
				});
			}

			const nowInside = nowMs >= windowStart && nowMs < windowEnd;
			const label = this.dayLabel(day, d);
			rows.push({
				key: day.toISODate() || String(d),
				label,
				ariaLabel: `${label}, ${bars.length === 1 ? '1 Event' : `${bars.length} Events`}`,
				isToday: d === 0,
				bars,
				laneCount: laneEnds.length,
				nowLeft: nowInside ? ((nowMs - windowStart) / spanMs) * 100 : null,
			});
		}
		return rows;
	}
}
</script>

<style lang="scss" scoped>
.vision-timeline {
	--timeline-day-width: 72px;
	color: var(--ink-primary);
	font-family: var(--font-ui);
}

.vision-timeline__scroller {
	overflow-x: auto;
	overscroll-behavior-x: contain;
	// Room for the "Jetzt" label above the first track.
	padding-top: 4px;
	border-radius: 8px;

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.vision-timeline__inner {
	min-width: 640px;
}

// Früher · range · Später (· Jetzt) above the axis.
.vision-timeline__controls {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;
	gap: 4px 8px;
	margin-bottom: 8px;
}

.vision-timeline__range {
	min-width: 96px;
	font-size: 13px;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	text-align: center;
	color: var(--ink-primary);
}

.vision-timeline__pan.q-btn {
	min-height: 32px;
	padding: 0 8px;
	font-size: 13px;
}

.vision-timeline__axis,
.vision-timeline__row {
	display: flex;
	align-items: stretch;
	gap: 12px;
}

.vision-timeline__day-spacer,
.vision-timeline__day {
	flex: 0 0 var(--timeline-day-width);
}

.vision-timeline__hours {
	position: relative;
	flex: 1 1 auto;
	height: 34px;
	// Keep the first and last label inside the track edges.
	margin: 0 18px;
}

.vision-timeline__hour {
	position: absolute;
	top: 0;
	transform: translateX(-50%);
	font-size: 12px;
	line-height: 16px;
	font-variant-numeric: tabular-nums;
	color: var(--ink-muted);
	white-space: nowrap;
}

.vision-timeline__row + .vision-timeline__row {
	margin-top: 8px;
}

.vision-timeline__day {
	display: flex;
	align-items: center;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.vision-timeline__row--today .vision-timeline__day {
	color: var(--ink-primary);
}

.vision-timeline__track {
	position: relative;
	flex: 1 1 auto;
	margin: 0 18px;
	border-radius: 10px;
	background-color: var(--rule-tint);
	// One hairline per hour; background-size is set inline from the span.
	background-image: linear-gradient(to right, var(--rule-soft) 1px, transparent 1px);
	background-repeat: repeat-x;
	box-shadow: inset 0 0 0 1px var(--rule-soft);
}

.vision-timeline__bars {
	margin: 0;
	padding: 0;
	list-style: none;
}

.vision-timeline__bar {
	position: absolute;
	z-index: 1;
	min-width: 28px;
	padding: 0 1px;
}

.vision-timeline__bar-link {
	display: flex;
	flex-direction: column;
	justify-content: center;
	height: 100%;
	padding: 0 10px;
	overflow: hidden;
	border-radius: 8px;
	border: 1px solid var(--rule-strong);
	border-left-width: 4px;
	background-color: var(--vision-card);
	color: var(--ink-primary);
	text-decoration: none;
	transition:
		border-color var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis);

	&:hover {
		box-shadow: 0 4px 12px var(--rule-tint);
		border-color: var(--ink-link);
	}

	&:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--glow-aether),
			0 0 0 3px var(--vision-focus-edge);
	}
}

.vision-timeline__bar-title,
.vision-timeline__bar-time {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.vision-timeline__bar-title {
	font-size: 13px;
	font-weight: 600;
	line-height: 17px;
}

.vision-timeline__bar-time {
	font-size: 11px;
	line-height: 15px;
	font-variant-numeric: tabular-nums;
	color: var(--ink-muted);
}

.vision-timeline__bar--live .vision-timeline__bar-link {
	border-color: var(--vision-live);
	background-color: var(--vision-card);
	background-image: linear-gradient(var(--vision-live-bg), var(--vision-live-bg));

	.vision-timeline__bar-time {
		color: var(--vision-live-text);
		font-weight: 600;
	}
}

// Past and (in the "Jetzt" view) not-running bars: muted, dashed, no fill.
// Text stays at --ink-muted (AA on the track) instead of using opacity.
.vision-timeline__bar--past .vision-timeline__bar-link,
.vision-timeline__bar--dim .vision-timeline__bar-link {
	border-style: dashed;
	border-color: var(--rule-soft);
	border-left-color: var(--rule-strong);
	background-color: transparent;
	color: var(--ink-muted);
}

.vision-timeline__bar--cut-start .vision-timeline__bar-link {
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.vision-timeline__bar--cut-end .vision-timeline__bar-link {
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
	border-right-style: dotted;
}

.vision-timeline__now {
	position: absolute;
	z-index: 2;
	top: -4px;
	bottom: -4px;
	width: 2px;
	margin-left: -1px;
	background-color: var(--vision-now);
	pointer-events: none;
}

// Label text uses --vision-on-now: white on the light "now" red, deep
// violet on the dark pink (both AA).
.vision-timeline__now-label {
	position: absolute;
	bottom: 100%;
	left: 50%;
	transform: translateX(-50%);
	padding: 1px 8px;
	border-radius: 999px;
	background-color: var(--vision-now);
	color: var(--vision-on-now);
	font-size: 11px;
	font-weight: 700;
	line-height: 16px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.vision-timeline--days .vision-timeline__now-label {
	display: none;
}

.vision-timeline--days .vision-timeline__row--today .vision-timeline__now-label {
	display: block;
}

.vision-timeline__empty {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0;
	padding: 0 16px;
	font-family: var(--font-section);
	font-style: italic;
	font-size: 15px;
	color: var(--ink-muted);
	text-align: center;
}

@media (prefers-reduced-motion: reduce) {
	.vision-timeline__bar-link {
		transition: none;
	}
}
</style>
