import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class ContentNote {
  @PrimaryColumn({
    nullable: false,
    type: 'varchar',
    width: 60,
  })
  name: string;

  constructor(properties?: Partial<ContentNote>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
