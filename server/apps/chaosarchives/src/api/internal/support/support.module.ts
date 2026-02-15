import { SupportTicket, SupportTicketEvent, SupportTicketMessage, User } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportTicketMessage, SupportTicketEvent, User]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
