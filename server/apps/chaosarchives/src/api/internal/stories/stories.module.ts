import { Character, ContentNote, Story, StoryTag } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, ContentNote, Story, StoryTag]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
