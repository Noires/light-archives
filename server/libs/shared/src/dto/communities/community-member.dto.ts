import { MembershipStatus } from "@app/shared/enums/membership-status.enum";

export interface CommunityMemberDto {
	characterId: number;
	name: string;
	server: string;
	avatar: string;
	status: MembershipStatus;
	canEdit: boolean;
	canManageMembers: boolean;
	// ER2 round 2 (optional), derived from ownership and flags
	role?: CommunityRole;
}

/** ER2 round 2: member role, derived from community ownership and membership flags. */
export type CommunityRole = 'owner' | 'manager' | 'editor' | 'member' | 'applicant';

export function communityRole(
	isOwner: boolean,
	status: MembershipStatus,
	canEdit: boolean,
	canManageMembers: boolean,
): CommunityRole {
	if (isOwner) {
		return 'owner';
	}

	if (status !== MembershipStatus.CONFIRMED) {
		return 'applicant';
	}

	if (canManageMembers) {
		return 'manager';
	}

	return canEdit ? 'editor' : 'member';
}
