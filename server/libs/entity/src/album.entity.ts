import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { Image } from './image.entity';

/** ER2 round 2: gallery album of one character. Images must belong to the same character. */
@Entity()
export class Album extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Character, {
    nullable: false,
  })
  owner: Character;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: false,
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @ManyToOne(() => Image, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  cover: Image | null;

  // Join table rows are removed with the image or album (FK cascade)
  @ManyToMany(() => Image)
  @JoinTable({
    name: 'album_images',
    joinColumn: { name: 'albumId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'imageId', referencedColumnName: 'id' },
  })
  images: Image[];
}
