import { ImageTagStatus as S } from '@app/shared/enums/image-tag-status.enum';
import { canRemoveTag, canSeeTag, decideTag, MAX_TAGS_PER_IMAGE, tagCreateOutcome } from './image-tags';

describe('tagCreateOutcome', () => {
  it('starts tags of other accounts as pending', () => {
    expect(tagCreateOutcome(null, false, 0)).toEqual({ action: 'create', status: S.PENDING });
  });

  it('approves tags of own characters right away', () => {
    expect(tagCreateOutcome(null, true, 0)).toEqual({ action: 'create', status: S.APPROVED });
  });

  it('is idempotent for pending and approved tags', () => {
    expect(tagCreateOutcome(S.PENDING, false, 3)).toEqual({ action: 'keep' });
    expect(tagCreateOutcome(S.APPROVED, false, 3)).toEqual({ action: 'keep' });
  });

  it('does not let the tagger re-request a declined tag', () => {
    expect(tagCreateOutcome(S.DECLINED, false, 3).action).toBe('refuse');
  });

  it('limits the number of tags per image', () => {
    expect(tagCreateOutcome(null, false, MAX_TAGS_PER_IMAGE).action).toBe('refuse');
  });
});

describe('decideTag', () => {
  it('approves or declines pending tags', () => {
    expect(decideTag(S.PENDING, S.APPROVED)).toBe(S.APPROVED);
    expect(decideTag(S.PENDING, S.DECLINED)).toBe(S.DECLINED);
  });

  it('lets the tagged owner change their mind', () => {
    expect(decideTag(S.APPROVED, S.DECLINED)).toBe(S.DECLINED);
    expect(decideTag(S.DECLINED, S.APPROVED)).toBe(S.APPROVED);
  });

  it('returns null when nothing changes', () => {
    expect(decideTag(S.APPROVED, S.APPROVED)).toBeNull();
  });

  it('cannot move a tag back to pending', () => {
    expect(() => decideTag(S.APPROVED, S.PENDING)).toThrow();
  });
});

describe('visibility and removal', () => {
  const parties = { taggerUserId: 1, taggedOwnerUserId: 2 };

  it('shows approved tags to everyone, also anonymously', () => {
    expect(canSeeTag(S.APPROVED, parties, null)).toBe(true);
    expect(canSeeTag(S.APPROVED, parties, 99)).toBe(true);
  });

  it('shows pending and declined tags only to the tagger and the tagged owner', () => {
    for (const status of [S.PENDING, S.DECLINED]) {
      expect(canSeeTag(status, parties, 1)).toBe(true);
      expect(canSeeTag(status, parties, 2)).toBe(true);
      expect(canSeeTag(status, parties, 99)).toBe(false);
      expect(canSeeTag(status, parties, null)).toBe(false);
    }
  });

  it('lets the image owner and the tagged owner remove a tag', () => {
    expect(canRemoveTag(parties, 1)).toBe(true);
    expect(canRemoveTag(parties, 2)).toBe(true);
    expect(canRemoveTag(parties, 99)).toBe(false);
  });
});
