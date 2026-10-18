import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Venue } from './venue.entity';

/** ER2-805: weekly opening hours of a venue. Weekday follows Luxon (1 = Monday ... 7 = Sunday). */
@Entity()
export class VenueOpeningHours {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venue, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  venue: Venue;

  @Column({
    type: 'integer',
    nullable: false,
  })
  weekday: number;

  /** 'HH:mm', server timezone */
  @Column({
    type: 'varchar',
    length: 5,
    nullable: false,
  })
  openTime: string;

  /** 'HH:mm', server timezone */
  @Column({
    type: 'varchar',
    length: 5,
    nullable: false,
  })
  closeTime: string;

  /** Closes on the following day */
  @Column({
    nullable: false,
    default: false,
  })
  overnight: boolean;
}
