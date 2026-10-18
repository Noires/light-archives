// ER2-111 — keep obvious test content out of public lists.
//
// Some stories and wiki pages were created to try the editor: titled exactly
// "Test" (any case), or saved without a body. They make the main page, the
// changes feed and the directories look empty and unfinished. This filter is
// deliberately conservative: it only matches
//   - a title that is exactly "test" after trimming, case-insensitive
//     ("Test", "test", " TEST "), never titles that merely contain the word
//     ("Testament", "Der Test der Zeit");
//   - a body that is empty once HTML tags, &nbsp; and whitespace are removed
//     (e.g. "", "<p></p>", "<p>&nbsp;</p>", "<p><br></p>").
// Matching items are only hidden from lists. They stay reachable by URL, in
// search and in the author's own content overview, and nothing is deleted.

export interface TestContentCandidate {
  title?: string | null;
  /** HTML body, or a plain-text excerpt of it. */
  content?: string | null;
}

const TEST_TITLE = 'test';

function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when an item looks like test content and should be left out of public lists. */
export function isTestContent(item: TestContentCandidate): boolean {
  const title = (item.title || '').trim().toLowerCase();
  if (title === TEST_TITLE) {
    return true;
  }

  return toPlainText(item.content || '').length === 0;
}

/**
 * SQL counterpart of isTestContent for TypeORM query builders (MariaDB):
 * `query.andWhere(excludeTestContentSql('story'))` keeps only rows that are
 * not test content. `alias` must be a trusted query-builder alias, never user
 * input, because it is interpolated into the SQL. The pattern avoids `:name`
 * sequences (e.g. POSIX `[[:space:]]`), which TypeORM reads as parameters.
 */
export function excludeTestContentSql(alias: string): string {
  return (
    `(LOWER(TRIM(${alias}.title)) <> '${TEST_TITLE}'` +
    ` AND TRIM(REGEXP_REPLACE(COALESCE(${alias}.content, ''), '<[^>]*>|&nbsp;|&#160;|[ \t\r\n]', '')) <> '')`
  );
}
