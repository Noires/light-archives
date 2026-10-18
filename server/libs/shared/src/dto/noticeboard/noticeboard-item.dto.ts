import { NoticeboardLocation } from "@app/shared/enums/noticeboard-location.enum";
import { NoticeboardType } from "@app/shared/enums/noticeboard-type.enum";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class NoticeboardItemDto {
	@IsNumber()
	@IsOptional()
	id?: number;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	characterId?: number;

	@IsString()
	@IsOptional()
	author?: string;

	@IsString()
	@IsOptional()
	authorServer?: string;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	venueId?: number;

	@IsString()
	@IsOptional()
	venueName?: string;

	@IsString()
	@IsOptional()
	venueServer?: string;

	@IsNumber()
	@IsOptional()
	createdAt: number;

	@IsString()
	title: string;

	@IsString()
	content: string;

	@IsEnum(NoticeboardLocation)
	location: NoticeboardLocation;

	@IsEnum(NoticeboardType)
	@IsOptional()
	type: NoticeboardType;

	// ER2 round 2: optional image (own image id). Omit to keep on edit, null to remove.
	@IsNumber()
	@IsOptional()
	imageId?: number | null;

	// Read only (optional); imageUrl is omitted when the item has no image
	@IsOptional()
	imageUrl?: string;

	@IsOptional()
	pinned?: boolean;

	@IsOptional()
	discordPosted?: boolean;

	/** alias of discordPosted (read by NoticeboardItemView) */
	@IsOptional()
	postedToDiscord?: boolean;

	constructor(properties?: Readonly<NoticeboardItemDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}

/** ER2 round 2: body of PUT /noticeboard/:id/pinned (moderators) */
export class NoticeboardPinnedRequestDto {
	@IsBoolean()
	pinned: boolean;
}
