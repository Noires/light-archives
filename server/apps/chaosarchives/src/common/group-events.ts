// ER2 backend finish — events of a free company or community ("Events" tab).
//
// Events have no FC/community link field, so an event belongs to a group when
// its owner character is a member, with the same member definition as
// group-summary.ts: FC = verified characters whose Lodestone FC is the group
// (character.freeCompanyId); community = confirmed memberships. Hidden and
// deleted events are skipped.
//
// upcoming: events starting now or later, ascending.
// past: events that started within the last 90 days, descending.

import { GROUP_EVENTS_DEFAULT_LIMIT, GROUP_EVENTS_MAX_LIMIT } from '@app/shared/dto/events/group-events.constants';
import { GroupKind } from './group-summary';

export const GROUP_EVENTS_PAST_DAYS = 90;

export interface GroupEventsOptions {
  upcoming?: boolean;
  limit?: number;
}

export interface GroupEventsQuery {
  sql: string;
  params: unknown[];
}

export function normalizeGroupEventsLimit(limit?: number | null): number {
  const value = Math.floor(Number(limit));

  if (!Number.isFinite(value) || value < 1) {
    return GROUP_EVENTS_DEFAULT_LIMIT;
  }

  return Math.min(value, GROUP_EVENTS_MAX_LIMIT);
}

function membershipJoin(kind: GroupKind): { join: string; where: string } {
  if (kind === 'freeCompany') {
    return {
      join: 'INNER JOIN `character` c ON c.id = e.ownerId AND c.verifiedAt IS NOT NULL AND c.deletedAt IS NULL',
      where: 'c.freeCompanyId = ?',
    };
  }

  return {
    join: "INNER JOIN `community_membership` m ON m.characterId = e.ownerId AND m.status = 'confirmed' AND m.deletedAt IS NULL",
    where: 'm.communityId = ?',
  };
}

/** Builds the query returning the ordered ids of a group's events. */
export function buildGroupEventIdsQuery(
  kind: GroupKind,
  groupId: number,
  options: GroupEventsOptions = {},
  now = new Date(),
): GroupEventsQuery {
  const upcoming = options.upcoming !== false;
  const limit = normalizeGroupEventsLimit(options.limit);
  const membership = membershipJoin(kind);
  const params: unknown[] = [groupId];
  let range: string;
  let order: string;

  if (upcoming) {
    range = 'e.startDateTime >= ?';
    order = 'e.startDateTime ASC, e.id ASC';
    params.push(now);
  } else {
    range = 'e.startDateTime < ? AND e.startDateTime >= ?';
    order = 'e.startDateTime DESC, e.id DESC';
    params.push(now, new Date(now.getTime() - GROUP_EVENTS_PAST_DAYS * 24 * 60 * 60 * 1000));
  }

  params.push(limit);

  const sql = `
    SELECT DISTINCT e.id, e.startDateTime FROM \`event\` e
    ${membership.join}
    WHERE ${membership.where} AND e.hidden = 0 AND e.deletedAt IS NULL AND ${range}
    ORDER BY ${order}
    LIMIT ?`;

  return { sql, params };
}

/** Reorders loaded entities to the id order returned by the id query. */
export function orderByIds<T extends { id: number }>(ids: number[], items: T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => byId.get(id)).filter((item): item is T => !!item);
}
