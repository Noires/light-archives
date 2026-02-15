import { SupportTicketMessageDto } from './support-ticket-message.dto';
import { SupportTicketSummaryDto } from './support-ticket-summary.dto';

export class SupportTicketDetailDto extends SupportTicketSummaryDto {
  ownerUserId?: number;
  firstResponseDueAt?: number | null;
  firstResponseAt?: number | null;
  resolutionDueAt?: number | null;
  resolvedAt?: number | null;
  messages: SupportTicketMessageDto[];

  constructor(properties?: Readonly<SupportTicketDetailDto>) {
    super(properties);
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
