import { FollowTargetType } from '@app/shared/dto/social/follow.dto';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

/** ER2 social: a user follows a character, venue, story series or story author. */
@Entity()
@Unique(['user', 'targetType', 'targetKey'])
@Index(['targetType', 'targetKey'])
export class Follow {
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
  targetType: FollowTargetType;

  @Column({
    type: 'varchar',
    length: 160,
    nullable: false,
  })
  targetKey: string;

  @CreateDateColumn()
  createdAt: Date;
}
