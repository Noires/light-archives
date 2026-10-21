import { DiscordAPIError, GuildScheduledEventEntityType, GuildScheduledEventStatus, RESTJSONErrorCodes } from 'discord.js';
import { buildScheduledEventPayload, DEFAULT_EVENT_DURATION_MS, ScheduledEventSyncService } from './scheduled-event-sync.service';

// ts-jest hoists jest.mock above the imports.
jest.mock('@app/configuration', () => ({
	serverConfiguration: { frontendRoot: 'https://elpisgarten.test' },
	s3Configuration: { publicRootUrl: 'https://cdn.elpisgarten.test/' },
}));
jest.mock('@app/configuration/discord.config', () => ({
	discordConfiguration: { syncScheduledEvents: true, serverId: '1' },
}));

const FUTURE = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

function event(overrides: any = {}): any {
	return {
		id: 42,
		title: 'Mondnacht',
		details: '<p>Ein Abend&nbsp;voller <strong>Lieder</strong>.</p>',
		startDateTime: FUTURE,
		endDateTime: null,
		adultOnly: false,
		hidden: false,
		deletedAt: null,
		discordScheduledEventId: null,
		locations: [{ name: 'Rolanberry Moon', address: 'Lavendelbeete 10', server: { name: 'Shiva' } }],
		banner: Promise.resolve(null),
		discordBanner: Promise.resolve(null),
		...overrides,
	};
}

function unknownEvent(): DiscordAPIError {
	return new DiscordAPIError(
		{ code: RESTJSONErrorCodes.UnknownGuildScheduledEvent, message: 'Unknown Guild Scheduled Event' },
		RESTJSONErrorCodes.UnknownGuildScheduledEvent,
		404,
		'GET',
		'/guilds/1/scheduled-events/9',
		{},
	);
}

function setup(entity: any, existing?: { status: GuildScheduledEventStatus } | Error) {
	const scheduled = existing && !(existing instanceof Error)
		? { ...existing, edit: jest.fn(async () => undefined), setStatus: jest.fn(async () => undefined) }
		: null;
	const scheduledEvents = {
		create: jest.fn(async () => ({ id: '900' })),
		fetch: jest.fn(async () => {
			if (existing instanceof Error) {
				throw existing;
			}
			return scheduled;
		}),
	};
	const update: any = { update: jest.fn(() => update), set: jest.fn(() => update), where: jest.fn(() => update), execute: jest.fn(async () => undefined) };
	const repo = { findOne: jest.fn(async () => entity), createQueryBuilder: jest.fn(() => update) };
	const gateway = { guild: jest.fn(async () => ({ scheduledEvents })) };
	const service = new ScheduledEventSyncService(gateway as any, repo as any);
	return { service, scheduledEvents, scheduled, update };
}

describe('buildScheduledEventPayload', () => {
	it('creates an external guild event with location, plain-text description and a default end', () => {
		const payload = buildScheduledEventPayload(event(), null);
		expect(payload.entityType).toBe(GuildScheduledEventEntityType.External);
		expect(payload.entityMetadata).toEqual({ location: 'Rolanberry Moon, Lavendelbeete 10 (Shiva)' });
		expect((payload.scheduledEndTime as Date).getTime() - FUTURE.getTime()).toBe(DEFAULT_EVENT_DURATION_MS);
		expect(payload.description).toBe('https://elpisgarten.test/event/42\n\nEin Abend voller Lieder.');
	});

	it('marks 18+ events in the name and respects the 100 character limit', () => {
		const payload = buildScheduledEventPayload(event({ adultOnly: true, title: 'X'.repeat(200) }), null);
		expect(payload.name.startsWith('[18+] ')).toBe(true);
		expect(payload.name.length).toBeLessThanOrEqual(100);
	});
});

describe('ScheduledEventSyncService.sync', () => {
	it('creates the Discord event for a visible future event and stores its id', async () => {
		const { service, scheduledEvents, update } = setup(event());
		await service.sync(42);
		expect(scheduledEvents.create).toHaveBeenCalledTimes(1);
		expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ discordScheduledEventId: '900' }));
	});

	it('edits an existing scheduled Discord event', async () => {
		const { service, scheduled, scheduledEvents } = setup(event({ discordScheduledEventId: '9' }), { status: GuildScheduledEventStatus.Scheduled });
		await service.sync(42);
		expect(scheduled!.edit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mondnacht' }));
		expect(scheduledEvents.create).not.toHaveBeenCalled();
	});

	it.each([
		['deleted', { deletedAt: new Date() }],
		['hidden', { hidden: true }],
	])('cancels the Discord event when the site event is %s', async (_, changes) => {
		const { service, scheduled, update } = setup(event({ discordScheduledEventId: '9', ...changes }), { status: GuildScheduledEventStatus.Scheduled });
		await service.sync(42);
		expect(scheduled!.setStatus).toHaveBeenCalledWith(GuildScheduledEventStatus.Canceled);
		expect(update.set).toHaveBeenCalledWith(expect.objectContaining({ discordScheduledEventId: null }));
	});

	it('recreates the Discord event when it was removed on Discord', async () => {
		const { service, scheduledEvents } = setup(event({ discordScheduledEventId: '9' }), unknownEvent());
		await service.sync(42);
		expect(scheduledEvents.create).toHaveBeenCalledTimes(1);
	});

	it('does not create events that already started', async () => {
		const { service, scheduledEvents } = setup(event({ startDateTime: new Date(Date.now() - 60_000) }));
		await service.sync(42);
		expect(scheduledEvents.create).not.toHaveBeenCalled();
	});
});
