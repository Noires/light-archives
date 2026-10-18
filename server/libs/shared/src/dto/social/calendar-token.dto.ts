/**
 * ER2 social: personal calendar subscription (ICS feed of registered and bookmarked events).
 * The token is a secret; anyone with the URL can read the feed, so users can rotate or revoke it.
 */
export interface CalendarTokenDto {
  /** absolute feed URL, e.g. https://…/api/internal/calendar/<token>.ics */
  url?: string;
  /** epoch millis */
  createdAt?: number;
}
