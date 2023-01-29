import { IsString } from "class-validator";

export class ContentNoteDto {
	@IsString()
	name: string;
}
