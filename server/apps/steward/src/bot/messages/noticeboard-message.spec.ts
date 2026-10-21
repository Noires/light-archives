import { MessageFlags } from 'discord.js';
import { buildNoticeboardMessage, NOTICEBOARD_ACCENT } from './noticeboard-message';

// ts-jest hoists jest.mock above the imports.
jest.mock('@app/configuration', () => ({
	serverConfiguration: { frontendRoot: 'https://elpisgarten.test' },
	s3Configuration: { publicRootUrl: 'https://cdn.elpisgarten.test/' },
}));

function item(overrides: any = {}): any {
	return {
		id: 9,
		title: 'Koch gesucht',
		content: '<p>Wir suchen <strong>Verstärkung</strong>.</p>',
		type: 'stellenangebot',
		location: 'uldah',
		createdAt: new Date('2026-10-21T10:00:00Z'),
		owner: { name: 'Aeris Khatayin', server: { name: 'Shiva' } },
		venue: null,
		...overrides,
	};
}

function json(message: ReturnType<typeof buildNoticeboardMessage>): any {
	return message.components[message.components.length - 1].toJSON();
}

describe('buildNoticeboardMessage', () => {
	it('builds a V2 container with author line, title and Markdown body', () => {
		const message = buildNoticeboardMessage(item(), null);
		const container = json(message);
		const texts = container.components.filter((c: any) => c.type === 10).map((c: any) => c.content).join('\n');

		expect(message.flags).toBe(MessageFlags.IsComponentsV2);
		expect(container.accent_color).toBe(NOTICEBOARD_ACCENT);
		expect(texts).toContain('[Aeris Khatayin (Shiva)](https://elpisgarten.test/Shiva/Aeris_Khatayin)');
		expect(texts).toContain('## [Koch gesucht](https://elpisgarten.test/noticeboard/9)');
		expect(texts).toContain('**Verstärkung**');
	});

	it('adds a venue button and line when a venue is linked', () => {
		const container = json(buildNoticeboardMessage(item({ venue: { id: 3, name: 'Rolanberry Moon', server: { name: 'Shiva' } } }), null));
		const row = container.components.find((c: any) => c.type === 1);
		const texts = container.components.filter((c: any) => c.type === 10).map((c: any) => c.content).join('\n');

		expect(row.components.map((b: any) => b.label)).toEqual(['Aushang ansehen', 'Treffpunkt']);
		expect(row.components[1].url).toBe('https://elpisgarten.test/venue/3');
		expect(texts).toContain('**Treffpunkt:** Rolanberry Moon (Shiva)');
	});
});
