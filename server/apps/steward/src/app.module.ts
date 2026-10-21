import { dbConfiguration } from "@app/configuration";
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { BotModule } from "./bot/bot.module";
import { WebhookModule } from "./webhook/webhook.module";

@Module({
	imports: [
		// Only the main API synchronizes the shared schema; two apps altering it at
		// startup race each other (duplicate column / constraint errors).
		TypeOrmModule.forRootAsync({ useFactory: () => ({ ...dbConfiguration, synchronize: false }) }),
    SentryModule.forRoot(),
		BotModule,
		WebhookModule,
	],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule { }
