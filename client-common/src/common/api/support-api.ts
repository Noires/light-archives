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
import APITransport, { QueryParams } from './api-transport';

export default class SupportAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('support');
  }

  async createTicket(request: CreateSupportTicketDto): Promise<IdWrapper> {
    return this.transport.authPost<IdWrapper>('tickets', request);
  }

  async getMyTickets(filter?: SupportTicketListFilterDto): Promise<PagingResultDto<SupportTicketSummaryDto>> {
    return this.transport.authGet<PagingResultDto<SupportTicketSummaryDto>>('tickets', filter as QueryParams);
  }

  async getMyTicket(id: number): Promise<SupportTicketDetailDto> {
    return this.transport.authGet<SupportTicketDetailDto>(`tickets/${id}`);
  }

  async addMyMessage(id: number, request: CreateSupportTicketMessageDto): Promise<void> {
    await this.transport.authPost<void>(`tickets/${id}/messages`, request);
  }

  async closeMyTicket(id: number): Promise<void> {
    await this.transport.authPost<void>(`tickets/${id}/close`, {});
  }

  async reopenMyTicket(id: number): Promise<void> {
    await this.transport.authPost<void>(`tickets/${id}/reopen`, {});
  }

  async getQueue(filter?: SupportQueueFilterDto): Promise<PagingResultDto<SupportQueueTicketSummaryDto>> {
    return this.transport.authGet<PagingResultDto<SupportQueueTicketSummaryDto>>('queue', filter as QueryParams);
  }

  async getQueueTicket(id: number): Promise<SupportTicketDetailDto> {
    return this.transport.authGet<SupportTicketDetailDto>(`queue/${id}`);
  }

  async addSupportMessage(id: number, request: CreateSupportTicketMessageDto): Promise<void> {
    await this.transport.authPost<void>(`queue/${id}/messages`, request);
  }

  async addSupportNote(id: number, request: CreateSupportTicketNoteDto): Promise<void> {
    await this.transport.authPost<void>(`queue/${id}/notes`, request);
  }

  async updateTicket(id: number, request: UpdateSupportTicketDto): Promise<void> {
    await this.transport.authPut<void>(`queue/${id}`, request);
  }

  async closeTicket(id: number): Promise<void> {
    await this.transport.authPost<void>(`queue/${id}/close`, {});
  }

  async reopenTicket(id: number): Promise<void> {
    await this.transport.authPost<void>(`queue/${id}/reopen`, {});
  }
}
