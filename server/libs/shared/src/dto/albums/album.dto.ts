import { ImageSummaryDto } from '../image/image-summary.dto';

/** ER2 round 2: entry of GET /albums. */
export interface AlbumSummaryDto {
	id: number;
	title: string;
	description: string | null;
	ownerId: number;
	owner: string;
	ownerServer: string;
	coverImageId: number | null;
	coverUrl: string | null;
	coverThumbUrl: string | null;
	imageCount: number;
	/** epoch millis */
	createdAt: number;
	/** epoch millis */
	updatedAt: number;
}

/** ER2 round 2: response of GET /albums/:id. */
export interface AlbumDto extends AlbumSummaryDto {
	mine: boolean;
	images: ImageSummaryDto[];
}
