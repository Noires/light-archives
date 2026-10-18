
export function wikify(name: string): string {
	return name.replace(/ /g, '_');
}

export function unwikify(name: string): string {
	return name.replace(/_/g, ' ');
}

// ER2-010 — the link body may span line breaks and carry padding spaces
// (`[[ Seikbhar Geissgaeg|Grollender Seebär]]`, `[[Name` + line break + `]]`), so it matches
// any run of characters except brackets instead of `.`. Excluding `[`/`]`
// keeps an unclosed `[[` from swallowing text up to a later link; the 200
// character cap keeps a stray `[[` from matching across paragraphs.
const WIKILINK_REGEX = /(?:\[\[|(?:&#91;|&#x5b;|&lbrack;){2})([^[\]]{1,200}?)(?:\]\]|(?:&#93;|&#x5d;|&rbrack;){2})/gi;

// Line breaks the HTML editor may insert inside a link, plus non-breaking spaces.
const LINK_WHITESPACE_REGEX = /<br\s*\/?>|&nbsp;|&#160;|\s+/gi;

const HTML_ENTITIES: { [entity: string]: string } = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&apos;': "'",
	'&#39;': "'",
	'&#x27;': "'",
};

/** Decodes the few entities html.escape / the editor produce, for the link target only. */
function decodeBasicEntities(text: string): string {
	return text.replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] || entity);
}

export function parseWikilinksInHtml(html: string): string {
	return html.replace(WIKILINK_REGEX, (match: string, link: string) => wikilinkToHtml(link) ?? match);
}

/** Returns null for an empty link (`[[ ]]`), which then stays as written. */
function wikilinkToHtml(linkContent: string): string | null {
	const normalizedLinkContent = linkContent.replace(LINK_WHITESPACE_REGEX, ' ');

	if (normalizedLinkContent.indexOf('<') !== -1 || normalizedLinkContent.indexOf('>') !== -1) {
		// HTML tags in link content - this means malformed HTML editor content, so just return as is
		return linkContent;
	}

	const trimmedLinkContent = normalizedLinkContent.trim();

	if (!trimmedLinkContent) {
		return null;
	}

	let target: string;
	let text: string;

	const indexOfVbar = trimmedLinkContent.indexOf('|');

	if (indexOfVbar === -1) {
		target = trimmedLinkContent;
		text = trimmedLinkContent;
	} else {
		target = trimmedLinkContent.substring(0, indexOfVbar).trim();
		text = trimmedLinkContent.substring(indexOfVbar + 1).trim() || target;
	}

	// The input is HTML (escaped plain text or sanitised editor output), so the
	// visible text stays as-is while the URL target is built from decoded text:
	// `Nymeia&apos;s Raben` must link to /link/Nymeia's_Raben.
	return `<a href="/link/${encodeURIComponent(wikify(decodeBasicEntities(target)))}">${text}</a>`;
}
