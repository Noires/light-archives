import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Image } from './image.entity';
import { Venue } from './venue.entity';
import { VenueOfferingCategory } from './venue-offering-category.entity';

@Entity()
export class VenueOffering {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venue, (venue) => venue.offerings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  venue: Venue;

  @ManyToOne(() => VenueOfferingCategory, (category) => category.offerings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  category: VenueOfferingCategory;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'mediumtext',
    nullable: false,
    default: '',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    default: '',
  })
  price: string;

  @ManyToOne(() => Image, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  image: Image | null;

  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  })
  sortOrder: number;
}
