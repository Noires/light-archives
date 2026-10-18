import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { EventDto } from '@app/shared/dto/events/event.dto';
import { VenueDto } from '@app/shared/dto/venues/venue.dto';
import { PageType } from '@app/shared/enums/page-type.enum';
import { races } from '@app/shared/enums/race.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { wikify } from '@common/common/wikilinks';
import { DateTime } from 'luxon';
import { useApi } from 'src/boot/axios';
import { displayOptions } from 'src/boot/display';
import { reactive } from 'vue';
import type { StatusBadgeType } from './types';

// ER2-208 — hover-card controller and data for components/vision/HoverCard.vue.
// One host instance (<hover-card />) is mounted by layouts/MainLayout.vue;
// containers opt in with `bindHoverCards(el)` from this module, which
// delegates pointer and focus events on matching anchors:
//   /link/:name, /:Server/:Character, /venue/…, /event/:id
// Mouse/pen hover shows the card after 300 ms, keyboard focus too; touch
// never shows it. The link keeps focus and gets `aria-describedby` while the
// card is open; Esc closes it. Data is resolved once per session.

export const HOVER_CARD_ID = 'vision-hovercard';
export const HOVER_CARD_GAP = 8;
const SHOW_DELAY_MS = 300;
const HIDE_DELAY_MS = 150;
const CARD_WIDTH = 320;

export type HoverCardTarget =
	| { kind: 'character'; server: string; name: string }
	| { kind: 'venue'; id?: number; server?: string; name?: string }
	| { kind: 'event'; id: number }
	| { kind: 'link'; name: string };

export type HoverCardData =
	| {
		kind: 'character';
		name: string;
		title: string;
		meta: string;
		avatar: string;
		bannerUrl: string;
		freeCompany: string;
		status: StatusBadgeType | null;
		link: string;
	}
	| { kind: 'venue'; name: string; imageUrl: string; address: string; server: string; open: boolean }
	| { kind: 'event'; title: string; day: string; month: string; when: string; location: string };

export const hoverCardState = reactive({
	visible: false,
	anchor: null as HTMLAnchorElement | null,
	data: null as HoverCardData | null,
	top: 0,
	left: 0,
});

const cache = new Map<string, Promise<HoverCardData | null>>();
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let pendingAnchor: HTMLAnchorElement | null = null;
let previousDescribedBy: string | null = null;

// ---- target parsing -------------------------------------------------------

const CHARACTER_PATH = /^\/([A-Z][a-z]+)\/([^/]+)\/?$/;

function decode(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch (e) {
		return segment;
	}
}

export function parseHoverCardTarget(href: string | null): HoverCardTarget | null {
	if (!href) {
		return null;
	}
	let url: URL;
	try {
		url = new URL(href, window.location.href);
	} catch (e) {
		return null;
	}
	if (url.host !== window.location.host) {
		return null;
	}
	const path = url.pathname;
	const segments = path.split('/').filter(Boolean).map(decode);

	if (segments[0] === 'link' && segments.length === 2) {
		return { kind: 'link', name: segments[1] };
	}
	if (segments[0] === 'event' && segments.length === 2 && /^\d+$/.test(segments[1])) {
		return { kind: 'event', id: Number(segments[1]) };
	}
	if (segments[0] === 'venue' && segments.length >= 2) {
		if (/^\d+$/.test(segments[1]) && segments.length <= 3) {
			return { kind: 'venue', id: Number(segments[1]) };
		}
		if (segments.length >= 3 && segments.length <= 4 && /^[A-Z][a-z]+$/.test(segments[1])) {
			return { kind: 'venue', server: segments[1], name: segments[2] };
		}
		return null;
	}
	const match = CHARACTER_PATH.exec(path);
	if (match) {
		return { kind: 'character', server: match[1], name: decode(match[2]) };
	}
	return null;
}

function targetKey(target: HoverCardTarget): string {
	switch (target.kind) {
	case 'character':
		return `character:${target.server}:${wikify(target.name)}`;
	case 'venue':
		return target.id ? `venue:${target.id}` : `venue:${target.server || ''}:${wikify(target.name || '')}`;
	case 'event':
		return `event:${target.id}`;
	case 'link':
		return `link:${wikify(target.name)}`;
	}
}

// ---- data -----------------------------------------------------------------

function characterLink(server: string, name: string): string {
	return `/${server}/${wikify(name)}`;
}

function toCharacterCard(character: CharacterProfileDto): HoverCardData {
	const race = races[character.race] || '';
	return {
		kind: 'character',
		name: character.name,
		title: character.title || '',
		meta: [race, character.server].filter(Boolean).join(' · '),
		avatar: character.avatar || '',
		bannerUrl: character.banner?.url || '',
		freeCompany: character.freeCompany?.name || '',
		// RP presence (ER2-806) is not in the profile DTO yet.
		status: null,
		link: characterLink(character.server, character.name),
	};
}

