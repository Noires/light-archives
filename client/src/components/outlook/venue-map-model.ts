// ER2 outlook — venue map model: where a venue sits on the stylised district
// maps (district, ward, plot slot 1–60) and the plot coordinates of each map.
//
// The district maps are ORIGINAL, abstract artwork drawn for Elpisgarten. They
// borrow only the general idea of each housing district (a coast or a river,
// a ring road, plots around it) and contain no extracted game map assets.
//
// The production summary DTO only carries `housingArea` and a formatted
// address ("Lavendelbeete, Bezirk 12, Grundstück 5 (Erweiterung)"), so the
// structured fields (`location`, `ward`, `plot`, `room`, `subdivision`) are
// used when the API sends them and parsed from the address otherwise.
import { VenueSummaryDto } from '@app/shared/dto/venues/venue-summary.dto';
import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';

export type MapVenue = VenueSummaryDto & {
	location?: VenueLocation | null;
	ward?: number | null;
	plot?: number | null;
	room?: string | null;
	subdivision?: boolean | null;
};

export const OPEN_WORLD_KEY = 'OPEN_WORLD';
export const WARD_COUNT = 30;
export const PLOTS_PER_HALF = 30;

export const DISTRICT_ORDER: HousingArea[] = [
	HousingArea.MIST,
	HousingArea.LAVENDER_BEDS,
	HousingArea.GOBLET,
	HousingArea.SHIROGANE,
	HousingArea.EMPYREUM,
];

export const DISTRICT_LABELS: Record<string, string> = {
	[HousingArea.MIST]: 'Nebeldorf',
	[HousingArea.LAVENDER_BEDS]: 'Lavendelbeete',
	[HousingArea.GOBLET]: 'Kelchkuppe',
	[HousingArea.SHIROGANE]: 'Shirogane',
	[HousingArea.EMPYREUM]: 'Empyreum',
	[OPEN_WORLD_KEY]: 'Offene Welt',
};

export type PlaceKind = 'house' | 'apartment' | 'unknown';

export interface VenuePlace {
	venue: MapVenue;
	/** Housing district, or null for open-world venues. */
	district: HousingArea | null;
	ward: number | null;
	kind: PlaceKind;
	/** 1–60 (31–60 = subdivision); null for apartments and unknown plots. */
	slot: number | null;
	/** 0 = main ward, 1 = subdivision. */
	half: 0 | 1;
	room: string;
	/** Open-world group label (city or area). */
	city: string;
}

const WARD_REGEX = /(?:Bezirk|Ward)\s*(\d{1,2})\b/i;
const PLOT_REGEX = /(?:Grundstück|Haus|Plot|Nr\.)\s*(\d{1,2})\b/i;
const ROOM_REGEX = /(?:Wohnung|Apartment|Zimmer|Room)\s*([\w-]{1,8})?/i;
const SUBDIVISION_REGEX = /Erweiterung|Subdivision|Unterbezirk/i;

