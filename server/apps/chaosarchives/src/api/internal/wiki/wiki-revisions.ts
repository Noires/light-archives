// ER2 round 2 — wiki revisions. Pure helpers shared by WikiService and its tests.

import { EditPermission } from '@app/shared/enums/edit-permission.enum';

export const CHANGE_NOTE_MAX_LENGTH = 200;

export interface RevisionUser {
  characters: { id: number }[];
}

/** Same rule as editing: pages with EditPermission.ME may only be changed by the owner's account. */
export function canEditWikiPage(editPermission: EditPermission, ownerId: number, user: RevisionUser): boolean {
  if (editPermission !== EditPermission.ME) {
    return true;
  }

  return user.characters.some((ch) => ch.id === ownerId);
}

/**
 * Which of the user's characters is recorded as the editor: the requested one
 * if it belongs to the user, else the page owner if it is one of the user's
 * characters, else the user's first character. Null when the user has none.
 */
export function pickEditorCharacterId(user: RevisionUser, ownerId: number | null, requestedId?: number | null): number | null {
  const ids = user.characters.map((ch) => ch.id);

  if (requestedId && ids.includes(requestedId)) {
    return requestedId;
  }

  if (ownerId && ids.includes(ownerId)) {
    return ownerId;
  }

  return ids.length > 0 ? ids[0] : null;
}

/** Trimmed change note, cut to the column length; empty becomes null. */
export function normalizeChangeNote(changeNote?: string | null): string | null {
  const trimmed = (changeNote || '').replace(/\s+/g, ' ').trim();
  return trimmed ? trimmed.substring(0, CHANGE_NOTE_MAX_LENGTH) : null;
}

/** Note for the revision written by a restore when the client sends none. */
export function restoreChangeNote(revisionId: number, changeNote?: string | null): string {
  return normalizeChangeNote(changeNote) || `Version #${revisionId} wiederhergestellt`;
}

/** Revision size in bytes (UTF-8), as shown in the history list. */
export function revisionSize(content: string | null | undefined): number {
  return Buffer.byteLength(content || '', 'utf8');
}

/** Fields of a new revision for the page state `page`. */
export function buildRevisionFields(
  page: { id: number; title: string; content: string },
  editorId: number,
  changeNote?: string | null,
): { wikiPage: { id: number }; title: string; content: string; editor: { id: number }; changeNote: string | null } {
  return {
    wikiPage: { id: page.id },
    title: page.title,
    content: page.content,
    editor: { id: editorId },
    changeNote: normalizeChangeNote(changeNote),
  };
}

/** Title lookup variants: as given and with underscores as spaces (wikified links). */
export function wikiTitleVariants(title: string): string[] {
  const raw = (title || '').trim();
  const spaced = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return Array.from(new Set([raw, spaced].filter((t) => t.length > 0)));
}
