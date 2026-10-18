// ER2-401 — character profile sections (tabs) and the rules that decide
// whether a section has content. Visitors only see sections that are switched
// on and filled; owners see every section, empty or switched-off ones dimmed.
import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { isEmptyFieldValue } from './empty-field';

export type CharacterTabKey =
	| 'profil'
	| 'aussehen'
	| 'persoenlichkeit'
	| 'kontakte'
	| 'geruechte'
	| 'tagebuch'
	| 'galerie'
	| 'inventar'
	| 'pen-and-paper';

type VisibilityFlag =
	| 'showAppearance'
	| 'showPersonality'
	| 'showContacts'
	| 'showRumors'
	| 'showDiary'
	| 'showGallery'
	| 'showInventory';

export interface CharacterSection {
	key: CharacterTabKey;
	label: string;
	icon: string;
	/** Child path of /edit-character/:id/ */
	editPath: string;
	/** Visibility switch the owner sets in the editor; none = always on. */
	flag?: VisibilityFlag;
}

export const CHARACTER_SECTIONS: readonly CharacterSection[] = Object.freeze([
	{ key: 'profil', label: 'Profil', icon: 'account_circle', editPath: 'profile' },
	{ key: 'aussehen', label: 'Aussehen', icon: 'curtains', editPath: 'appearance', flag: 'showAppearance' },
	{ key: 'persoenlichkeit', label: 'Persönlichkeit', icon: 'psychology', editPath: 'personality', flag: 'showPersonality' },
	{ key: 'kontakte', label: 'Kontakte', icon: 'diversity_3', editPath: 'contacts', flag: 'showContacts' },
	{ key: 'geruechte', label: 'Gerüchte', icon: 'sms', editPath: 'rumors', flag: 'showRumors' },
	{ key: 'tagebuch', label: 'Tagebuch', icon: 'auto_stories', editPath: 'diary', flag: 'showDiary' },
	{ key: 'galerie', label: 'Galerie', icon: 'collections', editPath: 'gallery', flag: 'showGallery' },
	{ key: 'inventar', label: 'Inventar', icon: 'diamond', editPath: 'inventory', flag: 'showInventory' },
	{ key: 'pen-and-paper', label: 'Pen & Paper', icon: 'casino', editPath: 'pen-and-paper' },
] as CharacterSection[]);

export const DEFAULT_CHARACTER_TAB: CharacterTabKey = 'profil';

export function isCharacterTabKey(value: unknown): value is CharacterTabKey {
	return typeof value === 'string' && CHARACTER_SECTIONS.some((section) => section.key === value);
}

export function findSection(key: CharacterTabKey): CharacterSection {
	return CHARACTER_SECTIONS.find((section) => section.key === key) || CHARACTER_SECTIONS[0];
}

type TextKey = keyof CharacterProfileDto;

export const APPEARANCE_FIELDS: TextKey[] = [
	'haircolor', 'eyecolor', 'skintone', 'build', 'height', 'weight', 'apparentage', 'voice',
	'specialfeatures', 'appearance', 'aether',
];

export const PERSONALITY_FIELDS: TextKey[] = [
	'personality', 'loves', 'hates', 'wishes', 'fears', 'slogan', 'motivation', 'strengths', 'weaknesses', 'ticks',
];

export const CONTACT_FIELDS: { key: TextKey; label: string }[] = [
	{ key: 'partners', label: 'Partner' },
	{ key: 'parents', label: 'Eltern' },
	{ key: 'children', label: 'Kinder' },
	{ key: 'relatives', label: 'Verwandte' },
	{ key: 'friends', label: 'Freunde' },
	{ key: 'acquaintances', label: 'Bekannte' },
	{ key: 'enemies', label: 'Rivalen' },
	{ key: 'past', label: 'Vergangenheit' },
	{ key: 'freecompanies', label: 'Freie Gesellschaft' },
	{ key: 'meetingplaces', label: 'Treffpunkt' },
	{ key: 'communities', label: 'Community' },
	{ key: 'mentioned', label: 'Erwähnt' },
];

export const RUMOR_FIELDS: { key: TextKey; label: string }[] = [
	{ key: 'commonrumors', label: 'Häufig' },
	{ key: 'openinformation', label: 'Offen' },
	{ key: 'rarerumors', label: 'Selten' },
];

export const INVENTORY_FIELDS: TextKey[] = ['possession', 'specialitems'];

// Same field set the old page used to decide whether a P&P sheet exists.
const PEN_AND_PAPER_FIELDS: TextKey[] = [
	'title', 'nickname', 'profession', 'deity', 'family', 'age', 'apparentage', 'pronouns', 'birthplace', 'birthday',
	'residence', 'relationsshipstatus', 'background', 'personality', 'currently', 'oocInfo', 'openinformation',
	'commonrumors', 'rarerumors', 'loves', 'hates', 'wishes', 'fears', 'slogan', 'motivation', 'strengths',
	'weaknesses', 'ticks', 'haircolor', 'eyecolor', 'skintone', 'build', 'height', 'weight', 'voice',
	'specialfeatures', 'possession', 'specialitems', 'partners', 'parents', 'children', 'relatives', 'friends',
	'acquaintances', 'enemies', 'freecompanies', 'meetingplaces', 'communities', 'mentioned', 'past',
];

