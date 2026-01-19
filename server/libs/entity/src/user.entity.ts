import { Role } from '@app/shared/enums/role.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';

@Entity()
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
    unique: true,
  })
  email: string | null;

  @Column({
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    nullable: true,
    unique: true,
  })
  discordId: string | null;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.UNVERIFIED,
    nullable: false,
  })
  role: Role | null;

  @Column({
    nullable: true
  })
  verifiedAt: Date;

  @Column({
    type: 'varchar',
    nullable: true
  })
  verificationCode: string|null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  newEmail: string|null;

  @Column({
    type: 'varchar',
    nullable: true
  })
  newEmailVerificationCode: string|null;
}
