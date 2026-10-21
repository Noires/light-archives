import { EventType } from '@app/shared/enums/event-type.enum';
import { MessageFlags } from 'discord.js';
import { buildEventReminderMessage, EVENT_ACCENT, EVENT_ACCENT_CANCELLED, V2_TEXT_LIMIT } from './event-message';

// ts-jest hoists jest.mock above the imports.
jest.mock('@app/configuration', () => ({
	serverConfiguration: { frontendRoot: 'https://elpisgarten.test' },
	s3Configuration: { publicRootUrl: 'https://cdn.elpisgarten.test/' },
}));

const START = new Date('2026-10-23T18:00:00Z'); // 20:00 ST (Europe/Berlin, CEST)

function announcement(overrides: { event?: any; content?: string; minutesBefore?: number } = {}): any {
	return {
		id: 7,
		minutesBefore: overrides.minutesBefore ?? 60,
		content: overrides.content ?? 'Kommt vorbei!',
		event: {
			id: 42,
			title: 'Rolanberry Moon',
			startDateTime: START,
			endDateTime: new Date('2026-10-23T20:00:00Z'),
			eventType: EventType.TAVERN,
			adultOnly: false,
			closedEvent: false,
			contentNotes: [],
			locations: [{ name: 'Rolanberry Moon', address: 'Lavendelbeete, Bezirk 10', server: { name: 'Shiva' } }],
			links: [],
			...overrides.event,
		},
	};
}

/** All text of a built message, flattened from the builders' JSON. */
function texts(message: ReturnType<typeof buildEventReminderMessage>): string[] {
	const out: string[] = [];
	const walk = (node: any) => {
		if (!node || typeof node !== 'object') {
			return;
		}
		if (typeof node.content === 'string') {
			out.push(node.content);
		}
		Object.values(node).forEach(walk);
	};
	message.components.forEach((component) => walk(component.toJSON()));
	return out;
}

function buttons(message: ReturnType<typeof buildEventReminderMessage>): any[] {
	const container: any = message.components[message.components.length - 1].toJSON();
	const row = container.components.find((c: any) => c.type === 1);
	return row ? row.components : [];
}

describe('buildEventReminderMessage', () => {
	it('is a Components V2 message without content or embeds', () => {
		const message: any = buildEventReminderMessage(announcement(), { icon: null, banner: null });
		expect(message.flags).toBe(MessageFlags.IsComponentsV2);
		expect(message.content).toBeUndefined();
		expect(message.embeds).toBeUndefined();
		expect((message.components[0].toJSON() as any).accent_color).toBe(EVENT_ACCENT);
	});

	it('shows the start as Discord timestamps plus the server time', () => {
		const unix = Math.floor(START.getTime() / 1000);
		const all = texts(buildEventReminderMessage(announcement(), { icon: null, banner: null })).join('\n');
		expect(all).toContain(`<t:${unix}:F>`);
		expect(all).toContain(`<t:${unix}:R>`);
		expect(all).toContain('20:00 ST');
		expect(all).toContain('Erinnerung: 1 Stunde vorher');
	});

	it('greys out a cancelled event, strikes the title and drops the buttons and countdown', () => {
		const message = buildEventReminderMessage(announcement(), { icon: null, banner: null }, { cancelled: true });
		const all = texts(message).join('\n');
		expect((message.components[0].toJSON() as any).accent_color).toBe(EVENT_ACCENT_CANCELLED);
		expect(all).toContain('~~Rolanberry Moon~~');
		expect(all).toContain('Abgesagt');
		expect(all).not.toContain(':R>');
		expect(buttons(message)).toHaveLength(0);
	});

	it('hides content warnings behind a spoiler', () => {
		const all = texts(buildEventReminderMessage(announcement({ event: { contentNotes: [{ name: 'GORE' }, { name: 'DRUGS' }] } }), { icon: null, banner: null })).join('\n');
		expect(all).toContain('**Inhaltswarnungen:** ||Gore | Drogen | Alkohol | Drogenkonsum||');
	});

	it('keeps all text within the V2 limit for very long reminder texts', () => {
		const message = buildEventReminderMessage(announcement({ content: 'Lorem ipsum '.repeat(1000) }), { icon: null, banner: null }, { mentionLine: '<@1>' });
		const total = texts(message).reduce((sum, text) => sum + text.length, 0);
		expect(total).toBeLessThanOrEqual(V2_TEXT_LIMIT);
	});

	it('links to the event and at most five links overall', () => {
		const links = Array.from({ length: 8 }, (_, i) => ({ label: `Link ${i}`, url: `https://example.test/${i}` }));
		const result = buttons(buildEventReminderMessage(announcement({ event: { links } }), { icon: null, banner: null }));
		expect(result).toHaveLength(5);
		expect(result[0]).toMatchObject({ label: 'Zum Event', url: 'https://elpisgarten.test/event/42', style: 5 });
	});

	it('puts the mention line above the container so it can ping', () => {
		const message = buildEventReminderMessage(announcement(), { icon: null, banner: null }, { mentionLine: '<@123>' });
		expect(message.components).toHaveLength(2);
		expect((message.components[0].toJSON() as any).content).toBe('<@123>');
	});
});
