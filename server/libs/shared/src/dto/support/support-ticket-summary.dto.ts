import { SupportLevel } from '@app/shared/enums/support-level.enum';
import { SupportTicketCategory } from '@app/shared/enums/support-ticket-category.enum';
import { SupportTicketPriority } from '@app/shared/enums/support-ticket-priority.enum';
import { SupportTicketStatus } from '@app/shared/enums/support-ticket-status.enum';

export class SupportTicketSummaryDto {
  id: number;
  ticketNumber: number;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  supportLevel: SupportLevel;
  assigneeUserId: number | null;
  createdAt: number;
  updatedAt: number;
  closedAt: number | null;
  lastPublicMessageAt: number | null;

  constructor(properties?: Readonly<SupportTicketSummaryDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
