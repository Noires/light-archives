import { SupportTicketSummaryDto } from './support-ticket-summary.dto';

export class SupportQueueTicketSummaryDto extends SupportTicketSummaryDto {
  ownerUserId: number;
  firstResponseDueAt: number | null;
  firstResponseAt: number | null;
  firstResponseBreached: boolean;
  resolutionDueAt: number | null;
  resolvedAt: number | null;
  resolutionBreached: boolean;

  constructor(properties?: Readonly<SupportQueueTicketSummaryDto>) {
    super(properties);
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
