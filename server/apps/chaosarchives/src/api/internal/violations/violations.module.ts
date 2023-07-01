import { Module } from '@nestjs/common';
import { ViolationsController } from './violations.controller';
import { ViolationsService } from './violations.service';
import { Violation } from '@app/entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Violation]),
  ],
  controllers: [ViolationsController],
  providers: [ViolationsService]
})
export class ViolationsModule {}