function venueAddress(venue: VenueDto): string {
	if (venue.housingArea) {
		const parts = [displayOptions.housingAreas[venue.housingArea] || ''];
		if (venue.ward) {
			parts.push(`Bezirk ${venue.ward}${venue.subdivision ? ' (Nebenbezirk)' : ''}`);
		}
		if (venue.plot) {
			parts.push(`Grundstück ${venue.plot}`);
		}
		if (venue.room) {
			parts.push(`Raum ${venue.room}`);
		}
		return parts.filter(Boolean).join(', ');
	}
	return venue.address || '';
}

/** Open now, from the weekly template (weekday 1–7, HH:mm, server time zone). */
function isVenueOpen(venue: VenueDto): boolean {
	if (!venue.eventStartWeekday || !venue.eventStartTime || !venue.eventEndTime) {
		return false;
	}
	const zone = SharedConstants.FFXIV_SERVER_TIMEZONE;
	const now = DateTime.now().setZone(zone);
	const [startHour, startMinute] = venue.eventStartTime.split(':').map(Number);
	const [endHour, endMinute] = venue.eventEndTime.split(':').map(Number);
	if ([startHour, startMinute, endHour, endMinute].some((value) => Number.isNaN(value))) {
		return false;
	}
	for (const weekOffset of [0, -1]) {
		const start = now
			.startOf('week')
			.plus({ weeks: weekOffset, days: venue.eventStartWeekday - 1 })
			.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
		let end = start.set({ hour: endHour, minute: endMinute }).plus({ days: venue.eventEndDurationDays || 0 });
		if (end <= start) {
			end = end.plus({ days: 1 });
		}
		if (now >= start && now < end) {
			return true;
		}
	}
	return false;
}

function toVenueCard(venue: VenueDto): HoverCardData {
	return {
		kind: 'venue',
		name: venue.name,
		imageUrl: venue.banner?.url || '',
		address: venueAddress(venue),
		server: venue.server || '',
		open: isVenueOpen(venue),
	};
}

function toEventCard(event: EventDto): HoverCardData {
	const start = DateTime.fromMillis(event.startDateTime);
	const end = event.endDateTime ? DateTime.fromMillis(event.endDateTime) : null;
	const time = end ? `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')} Uhr` : `${start.toFormat('HH:mm')} Uhr`;
	const location = event.locations?.[0];
	return {
		kind: 'event',
		title: event.title,
		day: start.toFormat('d'),
		month: start.toFormat('LLL'),
		when: `${start.toFormat('cccc, d. MMMM')} · ${time}`,
		location: location ? [location.name, location.address].filter(Boolean).join(', ') : '',
	};
}

async function fetchCard(target: HoverCardTarget): Promise<HoverCardData | null> {
	const api = useApi();
	switch (target.kind) {
	case 'character':
		return toCharacterCard(await api.characters.getCharacterProfile(target.name.replace(/_/g, ' '), target.server));
	case 'venue':
		return toVenueCard(target.id
			? await api.venues.getVenue(target.id)
			: await api.venues.getVenueByName((target.name || '').replace(/_/g, ' '), target.server || ''));
	case 'event':
		return toEventCard(await api.events.getEvent(target.id));
	case 'link': {
		// Same choice as pages/Link.vue: the only result, else the only profile.
		const results = await api.links.resolve(encodeURIComponent(target.name.replace(/_/g, ' ')));
		const profiles = results.filter((entry) => entry.type === PageType.PROFILE);
		const result = results.length === 1 ? results[0] : profiles.length === 1 ? profiles[0] : null;
		if (!result) {
			return null;
		}
		if (result.type === PageType.PROFILE && result.name && result.server) {
			return resolveCard({ kind: 'character', name: result.name, server: result.server });
		}
		if (result.type === PageType.VENUE && result.id) {
			return resolveCard({ kind: 'venue', id: result.id });
		}
		if (result.type === PageType.EVENT && result.id) {
			return resolveCard({ kind: 'event', id: result.id });
		}
		return null;
	}
	}
}

/** Session-cached card data for a target; null when there is nothing to show. */
export function resolveCard(target: HoverCardTarget): Promise<HoverCardData | null> {
	const key = targetKey(target);
	let promise = cache.get(key);
	if (!promise) {
		promise = fetchCard(target).catch(() => null);
		cache.set(key, promise);
	}
	return promise;
}

// ---- controller -------------------------------------------------------------

function clearTimers() {
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
}

