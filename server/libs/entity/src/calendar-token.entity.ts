import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './user.entity';

/** ER2 social: secret token for a user's personal ICS calendar feed. One per user, revocable. */
@Entity()
@Unique(['user'])
export class CalendarToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  /** 32 random bytes, base64url (43 characters) */
  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
    unique: true,
  })
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}
