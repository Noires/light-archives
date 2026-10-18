import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import {
  isValidAccentColor,
  normalizeAccentColor,
  normalizeFocusItems,
  normalizePlayStyleTags,
  validatePlayStyleTags,
} from '@app/shared/validation/profile-fields';

function fieldErrors(cls: new () => object, plain: object, field: string): string[] {
  const instance = plainToInstance(cls, plain);
  return validateSync(instance, { whitelist: true })
    .filter((error) => error.property === field)
    .flatMap((error) => [
      ...Object.values(error.constraints || {}),
      ...(error.children || []).flatMap((child) => (child.children || []).flatMap((c) => Object.values(c.constraints || {}))),
    ]);
}

describe('accent colour', () => {
  it.each(['#a1b2c3', '#FFFFFF', '#000000'])('accepts %p', (value) => {
    expect(isValidAccentColor(value)).toBe(true);
  });

  it.each(['a1b2c3', '#fff', '#a1b2c3d4', '#ggg000', 'red', '', null])('rejects %p', (value) => {
    expect(isValidAccentColor(value)).toBe(false);
  });

  it('normalises to lower case and clears empty values', () => {
    expect(normalizeAccentColor(' #A1B2C3 ')).toBe('#a1b2c3');
    expect(normalizeAccentColor('')).toBeNull();
    expect(normalizeAccentColor(null)).toBeNull();
    expect(() => normalizeAccentColor('#abc')).toThrow();
  });

  it('is validated on the profile DTO, empty and null allowed', () => {
    expect(fieldErrors(CharacterProfileDto, { accentColor: '#12abEF' }, 'accentColor')).toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { accentColor: null }, 'accentColor')).toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { accentColor: '' }, 'accentColor')).toEqual([]);
    expect(fieldErrors(CharacterProfileDto, {}, 'accentColor')).toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { accentColor: 'blue' }, 'accentColor')).not.toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { accentColor: '#12345' }, 'accentColor')).not.toEqual([]);
  });
});

describe('play-style tags', () => {
  it('accepts up to 6 tags of up to 24 characters', () => {
    const tags = ['Slice of Life', 'Abenteuer', 'Intrige', 'Romanze', 'Kampf', 'x'.repeat(24)];
    expect(validatePlayStyleTags(tags)).toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { playStyleTags: tags }, 'playStyleTags')).toEqual([]);
  });

  it('rejects more than 6 tags or tags longer than 24 characters', () => {
    expect(validatePlayStyleTags(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).not.toEqual([]);
    expect(validatePlayStyleTags(['x'.repeat(25)])).not.toEqual([]);
    expect(validatePlayStyleTags('Abenteuer')).not.toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { playStyleTags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }, 'playStyleTags')).not.toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { playStyleTags: ['x'.repeat(25)] }, 'playStyleTags')).not.toEqual([]);
    expect(fieldErrors(CharacterProfileDto, { playStyleTags: [3] }, 'playStyleTags')).not.toEqual([]);
  });

  it('normalises: trims, drops empties and case-insensitive duplicates', () => {
    expect(normalizePlayStyleTags(['  Abenteuer ', 'abenteuer', '', 'Slice  of Life'])).toEqual(['Abenteuer', 'Slice of Life']);
    expect(normalizePlayStyleTags([' '])).toBeNull();
    expect(normalizePlayStyleTags(null)).toBeNull();
  });
});

describe('focus items', () => {
  it('validates nested items and the item count on the FC DTO', () => {
    const item = { icon: 'swords', title: 'Raids', text: 'Dienstags Savage' };
    expect(fieldErrors(FreeCompanyDto, { focusItems: [item] }, 'focusItems')).toEqual([]);
    expect(fieldErrors(FreeCompanyDto, { focusItems: Array(7).fill(item) }, 'focusItems')).not.toEqual([]);
    expect(fieldErrors(FreeCompanyDto, { focusItems: [{ ...item, title: 'x'.repeat(61) }] }, 'focusItems')).not.toEqual([]);
    expect(fieldErrors(FreeCompanyDto, { focusItems: [{ icon: 'x' }] }, 'focusItems')).not.toEqual([]);
  });

  it('normalises: trims, drops untitled items, empty becomes null', () => {
    expect(normalizeFocusItems([
      { icon: ' swords ', title: ' Raids ', text: ' Di ' },
      { icon: 'x', title: '  ', text: 'ohne Titel' },
    ])).toEqual([{ icon: 'swords', title: 'Raids', text: 'Di' }]);
    expect(normalizeFocusItems([])).toBeNull();
  });
});
