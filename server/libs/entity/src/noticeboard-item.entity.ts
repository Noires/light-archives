import { NoticeboardLocation } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { Image } from './image.entity';
import { SearchFields } from './search-fields';
import { Venue } from './venue.entity';

@Entity()
@Index(SearchFields.noticeboardItem, { fulltext: true })
export class NoticeboardItem extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  owner: Character;

  @Column({
    nullable: false,
  })
  title: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: ''
  })
  content: string;

  @Column({
    type: 'enum',
    enum: NoticeboardLocation,
    nullable: false,
  })
  location: NoticeboardLocation;

  @Column({
    type: 'enum',
    enum: NoticeboardType,
    nullable: false,
    default: NoticeboardType.AUSHANG,
  })
  type: NoticeboardType;

  @ManyToOne(() => Venue, {
    nullable: true,
  })
  venue: Venue | null;

  // ER2 round 2: moderator pin, Discord flag and optional image
  @Column({
    nullable: false,
    default: false,
  })
  pinned: boolean;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  pinnedAt: Date | null;

  @Column({
    nullable: false,
    default: false,
  })
  discordPosted: boolean;

  // Steward: the Discord post of this item, edited or deleted with it.
  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  discordChannelId: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
  })
  discordMessageId: string | null;

  @ManyToOne(() => Image, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  image: Image | null;
}
