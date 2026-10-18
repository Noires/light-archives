import { ImageTagStatus } from '@app/shared/enums/image-tag-status.enum';
import { Type } from 'class-transformer';
import { IsIn, IsNumber } from 'class-validator';

/** ER2 round 2: EventEmitter2 event emitted when a tag awaits the tagged owner's consent. */
export const IMAGE_TAG_REQUESTED_EVENT = 'image.tag.requested';

export interface ImageTagRequestedEvent {
	taggedCharacterId: number;
	imageId: number;
	byCharacterName: string;
}

/** Body of POST /images/:id/tags. */
export class ImageTagRequestDto {
	@Type(() => Number)
	@IsNumber()
	characterId: number;
}

/** Body of PUT /images/tags/:tagId (tagged character's owner only). */
export class ImageTagDecisionDto {
	@IsIn([ImageTagStatus.APPROVED, ImageTagStatus.DECLINED])
	status: ImageTagStatus.APPROVED | ImageTagStatus.DECLINED;
}

/** Public, approved tag on ImageDto.taggedCharacters. */
export interface TaggedCharacterDto {
	id: number;
	name: string;
	server: string;
	avatar: string;
}

/** A tag with its consent state; only shown to the tagger and the tagged character's owner. */
export interface ImageTagDto {
	/** tag id */
	id: number;
	characterId: number;
	name: string;
	server: string;
	avatar: string;
	status: ImageTagStatus;
	/** epoch millis */
	createdAt: number;
	/** epoch millis */
	decidedAt: number | null;
}

/** Entry of GET /images/tags/pending: a tag awaiting my decision. */
export interface PendingImageTagDto {
	id: number;
	/** epoch millis */
	createdAt: number;
	image: {
		id: number;
		title: string;
		thumbUrl: string;
	};
	character: TaggedCharacterDto;
	taggedBy: {
		id: number;
		name: string;
		server: string;
	};
}
