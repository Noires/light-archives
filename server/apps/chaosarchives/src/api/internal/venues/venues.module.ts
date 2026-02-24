import { Image, Venue, VenueMembership, VenueOffering, VenueOfferingCategory } from '@app/entity';
import SharedConstants from '@app/shared/SharedConstants';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesModule } from '../images/images.module';
import { StorageService } from '../images/storage.service';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, VenueMembership, VenueOfferingCategory, VenueOffering, Image]),
    MulterModule.registerAsync({
      useFactory: () => ({
        limits: {
          fileSize: SharedConstants.MAX_UPLOAD_SIZE,
        },
      }),
    }),
    ImagesModule,
  ],
  controllers: [VenuesController],
  providers: [VenuesService, StorageService],
  exports: [VenuesService],
})
export class VenuesModule {}
