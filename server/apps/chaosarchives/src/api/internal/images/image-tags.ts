// ER2 round 2 — image character tags with consent (DSGVO). Pure rules shared by
// ImageTagsService and its tests.

import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';

export const MAX_TAGS_PER_IMAGE = 20;

export type TagCreateOutcome =
  | { action: 'create'; status: ImageTagStatus }
  | { action: 'keep' }
  | { action: 'refuse'; reason: string };

/**
 * What happens when the image owner tags a character. A character of the same
 * account is approved right away (consent is implied); everyone else starts
 * pending. Re-tagging is idempotent, and a declined tag cannot be re-requested.
 */
export function tagCreateOutcome(
  existingStatus: ImageTagStatus | null,
  sameAccount: boolean,
  tagCount: number,
): TagCreateOutcome {
  if (existingStatus === ImageTagStatus.DECLINED) {
    return { action: 'refuse', reason: 'This character declined being tagged on this image' };
  }

  if (existingStatus !== null) {
    return { action: 'keep' };
  }

  if (tagCount >= MAX_TAGS_PER_IMAGE) {
    return { action: 'refuse', reason: `An image can have at most ${MAX_TAGS_PER_IMAGE} tags` };
  }

  return { action: 'create', status: sameAccount ? ImageTagStatus.APPROVED : ImageTagStatus.PENDING };
}

/**
 * The tagged character's owner decides. They can approve or decline a pending
 * tag and change their mind later (approved <-> declined). Returns the new
 * status, or null when nothing changes.
 */
export function decideTag(current: ImageTagStatus, requested: ImageTagStatus): ImageTagStatus | null {
  if (requested !== ImageTagStatus.APPROVED && requested !== ImageTagStatus.DECLINED) {
    throw new Error('A tag can only be approved or declined');
  }

  return current === requested ? null : requested;
}

export interface TagParties {
  /** user id of the image owner (the only one who can tag) */
  taggerUserId: number;
  /** user id of the tagged character's owner */
  taggedOwnerUserId: number;
}

/** Approved tags are public; pending and declined ones only for the tagger and the tagged owner. */
export function canSeeTag(status: ImageTagStatus, parties: TagParties, viewerUserId?: number | null): boolean {
  if (status === ImageTagStatus.APPROVED) {
    return true;
  }

  return !!viewerUserId && (viewerUserId === parties.taggerUserId || viewerUserId === parties.taggedOwnerUserId);
}

/** The image owner or the tagged character's owner may remove a tag, whatever its state. */
export function canRemoveTag(parties: TagParties, viewerUserId: number): boolean {
  return viewerUserId === parties.taggerUserId || viewerUserId === parties.taggedOwnerUserId;
}
