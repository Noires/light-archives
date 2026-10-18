import { CalendarToken, Character, Event, EventRegistration } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksModule } from '../bookmarks/bookmarks.module';
import { CalendarTokenController } from './calendar-token.controller';
import { CalendarTokenService } from './calendar-token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarToken, Character, Event, EventRegistration]),
    BookmarksModule,
  ],
  controllers: [CalendarTokenController],
  providers: [CalendarTokenService],
})
export class CalendarTokenModule {}
