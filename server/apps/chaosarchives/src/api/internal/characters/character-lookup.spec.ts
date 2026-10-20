import { lookupKey, normalizeLookupName, pickLookupMatch, profileLink } from './character-lookup';

describe('normalizeLookupName', () => {
  it.each([
    ['Hans Wurst', 'Hans Wurst'],
    ['  Hans   Wurst ', 'Hans Wurst'],
    ['Hans_Wurst', 'Hans Wurst'],
    ['[[Hans Wurst]]', 'Hans Wurst'],
    ['[[Hans Wurst|der Hans]]', 'Hans Wurst'],
    ['Hans Wurst|der Hans', 'Hans Wurst'],
    ["[[Y'shtola Rhul]]", "Y'shtola Rhul"],
    ['', ''],
  ])('%p -> %p', (input, expected) => {
    expect(normalizeLookupName(input)).toBe(expected);
  });

  it('handles null', () => {
    expect(normalizeLookupName(null)).toBe('');
  });

  it('keys ignore case and include the optional server', () => {
    expect(lookupKey('Hans Wurst')).toBe(lookupKey('hans wurst'));
    expect(lookupKey('Hans Wurst', 'Alpha')).toBe(lookupKey('HANS WURST', ' alpha '));
    expect(lookupKey('Hans Wurst', 'Alpha')).not.toBe(lookupKey('Hans Wurst'));
  });
});

describe('pickLookupMatch', () => {
  const candidates = [
    { name: 'Hans Wurst', server: 'Phoenix' },
    { name: 'Hans Wurst', server: 'Alpha' },
    { name: 'Erika Muster', server: 'Alpha' },
  ];

  it('matches names case-insensitively and prefers the first candidate', () => {
    expect(pickLookupMatch(candidates, 'hans wurst')).toEqual(candidates[0]);
  });

  it('respects the requested server, case-insensitively', () => {
    expect(pickLookupMatch(candidates, 'Hans Wurst', 'alpha')).toEqual(candidates[1]);
    expect(pickLookupMatch(candidates, 'Erika Muster', 'Phoenix')).toBeNull();
  });

  it('builds the profile link with underscores', () => {
    expect(profileLink('Hans Wurst', 'Alpha')).toBe('/Alpha/Hans_Wurst');
  });
});
