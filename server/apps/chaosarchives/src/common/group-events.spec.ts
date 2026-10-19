import { buildGroupEventIdsQuery, normalizeGroupEventsLimit, orderByIds } from './group-events';

const NOW = new Date('2026-10-19T18:00:00Z');

describe('buildGroupEventIdsQuery', () => {
  it('filters FC events by verified members of the FC, upcoming ascending', () => {
    const { sql, params } = buildGroupEventIdsQuery('freeCompany', 7, { upcoming: true, limit: 5 }, NOW);

    expect(sql).toContain('INNER JOIN `character` c ON c.id = e.ownerId AND c.verifiedAt IS NOT NULL AND c.deletedAt IS NULL');
    expect(sql).toContain('c.freeCompanyId = ?');
    expect(sql).toContain('e.hidden = 0 AND e.deletedAt IS NULL');
    expect(sql).toContain('e.startDateTime >= ?');
    expect(sql).toContain('ORDER BY e.startDateTime ASC');
    expect(sql).not.toContain('community_membership');
    expect(params).toEqual([7, NOW, 5]);
  });

  it('filters community events by confirmed memberships, past 90 days descending', () => {
    const { sql, params } = buildGroupEventIdsQuery('community', 3, { upcoming: false }, NOW);

    expect(sql).toContain("m.characterId = e.ownerId AND m.status = 'confirmed' AND m.deletedAt IS NULL");
    expect(sql).toContain('m.communityId = ?');
    expect(sql).toContain('e.startDateTime < ? AND e.startDateTime >= ?');
    expect(sql).toContain('ORDER BY e.startDateTime DESC');
    expect(params).toEqual([3, NOW, new Date('2026-07-21T18:00:00Z'), 20]);
  });

  it('defaults to upcoming', () => {
    const { sql } = buildGroupEventIdsQuery('community', 3, {}, NOW);
    expect(sql).toContain('ORDER BY e.startDateTime ASC');
  });
});

describe('normalizeGroupEventsLimit', () => {
  it('defaults and clamps', () => {
    expect(normalizeGroupEventsLimit(undefined)).toBe(20);
    expect(normalizeGroupEventsLimit(0)).toBe(20);
    expect(normalizeGroupEventsLimit(3)).toBe(3);
    expect(normalizeGroupEventsLimit(500)).toBe(50);
  });
});

describe('orderByIds', () => {
  it('keeps the id order and drops missing ids', () => {
    expect(orderByIds([3, 1, 2], [{ id: 1 }, { id: 3 }])).toEqual([{ id: 3 }, { id: 1 }]);
  });
});