function inRange(value: number | null | undefined, min: number, max: number): number | null {
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function regexNumber(regex: RegExp, text: string): number | null {
	const match = regex.exec(text);
	return match ? parseInt(match[1], 10) : null;
}

/** Known open-world hubs; German and English spellings. */
const CITY_KEYWORDS: { label: string; pattern: RegExp }[] = [
	{ label: 'Limsa Lominsa', pattern: /limsa|lominsa|hawkers'? round|aftcastle|seebrise/i },
	{ label: 'Gridania', pattern: /gridania|lavender ?beds? market/i },
	{ label: 'Ul\'dah', pattern: /ul'?\s?dah|nald|thal/i },
	{ label: 'Ishgard', pattern: /ishgard|foundation|pillars|fundament|säulen/i },
	{ label: 'Kugane', pattern: /kugane/i },
	{ label: 'Doma', pattern: /doma|yanxia/i },
	{ label: 'Kristarium', pattern: /crystarium|kristarium/i },
	{ label: 'Eulmore', pattern: /eulmore/i },
	{ label: 'Alt-Sharlayan', pattern: /sharlayan/i },
	{ label: 'Radz-at-Han', pattern: /radz/i },
	{ label: 'Tuliyollal', pattern: /tuliyollal/i },
	{ label: 'Solution Nine', pattern: /solution ?nine|solution 9/i },
	{ label: 'Idyllshire', pattern: /idyll/i },
	{ label: 'Mor Dhona', pattern: /mor dhona|revenant|rastlos/i },
	{ label: 'Costa del Sol', pattern: /costa del sol/i },
	{ label: 'Gold Saucer', pattern: /gold(?:en)? saucer|goldene untertasse/i },
	{ label: 'Rhalgrs Wacht', pattern: /rhalgr/i },
];

/** City or area for an open-world address: a known hub, else the first segment. */
export function openWorldCity(address: string | null | undefined): string {
	const text = (address || '').trim();
	if (!text) {
		return 'Ohne Ortsangabe';
	}
	const known = CITY_KEYWORDS.find((city) => city.pattern.test(text));
	if (known) {
		return known.label;
	}
	const first = text.split(/[,;|/(\n]|\s[-–—]\s/)[0].trim();
	return first && first.length <= 40 ? first : 'Weitere Orte';
}

export function placeOf(venue: MapVenue): VenuePlace {
	const address = venue.address || '';
	const openWorld = venue.location === VenueLocation.OPEN_WORLD || !venue.housingArea;
	if (openWorld) {
		return { venue, district: null, ward: null, kind: 'unknown', slot: null, half: 0, room: '', city: openWorldCity(address) };
	}

	const ward = inRange(venue.ward, 1, WARD_COUNT) ?? inRange(regexNumber(WARD_REGEX, address), 1, WARD_COUNT);
	const subdivision = typeof venue.subdivision === 'boolean' ? venue.subdivision : SUBDIVISION_REGEX.test(address);

	let kind: PlaceKind = 'unknown';
	if (venue.location === VenueLocation.APARTMENT) {
		kind = 'apartment';
	} else if (venue.location === VenueLocation.HOUSE) {
		kind = 'house';
	} else if (ROOM_REGEX.test(address) && !PLOT_REGEX.test(address)) {
		kind = 'apartment';
	} else if (PLOT_REGEX.test(address)) {
		kind = 'house';
	}

	let slot: number | null = null;
	let room = '';
	if (kind === 'house') {
		const plot = inRange(venue.plot, 1, PLOTS_PER_HALF * 2) ?? inRange(regexNumber(PLOT_REGEX, address), 1, PLOTS_PER_HALF * 2);
		if (plot !== null) {
			slot = subdivision && plot <= PLOTS_PER_HALF ? plot + PLOTS_PER_HALF : plot;
		}
	} else if (kind === 'apartment') {
		const match = ROOM_REGEX.exec(address);
		room = (venue.room || (match && match[1]) || '').trim();
	}

	const half: 0 | 1 = slot !== null ? (slot > PLOTS_PER_HALF ? 1 : 0) : (subdivision ? 1 : 0);
	return { venue, district: venue.housingArea, ward, kind, slot, half, room, city: '' };
}

/** "Haus 12", "Wohnung 4", "Wohnungen (Erweiterung)" or "". */
export function unitLabel(place: VenuePlace): string {
	if (place.kind === 'house' && place.slot !== null) {
		return `Haus ${place.slot}`;
	}
	if (place.kind === 'apartment') {
		const base = place.room ? `Wohnung ${place.room}` : 'Wohnung';
		return place.half === 1 ? `${base} (Erweiterung)` : base;
	}
	return '';
}

// ---------------------------------------------------------------------------
// Map geometry. ViewBox 800 × 520; each map has two halves (main ward and
// subdivision), each a ring road with 30 plots in six clusters of five.
// ---------------------------------------------------------------------------

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 520;

export interface RingDef {
	cx: number;
	cy: number;
	rx: number;
	ry: number;
	/** Ellipse rotation in degrees. */
	rot: number;
	/** Angle of plot 1 in degrees (0 = east, clockwise). */
	start: number;
}

export interface MapPoint {
	x: number;
	y: number;
}

export interface DistrictArt {
	/** Water bodies (sea, river, pools). */
	water: string[];
	/** Shore or bank lines drawn over the water edge. */
	shore: string[];
	/** Paths, terraces, ridges: thin decorative strokes. */
	detail: string[];
	/** Small decorative dots (trees, rocks, lanterns). */
	dots: MapPoint[];
	/** Bridges or crossings between the halves. */
	bridges: string[];
	rings: [RingDef, RingDef];
}

const PLOT_SCALE = 1.24;
const CLUSTER_SPREAD = 10;

function rotatePoint(x: number, y: number, deg: number): MapPoint {
	const rad = (deg * Math.PI) / 180;
	return { x: x * Math.cos(rad) - y * Math.sin(rad), y: x * Math.sin(rad) + y * Math.cos(rad) };
}

function ringPoint(ring: RingDef, angleDeg: number, scale: number): MapPoint {
	const rad = (angleDeg * Math.PI) / 180;
	const local = rotatePoint(Math.cos(rad) * ring.rx * scale, Math.sin(rad) * ring.ry * scale, ring.rot);
	return { x: Math.round((ring.cx + local.x) * 10) / 10, y: Math.round((ring.cy + local.y) * 10) / 10 };
}

/** Position of plot slot 1–60 on a district map. */
export function plotPosition(art: DistrictArt, slot: number): MapPoint {
	const half = slot > PLOTS_PER_HALF ? 1 : 0;
	const index = (slot - 1) % PLOTS_PER_HALF;
	const cluster = Math.floor(index / 5);
	const offset = (index % 5) - 2;
	const ring = art.rings[half];
	const angle = ring.start + cluster * 60 + offset * CLUSTER_SPREAD;
	// Alternate clusters sit slightly further out so the halves read as streets.
	return ringPoint(ring, angle, PLOT_SCALE + (cluster % 2 === 0 ? 0 : 0.08));
}

/** Apartment building of a half (centre of its ring). */
export function apartmentPosition(art: DistrictArt, half: 0 | 1): MapPoint {
	return { x: art.rings[half].cx, y: art.rings[half].cy };
}

export function allPlotPositions(art: DistrictArt): MapPoint[] {
	const points: MapPoint[] = [];
	for (let slot = 1; slot <= PLOTS_PER_HALF * 2; slot++) {
		points.push(plotPosition(art, slot));
	}
	return points;
}

/** Deterministic scatter of decorative dots inside a box. */
function scatter(seed: number, count: number, box: [number, number, number, number]): MapPoint[] {
	const points: MapPoint[] = [];
	let value = seed;
	const next = () => {
		value = (value * 9301 + 49297) % 233280;
		return value / 233280;
	};
	for (let i = 0; i < count; i++) {
		points.push({ x: Math.round(box[0] + next() * box[2]), y: Math.round(box[1] + next() * box[3]) });
	}
	return points;
}

// Original artwork: hand-placed abstract shapes per district.
export const DISTRICT_ART: Record<string, DistrictArt> = {
	// Nebeldorf: a sea along the south and west with a rocky headland.
	[HousingArea.MIST]: {
		water: [
			'M0 380 C70 372 110 420 170 446 C250 480 330 470 420 488 C520 508 640 486 800 500 L800 520 L0 520 Z',
			'M0 0 L0 300 C26 262 18 210 34 160 C48 112 30 60 52 0 Z',
		],
		shore: [
			'M0 380 C70 372 110 420 170 446 C250 480 330 470 420 488 C520 508 640 486 800 500',
			'M0 300 C26 262 18 210 34 160 C48 112 30 60 52 0',
		],
		detail: [
			'M400 30 C392 120 412 200 398 260 C386 330 410 400 402 470',
			'M120 40 C200 24 300 30 380 46',
			'M430 46 C520 28 640 30 760 50',
		],
		dots: scatter(11, 26, [440, 12, 340, 40]).concat(scatter(23, 10, [60, 12, 320, 28])),
		bridges: [],
		rings: [
			{ cx: 215, cy: 236, rx: 112, ry: 132, rot: -12, start: -90 },
			{ cx: 600, cy: 248, rx: 116, ry: 130, rot: 10, start: -90 },
		],
	},
	// Lavendelbeete: a winding river between the halves, groves around them.
	[HousingArea.LAVENDER_BEDS]: {
		water: [
			'M372 0 C350 80 420 130 398 210 C378 280 336 330 380 410 C404 456 388 492 396 520 L436 520 C428 488 444 450 420 404 C380 330 420 282 440 212 C462 128 392 78 414 0 Z',
		],
		shore: [
			'M372 0 C350 80 420 130 398 210 C378 280 336 330 380 410 C404 456 388 492 396 520',
			'M414 0 C392 78 462 128 440 212 C420 282 380 330 420 404 C444 450 428 488 436 520',
		],
		detail: [
			'M30 470 C120 490 240 486 340 470',
			'M470 474 C560 492 680 490 780 470',
		],
		dots: scatter(5, 22, [16, 14, 330, 44]).concat(scatter(17, 22, [468, 14, 320, 44])),
		bridges: [ 'M392 168 L446 172', 'M366 346 L420 352' ],
		rings: [
			{ cx: 200, cy: 254, rx: 114, ry: 134, rot: 6, start: -80 },
			{ cx: 610, cy: 250, rx: 112, ry: 136, rot: -8, start: -100 },
		],
	},
	// Kelchkuppe: a dry canyon floor with mesas and one oasis pool.
	[HousingArea.GOBLET]: {
		water: [
			'M378 236 C392 222 424 222 436 238 C448 256 430 276 406 276 C382 276 366 254 378 236 Z',
		],
		shore: [
			'M360 0 C380 90 352 160 370 232',
			'M444 0 C426 90 456 160 438 232',
			'M372 282 C352 360 384 430 366 520',
			'M440 282 C460 360 426 430 448 520',
		],
		detail: [
			'M20 40 L80 20 L150 34 L130 60 L40 64 Z',
			'M650 470 L720 452 L790 468 L770 500 L668 502 Z',
			'M640 30 L700 18 L760 30 L742 52 L660 54 Z',
			'M30 480 L90 466 L150 482 L120 506 L40 504 Z',
		],
		dots: scatter(29, 14, [170, 16, 180, 30]).concat(scatter(31, 14, [460, 478, 170, 30])),
		bridges: [],
		rings: [
			{ cx: 205, cy: 258, rx: 110, ry: 128, rot: 0, start: -90 },
			{ cx: 600, cy: 256, rx: 110, ry: 128, rot: 0, start: -90 },
		],
	},
	// Shirogane: a bay in the north with arched bridges and small islands.
	[HousingArea.SHIROGANE]: {
		water: [
			'M0 0 L800 0 L800 52 C700 84 600 60 520 92 C460 116 430 160 400 160 C370 160 340 116 280 92 C200 60 100 84 0 52 Z',
			'M392 186 C384 260 416 330 398 400 C390 440 404 488 400 520 L420 520 C424 488 412 440 420 400 C436 330 404 260 412 186 Z',
		],
		shore: [
			'M0 52 C100 84 200 60 280 92 C340 116 370 160 400 160 C430 160 460 116 520 92 C600 60 700 84 800 52',
		],
		detail: [
			'M160 30 C170 22 186 22 194 30 C186 38 170 38 160 30 Z',
			'M612 26 C624 18 642 18 652 26 C642 34 624 34 612 26 Z',
		],
		dots: scatter(41, 16, [30, 470, 320, 36]).concat(scatter(43, 16, [450, 470, 320, 36])),
		bridges: [ 'M386 300 Q408 286 430 300', 'M386 430 Q408 416 430 430' ],
		rings: [
			{ cx: 205, cy: 284, rx: 112, ry: 120, rot: -6, start: -90 },
			{ cx: 605, cy: 284, rx: 112, ry: 120, rot: 6, start: -90 },
		],
	},
	// Empyreum: terraced cliffs in the north and a falling stream down the middle.
	[HousingArea.EMPYREUM]: {
		water: [
			'M394 0 L418 0 C414 70 426 140 414 210 C404 270 422 340 412 410 C406 460 416 494 412 520 L390 520 C394 494 384 460 390 410 C400 340 382 270 392 210 C404 140 392 70 394 0 Z',
		],
		shore: [
			'M394 0 C392 70 404 140 392 210 C382 270 400 340 390 410 C384 460 394 494 390 520',
			'M418 0 C414 70 426 140 414 210 C404 270 422 340 412 410 C406 460 416 494 412 520',
		],
		detail: [
			'M20 36 C120 16 260 18 370 34',
			'M30 60 C130 44 260 46 366 58',
			'M440 34 C560 16 680 18 784 36',
			'M444 58 C560 44 680 46 776 60',
		],
		dots: scatter(53, 12, [40, 474, 300, 30]).concat(scatter(59, 12, [460, 474, 300, 30])),
		bridges: [ 'M380 150 L428 150', 'M378 380 L426 380' ],
		rings: [
			{ cx: 205, cy: 268, rx: 112, ry: 126, rot: 4, start: -90 },
			{ cx: 605, cy: 268, rx: 112, ry: 126, rot: -4, start: -90 },
		],
	},
};

/** SVG path of a ring road (rotated ellipse). */
export function ringPath(ring: RingDef): string {
	const points: MapPoint[] = [];
	for (let angle = 0; angle < 360; angle += 10) {
		points.push(ringPoint(ring, angle, 1));
	}
	return `M${points.map((p) => `${p.x} ${p.y}`).join(' L')} Z`;
}
