// ER2-112 — profile fields that carry no content for visitors.
// A field counts as empty when it is blank (also after stripping HTML from
// editor output) or only holds a placeholder such as "(FOLGT)", "folgt…",
// "-" or "...". Visitors do not see such fields; owners see them labelled
// EMPTY_FIELD_LABEL so they know what is left to fill in.

export const EMPTY_FIELD_LABEL = 'Noch leer';

const PLACEHOLDER_REGEX = /^[([]?\s*(?:folgt|kommt\s+noch|tba|tbd|-+|–|—|\/|\.{2,}|…)\s*[.…!]*\s*[)\]]?$/i;

function toPlainText(value: string): string {
	return value
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function isEmptyFieldValue(value?: string | null): boolean {
	if (!value) {
		return true;
	}

	const text = toPlainText(value);
	return text.length === 0 || PLACEHOLDER_REGEX.test(text);
}
