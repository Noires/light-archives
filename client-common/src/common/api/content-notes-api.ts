import { ContentNoteDto } from "@app/shared/dto/content-notes/content-note.dto";
import APITransport from "./api-transport";

export default class ContentNotesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('content-notes');
  }

  async getContentNotes(): Promise<ContentNoteDto[]> {
    return this.transport.get<ContentNoteDto[]>('');
  }
}
