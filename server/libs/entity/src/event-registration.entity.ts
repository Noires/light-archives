import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Character } from './character.entity';
import { Event } from './event.entity';

@Entity()
@Unique(['event', 'character'])
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Event, (event) => event.registrations, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  event: Event;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  character: Character;

  @Column({
    type: 'varchar',
    length: 16,
    nullable: false,
    default: EventRegistrationKind.GOING,
  })
  kind: EventRegistrationKind;

  // ER2 social: set when the 'event-reminder' notification was handled for this registration
  @Column({
    type: 'datetime',
    nullable: true,
  })
  remindedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
