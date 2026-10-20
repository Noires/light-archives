// ER2-507 / ER2-509 — venue opening status and weekly hours.
//
// Thin re-export: the implementation lives in common/opening-status.ts, which
// also serves the home hub. Kept so venue components keep their import path.
export {
	WEEKDAYS_LONG,
	WEEKDAYS_SHORT,
	getVenueStatus,
	isOpenToday,
	shortHours,
	statusBadgeType,
	weekRows,
	weeklySlots,
} from 'src/common/opening-status';
export type {
	VenueHoursSource,
	VenueOpenState,
	VenueStatus,
	WeekRow,
	WeeklySlot,
} from 'src/common/opening-status';
