import { HousingArea } from '@app/shared/enums/housing-area.enum';
import { VenueLocation } from '@app/shared/enums/venue-location.enum';
import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { ContentNote } from './content-note.entity';
import { Image } from './image.entity';
import { SearchFields } from './search-fields';
import { Server } from './server.entity';
import { VenueOfferingCategory } from './venue-offering-category.entity';
import { VenueOffering } from './venue-offering.entity';
import { VenueTag } from './venue-tag.entity';

@Entity()
@Unique(['name', 'server'])
@Index(SearchFields.venue, { fulltext: true })
export class Venue extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @ManyToOne(() => Server, {
    nullable: false,
  })
  server: Server;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  owner: Character;

  @Column({
    type: 'date',
    nullable: true
  })
  foundedAt: string|null;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  description: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  eventDescription: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  eventOocDetails: string;

  @Column({
    nullable: false,
    default: ''
  })
  eventContact: string;

  @Column({
    nullable: false,
    default: ''
  })
  eventLink: string;

  @Column({
    nullable: false,
    default: ''
  })
	website: string;

  @Column({
    nullable: false,
    default: ''
  })
	purpose: string;

  @Column({
    nullable: false,
    default: ''
  })
	status: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  rules: string;

  @Column({
    nullable: false,
    default: false,
  })
  showRules: boolean;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  premises: string;

  @Column({
    nullable: false,
    default: false,
  })
  showPremises: boolean;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  menu: string;

  @Column({
    nullable: false,
    default: false,
  })
  showMenu: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showStaff: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showJobs: boolean;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  ooc: string;

  @Column({
    nullable: false,
    default: false,
  })
  showOoc: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showMedia: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showEvents: boolean;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  network: string;

  @Column({
    nullable: false,
    default: false,
  })
  showNetwork: boolean;

  @Column({
    nullable: false,
    width: 100,
    default: ''
  })
	carrdProfile: string;

  @Column({
    type: 'enum',
    enum: VenueLocation,
    nullable: false,
  })
	location: VenueLocation;

  @Column({
    nullable: false,
    default: ''
  })
	address: string;

  @Column({
    type: 'enum',
    enum: HousingArea,
    nullable: true,
  })
	housingArea: HousingArea|null;

  @Column({
    type: 'integer',
    nullable: true,
  })
	ward: number|null;

  @Column({
    type: 'integer',
    nullable: true,
  })
	plot: number|null;

  @Column({
    type: 'varchar',
    length: 60,
    nullable: true,
  })
	room: string|null;

  @Column({
    type: 'boolean',
    nullable: true,
  })
	subdivision: boolean|null;

  @ManyToOne(() => Image, {
    lazy: true,
  })
  banner: Promise<Image|null>;

  @OneToMany(() => VenueTag, tag => tag.venue, {
    cascade: true,
  })
	tags: VenueTag[]

  @ManyToMany(() => ContentNote)
  @JoinTable()
  eventContentNotes: ContentNote[];

  @OneToMany(() => VenueOfferingCategory, (cat) => cat.venue, {
    cascade: true,
  })
  offeringCategories: VenueOfferingCategory[];

  @OneToMany(() => VenueOffering, (offering) => offering.venue, {
    cascade: true,
  })
  offerings: VenueOffering[];
}
