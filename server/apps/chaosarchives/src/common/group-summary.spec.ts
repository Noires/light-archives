import { EntityManager } from 'typeorm';
import { foldGroupSummaryRows, GroupKind, loadGroupSummaryExtras } from './group-summary';

describe('foldGroupSummaryRows', () => {
  it('collects counts, up to three avatars and the next event per group', () => {
    const start = new Date('2026-11-01T19:00:00Z');
    const result = foldGroupSummaryRows(
      [1, 2],
      [
        { groupId: 1, avatar: 'a.png', cnt: '5' },
        { groupId: 1, avatar: null, cnt: '5' },
        { groupId: 1, avatar: 'b.png', cnt: '5' },
      ],
      [{ groupId: '1', id: '9', title: 'Tavernenabend', startDateTime: start }],
    );

    expect(result.get(1)).toEqual({
      memberCount: 5,
      memberAvatars: ['a.png', 'b.png'],
      nextEvent: { id: 9, title: 'Tavernenabend', startDateTime: start.getTime() },
    });
    expect(result.get(2)).toEqual({ memberCount: 0, memberAvatars: [], nextEvent: null });
  });

  it('ignores rows of unknown groups', () => {
    const result = foldGroupSummaryRows([1], [{ groupId: 3, avatar: 'x.png', cnt: 1 }], []);
    expect(result.has(3)).toBe(false);
  });
});

describe('loadGroupSummaryExtras', () => {
  it.each<GroupKind>(['freeCompany', 'community'])('orders %s member rows by group and rank', async (kind) => {
    const queries: string[] = [];
    const em = { query: async (sql: string) => { queries.push(sql); return []; } } as unknown as EntityManager;

    await loadGroupSummaryExtras(em, kind, [1]);

    // The avatar order ("most recently active first") is only guaranteed by the outer ORDER BY
    const memberQuery = queries.find((sql) => sql.includes('COUNT(*) OVER'));
    expect(memberQuery?.replace(/\s+/g, ' ').trim()).toMatch(/ORDER BY t\.groupId, t\.rn$/);
  });
});
