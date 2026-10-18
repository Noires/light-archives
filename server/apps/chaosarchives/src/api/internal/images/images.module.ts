import { Character, Image } from '@app/entity';
import SharedConstants from '@app/shared/SharedConstants';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@app/auth/auth.module';
import { ImagesController } from './images.controller';
import { ReactionsModule } from '../reactions/reactions.module';
import { ImagesService } from './images.service';
import { StorageService } from './storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, Image]),
    MulterModule.registerAsync({
      useFactory: () => ({
        limits: {
          fileSize: SharedConstants.MAX_UPLOAD_SIZE,
        },
      }),
    }),
    AuthModule,
    ReactionsModule,
  ],
  controllers: [ImagesController],
  providers: [ImagesService, StorageService],
  exports: [ImagesService]
})
export class ImagesModule {}
