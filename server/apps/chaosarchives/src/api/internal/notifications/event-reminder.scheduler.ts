import { EventRegistration } from '@app/entity';
import { REMINDER_MINUTES_MAX } from '@app/shared/dto/social/notification.dto';
import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { In, Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { ReminderCandidate, selectDueReminders } from './reminder-window';

@Injectable()
export class EventReminderScheduler {
  private readonly logger = new Logger(EventReminderScheduler.name);

  private running = false;

  constructor(
    @InjectRepository(EventRegistration) private readonly registrationRepo: Repository<EventRegistration>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sendReminders(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      await this.run(new Date());
    } catch (e) {
      this.logger.error(e instanceof Error ? e.message : e, e instanceof Error ? e.stack : undefined);
    } finally {
      this.running = false;
    }
  }

  async run(now: Date): Promise<void> {
    const horizon = new Date(now.getTime() + REMINDER_MINUTES_MAX * 60 * 1000);
    const rows: {
      registrationId: number;
      eventId: number;
      eventTitle: string;
      startDateTime: Date | string;
      userId: number;
    }[] = await this.registrationRepo
      .createQueryBuilder('registration')
      .innerJoin('registration.event', 'event')
      .innerJoin('registration.character', 'character')
      .innerJoin('character.user', 'user')
      .select('registration.id', 'registrationId')
      .addSelect('event.id', 'eventId')
      .addSelect('event.title', 'eventTitle')
      .addSelect('event.startDateTime', 'startDateTime')
      .addSelect('user.id', 'userId')
      .where('registration.kind = :kind', { kind: EventRegistrationKind.GOING })
      .andWhere('registration.remindedAt IS NULL')
      .andWhere('event.hidden = :hidden', { hidden: false })
      .andWhere('event.startDateTime > :now', { now })
      .andWhere('event.startDateTime <= :horizon', { horizon })
      .getRawMany();

    if (rows.length === 0) {
      return;
    }

    const candidates: ReminderCandidate[] = rows.map((row) => ({
      registrationId: Number(row.registrationId),
      eventId: Number(row.eventId),
      eventTitle: row.eventTitle,
      startDateTime: new Date(row.startDateTime),
      userId: Number(row.userId),
    }));
    const prefs = await this.notificationsService.getPreferencesForUsers([...new Set(candidates.map((c) => c.userId))]);
    const { reminders, registrationIds } = selectDueReminders(candidates, prefs, now);

    if (registrationIds.length === 0) {
      return;
    }

    // Mark first: a crash afterwards loses a reminder rather than sending it twice
    await this.registrationRepo.update({ id: In(registrationIds) }, { remindedAt: now });

    for (const reminder of reminders) {
      if (!reminder.notify) {
        continue;
      }

      const time = DateTime.fromJSDate(reminder.startDateTime).setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).toFormat('HH:mm');
      const title = `„${reminder.eventTitle}“ beginnt bald`;
      const body = `Beginn um ${time} Uhr`;
      const link = `/event/${reminder.eventId}`;

      try {
        // eslint-disable-next-line no-await-in-loop -- sequential on purpose: keeps per-user reminders ordered
        await this.notificationsService.notify(reminder.userId, { type: 'event-reminder', title, body, link });
      } catch (e) {
        this.logger.error(e instanceof Error ? e.message : e);
      }
    }
  }
}
