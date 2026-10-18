import { Bookmark, Character, Event, Story, Venue } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from '../images/storage.service';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Venue, Character, Event, Story])],
  controllers: [BookmarksController],
  providers: [BookmarksService, StorageService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
