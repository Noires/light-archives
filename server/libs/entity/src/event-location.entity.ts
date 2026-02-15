import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BasicEntity } from "./basic.entity";
import { Event } from './event.entity';
import { Server } from "./server.entity";
import { Venue } from "./venue.entity";

@Entity()
export class EventLocation extends BasicEntity {
	@PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @Column({
    nullable: false,
  })
  address: string;

  @Column({
    nullable: false,
  })
  tags: string;

  @Column({
    nullable: false,
    default: '',
  })
  link: string;

  @Column({
    nullable: false,
    default: '',
  })
  linkText: string;

  @ManyToOne(() => Server, {
    nullable: false,
  })
  server: Server;

  @ManyToOne(() => Venue, {
    nullable: true,
  })
  venue: Venue | null;

  @ManyToOne(() => Event, {
    nullable: false,
  })
  event: Event;
}
