import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Venue } from './venue.entity';

/** ER2-805: date-specific deviation from the weekly opening hours (e.g. closed for holidays). */
@Entity()
@Unique(['venue', 'date'])
export class VenueOpeningException {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venue, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  venue: Venue;

  /** yyyy-MM-dd, server timezone */
  @Column({
    type: 'date',
    nullable: false,
  })
  date: string;

  @Column({
    nullable: false,
    default: true,
  })
  closed: boolean;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    default: '',
  })
  note: string;
}
