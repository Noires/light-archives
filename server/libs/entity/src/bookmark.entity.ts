import { BookmarkTargetType } from '@app/shared/dto/social/bookmark.dto';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

/** ER2 social: a user's bookmark of a venue, character, event or story. */
@Entity()
@Unique(['user', 'targetType', 'targetId'])
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'varchar',
    length: 16,
    nullable: false,
  })
  targetType: BookmarkTargetType;

  @Column({
    type: 'integer',
    nullable: false,
  })
  targetId: number;

  @CreateDateColumn()
  createdAt: Date;
}
