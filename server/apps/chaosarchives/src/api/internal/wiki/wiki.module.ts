import { Character, Event, NoticeboardItem, Story, WikiPage } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiController } from './wiki.controller';
import { WikiService } from './wiki.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, WikiPage, Story, NoticeboardItem, Event]),
  ],
  controllers: [WikiController],
  providers: [WikiService],
})
export class WikiModule {}
