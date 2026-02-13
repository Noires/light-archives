import { Role } from '@app/shared/enums/role.enum';
import { TelemetryConsentStatus } from '@app/shared/enums/telemetry-consent-status.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';

@Entity()
export class User extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
  })
  email: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    type: 'varchar',
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
    type: 'datetime',
    nullable: true
  })
  verifiedAt: Date | null;

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

  @Column({
    type: 'datetime',
    nullable: true
  })
  termsAcceptedAt: Date | null;

  @Column({
    type: 'enum',
    enum: TelemetryConsentStatus,
    nullable: false,
    default: TelemetryConsentStatus.UNKNOWN,
  })
  telemetryConsentStatus: TelemetryConsentStatus;

  @Column({
    type: 'int',
    nullable: false,
    default: 1,
  })
  telemetryConsentVersion: number;

  @Column({
    type: 'datetime',
    nullable: true
  })
  telemetryConsentUpdatedAt: Date | null;
}
