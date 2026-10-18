import { StoryType } from "@app/shared/enums/story-type.enum";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ContentNoteDto } from "../content-notes/content-note.dto";
import { ReactionCountsDto } from "../reactions/reaction.dto";
import { ReactionKind } from "../../enums/reaction.enum";

export class StoryDto {
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

	@IsNumber()
	@IsOptional()
	createdAt: number;

	@IsString()
	title: string;

	@IsString()
	content: string;

	@IsEnum(StoryType)
	type: StoryType;

	@IsString({each: true})
	tags: string[];

	@IsString({each: true})
  contentNotes: string[];

  // ER2-808: optional series. Omit to keep, '' / null to remove.
  @IsString()
  @MaxLength(120)
  @IsOptional()
  seriesTitle?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  @IsOptional()
  seriesIndex?: number | null;

  // ER2-810: draft flag. Defaults to true on create; omit to keep on edit.
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  // Read only: number of visible parts in the series
  @IsOptional()
  seriesCount?: number;

  // ER2-807 (read only, optional)
  @IsOptional()
  reactionCounts?: ReactionCountsDto;

  @IsOptional()
  myReactions?: ReactionKind[];

	constructor(properties?: Readonly<StoryDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
