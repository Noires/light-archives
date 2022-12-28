import { Column, Entity, OneToMany, PrimaryGeneratedColumn, JoinTable} from 'typeorm';
import { BasicEntity } from './basic.entity';
import { LocationWeather } from './location_weather.entity';

@Entity()
export class Location extends BasicEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: false
    })
    name: string;

    @Column({
        nullable: false,
        unique: true
    })
    slug: string;

    @Column({
        nullable: false
    })
    imageFileName: string;

    @OneToMany(() => LocationWeather, (locationWeather) => locationWeather.location )
    locationWeather: LocationWeather[];
}
