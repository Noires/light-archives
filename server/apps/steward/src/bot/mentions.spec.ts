import { extractMentionTokens, MentionGuild, resolveMentions } from './mentions';

function member(id: string, username: string, nickname: string | null = null, globalName: string | null = null, discriminator = '0') {
	return { nickname, user: { id, username, discriminator, globalName } };
}

function guild(members: ReturnType<typeof member>[], roles: Array<{ id: string; name: string; mentionable: boolean }>): MentionGuild & { search: jest.Mock } {
	const search = jest.fn(async ({ query }: { query: string }) => {
		const lower = query.toLowerCase();
		return members.filter((m) =>
			m.user.username.toLowerCase().startsWith(lower)
			|| (m.nickname || '').toLowerCase().startsWith(lower)
			|| (m.user.globalName || '').toLowerCase().startsWith(lower));
	});
	return {
		search,
		members: { search },
		roles: { fetch: jest.fn(async () => roles) },
	};
}

describe('extractMentionTokens', () => {
	it('collects user and role tokens but never @everyone or @here', () => {
		expect(extractMentionTokens('Hallo @{Aeris} und @Barde, nicht @everyone oder @here')).toBe('@{Aeris} @Barde');
	});
});

describe('resolveMentions', () => {
	const members = [member('1', 'aeris', 'Aeris'), member('2', 'lyse', null, 'Lyse Hext')];
	const roles = [
		{ id: '10', name: 'Barde', mentionable: true },
		{ id: '11', name: 'Admin', mentionable: false },
		{ id: '12', name: 'everyone', mentionable: true },
	];

	it('resolves nicknames, display names and usernames to user mentions', async () => {
		const result = await resolveMentions(guild(members, roles), '@{Aeris} @{Lyse Hext} @{lyse}');
		expect(result.text).toBe('<@1> <@2> <@2>');
		expect(result.allowedMentions.users).toEqual(['1', '2']);
	});

	it('only pings roles the guild marked as mentionable', async () => {
		const result = await resolveMentions(guild(members, roles), 'Ruf an @Barde und @Admin');
		expect(result.text).toBe('Ruf an <@&10> und @Admin');
		expect(result.allowedMentions).toEqual({ parse: [], users: [], roles: ['10'] });
	});

	it('never turns @everyone or @here into a ping', async () => {
		const result = await resolveMentions(guild(members, roles), '@everyone @here');
		expect(result.text).toBe('@everyone @here');
		expect(result.allowedMentions).toEqual({ parse: [], users: [], roles: [] });
	});

	it('leaves ambiguous or unknown names as text', async () => {
		const twins = [member('3', 'kai_a', 'Kai'), member('4', 'kai_b', 'Kai')];
		const result = await resolveMentions(guild(twins, []), '@{Kai} @{Niemand}');
		expect(result.text).toBe('@{Kai} @{Niemand}');
		expect(result.allowedMentions.users).toEqual([]);
	});
});
