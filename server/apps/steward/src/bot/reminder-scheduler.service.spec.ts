import { ReminderSchedulerService, reminderJobId } from './reminder-scheduler.service';

function job(id: string, data: any, state = 'delayed') {
	return {
		id,
		data,
		state,
		getState: jest.fn(async () => state),
		changeDelay: jest.fn(async () => undefined),
		remove: jest.fn(async () => undefined),
	};
}

function setup(announcements: Array<{ id: number; eventId: number; inMs: number }>, jobs: ReturnType<typeof job>[] = []) {
	const now = Date.now();
	const rows = announcements.map((a) => ({ id: a.id, postAt: new Date(now + a.inMs), event: { id: a.eventId } }));
	const query: any = {
		innerJoin: jest.fn(() => query),
		select: jest.fn(() => query),
		where: jest.fn(() => query),
		andWhere: jest.fn(() => query),
		getMany: jest.fn(async () => rows),
	};
	const repo = { createQueryBuilder: jest.fn(() => query) };
	const queue = {
		getDelayed: jest.fn(async () => jobs.filter((j) => j.state === 'delayed')),
		getJob: jest.fn(async (id: string) => jobs.find((j) => j.id === id) || null),
		add: jest.fn(async () => undefined),
	};
	const service = new ReminderSchedulerService(queue as any, repo as any);
	return { service, queue, query };
}

describe('ReminderSchedulerService.reconcile', () => {
	it('adds a delayed job per future announcement with a stable job id', async () => {
		const { service, queue } = setup([{ id: 5, eventId: 1, inMs: 60_000 }]);
		await service.reconcile(1);

		expect(queue.add).toHaveBeenCalledTimes(1);
		const [name, data, options] = (queue.add.mock.calls[0] as unknown) as [string, any, any];
		expect(name).toBe('reminder');
		expect(data).toEqual({ announcementId: 5, eventId: 1 });
		expect(options.jobId).toBe(reminderJobId(5));
		expect(options.delay).toBeGreaterThan(55_000);
		expect(options.delay).toBeLessThanOrEqual(60_000);
	});

	it('reschedules an existing delayed job instead of adding a duplicate', async () => {
		const existing = job(reminderJobId(5), { announcementId: 5, eventId: 1 });
		const { service, queue } = setup([{ id: 5, eventId: 1, inMs: 120_000 }], [existing]);
		await service.reconcile(1);

		expect(existing.changeDelay).toHaveBeenCalledTimes(1);
		expect(queue.add).not.toHaveBeenCalled();
	});

	it('removes delayed jobs of the event that are no longer wanted, but not other events', async () => {
		const stale = job(reminderJobId(6), { announcementId: 6, eventId: 1 });
		const other = job(reminderJobId(7), { announcementId: 7, eventId: 2 });
		const { service } = setup([], [stale, other]);
		await service.reconcile(1);

		expect(stale.remove).toHaveBeenCalled();
		expect(other.remove).not.toHaveBeenCalled();
	});

	it('replaces a finished job with the same id', async () => {
		const done = job(reminderJobId(5), { announcementId: 5, eventId: 1 }, 'completed');
		const { service, queue } = setup([{ id: 5, eventId: 1, inMs: 60_000 }], [done]);
		await service.reconcile(1);

		expect(done.remove).toHaveBeenCalled();
		expect(queue.add).toHaveBeenCalledTimes(1);
	});

	it('only schedules visible events (hidden filter in the query)', async () => {
		const { service, query } = setup([]);
		await service.reconcile();
		expect(query.andWhere).toHaveBeenCalledWith('event.hidden = :hidden', { hidden: false });
	});
});
