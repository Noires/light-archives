import { ChangeArea } from '@app/shared/enums/change-area.enum';
import { ChangeType } from '@app/shared/enums/change-type.enum';

export interface ChangeItemDto {
  id: string;
  entityId: number;
  area: ChangeArea;
  type: ChangeType;
  title: string;
  summary: string;
  author: string;
  link: string;
  happenedAt: number;
  createdAt: number;
  updatedAt: number;
  // ER2 round 2 (optional): avatar of the author character
  authorAvatar?: string;
  /** profile avatar (profiles), image thumbnail (media), banner (venues) */
  thumbnailUrl?: string;
}
