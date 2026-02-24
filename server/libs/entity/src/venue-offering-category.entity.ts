import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Venue } from './venue.entity';
import { VenueOffering } from './venue-offering.entity';

@Entity()
export class VenueOfferingCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Venue, (venue) => venue.offeringCategories, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  venue: Venue;

  @ManyToOne(() => VenueOfferingCategory, (cat) => cat.subcategories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parentCategory: VenueOfferingCategory | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'integer',
    nullable: false,
    default: 0,
  })
  sortOrder: number;

  @OneToMany(() => VenueOfferingCategory, (sub) => sub.parentCategory, {
    cascade: true,
  })
  subcategories: VenueOfferingCategory[];

  @OneToMany(() => VenueOffering, (offering) => offering.category, {
    cascade: true,
  })
  offerings: VenueOffering[];
}
