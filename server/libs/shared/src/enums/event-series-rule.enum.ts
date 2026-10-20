export enum EventSeriesRule {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  /** n-th weekday of the month (nth = 1..5, or -1 for the last one) */
  MONTHLY_NTH = 'monthly-nth',
}

export const EVENT_SERIES_RULES: readonly EventSeriesRule[] = Object.freeze([
  EventSeriesRule.WEEKLY,
  EventSeriesRule.BIWEEKLY,
  EventSeriesRule.MONTHLY_NTH,
]);

/** Allowed values for EventSeries.nth (-1 = last weekday of the month) */
export const EVENT_SERIES_NTH_VALUES: readonly number[] = Object.freeze([1, 2, 3, 4, 5, -1]);
