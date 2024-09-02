import { NewsRole } from '@app/shared/enums/news-role.enum';
import { Race } from '@app/shared/enums/race.enum';
import { Tribe } from '@app/shared/enums/tribe.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { FreeCompany } from './free-company.entity';
import { Image } from './image.entity';
import { SearchFields } from './search-fields';
import { Server } from './server.entity';
import { User } from './user.entity';

@Entity()
@Unique(['name', 'server'])
@Unique(['lodestoneId', 'active'])
@Index(SearchFields.character, { fulltext: true })
export class Character extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  lodestoneId: number;

  @Column({
    type: 'boolean',
    nullable: true,
    default: true,
  })
  active: boolean | null;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    type: 'enum',
    enum: Race,
    nullable: false,
  })
  race: Race;

  @Column({
    type: 'enum',
    enum: Tribe,
    nullable: false,
  })
  tribe: Tribe;

  @Column({
    nullable: false,
  })
  avatar: string;

  @Column({
    nullable: true,
  })
  verifiedAt: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  verificationCode: string | null;

  @ManyToOne(() => Server, {
    nullable: false,
  })
  server: Server;

  @ManyToOne(() => User, {
    nullable: false,
  })
  user: User;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  appearance: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  aether: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  background: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  family: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  relationsshipstatus: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  personality: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  possession: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  specialitems: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  age: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  deity: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  birthplace: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  birthday: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  residence: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  title: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  nickname: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  loves: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  fears: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  wishes: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  hates: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  friends: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  relatives: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  parents: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  children: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  enemies: string;

  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  motivation: string;

  @Column({
    nullable: false,
    width: 100,
    default: '',
  })
  carrdProfile: string;

  @Column({
    nullable: false,
    default: true,
  })
  showAvatar: boolean;

  @Column({
    nullable: false,
    default: true,
  })
  showInfoboxes: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showAppearance: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showPersonality: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showContacts: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showRumors: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showDiary: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showGallery: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showInventory: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  combinedDescription: boolean;

  @Column({
    nullable: false,
    length: 1000,
    default: '',
  })
  currently: string;

  @Column({
    nullable: false,
    length: 1000,
    default: '',
  })
  oocInfo: string;

  @Column({
    nullable: false,
    length: SharedConstants.MAX_PRONOUNS_LENGTH,
    default: '',
  })
  pronouns: string;

  @ManyToOne(() => Image, {
    lazy: true,
  })
  banner: Promise<Image | null>;

  @ManyToOne(() => FreeCompany, {
    lazy: true,
  })
  freeCompany: Promise<FreeCompany | null>;

  @Column({
    type: 'enum',
    enum: NewsRole,
    nullable: false,
    default: NewsRole.NONE,
  })
  newsRole: NewsRole;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  newsPseudonym: string|null;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  haircolor: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  eyecolor: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  skintone: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  build: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  height: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  weight: string;

  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  voice: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  tattoosandscars: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  specialfeatures: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  strengths: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  weaknesses: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  ticks: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  partners: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  acquaintances: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  past: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  freecompanies: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  meetingplaces: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  communities: string;
  
  @Column({
    nullable: false,
    type: 'mediumtext',
    default: '',
  })
  mentioned: string;
  
  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  openinformation: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  commonrumors: string;
  
  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  rarerumors: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  profession: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  apparentage: string;
  
  @Column({
    nullable: false,
    type: 'tinytext',
    default: '',
  })
  slogan: string;
}
