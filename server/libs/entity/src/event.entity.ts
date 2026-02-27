import { EventSource } from '@app/shared/enums/event-source.enum';
import { EventType } from '@app/shared/enums/event-type.enum';
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { ContentNote } from './content-note.entity';
import { EventLocation } from './event-location.entity';
import { EventAnnouncement } from './event-announcement.entity';
import { EventRegistration } from './event-registration.entity';
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
    type: 'simple-json',
    nullable: true,
  })
  links: { url: string; label?: string }[] | null;

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
  adultOnly: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  closedEvent: boolean;

  @Column({
    type: 'integer',
    nullable: true,
  })
  registrationDeadlineDays: number | null;

  @Column({
    nullable: false,
    default: false,
  })
  hidden: boolean;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  extraInfo: string;

  @ManyToOne(() => Image, {
    lazy: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  banner: Promise<Image|null>;

  @ManyToOne(() => Image, {
    lazy: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  discordBanner: Promise<Image | null>;

  @ManyToOne(() => Image, {
    lazy: true,
    nullable: true,
    onDelete: 'SET NULL',
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

  @OneToMany(() => EventRegistration, (registration) => registration.event)
  registrations: EventRegistration[];

  @ManyToMany(() => ContentNote)
  @JoinTable()
  contentNotes: ContentNote[];
}
