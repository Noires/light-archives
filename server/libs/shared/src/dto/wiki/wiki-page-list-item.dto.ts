/** ER2-609: one entry of GET /wiki (published pages, most recently edited first). */
export interface WikiPageListItemDto {
	title: string;
	/** epoch millis */
	updatedAt: number;
}
