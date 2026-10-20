import { buildExcerpt, countWords, htmlToPlainText } from './plain-text';

describe('htmlToPlainText', () => {
  it('strips tags, decodes entities and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Ein&nbsp;Abend</p><p>in <b>Limsa</b> &amp; Ul\'dah</p>')).toBe('Ein Abend in Limsa & Ul\'dah');
  });

  it('keeps words of adjacent blocks apart', () => {
    expect(htmlToPlainText('<p>Ende</p><p>Anfang</p>')).toBe('Ende Anfang');
  });

  it.each([undefined, null, '', '<p><br></p>'])('returns an empty string for %p', (content) => {
    expect(htmlToPlainText(content)).toBe('');
  });
});

describe('buildExcerpt', () => {
  it('returns short text unchanged', () => {
    expect(buildExcerpt('<p>Kurz und gut.</p>', 240)).toBe('Kurz und gut.');
  });

  it('cuts at a word boundary and appends an ellipsis', () => {
    expect(buildExcerpt('<p>Eins zwei drei vier</p>', 12)).toBe('Eins zwei...');
  });

  it('hard-cuts a single long word', () => {
    expect(buildExcerpt('Donaudampfschifffahrt', 5)).toBe('Donau...');
  });
});

describe('countWords', () => {
  it('counts words in HTML content', () => {
    expect(countWords('<h2>Kapitel 1</h2><p>Es war&nbsp;einmal – ein Zwerg.</p>')).toBe(7);
  });

  it('counts umlauts and digits as words', () => {
    expect(countWords('Größe 12 Äpfel')).toBe(3);
  });

  it('returns zero for empty content', () => {
    expect(countWords('<p> </p>')).toBe(0);
    expect(countWords(null)).toBe(0);
  });
});
