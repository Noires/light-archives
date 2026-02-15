import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { ContentNote } from './content-note.entity';
import { EventLocation } from './event-location.entity';
import { EventAnnouncement } from './event-announcement.entity';
import { Image } from './image.entity';
import { SearchFields } from './search-fields';

@Entity()
@Index(SearchFields.event, { fulltext: true })
export class Event extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  title: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  details: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  oocDetails: string;

  @ManyToOne(() => Character, {
    nullable: true,
  })
  owner: Character;

  @Column({
    nullable: false,
  })
  startDateTime: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  endDateTime: Date | null;

  @Column({
    nullable: false,
    default: '',
  })
  link: string;

  @Column({
    nullable: false,
    default: '',
  })
  linkText: string;

  @Column({
    nullable: false,
    default: '',
  })
  contact: string;

  @Column({
    nullable: true,
    unique: true,
  })
  externalSourceLink: string;

  @Column({
    type: 'enum',
    enum: EventSource,
    nullable: false,
  })
  source: EventSource;

  @Column({
    type: 'enum',
    enum: EventType,
    nullable: false,
    default: EventType.RP,
  })
  eventType: EventType;

  @Column({
    nullable: false,
    default: false,
  })
  hidden: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  recurring: boolean;

  @ManyToOne(() => Image, {
    lazy: true,
  })
  banner: Promise<Image|null>;

  @ManyToOne(() => Image, {
    lazy: true,
    nullable: true,
  })
  discordBanner: Promise<Image | null>;

  @ManyToOne(() => Image, {
    lazy: true,
    nullable: true,
  })
  icon: Promise<Image | null>;

  @OneToMany(() => EventLocation, 'event', {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  locations: EventLocation[];

  @OneToMany(() => EventAnnouncement, 'event', {
    cascade: true,
    orphanedRowAction: 'delete',
    lazy: true,
  })
  announcements: Promise<EventAnnouncement[]>;

  @ManyToMany(() => ContentNote)
  @JoinTable()
  contentNotes: ContentNote[];
}
