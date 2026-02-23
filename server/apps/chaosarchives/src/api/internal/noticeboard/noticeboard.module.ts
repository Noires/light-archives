import { Character, NoticeboardItem, Venue } from '@app/entity';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeboardController } from './noticeboard.controller';
import { NoticeboardService } from './noticeboard.service';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, NoticeboardItem, Venue]),
    HttpModule,
    VenuesModule,
  ],
  controllers: [NoticeboardController],
  providers: [NoticeboardService],
  exports: [NoticeboardService],
})
export class NoticeboardModule {}
