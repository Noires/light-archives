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

// Temporary Mapping
export const ContentNoteTexts: {[key:string]: string} = {
    'RAPE':'Vergewaltigung',
    'ABUSE':'Missbrauch',
    'SEXUALABUSE': 'Sexueller Missbrauch',
    'VIOLENCE': 'Gewalt | Gewaltdarstellung',
    'DOMESTICVIOLENCE': 'Häusliche Gewalt',
    'GORE': 'Gore',
    'MENTALDISORDER': 'Psychische Störung | Phobie | Manipulation',
    'PSYCHOLOGICALVIOLENCE': 'Psychische Gewalt | Seelische Gewalt | Mobbing',
    'SWEARWORDS': 'Vulgärsprache | Kraftausdrücke | Derbe Sprache',
    'SELFHARM': 'Selbstverletzendes Verhalten',
    'SUICIDE': 'Suizid',
    'ADDICTION': 'Sucht | Spielsucht | Glücksspiel',
    'DRUGS': 'Drogen | Alkohol | Drogenkonsum',
    'CRIME': 'Crime | Kriminalität',
    'SEXISM': 'Sexismus',
    'PORNOGRAPHIC': 'Pornografie | Voyeurismus',
    'ERP': 'ERP | Sex',
    'BODYSHAMING': 'Body-Shaming',
    'MISOGYNY': 'Misogynie',
    'MISANDRY': 'Misandrie',
    'HOMOPHOBE': 'Homophobie',
    'TRANSPHOBIA': 'Transphobie'
  } as {[key:string]: string}
