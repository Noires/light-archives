// Shared prop types for components/vision (ER2-005 … ER2-007).
// Import from here in pages: `import type { SectionTab } from 'components/vision/types';`
import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router';

export type StatusBadgeType =
	| 'live'
	| 'open'
	| 'soon'
	| 'recurring'
	| 'countdown'
	| 'server'
	| 'cw'
	| 'rp-ic'
	| 'rp-lfrp'
	| 'rp-ooc';

export interface AvatarItem {
	src: string;
	alt: string;
}

export interface SectionTab {
	key: string;
	label: string;
	icon?: string;
	count?: number | string;
	to?: RouteLocationRaw;
	hidden?: boolean;
	dimmed?: boolean;
}

export type SectionTabsSync = 'none' | 'query' | 'route';

export interface BreadcrumbItem {
	label: string;
	to?: RouteLocationRaw;
}

/** Value of `route.meta.breadcrumb`. */
export type BreadcrumbMeta = string | ((route: RouteLocationNormalizedLoaded) => string);

export interface EventCardEvent {
	id: number | string;
	title: string;
	/** ISO string, epoch millis or Date. */
	startDateTime: string | number | Date;
	endDateTime?: string | number | Date | null;
	imageSrc?: string | null;
	locationLabel?: string | null;
	recurringLabel?: string | null;
	live?: boolean;
	attendees?: AvatarItem[];
	attendeeLabel?: string;
}

export type EventCardState = 'default' | 'live';
