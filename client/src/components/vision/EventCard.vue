<template>
	<article class="vision-event-card" :class="{ 'vision-event-card--live': isLive }">
		<div class="vision-event-card__time">
			<span class="vision-event-card__day">{{ dayLabel }}</span>
			<time class="vision-event-card__clock" :datetime="startIso">{{ startClock }}</time>
			<span class="vision-event-card__relative">{{ relativeLabel }}</span>
		</div>

		<div class="vision-event-card__image">
			<img v-if="event.imageSrc" :src="event.imageSrc" alt="" loading="lazy" />
			<q-icon v-else name="event" aria-hidden="true" />
		</div>

		<div class="vision-event-card__text">
			<h3 class="vision-event-card__title">
				<router-link v-if="link" class="vision-event-card__link" :to="link">{{ event.title }}</router-link>
				<template v-else>{{ event.title }}</template>
			</h3>
			<p v-if="event.locationLabel" class="vision-event-card__location">
				<q-icon name="place" aria-hidden="true" />
				<span>{{ event.locationLabel }}</span>
			</p>
			<div v-if="isLive || event.recurringLabel" class="vision-event-card__chips">
				<status-badge v-if="isLive" type="live" />
				<status-badge v-if="event.recurringLabel" type="recurring" :label="event.recurringLabel" />
			</div>
		</div>

		<div v-if="hasAttendees || $slots.action" class="vision-event-card__side">
			<avatar-stack
				v-if="hasAttendees"
				:avatars="event.attendees || []"
				:label="event.attendeeLabel || ''"
			/>
			<div v-if="$slots.action" class="vision-event-card__action">
				<slot name="action" />
			</div>
		</div>
	</article>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Options, prop, Vue } from 'vue-class-component';
import type { RouteLocationRaw } from 'vue-router';
import AvatarStack from './AvatarStack.vue';
import StatusBadge from './StatusBadge.vue';
import type { EventCardEvent, EventCardState } from './types';

// ER2-007 — event row: time column | 64 px image | title, place, chips |
// RSVP stack + action slot. `state="live"` (or `event.live`) adds the live
// bar and badge. Relative time is German ("in 2 Std.", "seit 1 Std.") and
// refreshes every minute.

const LOCALE = 'de';

function toDateTime(value: string | number | Date | null | undefined): DateTime | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}
	let dt: DateTime;
	if (value instanceof Date) {
		dt = DateTime.fromJSDate(value);
	} else if (typeof value === 'number') {
		dt = DateTime.fromMillis(value);
	} else {
		dt = DateTime.fromISO(value);
	}
	return dt.isValid ? dt.setLocale(LOCALE) : null;
}

function sinceLabel(minutes: number): string {
	if (minutes < 1) {
		return 'gerade begonnen';
	}
	if (minutes < 60) {
		return `seit ${minutes} Min.`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `seit ${hours} Std.`;
	}
	const days = Math.floor(hours / 24);
	return days === 1 ? 'seit 1 Tag' : `seit ${days} Tagen`;
}

class Props {
	event = prop<EventCardEvent>({ required: true });
	state = prop<EventCardState>({ default: 'default' });
	/** Title link. Defaults to `/event/:id`; pass `null` for no link. */
	to = prop<RouteLocationRaw | null | undefined>({ default: undefined });
}

@Options({
	name: 'EventCard',
	components: { AvatarStack, StatusBadge },
})
export default class EventCard extends Vue.with(Props) {
	now = DateTime.now();

	private timer: number | null = null;

	mounted() {
		this.timer = window.setInterval(() => {
			this.now = DateTime.now();
		}, 60000);
	}

	beforeUnmount() {
		if (this.timer !== null) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
	}

	get start(): DateTime | null {
		return toDateTime(this.event.startDateTime);
	}

	get end(): DateTime | null {
		return toDateTime(this.event.endDateTime);
	}

	get running(): boolean {
		if (!this.start || this.start > this.now) {
			return false;
		}
		return !this.end || this.end > this.now;
	}

	get isLive(): boolean {
		return this.state === 'live' || !!this.event.live;
	}

