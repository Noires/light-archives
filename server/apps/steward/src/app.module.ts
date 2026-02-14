import { dbConfiguration } from "@app/configuration";
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { BotModule } from "./bot/bot.module";
import { WebhookModule } from "./webhook/webhook.module";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({ useFactory: () => dbConfiguration }),
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