export function fieldText(character: CharacterProfileDto, key: TextKey): string {
	const value = character[key];
	return typeof value === 'string' ? value : '';
}

export function hasText(character: CharacterProfileDto, key: TextKey): boolean {
	return !isEmptyFieldValue(fieldText(character, key));
}

function anyText(character: CharacterProfileDto, keys: TextKey[]): boolean {
	return keys.some((key) => hasText(character, key));
}

const WIKILINK_REGEX = /\[\[([^[\]]{1,200}?)\]\]/g;

export interface WikilinkRef {
	target: string;
	label: string;
}

/** `[[Target|Label]]` / `[[Target]]` references in a text field. */
export function extractWikilinks(text: string): WikilinkRef[] {
	const result: WikilinkRef[] = [];
	if (!text) {
		return result;
	}
	for (const match of text.matchAll(WIKILINK_REGEX)) {
		const body = match[1].replace(/<br\s*\/?>|&nbsp;|\s+/gi, ' ').trim();
		if (!body || body.includes('<')) {
			continue;
		}
		const bar = body.indexOf('|');
		const target = (bar === -1 ? body : body.substring(0, bar)).trim();
		const label = (bar === -1 ? body : body.substring(bar + 1)).trim() || target;
		if (target) {
			result.push({ target, label });
		}
	}
	return result;
}

/** Replaces wikilinks by their label, for one-line meta text. */
export function stripWikilinks(text: string): string {
	return (text || '').replace(WIKILINK_REGEX, (_, body: string) => {
		const bar = body.indexOf('|');
		return (bar === -1 ? body : body.substring(bar + 1) || body.substring(0, bar)).trim();
	});
}

/** Text of the list items or paragraphs of an editor field, one rumour each. */
export function splitEntries(html: string): string[] {
	if (isEmptyFieldValue(html)) {
		return [];
	}
	let parts: string[];
	if (/<li[\s>]/i.test(html)) {
		parts = Array.from(html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi), (m) => m[1]);
	} else {
		parts = html.split(/<\/p>|<br\s*\/?>|\n/i);
	}
	return parts
		.map((part) => stripWikilinks(part.replace(/<[^>]*>/g, ' '))
			.replace(/&nbsp;|&#160;/gi, ' ')
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&#39;|&apos;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/\s+/g, ' ')
			.trim())
		.filter((part) => part.length > 0 && !isEmptyFieldValue(part));
}

export function contactCount(character: CharacterProfileDto): number {
	const names = new Set<string>();
	CONTACT_FIELDS.forEach(({ key }) => extractWikilinks(fieldText(character, key)).forEach((ref) => names.add(ref.target.toLowerCase())));
	if (names.size > 0) {
		return names.size;
	}
	return CONTACT_FIELDS.filter(({ key }) => hasText(character, key)).length;
}

export function rumorCount(character: CharacterProfileDto): number {
	return RUMOR_FIELDS.reduce((sum, { key }) => sum + splitEntries(fieldText(character, key)).length, 0);
}

export function sectionHasContent(key: CharacterTabKey, character: CharacterProfileDto, content: CharacterContentDto): boolean {
	switch (key) {
		case 'profil': return true;
		case 'aussehen': return anyText(character, APPEARANCE_FIELDS) || !!character.appearanceImage;
		case 'persoenlichkeit': return anyText(character, PERSONALITY_FIELDS);
		case 'kontakte': return anyText(character, CONTACT_FIELDS.map((f) => f.key));
		case 'geruechte': return anyText(character, RUMOR_FIELDS.map((f) => f.key));
		case 'tagebuch': return content.stories.length > 0;
		case 'galerie': return !!content.images && content.images.length > 0;
		case 'inventar': return anyText(character, INVENTORY_FIELDS);
		case 'pen-and-paper': return anyText(character, PEN_AND_PAPER_FIELDS);
	}
	return false;
}

export function sectionCount(key: CharacterTabKey, character: CharacterProfileDto, content: CharacterContentDto): number | undefined {
	switch (key) {
		case 'kontakte': return contactCount(character);
		case 'geruechte': return rumorCount(character);
		case 'tagebuch': return content.stories.length;
		case 'galerie': return content.images ? content.images.length : 0;
		default: return undefined;
	}
}

/** Switched on by the owner (sections without a switch are always on). */
export function sectionEnabled(section: CharacterSection, character: CharacterProfileDto): boolean {
	return !section.flag || !!character[section.flag];
}

/** Visitors see a section only when it is switched on and has content. */
export function sectionPublic(section: CharacterSection, character: CharacterProfileDto, content: CharacterContentDto): boolean {
	return sectionEnabled(section, character) && sectionHasContent(section.key, character, content);
}
