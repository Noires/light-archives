export interface DiscordConfigInterface {
	botToken: string;
	serverId: string;
	announcementChannel: string;
	noticeboardChannel: string;
	/** Mirror site events into the guild's Discord "Events" list (needs Create/Manage Events). */
	syncScheduledEvents: boolean;
}
