export interface CommunitySummaryDto {
	id: number;
	name: string;
	goal: string;
	// ER2-810 (optional)
	recruiting?: boolean | null;
}
