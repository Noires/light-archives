// Data helpers for the home hub (ER2-301 … ER2-306). Pure functions plus the
// loaders that talk to the API; the components stay presentational.
import type { EventSummaryDto } from '@app/shared/dto/events/event-summary.dto';
import type { VenueDto } from '@app/shared/dto/venues/venue.dto';
import type { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import SharedConstants from '@app/shared/SharedConstants';
import type API from '@common/common/api';
import { DateTime } from 'luxon';
import { getVenueOpenInfo, hasServerOpeningStatus } from 'src/common/opening-status';
import type { VenueEventTemplate, VenueOpeningSource, VenueOpenInfo } from 'src/common/opening-status';
import type { EventCardEvent } from 'components/vision/types';
import type { TimelineEvent } from 'components/vision/timeline';

export const SERVER_ZONE = SharedConstants.FFXIV_SERVER_TIMEZONE;
/** Assumed duration of events without an end (timeline, live detection). */
export const DEFAULT_EVENT_MINUTES = 120;
/** "Heute Abend" = 18:00 until 02:00 the next day, server time. */
export const EVENING_START_HOUR = 18;
export const EVENING_END_HOUR = 26;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export function eventEnd(event: EventSummaryDto): number {
	return event.endDateTime && event.endDateTime > event.startDateTime
		? event.endDateTime
		: event.startDateTime + DEFAULT_EVENT_MINUTES * 60000;
}

export function isEventLive(event: EventSummaryDto, now: number): boolean {
	return event.startDateTime <= now && now < eventEnd(event);
}

/** [start, end) of the current evening window; before 02:00 it is still yesterday's evening. */
export function eveningWindow(now: number): { start: number; end: number } {
	const local = DateTime.fromMillis(now, { zone: SERVER_ZONE });
	let day = local.startOf('day');
	if (local.hour < EVENING_END_HOUR - 24) {
		day = day.minus({ days: 1 });
	}
	const start = day.set({ hour: EVENING_START_HOUR }).toMillis();
	return { start, end: start + (EVENING_END_HOUR - EVENING_START_HOUR) * 3600000 };
}

/** [start of today, start of today + 7 days) in server time. */
export function weekWindow(now: number): { start: number; end: number } {
	const day = DateTime.fromMillis(now, { zone: SERVER_ZONE }).startOf('day');
	return { start: day.toMillis(), end: day.plus({ days: 7 }).toMillis() };
}

/** The evening windows of the next `days` days, starting with tonight. */
export function eveningWindows(now: number, days: number): { start: number; end: number }[] {
	const first = eveningWindow(now);
	return Array.from({ length: days }, (_, i) => {
		const start = DateTime.fromMillis(first.start, { zone: SERVER_ZONE }).plus({ days: i }).toMillis();
		return { start, end: start + (first.end - first.start) };
	});
}

export function overlaps(event: EventSummaryDto, window: { start: number; end: number }): boolean {
	return event.startDateTime < window.end && eventEnd(event) > window.start;
}

/** Events still relevant today: running or starting later, sorted by start. */
export function upcomingEvents(events: EventSummaryDto[], now: number): EventSummaryDto[] {
	return events
		.filter((event) => eventEnd(event) > now)
		.sort((a, b) => a.startDateTime - b.startDateTime);
}

export function eventImage(event: EventSummaryDto): string | null {
	return event.icon?.thumbUrl || event.icon?.previewUrl || event.icon?.url || null;
}

export function eventLocationLabel(event: EventSummaryDto): string | null {
	const location = event.locations?.[0];
	if (!location) {
		return null;
	}
	const parts = [location.name, location.address].filter((part) => !!part && part.trim());
	return parts.join(' · ') || null;
}

export function toEventCard(event: EventSummaryDto, now: number): EventCardEvent {
	const going = typeof event.goingCount === 'number' ? event.goingCount : null;
	return {
		id: event.id,
		title: event.title,
		startDateTime: event.startDateTime,
		endDateTime: event.endDateTime,
		imageSrc: eventImage(event),
		locationLabel: eventLocationLabel(event),
		recurringLabel: event.seriesLabel || null,
		live: isEventLive(event, now),
		attendeeLabel: going ? `${going} ${going === 1 ? 'Zusage' : 'Zusagen'}` : undefined,
	};
}

export function toTimelineEvent(event: EventSummaryDto): TimelineEvent {
	return {
		id: event.id,
		title: event.title,
		start: event.startDateTime,
		end: event.endDateTime,
	};
}

/**
 * Today's and this week's events. `GET /events` returns at most ten from the
 * start of today; the month endpoint fills the rest of the 7-day window.
 */
export async function loadHomeEvents(api: API, now: number = Date.now()): Promise<EventSummaryDto[]> {
	const week = { start: weekWindow(now).start, end: eveningWindows(now, 7)[6].end };
	const first = DateTime.fromMillis(week.start, { zone: SERVER_ZONE });
	const last = DateTime.fromMillis(week.end - 1, { zone: SERVER_ZONE });
	const months = [{ year: first.year, month: first.month }];
	if (last.month !== first.month || last.year !== first.year) {
		months.push({ year: last.year, month: last.month });
	}

	const results = await Promise.allSettled([
		api.events.getEvents({ refresh: false }).then((result) => result.events),
		...months.map(({ year, month }) => api.events.getEventsForMonth(year, month)),
	]);

	const fulfilled = results.filter(
		(result): result is PromiseFulfilledResult<EventSummaryDto[]> => result.status === 'fulfilled',
	);
	if (fulfilled.length === 0) {
		throw (results[0] as PromiseRejectedResult).reason;
	}

	const byId = new Map<number, EventSummaryDto>();
	fulfilled.forEach((result) => result.value.forEach((event) => byId.set(event.id, event)));
	return Array.from(byId.values()).sort((a, b) => a.startDateTime - b.startDateTime);
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export interface HomeVenue {
	id: number;
	name: string;
	server: string;
	address: string;
	imageSrc: string | null;
	info: VenueOpenInfo;
}

interface TemplateCacheEntry extends VenueEventTemplate {
	bannerUrl: string | null;
}

const TEMPLATE_CACHE_KEY = 'elpis.home.venueTemplates';
const TEMPLATE_CACHE_TTL_MS = 30 * 60000;
/** Upper bound of detail requests for the template fallback. */
const MAX_TEMPLATE_FETCHES = 60;
const FETCH_CONCURRENCY = 6;

function readTemplateCache(): Record<number, TemplateCacheEntry> | null {
	try {
		const raw = window.sessionStorage.getItem(TEMPLATE_CACHE_KEY);
		if (!raw) {
			return null;
		}
		const parsed = JSON.parse(raw) as { at: number; data: Record<number, TemplateCacheEntry> };
		return Date.now() - parsed.at < TEMPLATE_CACHE_TTL_MS ? parsed.data : null;
	} catch (_) {
		return null;
	}
}

function writeTemplateCache(data: Record<number, TemplateCacheEntry>) {
	try {
		window.sessionStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
	} catch (_) {
		// Storage unavailable — the fallback simply runs again next time.
	}
}

/** Weekly template of a venue detail, including the legacy single start/end timestamps. */
function templateFromVenue(venue: VenueDto): TemplateCacheEntry {
	let template: VenueEventTemplate = {
		eventStartWeekday: venue.eventStartWeekday ?? null,
		eventStartTime: venue.eventStartTime ?? null,
		eventEndTime: venue.eventEndTime ?? null,
		eventEndDurationDays: venue.eventEndDurationDays ?? null,
	};

	if (!template.eventStartWeekday && venue.eventStartDateTime) {
		const start = DateTime.fromMillis(venue.eventStartDateTime, { zone: SERVER_ZONE });
		const end = venue.eventEndDateTime ? DateTime.fromMillis(venue.eventEndDateTime, { zone: SERVER_ZONE }) : null;
		template = {
			eventStartWeekday: start.weekday,
			eventStartTime: start.toFormat('HH:mm'),
			eventEndTime: end ? end.toFormat('HH:mm') : null,
			eventEndDurationDays: end ? Math.max(0, Math.round(end.startOf('day').diff(start.startOf('day'), 'days').days)) : null,
		};
	}

	return { ...template, bannerUrl: venue.banner?.url || null };
}

async function mapLimited<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = new Array<R>(items.length);
	let next = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (next < items.length) {
			const index = next++;
			results[index] = await fn(items[index]);
		}
	});
	await Promise.all(workers);
	return results;
}

