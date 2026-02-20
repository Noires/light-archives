import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { FreeCompany } from './free-company.entity';

@Entity()
@Unique(['character', 'freeCompany'])
export class FreeCompanyMemberPermission extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  character: Character;

  @ManyToOne(() => FreeCompany, {
    nullable: false,
  })
  freeCompany: FreeCompany;

  @Column({
    nullable: false,
    default: false,
  })
  canEdit: boolean;
}
