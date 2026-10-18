import {
  characterInfo,
  eventInfo,
  groupTargetIds,
  storyInfo,
  toBookmarkDto,
  venueInfo,
} from './bookmark-mapping';

const imageUrl = (path: string) => `https://cdn.example/${path}`;
const createdAt = new Date('2026-10-01T12:00:00Z');

describe('bookmark enrichment mapping', () => {
  it('groups target ids per type without duplicates', () => {
    const groups = groupTargetIds([
      { targetType: 'venue', targetId: 1, createdAt },
      { targetType: 'story', targetId: 5, createdAt },
      { targetType: 'venue', targetId: 2, createdAt },
      { targetType: 'venue', targetId: 1, createdAt },
    ]);

    expect(groups.get('venue')).toEqual([1, 2]);
    expect(groups.get('story')).toEqual([5]);
    expect(groups.has('event')).toBe(false);
  });

  it('maps a venue with banner thumbnail', () => {
    expect(venueInfo({ id: 4, name: 'Zur Goldenen Möwe', serverName: 'Phoenix', imageOwnerId: 7, imageHash: 'abc', imageFilename: 'b.jpg' }, imageUrl))
      .toEqual({ title: 'Zur Goldenen Möwe', subtitle: 'Phoenix', link: '/venue/4', imageUrl: 'https://cdn.example/7/abc/thumb_b.jpg' });
    expect(venueInfo({ id: 4, name: 'X', serverName: null, imageOwnerId: null, imageHash: null, imageFilename: null }, imageUrl).imageUrl)
      .toBeNull();
  });

  it('maps a character to its profile route and respects showAvatar', () => {
    const info = characterInfo({ id: 1, name: 'Aerith Gainsborough', serverName: 'Odin', avatar: 'https://img/a.jpg', showAvatar: 1 });
    expect(info).toEqual({ title: 'Aerith Gainsborough', subtitle: 'Odin', link: '/Odin/Aerith_Gainsborough', imageUrl: 'https://img/a.jpg' });
    expect(characterInfo({ id: 1, name: 'A', serverName: 'Odin', avatar: 'https://img/a.jpg', showAvatar: 0 }).imageUrl).toBeNull();
  });

  it('maps events with Berlin start time and drops hidden ones', () => {
    const row = { id: 9, title: 'Tanzabend', startDateTime: '2026-10-20T18:00:00.000Z', hidden: 0, imageOwnerId: null, imageHash: null, imageFilename: null };
    expect(eventInfo(row, imageUrl)).toEqual({ title: 'Tanzabend', subtitle: '20.10.2026, 20:00 Uhr', link: '/event/9', imageUrl: null });
    expect(eventInfo({ ...row, hidden: 1 }, imageUrl)).toBeNull();
  });

  it('maps published stories and drops drafts', () => {
    expect(storyInfo({ id: 3, title: 'Kapitel 1', published: 1, authorName: 'Tifa' }))
      .toEqual({ title: 'Kapitel 1', subtitle: 'Tifa', link: '/story/3', imageUrl: null });
    expect(storyInfo({ id: 3, title: 'Entwurf', published: false, authorName: 'Tifa' })).toBeNull();
  });

  it('builds the dto, marking missing targets unavailable', () => {
    const bookmark = { targetType: 'story' as const, targetId: 3, createdAt };

    expect(toBookmarkDto(bookmark, { title: 'T', subtitle: null, link: '/story/3', imageUrl: null })).toEqual({
      targetType: 'story', targetId: 3, createdAt: createdAt.getTime(), available: true, title: 'T', subtitle: null, link: '/story/3', imageUrl: null,
    });
    expect(toBookmarkDto(bookmark, undefined)).toMatchObject({ available: false, title: null, link: null });
  });
});
