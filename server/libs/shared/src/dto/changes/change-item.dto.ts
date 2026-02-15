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
}
