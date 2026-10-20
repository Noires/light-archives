import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Character } from './character.entity';
import { Image } from './image.entity';

/**
 * ER2 round 2: a character tagged on an image. DSGVO: only public once the
 * tagged character's owner approved it; the owner can remove it at any time.
 * Pending/declined tags are visible only to the tagger and the tagged owner.
 */
@Entity()
@Unique(['image', 'character'])
@Index(['character', 'status'])
export class ImageCharacterTag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Image, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  image: Image;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  character: Character;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  taggedBy: Character;

  @Column({
    type: 'enum',
    enum: ImageTagStatus,
    nullable: false,
    default: ImageTagStatus.PENDING,
  })
  status: ImageTagStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  decidedAt: Date | null;
}
