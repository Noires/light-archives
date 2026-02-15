import { SupportTicketEventType } from '@app/shared/enums/support-ticket-event-type.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { SupportTicket } from './support-ticket.entity';
import { User } from './user.entity';

@Entity()
@Index(['ticket', 'createdAt'])
export class SupportTicketEvent extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SupportTicket, {
    nullable: false,
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: SupportTicket;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'actorUserId' })
  actor: User | null;

  @Column({
    type: 'enum',
    enum: SupportTicketEventType,
    nullable: false,
  })
  type: SupportTicketEventType;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  payload: Record<string, unknown> | null;
}
