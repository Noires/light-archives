import { Module } from '@nestjs/common';
import { Violation } from '@app/entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ViolationsController } from './violations.controller';
import { ViolationsService } from './violations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Violation]),
  ],
  controllers: [ViolationsController],
  providers: [ViolationsService]
})
export class ViolationsModule {}
