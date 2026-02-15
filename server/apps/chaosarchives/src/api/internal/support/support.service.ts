import { UserInfo } from '@app/auth/model/user-info';
import { SupportTicket, SupportTicketEvent, SupportTicketMessage, User } from '@app/entity';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { PagingResultDto } from '@app/shared/dto/common/paging-result.dto';
import { CreateSupportTicketMessageDto } from '@app/shared/dto/support/create-support-ticket-message.dto';
import { CreateSupportTicketNoteDto } from '@app/shared/dto/support/create-support-ticket-note.dto';
import { CreateSupportTicketDto } from '@app/shared/dto/support/create-support-ticket.dto';
import { SupportQueueFilterDto } from '@app/shared/dto/support/support-queue-filter.dto';
import { SupportQueueTicketSummaryDto } from '@app/shared/dto/support/support-queue-ticket-summary.dto';
import { SupportTicketDetailDto } from '@app/shared/dto/support/support-ticket-detail.dto';
import { SupportTicketListFilterDto } from '@app/shared/dto/support/support-ticket-list-filter.dto';
import { SupportTicketMessageDto } from '@app/shared/dto/support/support-ticket-message.dto';
import { SupportTicketSummaryDto } from '@app/shared/dto/support/support-ticket-summary.dto';
import { UpdateSupportTicketDto } from '@app/shared/dto/support/update-support-ticket.dto';
import { roleImplies, Role } from '@app/shared/enums/role.enum';
import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportMessageKind } from '@app/shared/enums/support-message-kind.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketEventType } from '@app/shared/enums/support-ticket-event-type.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Connection, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class SupportService {
  private readonly firstResponseSlaHoursByPriority: Record<SupportTicketPriority, number> = {
    [SupportTicketPriority.LOW]: 24,
    [SupportTicketPriority.MEDIUM]: 8,
    [SupportTicketPriority.HIGH]: 2,
  };

  private readonly resolutionSlaHoursByPriority: Record<SupportTicketPriority, number> = {
    [SupportTicketPriority.LOW]: 24 * 5,
    [SupportTicketPriority.MEDIUM]: 24 * 2,
    [SupportTicketPriority.HIGH]: 24,
  };

  constructor(
    private readonly connection: Connection,
    @InjectRepository(SupportTicket) private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportTicketMessage) private readonly messageRepo: Repository<SupportTicketMessage>,
    @InjectRepository(SupportTicketEvent) private readonly eventRepo: Repository<SupportTicketEvent>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createTicket(
    request: CreateSupportTicketDto,
    user: UserInfo,
  ): Promise<IdWrapper> {
    const created = await this.connection.transaction(async (em) => {
      const now = new Date();
      const priority = request.priority || SupportTicketPriority.MEDIUM;
      const ticketRepo = em.getRepository(SupportTicket);

      const ticket = ticketRepo.create({
        owner: { id: user.id } as User,
        assignee: null,
        ticketNumber: null,
        subject: request.subject.trim(),
        category: request.category,
        priority,
        status: SupportTicketStatus.WAITING_FOR_SUPPORT,
        supportLevel: SupportLevel.L1,
        firstResponseDueAt: this.addHours(now, this.firstResponseSlaHoursByPriority[priority]),
        firstResponseAt: null,
        resolutionDueAt: this.addHours(now, this.resolutionSlaHoursByPriority[priority]),
        resolvedAt: null,
        closedAt: null,
        reopenedAt: null,
        lastPublicMessageAt: now,
      });

      const savedTicket = await ticketRepo.save(ticket);
      savedTicket.ticketNumber = savedTicket.id;
      await ticketRepo.save(savedTicket);

      await em.getRepository(SupportTicketMessage).save(
        em.getRepository(SupportTicketMessage).create({
          ticket: savedTicket,
          author: { id: user.id } as User,
          kind: SupportMessageKind.USER,
          isInternal: false,
          body: request.message.trim(),
        }),
      );

      await this.createTicketEvent(em, savedTicket.id, SupportTicketEventType.CREATED, user.id, {
        category: request.category,
        priority,
      });

      await this.createTicketEvent(em, savedTicket.id, SupportTicketEventType.USER_MESSAGE, user.id, {
        initialMessage: true,
      });

      return savedTicket;
    });

    return { id: created.id };
  }

  async getMyTickets(
    filter: SupportTicketListFilterDto,
    user: UserInfo,
  ): Promise<PagingResultDto<SupportTicketSummaryDto>> {
    const query = this.ticketRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.assignee', 'assignee')
      .where('ticket.ownerUserId = :ownerUserId', { ownerUserId: user.id })
      .orderBy('ticket.updatedAt', 'DESC');

    if (filter.status) {
      query.andWhere('ticket.status = :status', { status: filter.status });
    }

    const total = await query.getCount();

    if (filter.offset !== undefined) {
      query.offset(filter.offset);
    }

    if (filter.limit !== undefined) {
      query.limit(filter.limit);
    }

    const tickets = await query.getMany();

    return {
      total,
      data: tickets.map((ticket) => this.toSupportTicketSummaryDto(ticket)),
    };
  }

  async getMyTicket(id: number, user: UserInfo): Promise<SupportTicketDetailDto> {
    const ticket = await this.getOwnedTicket(id, user.id);
    const messages = await this.getTicketMessages(id, false);

    return this.toSupportTicketDetailDto(ticket, messages, false);
  }

  async addUserMessage(
    id: number,
    request: CreateSupportTicketMessageDto,
    user: UserInfo,
  ): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await em.getRepository(SupportTicket).findOne({
        where: {
          id,
          owner: { id: user.id },
        },
        relations: ['owner'],
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      if (ticket.status === SupportTicketStatus.CLOSED) {
        throw new BadRequestException('Cannot send messages to a closed ticket');
      }

      const now = new Date();
      ticket.status = SupportTicketStatus.WAITING_FOR_SUPPORT;
      ticket.lastPublicMessageAt = now;
      await em.getRepository(SupportTicket).save(ticket);

      await em.getRepository(SupportTicketMessage).save(
        em.getRepository(SupportTicketMessage).create({
          ticket,
          author: { id: user.id } as User,
          kind: SupportMessageKind.USER,
          isInternal: false,
          body: request.message.trim(),
        }),
      );

      await this.createTicketEvent(em, ticket.id, SupportTicketEventType.USER_MESSAGE, user.id, null);
    });
  }

  async closeTicketAsUser(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await em.getRepository(SupportTicket).findOne({
        where: {
          id,
          owner: { id: user.id },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      await this.closeTicket(em, ticket, user.id);
    });
  }

  async reopenTicketAsUser(id: number, user: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await em.getRepository(SupportTicket).findOne({
        where: {
          id,
          owner: { id: user.id },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      await this.reopenTicket(em, ticket, user.id, SupportTicketStatus.WAITING_FOR_SUPPORT);
    });
  }

  async getQueue(
    filter: SupportQueueFilterDto,
  ): Promise<PagingResultDto<SupportQueueTicketSummaryDto>> {
    const query = this.createSupportQueueQuery(filter)
      .orderBy('ticket.updatedAt', 'DESC');

    const total = await query.getCount();

    if (filter.offset !== undefined) {
      query.offset(filter.offset);
    }

    if (filter.limit !== undefined) {
      query.limit(filter.limit);
    }

    const tickets = await query.getMany();

    return {
      total,
      data: tickets.map((ticket) => this.toSupportQueueTicketSummaryDto(ticket)),
    };
  }

  async getQueueTicket(id: number): Promise<SupportTicketDetailDto> {
    const ticket = await this.getTicketForSupport(id);
    const messages = await this.getTicketMessages(id, true);

    return this.toSupportTicketDetailDto(ticket, messages, true);
  }

  async addSupportMessage(
    id: number,
    request: CreateSupportTicketMessageDto,
    actor: UserInfo,
  ): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await this.getTicketForSupportWithManager(id, em);
      if (ticket.status === SupportTicketStatus.CLOSED) {
        throw new BadRequestException('Cannot send messages to a closed ticket');
      }

      const now = new Date();
      ticket.status = SupportTicketStatus.WAITING_FOR_USER;
      ticket.lastPublicMessageAt = now;

      if (!ticket.firstResponseAt) {
        ticket.firstResponseAt = now;
      }

      await em.getRepository(SupportTicket).save(ticket);

      await em.getRepository(SupportTicketMessage).save(
        em.getRepository(SupportTicketMessage).create({
          ticket,
          author: { id: actor.id } as User,
          kind: SupportMessageKind.SUPPORT,
          isInternal: false,
          body: request.message.trim(),
        }),
      );

      await this.createTicketEvent(em, ticket.id, SupportTicketEventType.SUPPORT_MESSAGE, actor.id, null);
    });
  }

  async addSupportNote(
    id: number,
    request: CreateSupportTicketNoteDto,
    actor: UserInfo,
  ): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await this.getTicketForSupportWithManager(id, em);

      await em.getRepository(SupportTicketMessage).save(
        em.getRepository(SupportTicketMessage).create({
          ticket,
          author: { id: actor.id } as User,
          kind: SupportMessageKind.INTERNAL_NOTE,
          isInternal: true,
          body: request.message.trim(),
        }),
      );

      await this.createTicketEvent(em, ticket.id, SupportTicketEventType.INTERNAL_NOTE, actor.id, null);
    });
  }

  async updateTicket(
    id: number,
    request: UpdateSupportTicketDto,
    actor: UserInfo,
  ): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await this.getTicketForSupportWithManager(id, em);
      const now = new Date();

      const isDeEscalationToL1 =
        request.supportLevel === SupportLevel.L1 && ticket.supportLevel === SupportLevel.L2;

      if (isDeEscalationToL1 && !roleImplies(actor.role, Role.ADMIN)) {
        throw new ForbiddenException('Only L2 support can de-escalate a ticket back to L1');
      }

      if (request.category && request.category !== ticket.category) {
        const previousCategory = ticket.category;
        ticket.category = request.category;
        await this.createTicketEvent(em, ticket.id, SupportTicketEventType.CATEGORY_CHANGED, actor.id, {
          from: previousCategory,
          to: request.category,
        });
      }

      if (request.priority && request.priority !== ticket.priority) {
        const previousPriority = ticket.priority;
        ticket.priority = request.priority;

        if (!ticket.firstResponseAt) {
          ticket.firstResponseDueAt = this.addHours(now, this.firstResponseSlaHoursByPriority[request.priority]);
        }

        if (!ticket.resolvedAt) {
          ticket.resolutionDueAt = this.addHours(now, this.resolutionSlaHoursByPriority[request.priority]);
        }

        await this.createTicketEvent(em, ticket.id, SupportTicketEventType.PRIORITY_CHANGED, actor.id, {
          from: previousPriority,
          to: request.priority,
        });
      }

      if (request.supportLevel && request.supportLevel !== ticket.supportLevel) {
        const previousLevel = ticket.supportLevel;
        ticket.supportLevel = request.supportLevel;

        await this.createTicketEvent(em, ticket.id, SupportTicketEventType.SUPPORT_LEVEL_CHANGED, actor.id, {
          from: previousLevel,
          to: request.supportLevel,
        });
      }

      if (request.assigneeUserId !== undefined) {
        if (request.assigneeUserId === null) {
          ticket.assignee = null;
        } else {
          const assignee = await em.getRepository(User).findOne({
            where: { id: request.assigneeUserId },
            select: ['id', 'role'],
          });

          if (!assignee || !roleImplies(assignee.role || Role.UNVERIFIED, Role.MODERATOR)) {
            throw new BadRequestException('Assignee must be a support user');
          }

          ticket.assignee = assignee;
        }

        await this.createTicketEvent(em, ticket.id, SupportTicketEventType.ASSIGNED, actor.id, {
          assigneeUserId: request.assigneeUserId,
        });
      }

      if (request.status && request.status !== ticket.status) {
        if (request.status === SupportTicketStatus.CLOSED) {
          await this.closeTicket(em, ticket, actor.id);
        } else if (ticket.status === SupportTicketStatus.CLOSED) {
          await this.reopenTicket(em, ticket, actor.id, request.status);
        } else {
          const previousStatus = ticket.status;
          ticket.status = request.status;
          await this.createTicketEvent(em, ticket.id, SupportTicketEventType.STATUS_CHANGED, actor.id, {
            from: previousStatus,
            to: request.status,
          });
        }
      }

      await em.getRepository(SupportTicket).save(ticket);
    });
  }

  async closeTicketAsSupport(id: number, actor: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await this.getTicketForSupportWithManager(id, em);
      await this.closeTicket(em, ticket, actor.id);
    });
  }

  async reopenTicketAsSupport(id: number, actor: UserInfo): Promise<void> {
    await this.connection.transaction(async (em) => {
      const ticket = await this.getTicketForSupportWithManager(id, em);
      await this.reopenTicket(em, ticket, actor.id, SupportTicketStatus.WAITING_FOR_USER);
    });
  }

  private async closeTicket(
    em: Connection['manager'],
    ticket: SupportTicket,
    actorUserId: number,
  ): Promise<void> {
    if (ticket.status === SupportTicketStatus.CLOSED) {
      return;
    }

    const now = new Date();
    ticket.status = SupportTicketStatus.CLOSED;
    ticket.closedAt = now;

    if (!ticket.resolvedAt) {
      ticket.resolvedAt = now;
    }

    await em.getRepository(SupportTicketMessage).save(
      em.getRepository(SupportTicketMessage).create({
        ticket,
        author: null,
        kind: SupportMessageKind.SYSTEM,
        isInternal: false,
        body: 'Ticket wurde geschlossen.',
      }),
    );

    await this.createTicketEvent(em, ticket.id, SupportTicketEventType.CLOSED, actorUserId, null);
  }

  private async reopenTicket(
    em: Connection['manager'],
    ticket: SupportTicket,
    actorUserId: number,
    reopenedStatus: SupportTicketStatus,
  ): Promise<void> {
    if (ticket.status !== SupportTicketStatus.CLOSED) {
      return;
    }

    const now = new Date();
    ticket.status = reopenedStatus;
    ticket.closedAt = null;
    ticket.reopenedAt = now;
    ticket.resolvedAt = null;

    if (!ticket.firstResponseAt) {
      ticket.firstResponseDueAt = this.addHours(now, this.firstResponseSlaHoursByPriority[ticket.priority]);
    }

    ticket.resolutionDueAt = this.addHours(now, this.resolutionSlaHoursByPriority[ticket.priority]);

    await em.getRepository(SupportTicketMessage).save(
      em.getRepository(SupportTicketMessage).create({
        ticket,
        author: null,
        kind: SupportMessageKind.SYSTEM,
        isInternal: false,
        body: 'Ticket wurde wieder geöffnet.',
      }),
    );

    await this.createTicketEvent(em, ticket.id, SupportTicketEventType.REOPENED, actorUserId, {
      toStatus: reopenedStatus,
    });
  }

  private createSupportQueueQuery(filter: SupportQueueFilterDto): SelectQueryBuilder<SupportTicket> {
    const query = this.ticketRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.owner', 'owner')
      .leftJoinAndSelect('ticket.assignee', 'assignee');

    if (filter.searchQuery) {
      const searchQuery = `%${filter.searchQuery.trim()}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('ticket.subject LIKE :searchQuery', { searchQuery })
            .orWhere('ticket.ticketNumber LIKE :searchQuery', { searchQuery })
            .orWhere('owner.id LIKE :searchQuery', { searchQuery });
        }),
      );
    }

    if (filter.status) {
      query.andWhere('ticket.status = :status', { status: filter.status });
    }

    if (filter.category) {
      query.andWhere('ticket.category = :category', { category: filter.category });
    }

    if (filter.priority) {
      query.andWhere('ticket.priority = :priority', { priority: filter.priority });
    }

    if (filter.supportLevel) {
      query.andWhere('ticket.supportLevel = :supportLevel', { supportLevel: filter.supportLevel });
    }

    if (filter.assignedToUserId !== undefined) {
      query.andWhere('ticket.assigneeUserId = :assignedToUserId', {
        assignedToUserId: filter.assignedToUserId,
      });
    }

    if (filter.updatedWithinHours !== undefined && filter.updatedWithinHours > 0) {
      const updatedSince = this.addHours(new Date(), -filter.updatedWithinHours);
      query.andWhere('ticket.updatedAt >= :updatedSince', { updatedSince });
    }

    if (filter.overdueOnly) {
      const now = new Date();
      query.andWhere('ticket.status <> :closedStatus', { closedStatus: SupportTicketStatus.CLOSED });
      query.andWhere(new Brackets((qb) => {
        qb.where('(ticket.firstResponseAt IS NULL AND ticket.firstResponseDueAt IS NOT NULL AND ticket.firstResponseDueAt < :now)', { now })
          .orWhere('(ticket.resolvedAt IS NULL AND ticket.resolutionDueAt IS NOT NULL AND ticket.resolutionDueAt < :now)', { now });
      }));
    }

    return query;
  }

  private async getOwnedTicket(id: number, ownerUserId: number): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: {
        id,
        owner: { id: ownerUserId },
      },
      relations: ['owner', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  private async getTicketForSupport(id: number): Promise<SupportTicket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['owner', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  private async getTicketForSupportWithManager(id: number, em: Connection['manager']): Promise<SupportTicket> {
    const ticket = await em.getRepository(SupportTicket).findOne({
      where: { id },
      relations: ['owner', 'assignee'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  private async getTicketMessages(ticketId: number, includeInternal: boolean): Promise<SupportTicketMessage[]> {
    const query = this.messageRepo.createQueryBuilder('message')
      .leftJoinAndSelect('message.author', 'author')
      .leftJoinAndSelect('message.ticket', 'ticket')
      .where('message.ticketId = :ticketId', { ticketId })
      .orderBy('message.createdAt', 'ASC');

    if (!includeInternal) {
      query.andWhere('message.isInternal = :includeInternal', { includeInternal: false });
    }

    return query.getMany();
  }

  private toSupportTicketSummaryDto(ticket: SupportTicket): SupportTicketSummaryDto {
    return new SupportTicketSummaryDto({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber || ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      supportLevel: ticket.supportLevel,
      assigneeUserId: ticket.assignee ? ticket.assignee.id : null,
      createdAt: ticket.createdAt.getTime(),
      updatedAt: ticket.updatedAt.getTime(),
      closedAt: ticket.closedAt ? ticket.closedAt.getTime() : null,
      lastPublicMessageAt: ticket.lastPublicMessageAt ? ticket.lastPublicMessageAt.getTime() : null,
    });
  }

  private toSupportQueueTicketSummaryDto(ticket: SupportTicket): SupportQueueTicketSummaryDto {
    const now = new Date();

    return new SupportQueueTicketSummaryDto({
      ...this.toSupportTicketSummaryDto(ticket),
      ownerUserId: ticket.owner.id,
      firstResponseDueAt: ticket.firstResponseDueAt ? ticket.firstResponseDueAt.getTime() : null,
      firstResponseAt: ticket.firstResponseAt ? ticket.firstResponseAt.getTime() : null,
      firstResponseBreached: !ticket.firstResponseAt && !!ticket.firstResponseDueAt && ticket.firstResponseDueAt < now,
      resolutionDueAt: ticket.resolutionDueAt ? ticket.resolutionDueAt.getTime() : null,
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.getTime() : null,
      resolutionBreached: !ticket.resolvedAt && !!ticket.resolutionDueAt && ticket.resolutionDueAt < now,
    });
  }

  private toSupportTicketDetailDto(
    ticket: SupportTicket,
    messages: SupportTicketMessage[],
    includeInternal: boolean,
  ): SupportTicketDetailDto {
    const messageDtos = messages
      .filter((message) => includeInternal || !message.isInternal)
      .map((message) => this.toSupportTicketMessageDto(message, includeInternal));

    return new SupportTicketDetailDto({
      ...this.toSupportTicketSummaryDto(ticket),
      ownerUserId: ticket.owner?.id,
      firstResponseDueAt: ticket.firstResponseDueAt ? ticket.firstResponseDueAt.getTime() : null,
      firstResponseAt: ticket.firstResponseAt ? ticket.firstResponseAt.getTime() : null,
      resolutionDueAt: ticket.resolutionDueAt ? ticket.resolutionDueAt.getTime() : null,
      resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.getTime() : null,
      messages: messageDtos,
    });
  }

  private toSupportTicketMessageDto(
    message: SupportTicketMessage,
    includeInternal: boolean,
  ): SupportTicketMessageDto {
    const senderLabel = includeInternal
      ? this.getInternalSenderLabel(message)
      : this.getExternalSenderLabel(message);

    return new SupportTicketMessageDto({
      id: message.id,
      kind: message.kind,
      senderLabel,
      authorUserId: includeInternal ? (message.author ? message.author.id : null) : undefined,
      body: message.body,
      isInternal: message.isInternal,
      createdAt: message.createdAt.getTime(),
    });
  }

  private getExternalSenderLabel(message: SupportTicketMessage): string {
    if (message.kind === SupportMessageKind.USER) {
      return 'Du';
    }

    return 'Support';
  }

  private getInternalSenderLabel(message: SupportTicketMessage): string {
    if (!message.author) {
      return 'System';
    }

    if (message.kind === SupportMessageKind.USER) {
      return `User #${message.author.id}`;
    }

    return `Support #${message.author.id}`;
  }

  private async createTicketEvent(
    em: Connection['manager'],
    ticketId: number,
    type: SupportTicketEventType,
    actorUserId: number | null,
    payload: Record<string, unknown> | null,
  ): Promise<void> {
    await em.getRepository(SupportTicketEvent).save(
      em.getRepository(SupportTicketEvent).create({
        ticket: { id: ticketId } as SupportTicket,
        actor: actorUserId ? ({ id: actorUserId } as User) : null,
        type,
        payload,
      }),
    );
  }

  private addHours(date: Date, hours: number): Date {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }
}


