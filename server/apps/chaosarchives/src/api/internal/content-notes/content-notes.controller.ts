import { ContentNoteDto } from "@app/shared/dto/content-notes/content-note.dto";
import { Controller, Get } from "@nestjs/common";
import { ContentNotesService } from "./content-notes.service";

@Controller('content-notes')
export class ContentNotesController {
	constructor(
		private contentNotesService: ContentNotesService,
	) {}

	@Get()
	async getContentNotes(): Promise<ContentNoteDto[]|null> {
		return this.contentNotesService.getContentNotes();
	}
}
