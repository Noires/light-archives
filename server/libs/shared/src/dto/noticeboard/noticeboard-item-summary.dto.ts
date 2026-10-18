import { NoticeboardLocation } from "@app/shared/enums/noticeboard-location.enum";
import { NoticeboardType } from "@app/shared/enums/noticeboard-type.enum";

export interface NoticeboardItemSummaryDto {
	id: number;
	title: string;
	author: string;
	createdAt: number;
	location: NoticeboardLocation;
	type: NoticeboardType;
	venueId?: number;
	venueName?: string;
	venueServer?: string;
	// ER2 round 2 (optional, read only)
	pinned?: boolean;
	discordPosted?: boolean;
	/** alias of discordPosted (read by NoticeboardCard / NoticeboardItemView) */
	postedToDiscord?: boolean;
	/** omitted when the item has no image */
	imageUrl?: string;
	/** plain text, HTML stripped, ~240 characters */
	excerpt?: string;
}
