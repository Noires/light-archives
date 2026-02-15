import { Character, Community, Event, FreeCompany, Image, NoticeboardItem, Story, Venue } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangesController } from './changes.controller';
import { ChangesService } from './changes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, Venue, Community, FreeCompany, Story, NoticeboardItem, Event, Image]),
  ],
  controllers: [ChangesController],
  providers: [ChangesService],
})
export class ChangesModule {}
