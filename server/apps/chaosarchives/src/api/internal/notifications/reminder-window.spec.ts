import { NotificationPreferencesDto } from '@app/shared/dto/social/notification.dto';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './notifications.service';
import { ReminderCandidate, selectDueReminders } from './reminder-window';

const now = new Date('2026-10-18T18:00:00Z');
const minutes = (n: number) => new Date(now.getTime() + n * 60 * 1000);

function candidate(overrides: Partial<ReminderCandidate>): ReminderCandidate {
  return {
    registrationId: 1,
    eventId: 10,
    eventTitle: 'Tanzabend',
    startDateTime: minutes(20),
    userId: 1,
    discordId: null,
    ...overrides,
  };
}

function prefs(entries: [number, Partial<NotificationPreferencesDto>][]): Map<number, Required<NotificationPreferencesDto>> {
  return new Map(entries.map(([id, pref]) => [id, { ...DEFAULT_NOTIFICATION_PREFERENCES, ...pref }]));
}

describe('selectDueReminders', () => {
  it('selects events starting within the user window, not before or after', () => {
    const result = selectDueReminders(
      [
        candidate({ registrationId: 1, eventId: 10, startDateTime: minutes(30) }), // edge: exactly 30 min
        candidate({ registrationId: 2, eventId: 11, startDateTime: minutes(31) }), // too early
        candidate({ registrationId: 3, eventId: 12, startDateTime: minutes(0) }), // already started
        candidate({ registrationId: 4, eventId: 13, startDateTime: minutes(5) }),
      ],
      prefs([[1, {}]]),
      now,
    );

    expect(result.registrationIds).toEqual([1, 4]);
    expect(result.reminders.map((r) => r.eventId)).toEqual([10, 13]);
  });

  it('uses each user’s reminderMinutes', () => {
    const result = selectDueReminders(
      [
        candidate({ registrationId: 1, userId: 1, startDateTime: minutes(90) }),
        candidate({ registrationId: 2, userId: 2, startDateTime: minutes(90) }),
      ],
      prefs([[1, { reminderMinutes: 120 }], [2, { reminderMinutes: 60 }]]),
      now,
    );

    expect(result.registrationIds).toEqual([1]);
  });

  it('sends one reminder per user and event but marks every registration', () => {
    const result = selectDueReminders(
      [
        candidate({ registrationId: 1, userId: 1, eventId: 10 }),
        candidate({ registrationId: 2, userId: 1, eventId: 10 }), // second character of the same user
      ],
      prefs([[1, {}]]),
      now,
    );

    expect(result.registrationIds).toEqual([1, 2]);
    expect(result.reminders).toHaveLength(1);
  });

  it('marks but does not notify when reminders are switched off', () => {
    const result = selectDueReminders([candidate({})], prefs([[1, { eventReminder: false, discordDm: true }]]), now);

    expect(result.registrationIds).toEqual([1]);
    expect(result.reminders[0]).toMatchObject({ notify: false, discordDm: false });
  });

  it('only requests a Discord DM when opted in and a Discord account is linked', () => {
    const result = selectDueReminders(
      [
        candidate({ registrationId: 1, userId: 1, discordId: '123' }),
        candidate({ registrationId: 2, userId: 2, discordId: '456' }),
        candidate({ registrationId: 3, userId: 3, discordId: null }),
      ],
      prefs([[1, { discordDm: true }], [2, {}], [3, { discordDm: true }]]),
      now,
    );

    expect(result.reminders.map((r) => [r.userId, r.discordDm])).toEqual([[1, true], [2, false], [3, false]]);
  });
});
