import { FreeCompanyApplicationStatus } from '@app/shared/enums/free-company-application-status.enum';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Character } from './character.entity';
import { FreeCompany } from './free-company.entity';

/**
 * ER2 round 2: a character's application to a free company. Accepting it is a
 * portal-side acknowledgement; actual membership still comes from the Lodestone
 * sync (character.freeCompany). Withdrawing deletes the row.
 */
@Entity()
@Unique(['character', 'freeCompany'])
export class FreeCompanyApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FreeCompany, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  freeCompany: FreeCompany;

  @ManyToOne(() => Character, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  character: Character;

  @Column({
    type: 'enum',
    enum: FreeCompanyApplicationStatus,
    nullable: false,
    default: FreeCompanyApplicationStatus.PENDING,
  })
  status: FreeCompanyApplicationStatus;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  message: string | null;

  @ManyToOne(() => Character, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  decidedBy: Character | null;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  decidedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
