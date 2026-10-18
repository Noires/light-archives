import { EventSeriesRule } from '@app/shared/enums/event-series-rule.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { Venue } from './venue.entity';

/**
 * ER2-804: a recurring event series ("Wiederkehrend"). Events can optionally point to a series;
 * the next occurrences are computed on the fly (see libs/shared/src/event-series.ts).
 * Weekday follows Luxon (1 = Monday ... 7 = Sunday); times are 'HH:mm' in the server timezone.
 */
@Entity()
export class EventSeries extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'varchar',
    length: 16,
    nullable: false,
    default: EventSeriesRule.WEEKLY,
  })
  rule: EventSeriesRule;

  @Column({
    type: 'integer',
    nullable: false,
  })
  weekday: number;

  /** Only for 'monthly-nth': 1..5, or -1 for the last weekday of the month */
  @Column({
    type: 'integer',
    nullable: true,
  })
  nth: number | null;

  @Column({
    type: 'varchar',
    length: 5,
    nullable: false,
  })
  startTime: string;

  @Column({
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  endTime: string | null;

  @Column({
    type: 'integer',
    nullable: true,
  })
  endDurationDays: number | null;

  /** Reference occurrence (yyyy-MM-dd); decides the week parity for 'biweekly' */
  @Column({
    type: 'date',
    nullable: true,
  })
  anchorDate: string | null;

  @ManyToOne(() => Venue, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  venue: Venue | null;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  owner: Character;

  @Column({
    nullable: false,
    default: true,
  })
  active: boolean;
}
