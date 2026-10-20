import { ImageCategory } from "@app/shared/enums/image-category.enum";
import { ReactionKind } from "@app/shared/enums/reaction.enum";
import { ReactionCountsDto } from "../reactions/reaction.dto";
import { ImageTagDto, TaggedCharacterDto } from "./image-tag.dto";

export interface ImageDto {
  id: number;
  mine: boolean;
  url: string;
  thumbUrl: string;
  filename: string;
  title: string;
  description: string;
  credits: string;
  category: ImageCategory;
  width: number;
  height: number;
  createdAt: number;
  author: string;
  authorServer: string;
  eventId: number|null;
  eventTitle: string|null;
  venueId: number|null;
  venueName: string|null;
  venueServer: string|null;
  // ER2-807 (optional)
  reactionCounts?: ReactionCountsDto;
  myReactions?: ReactionKind[];
  // ER2 round 2 (optional): albums containing the image, only for the owner
  albumIds?: number[];
  // ER2 round 2 (optional): approved character tags (public)
  taggedCharacters?: TaggedCharacterDto[];
  // ER2 round 2 (optional): tags incl. consent state; only for the image owner (all) or a tagged owner (own)
  tags?: ImageTagDto[];
}