function stateRank(info: VenueOpenInfo): number {
	switch (info.state) {
		case 'open':
			return 0;
		case 'soon':
			return 1;
		case 'closed':
			return info.opensAt ? 2 : 3;
		default:
			return 4;
	}
}

/** Open first (closing soonest last), then opening soon, then the next openings. */
export function sortVenuesByOpening(venues: HomeVenue[]): HomeVenue[] {
	return [...venues].sort((a, b) => {
		const rank = stateRank(a.info) - stateRank(b.info);
		if (rank !== 0) {
			return rank;
		}
		if (a.info.state === 'open') {
			return (b.info.closesAt || 0) - (a.info.closesAt || 0);
		}
		return (a.info.opensAt || Infinity) - (b.info.opensAt || Infinity);
	});
}

/**
 * All venues with their opening state. Uses the ER2-805 fields when the API
 * sends them; otherwise reads the weekly template from the venue details
 * (bounded, cached for 30 minutes per session).
 */
export async function loadHomeVenues(api: API, now: number = Date.now()): Promise<HomeVenue[]> {
	const summaries: VenueSummaryDto[] = await api.venues.getVenues();
	const toHomeVenue = (summary: VenueSummaryDto, source: VenueOpeningSource, imageSrc: string | null): HomeVenue => ({
		id: summary.id,
		name: summary.name,
		server: summary.server,
		address: summary.address,
		imageSrc,
		info: getVenueOpenInfo(source, now),
	});

	if (summaries.some(hasServerOpeningStatus)) {
		return summaries.map((summary) => toHomeVenue(summary, summary, null));
	}

	const cache = readTemplateCache() || {};
	const missing = summaries.filter((summary) => !cache[summary.id]).slice(0, MAX_TEMPLATE_FETCHES);
	if (missing.length > 0) {
		await mapLimited(missing, FETCH_CONCURRENCY, async (summary) => {
			try {
				cache[summary.id] = templateFromVenue(await api.venues.getVenue(summary.id));
			} catch (_) {
				cache[summary.id] = { bannerUrl: null };
			}
		});
		writeTemplateCache(cache);
	}

	return summaries.map((summary) => {
		const template = cache[summary.id] || { bannerUrl: null };
		return toHomeVenue(summary, template, template.bannerUrl);
	});
}

