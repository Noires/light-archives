import { comparePinnedFirst, dropTruncatedTag, PinnableItem } from './noticeboard.helpers';

describe('comparePinnedFirst', () => {
  const item = (id: string, created: string, pinnedAt?: string): PinnableItem & { id: string } => ({
    id,
    pinned: !!pinnedAt,
    pinnedAt: pinnedAt ? new Date(pinnedAt) : null,
    createdAt: new Date(created),
  });

  it('puts pinned items first, most recently pinned first, then newest', () => {
    const items = [
      item('old', '2026-10-01T10:00:00Z'),
      item('pinnedEarly', '2026-09-01T10:00:00Z', '2026-10-02T10:00:00Z'),
      item('new', '2026-10-17T10:00:00Z'),
      item('pinnedLate', '2026-08-01T10:00:00Z', '2026-10-10T10:00:00Z'),
    ];

    expect(items.sort(comparePinnedFirst).map((i) => i.id)).toEqual(['pinnedLate', 'pinnedEarly', 'new', 'old']);
  });

  it('falls back to creation date for pinned items without pin date', () => {
    const a = { pinned: true, pinnedAt: null, createdAt: new Date('2026-10-01T00:00:00Z') };
    const b = { pinned: true, pinnedAt: null, createdAt: new Date('2026-10-05T00:00:00Z') };

    expect(comparePinnedFirst(a, b)).toBeGreaterThan(0);
  });
});

describe('dropTruncatedTag', () => {
  it('removes a trailing unfinished tag', () => {
    expect(dropTruncatedTag('<p>Hallo</p><a href="https://exa')).toBe('<p>Hallo</p>');
  });

  it('keeps complete markup', () => {
    expect(dropTruncatedTag('<p>Hallo</p>')).toBe('<p>Hallo</p>');
  });
});
