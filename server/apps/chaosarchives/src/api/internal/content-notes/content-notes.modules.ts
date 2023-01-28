import { ContentNote } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesModule } from '../images/images.module';
import { ContentNotesController } from './content-notes.controller';
import { ContentNotesService } from './content-notes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentNote]),
    ImagesModule,
  ],
  controllers: [ContentNotesController],
  providers: [ContentNotesService]
})
export class ContentNotesModule {

}
