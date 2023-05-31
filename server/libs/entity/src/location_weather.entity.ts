import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn} from 'typeorm';
import { BasicEntity } from './basic.entity';
import { Location } from './location.entity';
import { Weather } from './weather.entity';

@Entity()
export class LocationWeather extends BasicEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        width: 2,
        nullable: false,
    })
    probability: number;

    @Column({
        width: 1,
        nullable: false,
    })
    tier: number;

    @ManyToOne(() => Location, (location) => location.locationWeather )
    location: Location;

    @ManyToOne(() => Weather, (weather) => weather.locationWeather )
    weather: Weather;
}
