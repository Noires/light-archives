import { FocusItem } from '@app/shared/validation/profile-fields';
import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { CommunityTag } from './community-tag.entity';
import { Image } from './image.entity';
import { SearchFields } from './search-fields';

@Entity()
@Index(SearchFields.community, { fulltext: true })
export class Community extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
    unique: true,
  })
  name: string;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  owner: Character;

  @Column({
    type: 'date',
    nullable: true,
  })
  foundedAt: string | null;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  description: string;

  @Column({
    nullable: false,
    default: '',
  })
  website: string;

  @Column({
    nullable: false,
    default: '',
  })
  discord: string;

  @Column({
    nullable: false,
    default: '',
  })
  goal: string;

  @Column({
    nullable: false,
    default: '',
  })
  status: string;

  @Column({
    nullable: false,
    default: '',
  })
  recruitingOfficers: string;

  // ER2-810: currently recruiting? null = not specified
  @Column({
    type: 'boolean',
    nullable: true,
  })
  recruiting: boolean | null;

  @Column({
    nullable: false,
    width: 100,
    default: '',
  })
  carrdProfile: string;

  @ManyToOne(() => Image, {
    lazy: true,
  })
  banner: Promise<Image | null>;

  // ER2 round 2: "Was wir spielen" cards, max 6 x {icon, title, text}
  @Column({
    type: 'simple-json',
    nullable: true,
  })
  focusItems: FocusItem[] | null;

  @OneToMany(() => CommunityTag, (tag) => tag.community, {
    cascade: true,
  })
  tags: CommunityTag[];
}
