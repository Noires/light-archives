import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Character } from './character.entity';
import { WikiPage } from './wiki-page.entity';

/** ER2 round 2: immutable snapshot of a wiki page, written on every create, edit and restore. */
@Entity()
@Index(['wikiPage', 'createdAt'])
export class WikiPageRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WikiPage, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  wikiPage: WikiPage;

  @Column({
    nullable: false,
  })
  title: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
  })
  content: string;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  editor: Character;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  changeNote: string | null;
}
