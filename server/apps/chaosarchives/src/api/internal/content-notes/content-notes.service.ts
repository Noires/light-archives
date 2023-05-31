import { ContentNote } from "@app/entity";
import { ContentNoteDto } from "@app/shared/dto/content-notes/content-note.dto";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Repository } from "typeorm";

@Injectable()
export class ContentNotesService {
	constructor(
		private connection: Connection,
		@InjectRepository(ContentNote) private contentNoteRepo: Repository<ContentNote>
	) {}

	async getContentNotes(): Promise<ContentNoteDto[]> {
		const contentNotes = await this.contentNoteRepo.find();

    if (contentNotes.length == 0)
    {
      return [];
    }

		return contentNotes;
	}
}
