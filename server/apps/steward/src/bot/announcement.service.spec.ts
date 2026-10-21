import { AnnouncementService } from './announcement.service';

// ts-jest hoists jest.mock above the imports.
jest.mock('@app/configuration', () => ({
	serverConfiguration: { frontendRoot: 'https://elpisgarten.test' },
	s3Configuration: { publicRootUrl: 'https://cdn.elpisgarten.test/' },
}));
jest.mock('@app/configuration/discord.config', () => ({
	discordConfiguration: { syncScheduledEvents: true, serverId: '1', announcementChannel: '100', noticeboardChannel: '200' },
}));

function announcement(overrides: any = {}): any {
	return {
		id: 7,
		minutesBefore: 60,
		content: 'Kommt vorbei @everyone',
		discordChannelId: null,
		discordMessageId: null,
		deletedAt: null,
		event: {
			id: 42,
			title: 'Mondnacht',
			startDateTime: new Date(Date.now() + 3_600_000),
			endDateTime: null,
			hidden: false,
			deletedAt: null,
			contentNotes: [],
			locations: [],
			links: [],
			icon: Promise.resolve(null),
			banner: Promise.resolve(null),
			discordBanner: Promise.resolve(null),
		},
		...overrides,
	};
}

function setup(row: any) {
	const gateway = {
		announcementChannelId: '100',
		noticeboardChannelId: '200',
		guild: jest.fn(async () => ({ members: { search: jest.fn(async () => []) }, roles: { fetch: jest.fn(async () => []) } })),
		send: jest.fn(async () => ({ channelId: '100', messageId: '555' })),
		edit: jest.fn(async () => undefined),
		delete: jest.fn(async () => undefined),
	};
	const announcementRepo = {
		findOne: jest.fn(async () => row),
		find: jest.fn(async () => (row ? [row] : [])),
		update: jest.fn(async () => undefined),
	};
	const scheduler = { reconcile: jest.fn(async () => undefined) };
	const sync = { sync: jest.fn(async () => undefined) };
	const service = new AnnouncementService(gateway as any, scheduler as any, sync as any, announcementRepo as any, {} as any);
	return { service, gateway, announcementRepo };
}

describe('AnnouncementService.postReminder', () => {
	it('posts once, never pings @everyone and stores the Discord ids', async () => {
		const { service, gateway, announcementRepo } = setup(announcement());
		await service.postReminder(7);

		expect(gateway.send).toHaveBeenCalledTimes(1);
		const [channelId, message] = (gateway.send.mock.calls[0] as unknown) as [string, any];
		expect(channelId).toBe('100');
		expect(message.allowedMentions).toEqual({ parse: [], users: [], roles: [] });
		expect(announcementRepo.update).toHaveBeenCalledWith(7, expect.objectContaining({ discordChannelId: '100', discordMessageId: '555' }));
	});

	it.each([
		['already posted', () => announcement({ discordMessageId: '1' })],
		['hidden event', () => announcement({ event: { ...announcement().event, hidden: true } })],
		['missing announcement', () => null],
	])('skips the reminder (%s)', async (_, row) => {
		const { service, gateway } = setup(row());
		await service.postReminder(7);
		expect(gateway.send).not.toHaveBeenCalled();
	});

	it('rethrows send errors so the queue retries the job', async () => {
		const { service, gateway } = setup(announcement());
		gateway.send.mockRejectedValueOnce(new Error('Discord down'));
		await expect(service.postReminder(7)).rejects.toThrow('Discord down');
	});
});

describe('AnnouncementService.refresh', () => {
	it('edits posted reminders of a deleted event into the cancelled state', async () => {
		const posted = announcement({ discordChannelId: '100', discordMessageId: '555', event: { ...announcement().event, deletedAt: new Date() } });
		const { service, gateway } = setup(posted);
		await service.refresh(42);

		expect(gateway.edit).toHaveBeenCalledTimes(1);
		const [, , message] = (gateway.edit.mock.calls[0] as unknown) as [string, string, any];
		expect(JSON.stringify(message.components.map((c: any) => c.toJSON()))).toContain('Abgesagt');
		expect(message.allowedMentions).toEqual({ parse: [], users: [], roles: [] });
	});
});
