import { NotificationType } from '@app/shared/dto/social/notification.dto';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

/** ER2 social: in-app notification. Deleted after 90 days by a scheduled job. */
@Entity()
@Index(['user', 'readAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
  })
  type: NotificationType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  body: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  link: string;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  readAt: Date | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
