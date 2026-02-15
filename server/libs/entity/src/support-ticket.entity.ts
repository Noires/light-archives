import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { User } from './user.entity';

@Entity()
@Index(['status', 'supportLevel', 'updatedAt'])
@Index(['assignee', 'status'])
@Index(['owner', 'status'])
@Index(['priority', 'firstResponseDueAt'])
@Index(['priority', 'resolutionDueAt'])
export class SupportTicket extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    nullable: true,
    unique: true,
  })
  ticketNumber: number | null;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'ownerUserId' })
  owner: User;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'assigneeUserId' })
  assignee: User | null;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: false,
  })
  subject: string;

  @Column({
    type: 'enum',
    enum: SupportTicketCategory,
    nullable: false,
  })
  category: SupportTicketCategory;

  @Column({
    type: 'enum',
    enum: SupportTicketPriority,
    nullable: false,
    default: SupportTicketPriority.MEDIUM,
  })
  priority: SupportTicketPriority;

  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    nullable: false,
    default: SupportTicketStatus.WAITING_FOR_SUPPORT,
  })
  status: SupportTicketStatus;

  @Column({
    type: 'enum',
    enum: SupportLevel,
    nullable: false,
    default: SupportLevel.L1,
  })
  supportLevel: SupportLevel;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  firstResponseDueAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  firstResponseAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  resolutionDueAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  resolvedAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  closedAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  reopenedAt: Date | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  lastPublicMessageAt: Date | null;
}
