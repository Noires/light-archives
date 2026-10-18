import { excludeTestContentSql, isTestContent } from './test-content.filter';

describe('isTestContent', () => {
  const body = '<p>Ein echter Absatz.</p>';

  it.each(['Test', 'test', 'TEST', '  Test  '])('flags the title %p', (title) => {
    expect(isTestContent({ title, content: body })).toBe(true);
  });

  it.each(['Testament', 'Der Test der Zeit', 'Test 2', 'Tests', 'I'])('keeps the title %p', (title) => {
    expect(isTestContent({ title, content: body })).toBe(false);
  });

  it.each([undefined, null, '', '   ', '<p></p>', '<p>&nbsp;</p>', '<p><br></p>', '<div>\n  <br />\n</div>'])(
    'flags the empty body %p',
    (content) => {
      expect(isTestContent({ title: 'Ein Abend in Limsa', content })).toBe(true);
    },
  );

  it('keeps a body with text inside markup', () => {
    expect(isTestContent({ title: 'Ein Abend in Limsa', content: '<p><strong>Hallo</strong></p>' })).toBe(false);
  });

  it('accepts a plain-text excerpt as the body', () => {
    expect(isTestContent({ title: 'Ein Abend in Limsa', content: 'Hallo Welt' })).toBe(false);
    expect(isTestContent({ title: 'Ein Abend in Limsa', content: '' })).toBe(true);
  });
});

describe('excludeTestContentSql', () => {
  it('builds a condition on the given alias', () => {
    const sql = excludeTestContentSql('story');
    expect(sql).toContain("LOWER(TRIM(story.title)) <> 'test'");
    expect(sql).toContain('COALESCE(story.content');
  });
});
