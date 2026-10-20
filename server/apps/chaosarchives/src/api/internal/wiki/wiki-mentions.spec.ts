import { buildWikiMentionLikePatterns, contentMentionsWikiTitle, normalizeWikiTitle } from './wiki-mentions';

describe('normalizeWikiTitle', () => {
  it('treats underscores, whitespace runs and case alike', () => {
    expect(normalizeWikiTitle('  Haus_der  Sterne ')).toBe('haus der sterne');
    expect(normalizeWikiTitle('Nymeia&#39;s Raben')).toBe("nymeia's raben");
  });
});

describe('contentMentionsWikiTitle', () => {
  const title = 'Haus der Sterne';

  it.each([
    '<p>Siehe [[Haus der Sterne]].</p>',
    '<p>Siehe [[haus der sterne|das Haus]].</p>',
    '<p>Siehe [[ Haus der<br>Sterne ]].</p>',
    '<p>Siehe &#91;&#91;Haus der Sterne&#93;&#93;.</p>',
    '<p>Siehe <a href="/link/Haus_der_Sterne">hier</a>.</p>',
    '<p>Siehe <a href="https://elpisgarten.de/link/Haus%20der%20Sterne">hier</a>.</p>',
    'Plain text /link/haus_der_sterne end',
    '<p><a href="/link/Haus_der_Sterne#geschichte">Abschnitt</a></p>',
  ])('finds the mention in %p', (content) => {
    expect(contentMentionsWikiTitle(content, title)).toBe(true);
  });

  it.each([
    '',
    '<p>Das Haus der Sterne ohne Link.</p>',
    '<p>[[Haus der Sterne II]]</p>',
    '<p>[[Das Haus|Haus der Sterne]]</p>',
    '<p><a href="/link/Haus_der_Sterne_II">x</a></p>',
    '<p>[[Haus der Sterne</p>',
  ])('ignores %p', (content) => {
    expect(contentMentionsWikiTitle(content, title)).toBe(false);
  });

  it('matches titles with apostrophes in both link forms', () => {
    expect(contentMentionsWikiTitle('<p>[[Nymeia&#39;s Raben]]</p>', "Nymeia's Raben")).toBe(true);
    expect(contentMentionsWikiTitle(`<a href="/link/${encodeURIComponent("Nymeia's_Raben")}">x</a>`, "Nymeia's Raben")).toBe(true);
  });

  it('accepts the wikified title as input', () => {
    expect(contentMentionsWikiTitle('[[Haus der Sterne]]', 'Haus_der_Sterne')).toBe(true);
  });

  it('handles null content', () => {
    expect(contentMentionsWikiTitle(null, title)).toBe(false);
  });
});

describe('buildWikiMentionLikePatterns', () => {
  it('covers plain, wikified and encoded forms and escapes LIKE wildcards', () => {
    const patterns = buildWikiMentionLikePatterns('100% Haus');
    expect(patterns).toContain(String.raw`%100\% Haus%`);
    expect(patterns).toContain(String.raw`%100\%\_Haus%`);
    expect(patterns).toContain(String.raw`%100\%25\_Haus%`);
  });

  it('returns nothing for an empty title', () => {
    expect(buildWikiMentionLikePatterns('   ')).toEqual([]);
  });
});
