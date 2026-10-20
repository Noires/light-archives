// ER2 outlook — relationship constellation model. Parses the contact fields
// the same way CharacterOverview does (profile-sections' CONTACT_FIELDS +
// extractWikilinks, links through /link/<wikified target>) and lays the
// contacts out on three rings around the character.
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { wikify } from '@common/common/wikilinks';
import { CONTACT_FIELDS, extractWikilinks, fieldText } from 'components/character/profile-sections';

export interface ConstellationRing {
	index: number;
	label: string;
	keys: string[];
}

/** Person relations only; free companies, venues and communities are not stars. */
export const CONSTELLATION_RINGS: ConstellationRing[] = [
	{ index: 0, label: 'Familie und Herz', keys: [ 'partners', 'parents', 'children', 'relatives' ] },
	{ index: 1, label: 'Freunde und Bekannte', keys: [ 'friends', 'acquaintances' ] },
	{ index: 2, label: 'Rivalen und Vergangenheit', keys: [ 'enemies', 'past' ] },
];

export const MAX_STARS = 30;

export interface ContactStar {
	id: string;
	target: string;
	label: string;
	relation: string;
	ring: number;
	to: string;
}

export interface PlacedStar extends ContactStar {
	x: number;
	y: number;
	/** Label side: right of the star (east half) or left of it. */
	side: 'start' | 'end';
}

/** Relationship contacts in field order, deduplicated by target. */
export function parseContactStars(character: CharacterProfileDto): ContactStar[] {
	const seen = new Set<string>();
	const result: ContactStar[] = [];
	for (const ring of CONSTELLATION_RINGS) {
		for (const field of CONTACT_FIELDS.filter((f) => ring.keys.includes(String(f.key)))) {
			for (const ref of extractWikilinks(fieldText(character, field.key))) {
				const id = ref.target.toLowerCase();
				if (seen.has(id)) {
					continue;
				}
				seen.add(id);
				result.push({
					id,
					target: ref.target,
					label: ref.label,
					relation: field.label,
					ring: ring.index,
					to: `/link/${encodeURIComponent(wikify(ref.target))}`,
				});
			}
		}
	}
	return result;
}

export const CHART_WIDTH = 800;
export const CHART_HEIGHT = 560;
export const CHART_CX = CHART_WIDTH / 2;
export const CHART_CY = CHART_HEIGHT / 2;

/** Ring radii in viewBox units. */
export const RING_RADII: { rx: number; ry: number }[] = [
	{ rx: 150, ry: 102 },
	{ rx: 250, ry: 170 },
	{ rx: 340, ry: 232 },
];

/** Places stars evenly on their ring; ring offsets keep labels from lining up. */
export function placeStars(stars: ContactStar[]): PlacedStar[] {
	const placed: PlacedStar[] = [];
	for (const ring of CONSTELLATION_RINGS) {
		const members = stars.filter((star) => star.ring === ring.index);
		const radius = RING_RADII[ring.index];
		const step = 360 / Math.max(members.length, 1);
		const offset = -90 + ring.index * 23 + (members.length % 2 === 0 ? step / 2 : 0);
		members.forEach((star, i) => {
			const rad = ((offset + i * step) * Math.PI) / 180;
			const x = CHART_CX + Math.cos(rad) * radius.rx;
			const y = CHART_CY + Math.sin(rad) * radius.ry;
			placed.push({ ...star, x: Math.round(x), y: Math.round(y), side: x >= CHART_CX ? 'start' : 'end' });
		});
	}
	return placed;
}

export interface BackgroundStar {
	x: number;
	y: number;
	r: number;
	twinkle: boolean;
}

/** Deterministic faint background stars, seeded by the character name. */
export function backgroundStars(seedText: string, count = 90): BackgroundStar[] {
	let seed = 0;
	for (let i = 0; i < seedText.length; i++) {
		seed = (seed * 31 + seedText.charCodeAt(i)) % 233280;
	}
	const next = () => {
		seed = (seed * 9301 + 49297) % 233280;
		return seed / 233280;
	};
	const stars: BackgroundStar[] = [];
	for (let i = 0; i < count; i++) {
		stars.push({
			x: Math.round(next() * CHART_WIDTH),
			y: Math.round(next() * CHART_HEIGHT),
			r: Math.round((0.6 + next() * 1.4) * 10) / 10,
			twinkle: next() > 0.82,
		});
	}
	return stars;
}

/** Four-pointed star glyph centred on (x, y). */
export function starPath(x: number, y: number, size: number): string {
	const s = size;
	const w = size * 0.28;
	return `M${x} ${y - s} L${x + w} ${y - w} L${x + s} ${y} L${x + w} ${y + w} L${x} ${y + s} L${x - w} ${y + w} L${x - s} ${y} L${x - w} ${y - w} Z`;
}
