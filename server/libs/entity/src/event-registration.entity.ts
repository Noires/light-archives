import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
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

  @CreateDateColumn()
  createdAt: Date;
}
