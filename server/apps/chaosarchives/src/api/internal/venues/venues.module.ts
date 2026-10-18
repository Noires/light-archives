import { Image, Venue, VenueMembership, VenueOffering, VenueOfferingCategory, VenueOpeningException, VenueOpeningHours } from '@app/entity';
import SharedConstants from '@app/shared/SharedConstants';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesModule } from '../images/images.module';
import { StorageService } from '../images/storage.service';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { VenueOpeningHoursService } from './venue-opening-hours.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venue,
      VenueMembership,
      VenueOfferingCategory,
      VenueOffering,
      VenueOpeningHours,
      VenueOpeningException,
      Image,
    ]),
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
  providers: [VenuesService, VenueOpeningHoursService, StorageService],
  exports: [VenuesService, VenueOpeningHoursService],
})
export class VenuesModule {}
