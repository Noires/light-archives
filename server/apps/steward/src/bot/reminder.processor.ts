import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnnouncementService } from './announcement.service';
import { REMINDER_QUEUE, ReminderJobData } from './reminder-scheduler.service';

// Posts a due event reminder. Errors propagate so BullMQ retries the job
// (attempts/backoff are set on the queue); posting itself is idempotent.
@Processor(REMINDER_QUEUE)
export class ReminderProcessor extends WorkerHost {
	constructor(private readonly announcementService: AnnouncementService) {
		super();
	}

	async process(job: Job<ReminderJobData>): Promise<void> {
		await this.announcementService.postReminder(job.data.announcementId);
	}
}
