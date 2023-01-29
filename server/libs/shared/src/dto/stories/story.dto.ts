import { StoryType } from "@app/shared/enums/story-type.enum";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ContentNoteDto } from "../content-notes/content-note.dto";

export class StoryDto {
	@IsNumber()
	@IsOptional()
	id?: number;

	@IsBoolean()
	@IsOptional()
	mine: boolean;

	@IsString()
	author: string;

	@IsString()
	authorServer: string;

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

	constructor(properties?: Readonly<StoryDto>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
