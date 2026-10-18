import { EditPermission } from '@app/shared/enums/edit-permission.enum';
import {
  buildRevisionFields,
  canEditWikiPage,
  normalizeChangeNote,
  pickEditorCharacterId,
  restoreChangeNote,
  revisionSize,
  wikiTitleVariants,
} from './wiki-revisions';

const user = { characters: [{ id: 3 }, { id: 7 }] };

describe('canEditWikiPage', () => {
  it('lets only the owner account edit pages restricted to the owner', () => {
    expect(canEditWikiPage(EditPermission.ME, 7, user)).toBe(true);
    expect(canEditWikiPage(EditPermission.ME, 9, user)).toBe(false);
  });

  it('lets anyone (trusted) edit open pages', () => {
    const open = Object.values(EditPermission).find((p) => p !== EditPermission.ME) as EditPermission;
    expect(canEditWikiPage(open, 9, user)).toBe(true);
  });
});

describe('pickEditorCharacterId', () => {
  it('prefers the requested character when it is the user\'s', () => {
    expect(pickEditorCharacterId(user, 3, 7)).toBe(7);
  });

  it('ignores a requested character of someone else', () => {
    expect(pickEditorCharacterId(user, 3, 99)).toBe(3);
  });

  it('falls back to the owner, then the first character', () => {
    expect(pickEditorCharacterId(user, 7)).toBe(7);
    expect(pickEditorCharacterId(user, 42)).toBe(3);
    expect(pickEditorCharacterId({ characters: [] }, 42)).toBeNull();
  });
});

describe('change notes', () => {
  it('trims, collapses whitespace and nulls empty notes', () => {
    expect(normalizeChangeNote('  Tippfehler \n behoben ')).toBe('Tippfehler behoben');
    expect(normalizeChangeNote('   ')).toBeNull();
    expect(normalizeChangeNote(undefined)).toBeNull();
  });

  it('cuts notes to 200 characters', () => {
    expect(normalizeChangeNote('x'.repeat(250))).toHaveLength(200);
  });

  it('gives restores a default note', () => {
    expect(restoreChangeNote(12)).toBe('Version #12 wiederhergestellt');
    expect(restoreChangeNote(12, 'Vandalismus rückgängig')).toBe('Vandalismus rückgängig');
  });
});

describe('buildRevisionFields', () => {
  it('snapshots title and content of the saved page with the editor', () => {
    const page = { id: 5, title: 'Haus der Sterne', content: '<p>Text</p>' };
    expect(buildRevisionFields(page, 3, ' Erste Fassung ')).toEqual({
      wikiPage: { id: 5 },
      title: 'Haus der Sterne',
      content: '<p>Text</p>',
      editor: { id: 3 },
      changeNote: 'Erste Fassung',
    });
  });

  it('restoring a revision snapshots the restored state, not the previous one', () => {
    const page = { id: 5, title: 'Neu', content: 'kaputt' };
    const revision = { id: 2, title: 'Alt', content: 'gut' };
    Object.assign(page, { title: revision.title, content: revision.content });
    const fields = buildRevisionFields(page, 7, restoreChangeNote(revision.id));
    expect(fields.title).toBe('Alt');
    expect(fields.content).toBe('gut');
    expect(fields.changeNote).toBe('Version #2 wiederhergestellt');
  });
});

describe('revisionSize', () => {
  it('counts UTF-8 bytes', () => {
    expect(revisionSize('abc')).toBe(3);
    expect(revisionSize('ä')).toBe(2);
    expect(revisionSize(null)).toBe(0);
  });
});

describe('wikiTitleVariants', () => {
  it('accepts wikified titles', () => {
    expect(wikiTitleVariants('Haus_der_Sterne')).toEqual(['Haus_der_Sterne', 'Haus der Sterne']);
    expect(wikiTitleVariants('Haus')).toEqual(['Haus']);
    expect(wikiTitleVariants('  ')).toEqual([]);
  });
});
