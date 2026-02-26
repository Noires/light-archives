
export function wikify(name: string): string {
	return name.replace(/ /g, '_');
}

export function unwikify(name: string): string {
	return name.replace(/_/g, ' ');
}

const WIKILINK_REGEX = /(?:\[\[|(?:&#91;|&#x5b;|&lbrack;){2})(.+?)(?:\]\]|(?:&#93;|&#x5d;|&rbrack;){2})/gi;

export function parseWikilinksInHtml(html: string): string {
	return html.replace(WIKILINK_REGEX, (_, link) => wikilinkToHtml(link));
}

function wikilinkToHtml(linkContent: string): string {
	if (linkContent.indexOf('<') !== -1 || linkContent.indexOf('>') !== -1) {
		// HTML tags in link content - this means malformed HTML editor content, so just return as is
		return linkContent;
	}

	const trimmedLinkContent = linkContent.trim();

	let target: string;
	let text: string;

	const indexOfVbar = trimmedLinkContent.indexOf('|');

	if (indexOfVbar === -1) {
		target = wikify(trimmedLinkContent);
		text = trimmedLinkContent;
	} else {
		target = wikify(trimmedLinkContent.substring(0, indexOfVbar).trim());
		text = trimmedLinkContent.substring(indexOfVbar + 1).trim() || trimmedLinkContent.substring(0, indexOfVbar).trim();
	}

	return `<a href="/link/${encodeURIComponent(target)}">${text}</a>`;
}
