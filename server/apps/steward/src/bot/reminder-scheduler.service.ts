import { EventAnnouncement } from '@app/entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';

export const REMINDER_QUEUE = 'steward-reminders';

export interface ReminderJobData {
	announcementId: number;
	eventId: number;
}

export function reminderJobId(announcementId: number): string {
	return `reminder-${announcementId}`;
}

// Event reminders as BullMQ delayed jobs in Redis, so they survive Steward
// restarts. reconcile() makes the queue match the database: one delayed job
// per future announcement of a visible event, rescheduled when the time
// moves, removed when the announcement or event disappears. Idempotent.
@Injectable()
export class ReminderSchedulerService {
	private readonly logger = new Logger(ReminderSchedulerService.name);

	constructor(
		@InjectQueue(REMINDER_QUEUE) private readonly queue: Queue<ReminderJobData>,
		@InjectRepository(EventAnnouncement) private readonly announcementRepo: Repository<EventAnnouncement>,
	) {}

	async reconcile(eventId?: number): Promise<void> {
		const now = Date.now();
		const query = this.announcementRepo.createQueryBuilder('ea')
			.innerJoin('ea.event', 'event')
			.select(['ea.id', 'ea.postAt', 'event.id'])
			.where('ea.postAt > :now', { now: new Date(now) })
			.andWhere('event.hidden = :hidden', { hidden: false });

		if (eventId !== undefined) {
			query.andWhere('event.id = :eventId', { eventId });
		}

		const announcements = await query.getMany();
		const wanted = new Map<string, { data: ReminderJobData; delay: number }>();

		for (const announcement of announcements) {
			wanted.set(reminderJobId(announcement.id), {
				data: { announcementId: announcement.id, eventId: announcement.event.id },
				delay: Math.max(0, announcement.postAt.getTime() - now),
			});
		}

		// Drop delayed jobs that are no longer wanted (deleted, hidden or moved into the past).
		const stale = (await this.queue.getDelayed())
			.filter((job) => job.id && (eventId === undefined || job.data?.eventId === eventId) && !wanted.has(job.id));
		await Promise.all(stale.map((job) => job.remove()));

		await Promise.all(Array.from(wanted).map(([jobId, { data, delay }]) => this.schedule(jobId, data, delay)));

		this.logger.log(`Reminder jobs reconciled for ${eventId !== undefined ? `event ${eventId}` : 'all events'} (${wanted.size} scheduled)`);
	}

	private async schedule(jobId: string, data: ReminderJobData, delay: number): Promise<void> {
		const existing = await this.queue.getJob(jobId);

		if (existing) {
			const state = await existing.getState();
			if (state === 'delayed') {
				await existing.changeDelay(delay);
				return;
			}
			if (state === 'active' || state === 'waiting' || state === 'prioritized') {
				return;
			}
			// completed/failed jobs keep their id; replace them with a fresh one.
			await existing.remove();
		}

		await this.queue.add('reminder', data, { jobId, delay });
	}
}
