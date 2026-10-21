import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from "./basic.entity";
import { Event } from './event.entity';

@Entity()
export class EventAnnouncement extends BasicEntity {
  @PrimaryGeneratedColumn()
  id: number;

	@ManyToOne(() => Event, {
		nullable: false,
	})
	event: Event;

	@Column({
    nullable: false,
  })
	minutesBefore: number;

	@Column({
		type: 'text',
    nullable: false,
  })
	content: string;

	@Column({
    nullable: false,
  })
	postAt: Date;

	// Steward: where the reminder was posted on Discord, so it can be edited
	// (event changes) or marked as cancelled later.
	@Column({
		type: 'varchar',
		length: 32,
		nullable: true,
	})
	discordChannelId: string | null;

	@Column({
		type: 'varchar',
		length: 32,
		nullable: true,
	})
	discordMessageId: string | null;

	@Column({
		type: 'datetime',
		nullable: true,
	})
	postedAt: Date | null;
}
