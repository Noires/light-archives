// Prop types for TimelineStrip.vue (ER2-302). Kept apart from types.ts so the
// timeline can evolve without touching the shared type file.
import type { RouteLocationRaw } from 'vue-router';

export interface TimelineEvent {
	id: number | string;
	title: string;
	/** ISO string, epoch millis or Date. */
	start: string | number | Date;
	/** Missing or invalid: `defaultDurationMinutes` after the start. */
	end?: string | number | Date | null;
	/** Bar link. Defaults to `/event/:id`; `null` renders a plain bar. */
	to?: RouteLocationRaw | null;
	/** Force the live style (otherwise derived from start/end and the clock). */
	live?: boolean;
}

export type TimelineView = 'now' | 'tonight' | 'week';
