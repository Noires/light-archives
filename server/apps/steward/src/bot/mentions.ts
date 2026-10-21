import { MessageMentionOptions } from 'discord.js';

// Mentions in site texts. Authors write `@{Name}` (Discord nickname, display
// name or username), legacy `@user#1234`, or `@RoleName`. Only targets that
// resolve to exactly one member, or to a role the guild marked mentionable,
// become real mentions, and allowedMentions lists exactly those ids, so a
// site text can never ping @everyone, @here or a protected role.

interface MentionUser {
	id: string;
	username: string;
	discriminator: string;
	globalName?: string | null;
}

interface MentionMember {
	nickname: string | null;
	user: MentionUser;
}

interface MentionRole {
	id: string;
	name: string;
	mentionable: boolean;
}

/** The part of a discord.js Guild the resolver needs (keeps it testable). */
export interface MentionGuild {
	members: { search(options: { query: string; limit?: number }): Promise<{ values(): Iterable<MentionMember> }> };
	roles: { fetch(): Promise<{ values(): Iterable<MentionRole> }> };
}

export interface ResolvedMentions {
	text: string;
	allowedMentions: MessageMentionOptions;
}

const LEGACY_USER = /@([A-Za-z0-9_.-]+)#([0-9]{1,4})/g;
const NAMED_USER = /@\{([^}]+)\}/g;
const ROLE = /(^|[\s(])@([A-Za-z0-9][A-Za-z0-9_-]*)/g;
const RESERVED_ROLE_NAMES = new Set(['everyone', 'here']);

/** Collects the mention tokens of a text, e.g. for the line above a post. */
export function extractMentionTokens(content: string): string {
	const tokens = new Set<string>();
	const text = content || '';

	for (const match of text.matchAll(LEGACY_USER)) {
		tokens.add(match[0]);
	}

	for (const match of text.matchAll(NAMED_USER)) {
		tokens.add(match[0]);
	}

	const withoutUsers = text.replace(LEGACY_USER, '').replace(NAMED_USER, '');
	for (const match of withoutUsers.matchAll(ROLE)) {
		if (!RESERVED_ROLE_NAMES.has(match[2].toLowerCase())) {
			tokens.add(`@${match[2]}`);
		}
	}

	return Array.from(tokens).join(' ');
}

function single<T>(items: T[]): T | null {
	return items.length === 1 ? items[0] : null;
}

export async function resolveMentions(guild: MentionGuild, text: string): Promise<ResolvedMentions> {
	const userIds = new Set<string>();
	const roleIds = new Set<string>();
	const source = text || '';
	const lookups = new Map<string, MentionMember[]>();

	const queries = new Set<string>();
	for (const match of source.matchAll(LEGACY_USER)) {
		queries.add(match[1]);
	}
	for (const match of source.matchAll(NAMED_USER)) {
		queries.add(match[1].trim());
	}

	await Promise.all(Array.from(queries).map(async (query) => {
		try {
			const found = await guild.members.search({ query, limit: 10 });
			lookups.set(query, Array.from(found.values()));
		} catch {
			lookups.set(query, []);
		}
	}));

	let result = source.replace(LEGACY_USER, (token, username: string, discriminator: string) => {
		const member = single((lookups.get(username) || []).filter((m) => m.user.username === username && m.user.discriminator === discriminator));
		if (!member) {
			return token;
		}
		userIds.add(member.user.id);
		return `<@${member.user.id}>`;
	});

	result = result.replace(NAMED_USER, (token, rawName: string) => {
		const name = rawName.trim();
		const candidates = lookups.get(name) || [];
		const lower = name.toLowerCase();
		const member = single(candidates.filter((m) => m.nickname === name))
			|| single(candidates.filter((m) => m.user.globalName === name))
			|| single(candidates.filter((m) => m.user.username.toLowerCase() === lower));
		if (!member) {
			return token;
		}
		userIds.add(member.user.id);
		return `<@${member.user.id}>`;
	});

	if (ROLE.test(result)) {
		ROLE.lastIndex = 0;
		let roles: MentionRole[] = [];
		try {
			roles = Array.from((await guild.roles.fetch()).values());
		} catch {
			roles = [];
		}

		result = result.replace(ROLE, (token, prefix: string, roleName: string) => {
			if (RESERVED_ROLE_NAMES.has(roleName.toLowerCase())) {
				return token;
			}
			const role = single(roles.filter((r) => r.name === roleName && r.mentionable));
			if (!role) {
				return token;
			}
			roleIds.add(role.id);
			return `${prefix}<@&${role.id}>`;
		});
	}
	ROLE.lastIndex = 0;

	return {
		text: result,
		allowedMentions: { parse: [], users: Array.from(userIds), roles: Array.from(roleIds) },
	};
}

/** For edits and posts without resolved targets: never ping anyone. */
export const NO_MENTIONS: MessageMentionOptions = { parse: [], users: [], roles: [] };
