/** ER2 round 2: next event of an FC or community (owner character is a member). */
export interface GroupEventDto {
	id: number;
	title: string;
	/** epoch millis */
	startDateTime: number;
}

/** ER2 round 2: optional enrichment shared by FC and community list cards. */
export interface GroupSummaryExtrasDto {
	memberCount?: number;
	/** up to 3 avatar URLs; members hiding their avatar are skipped */
	memberAvatars?: string[];
	nextEvent?: GroupEventDto | null;
}
