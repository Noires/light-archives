import { EventRegistrationKind } from '@app/shared/enums/event-registration-kind.enum';
import { FollowTargetType } from '@app/shared/dto/social/follow.dto';
import { NotificationsListener, splitStoryRecipients } from './notifications.listener';

type Followers = { [key: string]: number[] };

function setup(options: { followers?: Followers; story?: any; event?: any; character?: any } = {}) {
  const followers = options.followers || {};
  const notificationsService = {
    notify: jest.fn<Promise<void>, [number, any]>(async () => undefined),
    notifyMany: jest.fn<Promise<number[]>, [number[], any]>(async (ids) => ids),
  };
  const followsService = {
    getFollowerUserIds: jest.fn(async (type: FollowTargetType, keys: string[]) =>
      [...new Set(keys.flatMap((key) => followers[`${type}|${key}`] || []))]),
  };
  const storyRepo = { findOne: jest.fn(async () => options.story || null) };
  const eventRepo = { findOne: jest.fn(async () => options.event || null) };
  const characterRepo = { findOne: jest.fn(async () => options.character || null) };
  const listener = new NotificationsListener(
    notificationsService as any,
    followsService as any,
    storyRepo as any,
    eventRepo as any,
    characterRepo as any,
  );

  /** userIds per notification type */
  const recipients = (type: string): number[] => [
    ...notificationsService.notifyMany.mock.calls
      .filter(([, payload]: any) => payload.type === type)
      .flatMap(([ids]: any) => ids),
    ...notificationsService.notify.mock.calls
      .filter(([, payload]: any) => payload.type === type)
      .map(([id]: any) => id),
  ];

  return { listener, notificationsService, recipients };
}

describe('splitStoryRecipients', () => {
  it('prefers the series notification and excludes the actor', () => {
    expect(splitStoryRecipients([1, 2, 2, 9], [2, 3, 9, 4], [9])).toEqual({
      seriesPart: [1, 2],
      authorStory: [3, 4],
    });
  });
});

describe('NotificationsListener', () => {
  const author = { id: 50, name: 'Aerith Gainsborough', user: { id: 9 } };

  it('notifies series and author followers of a published story, but not the author', async () => {
    const { listener, recipients } = setup({
      story: { id: 7, title: 'Kapitel 2', seriesTitle: 'Die Reise', owner: author },
      followers: {
        'story-series|50:Die Reise': [1, 2, 9],
        'author|50': [2, 3, 9],
      },
    });

    await listener.onStoryPublished({ storyId: 7, actorUserId: 9 });

    expect(recipients('series-part')).toEqual([1, 2]);
    expect(recipients('author-story')).toEqual([3]);
  });

  it('only notifies author followers for a story without series', async () => {
    const { listener, recipients, notificationsService } = setup({
      story: { id: 8, title: 'Einzelstück', seriesTitle: null, owner: author },
      followers: { 'author|50': [3] },
    });

    await listener.onStoryPublished({ storyId: 8, actorUserId: 9 });

    expect(recipients('series-part')).toEqual([]);
    expect(recipients('author-story')).toEqual([3]);
    expect(notificationsService.notifyMany.mock.calls[0][1].link).toBe('/story/8');
  });

  it('does nothing for an unknown or unpublished story', async () => {
    const { listener, notificationsService } = setup({ story: null });
    await listener.onStoryPublished({ storyId: 1, actorUserId: 9 });
    expect(notificationsService.notifyMany).not.toHaveBeenCalled();
  });

  it('notifies venue followers once per user for a new event, excluding the creator', async () => {
    const { listener, recipients } = setup({
      event: {
        id: 30,
        title: 'Tanzabend',
        hidden: false,
        startDateTime: new Date('2026-10-20T18:00:00Z'),
        owner: { id: 51, user: { id: 9 } },
        locations: [
          { venue: { id: 4, name: 'Zur Goldenen Möwe' } },
          { venue: null },
          { venue: { id: 5, name: 'Mondschein' } },
        ],
      },
      followers: { 'venue|4': [1, 9], 'venue|5': [1, 2] },
    });

    await listener.onEventCreated({ eventId: 30, actorUserId: 9 });

    expect(recipients('venue-event')).toEqual([1, 2]);
  });

  it('skips hidden events', async () => {
    const { listener, notificationsService } = setup({
      event: { id: 31, hidden: true, locations: [{ venue: { id: 4, name: 'X' } }] },
      followers: { 'venue|4': [1] },
    });

    await listener.onEventCreated({ eventId: 31, actorUserId: 9 });

    expect(notificationsService.notifyMany).not.toHaveBeenCalled();
  });

  it('notifies the event owner about a registration by someone else', async () => {
    const { listener, recipients, notificationsService } = setup();

    await listener.onEventRegistrationCreated({
      eventId: 30, eventTitle: 'Tanzabend', ownerUserId: 9, characterName: 'Tifa', kind: EventRegistrationKind.GOING, actorUserId: 2,
    });

    expect(recipients('event-registration')).toEqual([9]);
    expect(notificationsService.notify.mock.calls[0][1].link).toBe('/event/30');
  });

  it('does not notify the owner about their own registration', async () => {
    const { listener, notificationsService } = setup();

    await listener.onEventRegistrationCreated({
      eventId: 30, eventTitle: 'Tanzabend', ownerUserId: 9, characterName: 'Aerith', kind: EventRegistrationKind.INTERESTED, actorUserId: 9,
    });
    await listener.onEventRegistrationCreated({
      eventId: 30, eventTitle: 'Extern', ownerUserId: null, characterName: 'Aerith', kind: EventRegistrationKind.GOING, actorUserId: 9,
    });

    expect(notificationsService.notify).not.toHaveBeenCalled();
  });

  it('resolves the tagged user from the character for image tags', async () => {
    const { listener, notificationsService } = setup({ character: { id: 50, name: 'Aerith', user: { id: 9 } } });

    await listener.onImageTagRequested({ taggedCharacterId: 50, imageId: 3, byCharacterName: 'Tifa' });

    expect(notificationsService.notify).toHaveBeenCalledWith(9, expect.objectContaining({ type: 'image-tag', link: '/meine-inhalte' }));
  });

  it('skips self-tags', async () => {
    const { listener, notificationsService } = setup({ character: { id: 50, name: 'Aerith', user: { id: 9 } } });

    await listener.onImageTagRequested({ taggedCharacterId: 50, imageId: 3, byCharacterName: 'Aerith', byUserId: 9 });

    expect(notificationsService.notify).not.toHaveBeenCalled();
  });

  it('swallows errors so the emitting request is unaffected', async () => {
    const { listener, notificationsService } = setup();
    notificationsService.notify.mockRejectedValueOnce(new Error('db down'));
    jest.spyOn((listener as any).logger, 'error').mockImplementation(() => undefined);

    await expect(listener.onEventRegistrationCreated({
      eventId: 1, eventTitle: 'X', ownerUserId: 9, characterName: 'Y', kind: EventRegistrationKind.GOING, actorUserId: 2,
    })).resolves.toBeUndefined();
  });
});
