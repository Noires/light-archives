import { FreeCompanyApplicationStatus as S } from '@app/shared/enums/free-company-application-status.enum';
import { canApplyToFreeCompany, decideFcApplication } from './fc-applications';

describe('decideFcApplication', () => {
  it('accepts or rejects pending applications', () => {
    expect(decideFcApplication(S.PENDING, 'accept')).toBe(S.ACCEPTED);
    expect(decideFcApplication(S.PENDING, 'reject')).toBe(S.REJECTED);
  });

  it('refuses to change decided applications', () => {
    expect(decideFcApplication(S.ACCEPTED, 'reject')).toBeNull();
    expect(decideFcApplication(S.REJECTED, 'accept')).toBeNull();
  });
});

describe('canApplyToFreeCompany', () => {
  const base = { claimed: true, recruiting: null, alreadyMember: false, existingStatus: null };

  it('allows applying to a claimed FC without stated recruiting status', () => {
    expect(canApplyToFreeCompany(base)).toBe(true);
    expect(canApplyToFreeCompany({ ...base, recruiting: true })).toBe(true);
  });

  it('blocks unclaimed, not recruiting, own FC and repeated applications', () => {
    expect(canApplyToFreeCompany({ ...base, claimed: false })).toBe(false);
    expect(canApplyToFreeCompany({ ...base, recruiting: false })).toBe(false);
    expect(canApplyToFreeCompany({ ...base, alreadyMember: true })).toBe(false);
    expect(canApplyToFreeCompany({ ...base, existingStatus: S.PENDING })).toBe(false);
    expect(canApplyToFreeCompany({ ...base, existingStatus: S.REJECTED })).toBe(false);
  });
});
