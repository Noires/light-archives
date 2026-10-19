// Runs one pass of the event reminder scheduler against the configured database, outside Nest.
// Used by run.mjs; the cron in the server runs only every 5 minutes.
//   node -r ts-node/register/transpile-only -r tsconfig-paths/register test/er2-integration/reminder-run.ts
import 'reflect-metadata';
import { dbConfiguration } from '@app/configuration';
import { EventRegistration, Notification, NotificationPreference } from '@app/entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { EventReminderScheduler } from '../../apps/chaosarchives/src/api/internal/notifications/event-reminder.scheduler';
import { NotificationsService } from '../../apps/chaosarchives/src/api/internal/notifications/notifications.service';

async function main(): Promise<void> {
  const dataSource = new DataSource({ ...(dbConfiguration as DataSourceOptions), synchronize: false, logging: ['error'] });
  await dataSource.initialize();

  try {
    const notifications = new NotificationsService(
      dataSource.getRepository(Notification),
      dataSource.getRepository(NotificationPreference),
    );
    // Reminders are checked as in-app notifications only. A no-op third argument keeps this
    // working whether or not the scheduler still takes a Discord notifier.
    const Scheduler = EventReminderScheduler as unknown as new (...args: unknown[]) => EventReminderScheduler;
    const scheduler = new Scheduler(
      dataSource.getRepository(EventRegistration),
      notifications,
      { sendDirectMessage: async () => undefined },
    );
    await scheduler.run(new Date());
    console.log('reminder pass done');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
