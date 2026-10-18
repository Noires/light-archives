/** ER2-608: one entry of GET /wiki/:title/mentions ("Erwähnt in"). */
export interface WikiMentionItemDto {
	id: number;
	title: string;
	link: string;
}

/** ER2-608: response of GET /wiki/:title/mentions (max. 10 items per group). */
export interface WikiMentionsDto {
	stories: WikiMentionItemDto[];
	noticeboardItems: WikiMentionItemDto[];
	events: WikiMentionItemDto[];
}
