import { REMINDER_MINUTES_DEFAULT } from '@app/shared/dto/social/notification.dto';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

/**
 * ER2 social: per-user notification settings. Absent row = defaults (all in-app types on,
 * Discord DM off). Discord DMs are strictly opt-in.
 */
@Entity()
@Unique(['user'])
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ nullable: false, default: true })
  seriesPart: boolean;

  @Column({ nullable: false, default: true })
  authorStory: boolean;

  @Column({ nullable: false, default: true })
  venueEvent: boolean;

  @Column({ nullable: false, default: true })
  eventReminder: boolean;

  @Column({ nullable: false, default: true })
  eventRegistration: boolean;

  @Column({ nullable: false, default: true })
  imageTag: boolean;

  // unused since 2026-10-19 (Discord DM reminders removed), kept to avoid a destructive schema change
  @Column({ nullable: false, default: false })
  discordDm: boolean;

  @Column({ type: 'int', nullable: false, default: REMINDER_MINUTES_DEFAULT })
  reminderMinutes: number;
}
