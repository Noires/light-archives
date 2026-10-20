import { Role, roleImplies } from '@app/shared/enums/role.enum';
import type { BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import type API from '@common/common/api';
import { DateTime } from 'luxon';
import { reactive } from 'vue';

// ER2 social — shared client state for follows, bookmarks, notifications and
// the calendar subscription. The production API does not have these
// endpoints yet, so every caller treats a failed request as "feature not
// available" and hides its UI instead of showing an error. Once a feature
// answered 404 (or 401/403, or no answer at all), it stays hidden for the
// rest of the session.

export type SocialFeature = 'follows' | 'notifications' | 'bookmarks' | 'calendarToken';

interface SocialState {
  unavailable: Record<SocialFeature, boolean>;
  /** Unread notifications, polled by ShellHeader; read by the mobile sheet and the notifications page. */
  unreadCount: number;
  /** `${targetType}:${targetId}` of the user's bookmarks; null until loaded. */
  bookmarkKeys: Set<string> | null;
}

export const socialState = reactive<SocialState>({
  unavailable: {
    follows: false,
    notifications: false,
    bookmarks: false,
    calendarToken: false,
  },
  unreadCount: 0,
  bookmarkKeys: null,
});

let bookmarkLoad: Promise<void> | null = null;

/** The server requires Role.USER (a verified account) for every social endpoint. */
export function canUseSocial(realRole: Role | null | undefined): boolean {
  return !!realRole && roleImplies(realRole, Role.USER);
}

export function errorStatus(e: unknown): number | null {
  const response = (e as { response?: { status?: number } } | null)?.response;
  return response && typeof response.status === 'number' ? response.status : null;
}

/**
 * Marks the feature unavailable when the error means "this API does not
 * offer it" (no response, 401, 403, 404, 405, 501). Returns true in that case.
 */
export function markUnavailable(feature: SocialFeature, e: unknown): boolean {
  const status = errorStatus(e);
  if (status === null || [ 401, 403, 404, 405, 501 ].includes(status)) {
    socialState.unavailable[feature] = true;
    return true;
  }
  return false;
}

export function isAvailable(feature: SocialFeature): boolean {
  return !socialState.unavailable[feature];
}

/** Called on login/logout: forget per-user data and retry the endpoints. */
export function resetSocialState() {
  socialState.unreadCount = 0;
  socialState.bookmarkKeys = null;
  bookmarkLoad = null;
  (Object.keys(socialState.unavailable) as SocialFeature[]).forEach((key) => {
    socialState.unavailable[key] = false;
  });
}

export function bookmarkKey(targetType: BookmarkTargetType, targetId: number): string {
  return `${targetType}:${targetId}`;
}

/** Loads the user's bookmark keys once per session; buttons share the result instead of asking per card. */
export function ensureBookmarkKeys(api: API): Promise<void> {
  if (socialState.bookmarkKeys || socialState.unavailable.bookmarks) {
    return Promise.resolve();
  }
  if (!bookmarkLoad) {
    bookmarkLoad = api.bookmarks.getMyBookmarks()
      .then((items) => {
        socialState.bookmarkKeys = new Set(
          items
            .filter((item) => item.targetType && item.targetId)
            .map((item) => bookmarkKey(item.targetType as BookmarkTargetType, item.targetId as number)),
        );
      })
      .catch((e) => {
        markUnavailable('bookmarks', e);
        bookmarkLoad = null;
      });
  }
  return bookmarkLoad;
}

export function setBookmarked(targetType: BookmarkTargetType, targetId: number, bookmarked: boolean) {
  const keys = new Set(socialState.bookmarkKeys || []);
  const key = bookmarkKey(targetType, targetId);
  if (bookmarked) {
    keys.add(key);
  } else {
    keys.delete(key);
  }
  socialState.bookmarkKeys = keys;
}

/** "vor 5 Min.", "vor 2 Std.", "vor 3 Tagen" */
export function relativeTime(millis: number | undefined | null): string {
  if (!millis) {
    return '';
  }
  const time = DateTime.fromMillis(millis);
  if (Math.abs(time.diffNow('seconds').seconds) < 60) {
    return 'gerade eben';
  }
  return time.toRelative({ locale: 'de', style: 'short' }) || '';
}

export function absoluteTime(millis: number | undefined | null): string {
  return millis ? DateTime.fromMillis(millis).setLocale('de').toFormat('d. LLLL yyyy, HH:mm') : '';
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  'series-part': 'auto_stories',
  'author-story': 'history_edu',
  'venue-event': 'storefront',
  'event-reminder': 'alarm',
  'event-registration': 'how_to_reg',
  'image-tag': 'sell',
};

export function notificationIcon(type: string | undefined): string {
  return (type && NOTIFICATION_ICONS[type]) || 'notifications';
}

export function loginWithDiscord(api: API) {
  window.location.href = api.user.getDiscordLoginUrl(window.location.origin);
}

/** Notification and bookmark links are client routes; anything else is ignored. */
export function isInternalLink(link: string | undefined | null): link is string {
  return !!link && link.startsWith('/') && !link.startsWith('//');
}
