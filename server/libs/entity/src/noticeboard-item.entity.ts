import { NoticeboardLocation } from '@app/shared/enums/noticeboard-location.enum';
import { NoticeboardType } from '@app/shared/enums/noticeboard-type.enum';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
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
}
