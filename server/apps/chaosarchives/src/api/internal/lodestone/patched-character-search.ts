import { CharacterSearch } from '@xivapi/nodestone';
import { type Request } from 'express';

export class PatchedCharacterSearch extends CharacterSearch {
  protected getBaseURL(req: Request): string {
    const reqQuery = req.query as Record<string, string>;

    let query = `?q=${reqQuery.name}`;
    if (req.query.dc) {
      query += `&worldname=_dc_${reqQuery.dc}`;
    } else if (req.query.server) {
      query += `&worldname=${reqQuery.server}`;
    } else {
      query += '&worldname=';
    }

    return `https://de.finalfantasyxiv.com/lodestone/character/${query}`;
  }
}