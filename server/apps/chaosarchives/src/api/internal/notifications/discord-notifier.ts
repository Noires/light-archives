import { Injectable, Logger } from '@nestjs/common';

export interface DiscordDirectMessage {
  title: string;
  body?: string | null;
  /** absolute URL */
  url?: string | null;
}

/**
 * ER2 social: sends a Discord DM to a user who opted in (NotificationPreference.discordDm).
 * Only ever called for users with `discordDm === true`.
 */
export interface DiscordNotifier {
  sendDirectMessage(discordUserId: string, message: DiscordDirectMessage): Promise<void>;
}

export const DISCORD_NOTIFIER = Symbol('DISCORD_NOTIFIER');

/**
 * TODO(ER2 social): no DM channel to the steward bot exists yet. Steward only exposes
 * `POST /event` and `POST /noticeboard` webhooks (serverConfiguration.stewardWebhookUrl) and its
 * Discord client is configured for guild messages only. A real implementation would add a
 * `POST /dm { discordUserId, title, body, url }` webhook in steward (client.users.fetch(id).send(...))
 * and an HTTP notifier here that posts to it. Until then DMs are a no-op.
 */
@Injectable()
export class NoopDiscordNotifier implements DiscordNotifier {
  private readonly logger = new Logger(NoopDiscordNotifier.name);

  async sendDirectMessage(discordUserId: string, message: DiscordDirectMessage): Promise<void> {
    this.logger.debug(`Discord DM not implemented, skipped: ${message.title}`);
  }
}
