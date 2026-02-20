import { MembershipStatus } from '@app/shared/enums/membership-status.enum';

export interface VenueMemberDto {
  characterId: number;
  name: string;
  server: string;
  avatar: string;
  status: MembershipStatus;
  canEdit: boolean;
  canManageMembers: boolean;
}
