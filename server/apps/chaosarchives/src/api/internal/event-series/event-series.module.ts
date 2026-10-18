import { EventSeries, Venue } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSeriesController } from './event-series.controller';
import { EventSeriesService } from './event-series.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventSeries, Venue])],
  controllers: [EventSeriesController],
  providers: [EventSeriesService],
  exports: [EventSeriesService],
})
export class EventSeriesModule {}
