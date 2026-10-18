import { NotificationPreferencesDto } from '@app/shared/dto/social/notification.dto';

export interface ReminderCandidate {
  registrationId: number;
  eventId: number;
  eventTitle: string;
  startDateTime: Date;
  userId: number;
  discordId: string | null;
}

export interface DueReminder {
  userId: number;
  discordId: string | null;
  eventId: number;
  eventTitle: string;
  startDateTime: Date;
  /** whether the user wants the in-app notification (else the registration is only marked) */
  notify: boolean;
  discordDm: boolean;
}

/**
 * Picks the candidates whose event starts within the user's reminder window (now, now + reminderMinutes].
 * One reminder per (user, event) even if several of the user's characters are going.
 * All registration ids in the window are returned so they get marked as reminded.
 */
export function selectDueReminders(
  candidates: ReminderCandidate[],
  prefs: Map<number, Required<NotificationPreferencesDto>>,
  now: Date,
): { reminders: DueReminder[]; registrationIds: number[] } {
  const reminders = new Map<string, DueReminder>();
  const registrationIds: number[] = [];

  for (const candidate of candidates) {
    const pref = prefs.get(candidate.userId);

    if (!pref) {
      continue;
    }

    const msUntilStart = candidate.startDateTime.getTime() - now.getTime();

    if (msUntilStart <= 0 || msUntilStart > pref.reminderMinutes * 60 * 1000) {
      continue;
    }

    registrationIds.push(candidate.registrationId);
    const key = `${candidate.userId}:${candidate.eventId}`;

    if (!reminders.has(key)) {
      reminders.set(key, {
        userId: candidate.userId,
        discordId: candidate.discordId,
        eventId: candidate.eventId,
        eventTitle: candidate.eventTitle,
        startDateTime: candidate.startDateTime,
        notify: pref.eventReminder,
        discordDm: pref.eventReminder && pref.discordDm && !!candidate.discordId,
      });
    }
  }

  return { reminders: [...reminders.values()], registrationIds };
}
