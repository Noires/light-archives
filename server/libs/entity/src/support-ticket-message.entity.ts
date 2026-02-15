import { SupportMessageKind } from '@app/shared/enums/support-message-kind.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { SupportTicket } from './support-ticket.entity';
import { User } from './user.entity';

@Entity()
@Index(['ticket', 'createdAt'])
@Index(['ticket', 'isInternal'])
export class SupportTicketMessage extends BasicEntity {
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
  @JoinColumn({ name: 'authorUserId' })
  author: User | null;

  @Column({
    type: 'enum',
    enum: SupportMessageKind,
    nullable: false,
  })
  kind: SupportMessageKind;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  isInternal: boolean;

  @Column({
    type: 'text',
    nullable: false,
    default: '',
  })
  body: string;
}
