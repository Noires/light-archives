import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { User } from './user.entity';

@Entity()
export class RefreshToken extends BasicEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ default: false })
  revoked: boolean;
}