function setDescribedBy(anchor: HTMLAnchorElement | null, on: boolean) {
	if (!anchor) {
		return;
	}
	if (on) {
		previousDescribedBy = anchor.getAttribute('aria-describedby');
		anchor.setAttribute('aria-describedby', previousDescribedBy ? `${previousDescribedBy} ${HOVER_CARD_ID}` : HOVER_CARD_ID);
	} else if (previousDescribedBy) {
		anchor.setAttribute('aria-describedby', previousDescribedBy);
	} else {
		anchor.removeAttribute('aria-describedby');
	}
}

export function hideHoverCard() {
	clearTimers();
	pendingAnchor = null;
	if (hoverCardState.visible) {
		setDescribedBy(hoverCardState.anchor, false);
	}
	hoverCardState.visible = false;
	hoverCardState.anchor = null;
	hoverCardState.data = null;
}

export function scheduleHoverCardHide(delay = HIDE_DELAY_MS) {
	if (showTimer) {
		clearTimeout(showTimer);
		showTimer = null;
	}
	pendingAnchor = null;
	if (hideTimer) {
		clearTimeout(hideTimer);
	}
	hideTimer = setTimeout(hideHoverCard, delay);
}

function placeNear(anchor: HTMLAnchorElement) {
	const rect = anchor.getBoundingClientRect();
	const maxLeft = window.innerWidth - CARD_WIDTH - HOVER_CARD_GAP;
	hoverCardState.left = Math.max(HOVER_CARD_GAP, Math.min(rect.left, maxLeft));
	hoverCardState.top = rect.bottom + HOVER_CARD_GAP;
}

export function showHoverCardFor(anchor: HTMLAnchorElement, delay = SHOW_DELAY_MS) {
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
	if (hoverCardState.visible && hoverCardState.anchor === anchor) {
		return;
	}
	const target = parseHoverCardTarget(anchor.getAttribute('href'));
	if (!target) {
		return;
	}
	if (showTimer) {
		clearTimeout(showTimer);
	}
	pendingAnchor = anchor;
	const dataPromise = resolveCard(target);
	showTimer = setTimeout(() => {
		showTimer = null;
		void dataPromise.then((data) => {
			if (pendingAnchor !== anchor || !data || !anchor.isConnected) {
				return;
			}
			if (hoverCardState.visible) {
				setDescribedBy(hoverCardState.anchor, false);
			}
			hoverCardState.anchor = anchor;
			hoverCardState.data = data;
			placeNear(anchor);
			hoverCardState.visible = true;
			setDescribedBy(anchor, true);
		});
	}, delay);
}

function anchorFrom(root: HTMLElement, node: EventTarget | null): HTMLAnchorElement | null {
	if (!(node instanceof Element)) {
		return null;
	}
	const anchor = node.closest('a[href]');
	return anchor instanceof HTMLAnchorElement && root.contains(anchor) ? anchor : null;
}

/**
 * Enables hover cards for matching links inside `root` (event delegation, so
 * re-rendered content keeps working). Returns the unbind function.
 */
export function bindHoverCards(root: HTMLElement): () => void {
	const onPointerOver = (event: PointerEvent) => {
		if (event.pointerType === 'touch') {
			return;
		}
		const anchor = anchorFrom(root, event.target);
		if (anchor) {
			showHoverCardFor(anchor);
		}
	};
	const onPointerOut = (event: PointerEvent) => {
		const anchor = anchorFrom(root, event.target);
		if (anchor && !(event.relatedTarget instanceof Node && anchor.contains(event.relatedTarget))) {
			scheduleHoverCardHide();
		}
	};
	const onFocusIn = (event: FocusEvent) => {
		const anchor = anchorFrom(root, event.target);
		if (anchor && anchor.matches(':focus-visible')) {
			showHoverCardFor(anchor);
		}
	};
	const onFocusOut = (event: FocusEvent) => {
		if (anchorFrom(root, event.target)) {
			scheduleHoverCardHide(0);
		}
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && hoverCardState.visible) {
			hideHoverCard();
		}
	};
	const onClick = () => hideHoverCard();

	root.addEventListener('pointerover', onPointerOver);
	root.addEventListener('pointerout', onPointerOut);
	root.addEventListener('focusin', onFocusIn);
	root.addEventListener('focusout', onFocusOut);
	root.addEventListener('keydown', onKeyDown);
	root.addEventListener('click', onClick);

	return () => {
		root.removeEventListener('pointerover', onPointerOver);
		root.removeEventListener('pointerout', onPointerOut);
		root.removeEventListener('focusin', onFocusIn);
		root.removeEventListener('focusout', onFocusOut);
		root.removeEventListener('keydown', onKeyDown);
		root.removeEventListener('click', onClick);
		if (hoverCardState.anchor && root.contains(hoverCardState.anchor)) {
			hideHoverCard();
		}
	};
}

/** Cancels a pending hide while the pointer is over the card. */
export function keepHoverCardOpen() {
	if (hideTimer) {
		clearTimeout(hideTimer);
		hideTimer = null;
	}
}
