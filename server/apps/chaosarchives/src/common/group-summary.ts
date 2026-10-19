// ER2 round 2 — enrichment for FC and community list cards: member count, up to
// three member avatars and the next event, each loaded for all groups at once.
//
// Definitions:
//   - members: FC = verified characters whose Lodestone FC is the group
//     (character.freeCompanyId); community = confirmed memberships.
//   - memberAvatars: avatars of up to 3 members, members who hide their
//     avatar (showAvatar = false) are skipped; most recently active first
//     (the outer ORDER BY is required: a derived table has no guaranteed order).
//   - nextEvent: the earliest not-hidden, not-deleted event starting now or
//     later whose owner character is a member of the group (by the same member
//     definition). Events have no FC/community link field, so ownership by a
//     member is the link.

import { GroupEventDto, GroupSummaryExtrasDto } from '@app/shared/dto/common/group-summary-extras.dto';
import { EntityManager } from 'typeorm';

export const MEMBER_AVATARS_MAX = 3;

export type GroupKind = 'freeCompany' | 'community';

interface MemberRow {
  groupId: number | string;
  avatar: string | null;
  cnt: number | string;
}

interface EventRow {
  groupId: number | string;
  id: number | string;
  title: string;
  startDateTime: Date | string;
}

function memberSql(kind: GroupKind): string {
  if (kind === 'freeCompany') {
    return `
      SELECT t.groupId, t.avatar, t.cnt FROM (
        SELECT c.freeCompanyId AS groupId,
          CASE WHEN c.showAvatar = 1 THEN c.avatar ELSE NULL END AS avatar,
          COUNT(*) OVER (PARTITION BY c.freeCompanyId) AS cnt,
          ROW_NUMBER() OVER (PARTITION BY c.freeCompanyId ORDER BY c.showAvatar DESC, c.updatedAt DESC, c.id ASC) AS rn
        FROM \`character\` c
        WHERE c.freeCompanyId IN (?) AND c.verifiedAt IS NOT NULL AND c.deletedAt IS NULL
      ) t
      WHERE t.rn <= ${MEMBER_AVATARS_MAX}
      ORDER BY t.groupId, t.rn`;
  }

  return `
    SELECT t.groupId, t.avatar, t.cnt FROM (
      SELECT m.communityId AS groupId,
        CASE WHEN c.showAvatar = 1 THEN c.avatar ELSE NULL END AS avatar,
        COUNT(*) OVER (PARTITION BY m.communityId) AS cnt,
        ROW_NUMBER() OVER (PARTITION BY m.communityId ORDER BY c.showAvatar DESC, c.updatedAt DESC, c.id ASC) AS rn
      FROM \`community_membership\` m
      INNER JOIN \`character\` c ON c.id = m.characterId AND c.deletedAt IS NULL
      WHERE m.communityId IN (?) AND m.status = 'confirmed' AND m.deletedAt IS NULL
    ) t
    WHERE t.rn <= ${MEMBER_AVATARS_MAX}
    ORDER BY t.groupId, t.rn`;
}

function eventSql(kind: GroupKind): string {
  const membership = kind === 'freeCompany'
    ? {
      join: 'INNER JOIN `character` c ON c.id = e.ownerId AND c.verifiedAt IS NOT NULL AND c.deletedAt IS NULL',
      group: 'c.freeCompanyId',
    }
    : {
      join: "INNER JOIN `community_membership` m ON m.characterId = e.ownerId AND m.status = 'confirmed' AND m.deletedAt IS NULL",
      group: 'm.communityId',
    };

  return `
    SELECT t.groupId, t.id, t.title, t.startDateTime FROM (
      SELECT ${membership.group} AS groupId, e.id, e.title, e.startDateTime,
        ROW_NUMBER() OVER (PARTITION BY ${membership.group} ORDER BY e.startDateTime ASC, e.id ASC) AS rn
      FROM \`event\` e
      ${membership.join}
      WHERE ${membership.group} IN (?) AND e.hidden = 0 AND e.deletedAt IS NULL AND e.startDateTime >= ?
    ) t
    WHERE t.rn = 1`;
}

/** Folds the raw rows into per-group extras; groups without rows get zero members and no event. */
export function foldGroupSummaryRows(
  groupIds: number[],
  memberRows: MemberRow[],
  eventRows: EventRow[],
): Map<number, GroupSummaryExtrasDto> {
  const result = new Map<number, GroupSummaryExtrasDto>();
  groupIds.forEach((id) => result.set(id, { memberCount: 0, memberAvatars: [], nextEvent: null }));

  memberRows.forEach((row) => {
    const extras = result.get(Number(row.groupId));

    if (!extras) {
      return;
    }

    extras.memberCount = Number(row.cnt) || 0;

    if (row.avatar && extras.memberAvatars!.length < MEMBER_AVATARS_MAX) {
      extras.memberAvatars!.push(row.avatar);
    }
  });

  eventRows.forEach((row) => {
    const extras = result.get(Number(row.groupId));

    if (extras) {
      const event: GroupEventDto = {
        id: Number(row.id),
        title: row.title,
        startDateTime: new Date(row.startDateTime).getTime(),
      };
      extras.nextEvent = event;
    }
  });

  return result;
}

export async function loadGroupSummaryExtras(
  em: EntityManager,
  kind: GroupKind,
  groupIds: number[],
  now = new Date(),
): Promise<Map<number, GroupSummaryExtrasDto>> {
  if (groupIds.length === 0) {
    return new Map();
  }

  const [memberRows, eventRows] = await Promise.all([
    em.query(memberSql(kind), [groupIds]) as Promise<MemberRow[]>,
    em.query(eventSql(kind), [groupIds, now]) as Promise<EventRow[]>,
  ]);

  return foldGroupSummaryRows(groupIds, memberRows, eventRows);
}