	get link(): RouteLocationRaw | null {
		if (this.to === null) {
			return null;
		}
		return this.to || `/event/${this.event.id}`;
	}

	get hasAttendees(): boolean {
		return !!this.event.attendees && this.event.attendees.length > 0;
	}

	get startIso(): string {
		return this.start ? this.start.toISO() : '';
	}

	get startClock(): string {
		return this.start ? this.start.toFormat('HH:mm') : '–';
	}

	get dayLabel(): string {
		if (!this.start) {
			return '';
		}
		const days = Math.round(this.start.startOf('day').diff(this.now.startOf('day'), 'days').days);
		if (days === 0) {
			return 'Heute';
		}
		if (days === 1) {
			return 'Morgen';
		}
		if (days === -1) {
			return 'Gestern';
		}
		return this.start.toFormat('ccc, d. LLL');
	}

	get relativeLabel(): string {
		if (!this.start) {
			return '';
		}
		if (this.running || (this.isLive && this.start <= this.now)) {
			return sinceLabel(Math.floor(this.now.diff(this.start, 'minutes').minutes));
		}
		return this.start.toRelative({ base: this.now, locale: LOCALE, style: 'short' }) || '';
	}
}
</script>

<style lang="scss" scoped>
.vision-event-card {
	position: relative;
	display: grid;
	grid-template-columns: 76px 64px minmax(0, 1fr) auto;
	align-items: center;
	gap: 16px;
	padding: 14px 16px;
	overflow: hidden;
	background-color: var(--vision-card);
	border: 1px solid var(--rule-soft);
	border-radius: 12px;
	color: var(--ink-primary);
	transition:
		border-color var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis);

	&:hover,
	&:focus-within {
		border-color: var(--rule-strong);
		box-shadow: 0 6px 18px var(--rule-tint);
	}

	@media (max-width: 599px) {
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 12px;

		.vision-event-card__image {
			display: none;
		}

		.vision-event-card__side {
			grid-column: 1 / -1;
			justify-content: space-between;
		}
	}
}

.vision-event-card--live::before {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 4px;
	background-color: var(--vision-live);
}

.vision-event-card__time {
	display: flex;
	flex-direction: column;
	min-width: 0;
	font-family: var(--font-ui);
}

.vision-event-card__day {
	font-size: 11px;
	font-weight: 600;
	line-height: 16px;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: var(--ink-muted);
}

.vision-event-card__clock {
	font-family: var(--font-display);
	font-size: 22px;
	line-height: 1.15;
	font-variant-numeric: tabular-nums lining-nums;
	color: var(--ink-primary);
}

.vision-event-card__relative {
	font-size: 12px;
	line-height: 16px;
	color: var(--ink-muted);
}

.vision-event-card--live .vision-event-card__relative {
	color: var(--vision-live-text);
	font-weight: 600;
}

.vision-event-card__image {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	overflow: hidden;
	border-radius: 8px;
	background-color: var(--rule-tint);
	color: var(--ink-muted);
	font-size: 28px;

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.vision-event-card__text {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.vision-event-card__title {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 17px;
	line-height: 1.3;
	letter-spacing: 0;
	color: var(--ink-primary);
	overflow-wrap: anywhere;
}

.vision-event-card__link {
	color: inherit;
	text-decoration: none;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		border-radius: 12px;
	}

	&:hover {
		text-decoration: underline;
	}

	&:focus-visible {
		outline: none;

		&::after {
			box-shadow:
				inset 0 0 0 2px var(--glow-aether),
				inset 0 0 0 3px var(--vision-focus-edge);
		}
	}
}

.vision-event-card__location {
	display: flex;
	align-items: center;
	gap: 4px;
	margin: 0;
	font-family: var(--font-ui);
	font-size: 13px;
	line-height: 18px;
	color: var(--ink-muted);

	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
}

.vision-event-card__chips {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-top: 2px;
}

.vision-event-card__side {
	position: relative;
	z-index: 2;
	display: flex;
	align-items: center;
	gap: 12px;
}
</style>
