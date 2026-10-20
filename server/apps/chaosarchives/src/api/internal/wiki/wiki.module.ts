import { Character, Event, NoticeboardItem, Story, WikiPage, WikiPageRevision } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiController } from './wiki.controller';
import { WikiService } from './wiki.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, WikiPage, Story, NoticeboardItem, Event, WikiPageRevision]),
  ],
  controllers: [WikiController],
  providers: [WikiService],
})
export class WikiModule {}
