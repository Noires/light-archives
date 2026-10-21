import { EventType } from '../enums/event-type.enum';

// Labels used in Steward's Discord posts. Shared with the client, so the
// Discord preview on the site shows exactly what the bot posts.

export const DISCORD_EVENT_TYPE_LABELS: Record<EventType, string> = {
	[EventType.GENERAL]: 'Offenes Rollenspiel',
	[EventType.TAVERN]: 'Taverne / Kneipe',
	[EventType.BAR_LOUNGE]: 'Bar / Lounge',
	[EventType.BATHHOUSE]: 'Badehaus',
	[EventType.CLUB]: 'Club / Tanzlokal',
	[EventType.RESTAURANT_GASTHAUS]: 'Restaurant / Gasthaus',
	[EventType.TEAHOUSE]: 'Teehaus',
	[EventType.HEALERHOUSE]: 'Heilerhaus',
	[EventType.COMBAT_ARENA]: 'Kampfarena',
	[EventType.SALES]: 'Verkauf',
	[EventType.LIBRARY]: 'Bibliothek',
	[EventType.GALLERY_MUSEUM]: 'Galerie / Museum',
	[EventType.MARKET]: 'Markt',
	[EventType.ADVENTURERS_GUILD]: 'Abenteurergilde',
	[EventType.EDUCATION_UNIVERSITY]: 'Ausbildung / Universität',
	[EventType.RP]: 'Offenes Rollenspiel',
	[EventType.ADULT]: '18+',
	[EventType.OTHER]: 'Sonstiges',
};

export const DISCORD_CONTENT_NOTE_LABELS: Record<string, string> = {
	RAPE: 'Vergewaltigung',
	ABUSE: 'Missbrauch',
	SEXUALABUSE: 'Sexueller Missbrauch',
	VIOLENCE: 'Gewalt | Gewaltdarstellung',
	DOMESTICVIOLENCE: 'Häusliche Gewalt',
	GORE: 'Gore',
	MENTALDISORDER: 'Psychische Störung | Phobie | Manipulation',
	PSYCHOLOGICALVIOLENCE: 'Psychische Gewalt | Seelische Gewalt | Mobbing',
	SWEARWORDS: 'Vulgärsprache | Kraftausdrücke | Derbe Sprache',
	SELFHARM: 'Selbstverletzendes Verhalten',
	SUICIDE: 'Suizid',
	ADDICTION: 'Sucht | Spielsucht | Glücksspiel',
	DRUGS: 'Drogen | Alkohol | Drogenkonsum',
	CRIME: 'Crime | Kriminalität',
	SEXISM: 'Sexismus',
	PORNOGRAPHIC: 'Pornografie | Voyeurismus',
	ERP: 'ERP | Sex',
	BODYSHAMING: 'Body-Shaming',
	MISOGYNY: 'Misogynie',
	MISANDRY: 'Misandrie',
	HOMOPHOBE: 'Homophobie',
	TRANSPHOBIA: 'Transphobie',
	RACISM: 'Rassismus',
};
