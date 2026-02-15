import { SupportMessageKind } from '@app/shared/enums/support-message-kind.enum';

export class SupportTicketMessageDto {
  id: number;
  kind: SupportMessageKind;
  senderLabel: string;
  authorUserId?: number | null;
  body: string;
  isInternal: boolean;
  createdAt: number;

  constructor(properties?: Readonly<SupportTicketMessageDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
