import { ReactionKind, ReactionTargetType } from '@app/shared/enums/reaction.enum';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Character } from './character.entity';

/** ER2-807: a character's reaction to a story or image. One reaction per kind per character. */
@Entity()
@Unique(['targetType', 'targetId', 'character', 'kind'])
@Index(['targetType', 'targetId'])
export class Reaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 16,
    nullable: false,
  })
  targetType: ReactionTargetType;

  @Column({
    type: 'integer',
    nullable: false,
  })
  targetId: number;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  character: Character;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: false,
  })
  kind: ReactionKind;

  /** Moderation hook: hidden reactions are not counted and cannot be re-added by the author */
  @Column({
    nullable: false,
    default: false,
  })
  hidden: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
