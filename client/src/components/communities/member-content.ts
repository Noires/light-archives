// ER2 round 2 — gallery and stories of a group, gathered from its members.
// There is no group endpoint, so this calls GET /characters/:id/content
// (stories + images of one character) for up to MAX_MEMBERS members, a few
// at a time, and caches each character's content for the session.

import type { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import type { ImageSummaryDto } from '@app/shared/dto/image/image-summary.dto';
import type { StorySummaryDto } from '@app/shared/dto/stories/story-summary.dto';
import { useApi } from 'src/boot/axios';

export const MAX_MEMBERS = 40;
const CONCURRENCY = 4;
const CACHE_MS = 5 * 60 * 1000;

const cache = new Map<number, { at: number; content: Promise<CharacterContentDto | null> }>();

function contentFor(characterId: number): Promise<CharacterContentDto | null> {
  const hit = cache.get(characterId);

  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.content;
  }

  const content = useApi()
    .characters.getCharacterContent(characterId)
    .catch(() => null);
  cache.set(characterId, { at: Date.now(), content });
  return content;
}

export interface GroupContent {
  images: ImageSummaryDto[];
  stories: StorySummaryDto[];
  /** members whose content was requested */
  memberCount: number;
  /** more members than MAX_MEMBERS */
  truncated: boolean;
}

export async function loadGroupContent(characterIds: number[]): Promise<GroupContent> {
  const ids = Array.from(new Set(characterIds)).slice(0, MAX_MEMBERS);
  const results = new Array<CharacterContentDto | null>(ids.length).fill(null);
  let next = 0;

  async function worker() {
    while (next < ids.length) {
      const index = next++;
      results[index] = await contentFor(ids[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));

  const images = new Map<number, ImageSummaryDto>();
  const stories = new Map<number, StorySummaryDto>();

  results.forEach((content) => {
    content?.images.forEach((image) => images.set(image.id, image));
    content?.stories.forEach((story) => {
      // Drafts only reach their owner; never show them on a group page.
      if (story.published !== false) {
        stories.set(story.id, story);
      }
    });
  });

  return {
    images: Array.from(images.values()).sort((a, b) => b.createdAt - a.createdAt),
    stories: Array.from(stories.values()).sort((a, b) => b.createdAt - a.createdAt),
    memberCount: ids.length,
    truncated: new Set(characterIds).size > ids.length,
  };
}
