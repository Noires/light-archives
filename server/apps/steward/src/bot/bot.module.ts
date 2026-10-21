import { redisConfiguration } from "@app/configuration";
import { discordConfiguration } from "@app/configuration/discord.config";
import { Event, EventAnnouncement, EventLocation, NoticeboardItem } from "@app/entity";
import { ModalFieldsTransformPipe, ValidationPipe } from "@discord-nestjs/common";
import { DiscordModule } from "@discord-nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnnouncementService } from "./announcement.service";
import { BotGateway } from "./bot.gateway";
import { REMINDER_QUEUE, ReminderSchedulerService } from "./reminder-scheduler.service";
import { ReminderProcessor } from "./reminder.processor";
import { ScheduledEventSyncService } from "./scheduled-event-sync.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([ Event, EventAnnouncement, EventLocation, NoticeboardItem ]),
		DiscordModule.forRootAsync({
			useFactory: () => ({
				token: discordConfiguration.botToken,
				commandPrefix: '!',
				usePipes: [ModalFieldsTransformPipe, ValidationPipe],
				discordClientOptions: {
					intents: ['Guilds', 'GuildMessages'],
				}
			})
		}),
		// Reminder jobs live in Redis, so they survive restarts.
		BullModule.forRoot({
			connection: { host: redisConfiguration.host, port: redisConfiguration.port },
		}),
		BullModule.registerQueue({
			name: REMINDER_QUEUE,
			defaultJobOptions: {
				attempts: 3,
				backoff: { type: 'exponential', delay: 30000 },
				removeOnComplete: true,
				removeOnFail: 50,
			},
		}),
	],
	providers: [ AnnouncementService, BotGateway, ReminderSchedulerService, ReminderProcessor, ScheduledEventSyncService ],
	exports: [ AnnouncementService ],
})
export class BotModule { }
