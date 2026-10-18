import { Character, Event, EventRegistration, Notification, NotificationPreference, Story } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsModule } from '../follows/follows.module';
import { DISCORD_NOTIFIER, NoopDiscordNotifier } from './discord-notifier';
import { EventReminderScheduler } from './event-reminder.scheduler';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference, Story, Event, EventRegistration, Character]),
    FollowsModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsListener,
    EventReminderScheduler,
    // TODO(ER2 social): swap for a steward-backed notifier once steward offers a DM webhook
    { provide: DISCORD_NOTIFIER, useClass: NoopDiscordNotifier },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