/** Banner images for the few venues on screen (summaries carry none). */
export async function loadVenueImages(api: API, venues: HomeVenue[]): Promise<Record<number, string>> {
	const result: Record<number, string> = {};
	await Promise.all(venues.filter((venue) => !venue.imageSrc).map(async (venue) => {
		try {
			const detail = await api.venues.getVenue(venue.id);
			if (detail.banner?.url) {
				result[venue.id] = detail.banner.url;
			}
		} catch (_) {
			// No image then; the row shows the placeholder icon.
		}
	}));
	return result;
}

// ---------------------------------------------------------------------------
// Hero "Heute-Leiste"
// ---------------------------------------------------------------------------

/** A null stat is unavailable and hidden. */
export interface HomeTodayStats {
	live: number | null;
	tonight: number | null;
	venuesOpen: number | null;
	inRp: number | null;
	/** inRp hit the request limit: show "50+" */
	inRpCapped?: boolean;
}

// ---------------------------------------------------------------------------
// RP presence
// ---------------------------------------------------------------------------

export const RP_ACTIVE_LIMIT = 50;

/** Number of characters currently in RP or looking for RP; null when the API has no presence yet. */
export async function loadRpCount(api: API): Promise<number | null> {
	const characters = api.characters as Partial<API['characters']>;
	if (typeof characters.getRpActiveCharacters !== 'function') {
		return null;
	}
	try {
		const active = await characters.getRpActiveCharacters(RP_ACTIVE_LIMIT);
		if (!Array.isArray(active)) {
			return null;
		}
		return active.filter((entry) => entry.rpStatus === 'ic' || entry.rpStatus === 'lfrp').length;
	} catch (_) {
		return null;
	}
}
