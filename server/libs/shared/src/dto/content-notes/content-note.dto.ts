import { IsNumber, IsString } from "class-validator";

export class ContentNoteDto {
	@IsNumber()
	id: number;

	@IsString()
	name: string;
}
