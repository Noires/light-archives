import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RoleRequired } from '@app/auth/decorators/role-required.decorator';
import { UserInfo } from '@app/auth/model/user-info';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { CreateSupportTicketMessageDto } from '@app/shared/dto/support/create-support-ticket-message.dto';
import { CreateSupportTicketNoteDto } from '@app/shared/dto/support/create-support-ticket-note.dto';
import { CreateSupportTicketDto } from '@app/shared/dto/support/create-support-ticket.dto';
import { SupportQueueFilterDto } from '@app/shared/dto/support/support-queue-filter.dto';
import { SupportQueueTicketSummaryDto } from '@app/shared/dto/support/support-queue-ticket-summary.dto';
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportTicketListFilterDto } from '@app/shared/dto/support/support-ticket-list-filter.dto';
import { SupportTicketSummaryDto } from '@app/shared/dto/support/support-ticket-summary.dto';
import { UpdateSupportTicketDto } from '@app/shared/dto/support/update-support-ticket.dto';
import { Role } from '@app/shared/enums/role.enum';
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @RoleRequired(Role.USER)
  async createTicket(
    @Body() body: CreateSupportTicketDto,
    @CurrentUser() user: UserInfo,
  ): Promise<IdWrapper> {
    return this.supportService.createTicket(body, user);
  }

  @Get('tickets')
  @RoleRequired(Role.USER)
  async getMyTickets(
    @Query() filter: SupportTicketListFilterDto,
    @CurrentUser() user: UserInfo,
  ): Promise<PagingResultDto<SupportTicketSummaryDto>> {
    return this.supportService.getMyTickets(filter, user);
  }

  @Get('tickets/:id')
  @RoleRequired(Role.USER)
  async getMyTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<SupportTicketDetailDto> {
    return this.supportService.getMyTicket(id, user);
  }

  @Post('tickets/:id/messages')
  @RoleRequired(Role.USER)
  async addMyMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateSupportTicketMessageDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.addUserMessage(id, body, user);
  }

  @Post('tickets/:id/close')
  @RoleRequired(Role.USER)
  async closeMyTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.closeTicketAsUser(id, user);
  }

  @Post('tickets/:id/reopen')
  @RoleRequired(Role.USER)
  async reopenMyTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.reopenTicketAsUser(id, user);
  }

  @Get('queue')
  @RoleRequired(Role.MODERATOR)
  async getQueue(
    @Query() filter: SupportQueueFilterDto,
  ): Promise<PagingResultDto<SupportQueueTicketSummaryDto>> {
    return this.supportService.getQueue(filter);
  }

  @Get('queue/:id')
  @RoleRequired(Role.MODERATOR)
  async getQueueTicket(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SupportTicketDetailDto> {
    return this.supportService.getQueueTicket(id);
  }

  @Post('queue/:id/messages')
  @RoleRequired(Role.MODERATOR)
  async addSupportMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateSupportTicketMessageDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.addSupportMessage(id, body, user);
  }

  @Post('queue/:id/notes')
  @RoleRequired(Role.MODERATOR)
  async addSupportNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateSupportTicketNoteDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.addSupportNote(id, body, user);
  }

  @Put('queue/:id')
  @RoleRequired(Role.MODERATOR)
  async updateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateSupportTicketDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.updateTicket(id, body, user);
  }

  @Post('queue/:id/close')
  @RoleRequired(Role.MODERATOR)
  async closeTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.closeTicketAsSupport(id, user);
  }

  @Post('queue/:id/reopen')
  @RoleRequired(Role.MODERATOR)
  async reopenTicket(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    await this.supportService.reopenTicketAsSupport(id, user);
  }
}
