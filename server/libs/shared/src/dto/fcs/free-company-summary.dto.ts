export interface FreeCompanySummaryDto {
	name: string;
	goal: string;
	crest: string[];
	server: string;
	// ER2-810 (optional)
	recruiting?: boolean | null;
}
