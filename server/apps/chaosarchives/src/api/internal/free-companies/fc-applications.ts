// ER2 round 2 — FC applications ("Bewerben"). Pure rules shared by the service and tests.

import { FreeCompanyApplicationStatus } from '@app/shared/enums/free-company-application-status.enum';

export type FcApplicationDecision = 'accept' | 'reject';

/** New status for a manager decision, or null when the application is not pending. */
export function decideFcApplication(
  current: FreeCompanyApplicationStatus,
  decision: FcApplicationDecision,
): FreeCompanyApplicationStatus | null {
  if (current !== FreeCompanyApplicationStatus.PENDING) {
    return null;
  }

  return decision === 'accept' ? FreeCompanyApplicationStatus.ACCEPTED : FreeCompanyApplicationStatus.REJECTED;
}

export interface CanApplyInput {
  claimed: boolean;
  recruiting: boolean | null;
  alreadyMember: boolean;
  existingStatus: FreeCompanyApplicationStatus | null;
}

/**
 * A character can apply to a claimed FC it is not in, unless the FC says it is
 * not recruiting, and only once (a rejected application blocks re-applying;
 * withdrawing deletes the application and allows a new one).
 */
export function canApplyToFreeCompany(input: CanApplyInput): boolean {
  return input.claimed && input.recruiting !== false && !input.alreadyMember && input.existingStatus === null;
}
