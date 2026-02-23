import { MembershipStatus } from '@app/shared/enums/membership-status.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Character } from './character.entity';
import { Venue } from './venue.entity';

@Entity()
@Unique(['character', 'venue'])
export class VenueMembership extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, {
    nullable: false,
  })
  character: Character;

  @ManyToOne(() => Venue, {
    nullable: false,
  })
  venue: Venue;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    nullable: false,
    default: MembershipStatus.APPLIED,
  })
  status: MembershipStatus;

  @Column({
    nullable: false,
    default: false,
  })
  canEdit: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  canManageMembers: boolean;

  @Column({
    nullable: false,
    default: false,
  })
  showInStaff: boolean;
}
