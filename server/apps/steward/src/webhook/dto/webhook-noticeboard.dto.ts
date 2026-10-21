export interface WebHookNoticeboardDto {
	noticeboardItemId: number;
	/** Missing on older callers: treated as 'create'. */
	action?: 'create' | 'update' | 'delete';
}
