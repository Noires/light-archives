import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, JoinTable} from 'typeorm';
import { BasicEntity } from './basic.entity';
import { LocationWeather } from './location_weather.entity';

@Entity()
export class Weather extends BasicEntity {
    tier: 0;
    probability: 0;
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

    @OneToMany(() => LocationWeather, (locationWeather) => locationWeather.weather )
    locationWeather: LocationWeather[];

    @ManyToMany(() => Weather, (weather) => weather.followUps)
    @JoinTable()
    followUps: Weather[];
}
