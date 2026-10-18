// ER2 round 2 — POST /characters/lookup: names from [[wikilinks]] (profile contacts) to
// profile cards. Matching mirrors the link resolver: the database compares names
// case-insensitively (collation); here the input is normalised the same way the
// client wikifies links (underscores = spaces) and matched back case-insensitively.

export const LOOKUP_MAX_NAMES = 50;
export const LOOKUP_NAME_MAX_LENGTH = 100;

/**
 * `[[Name|Text]]` / `[[Name]]` / `Name_With_Underscores` to "Name With Underscores":
 * brackets and display text removed, underscores and whitespace runs as one
 * space, trimmed. Case is kept (comparison happens on lookupKey()).
 */
export function normalizeLookupName(raw: string | null | undefined): string {
  let name = (raw || '').trim();
  const wikilink = /^\[\[([^\]]*)\]\]$/.exec(name);

  if (wikilink) {
    name = wikilink[1];
  }

  const bar = name.indexOf('|');

  if (bar !== -1) {
    name = name.substring(0, bar);
  }

  return name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().substring(0, LOOKUP_NAME_MAX_LENGTH);
}

export function lookupKey(name: string, server?: string | null): string {
  return `${name.toLowerCase()}@${(server || '').trim().toLowerCase()}`;
}

/** Profile route, as used by the client (`/:server/:Name_With_Underscores`). */
export function profileLink(name: string, server: string): string {
  return `/${server}/${name.replace(/ /g, '_')}`;
}

export interface LookupCandidate {
  name: string;
  server: string;
}

/**
 * Best match for one requested name: same name ignoring case, on the requested
 * server if one was given. Candidates must be ordered by preference (most
 * recently active first), so ambiguous names without server pick that one.
 */
export function pickLookupMatch<T extends LookupCandidate>(
  candidates: T[],
  name: string,
  server?: string | null,
): T | null {
  const wantedName = name.toLowerCase();
  const wantedServer = (server || '').trim().toLowerCase();

  return candidates.find((candidate) => candidate.name.toLowerCase() === wantedName
    && (!wantedServer || candidate.server.toLowerCase() === wantedServer)) || null;
}
