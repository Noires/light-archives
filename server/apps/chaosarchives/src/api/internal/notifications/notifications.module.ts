import { Character, Event, EventRegistration, Notification, NotificationPreference, Story } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsModule } from '../follows/follows.module';
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
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
