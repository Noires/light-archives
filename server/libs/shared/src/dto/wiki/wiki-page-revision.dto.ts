/** ER2 round 2: one entry of GET /wiki/:title/revisions (newest first). */
export interface WikiPageRevisionSummaryDto {
	id: number;
	/** epoch millis */
	createdAt: number;
	editor: string;
	editorServer: string;
	changeNote: string | null;
	/** content size in bytes (UTF-8) */
	size: number;
}

/** ER2 round 2: response of GET /wiki/:title/revisions/:id. */
export interface WikiPageRevisionDto extends WikiPageRevisionSummaryDto {
	wikiPageId: number;
	title: string;
	content: string;
}
