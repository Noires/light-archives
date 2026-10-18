// ER2-410 — chip shown in the GroupPlate hero.
export interface GroupPlateChip {
	label: string;
	icon?: string;
	/** Green dot, e.g. "Nimmt Mitglieder auf". */
	live?: boolean;
}

// ER2-410 — row of the GroupFacts ("Eckdaten") card; empty values are skipped.
export interface GroupFact {
	label: string;
	value?: string | null;
	/** External link (website, Discord). */
	href?: string;
}
