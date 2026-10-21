import { discordConfiguration } from '@app/configuration/discord.config';
import { DiscordClientProvider, Once } from '@discord-nestjs/core';
import { Injectable, Logger } from '@nestjs/common';
import { DiscordAPIError, Guild, MessageCreateOptions, MessageEditOptions, RESTJSONErrorCodes, SendableChannels } from 'discord.js';

export interface PostedMessage {
	channelId: string;
	messageId: string;
}

/** True for Discord's "Unknown Message" / "Unknown Guild Scheduled Event" style errors. */
export function isUnknownDiscordObject(error: unknown, code: RESTJSONErrorCodes): boolean {
	return error instanceof DiscordAPIError && error.code === code;
}

// Discord access for Steward: send, edit and delete messages by id (no message
// cache needed, so this works after restarts) and the configured guild.
@Injectable()
export class BotGateway {
	private readonly logger = new Logger(BotGateway.name);

	private ready = false;

	constructor(private readonly discordProvider: DiscordClientProvider) {}

	@Once('ready')
	async onReady(): Promise<void> {
		const client = this.discordProvider.getClient();
		this.logger.log(`Logged in as ${client.user!.tag}`);
		this.ready = true;
	}

	get announcementChannelId(): string {
		return discordConfiguration.announcementChannel;
	}

	get noticeboardChannelId(): string {
		return discordConfiguration.noticeboardChannel;
	}

	async guild(): Promise<Guild> {
		this.assertReady();
		return this.discordProvider.getClient().guilds.fetch(discordConfiguration.serverId);
	}

	async send(channelId: string, message: MessageCreateOptions): Promise<PostedMessage> {
		const channel = await this.sendableChannel(channelId);
		const sent = await channel.send(message);
		return { channelId: sent.channelId, messageId: sent.id };
	}

	async edit(channelId: string, messageId: string, message: MessageEditOptions): Promise<void> {
		const channel = await this.sendableChannel(channelId);
		await channel.messages.edit(messageId, message);
	}

	async delete(channelId: string, messageId: string): Promise<void> {
		const channel = await this.sendableChannel(channelId);
		await channel.messages.delete(messageId);
	}

	private assertReady(): void {
		if (!this.ready) {
			throw new Error('Discord bot still initializing');
		}
	}

	private async sendableChannel(channelId: string): Promise<SendableChannels> {
		this.assertReady();
		const channel = await this.discordProvider.getClient().channels.fetch(channelId);

		if (!channel) {
			throw new Error(`Channel ${channelId} not found`);
		}

		if (!channel.isSendable()) {
			throw new Error(`Cannot send messages to channel ${channelId}`);
		}

		return channel;
	}
}
