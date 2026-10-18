import { Character, Image, NoticeboardItem, Venue } from '@app/entity';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeboardController } from './noticeboard.controller';
import { NoticeboardService } from './noticeboard.service';
import { ImagesModule } from '../images/images.module';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, Image, NoticeboardItem, Venue]),
    HttpModule,
    VenuesModule,
    ImagesModule,
  ],
  controllers: [NoticeboardController],
  providers: [NoticeboardService],
  exports: [NoticeboardService],
})
export class NoticeboardModule {}
