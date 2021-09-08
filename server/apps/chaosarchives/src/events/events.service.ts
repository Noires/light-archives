import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { HttpService, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import parse from 'node-html-parser';
import SharedConstants from '@app/shared/SharedConstants';
import { EventDto } from '@app/shared/dto/events/event.dto';

@Injectable()
export class EventsService {
	private readonly EVENTS_SITE = 'https://crescentmoonpublishing.com/events/';

	private readonly CACHE_DURATION_SEC = 5 * 60;

	private readonly DATE_TIME_FORMAT = 'LLLL d, yyyy h:mma';

	constructor(
		@InjectRedis()
		private readonly redisService: Redis,
		private httpService: HttpService,
	) { }

	async getEvents(): Promise<EventDto[]> {
		const cachedEvents = await this.redisService.get('events');

		if (cachedEvents) {
			return JSON.parse(cachedEvents);
		}

		// Not cached - fetch and cache
		const events = await this.fetchEvents();
		this.redisService.set('events', JSON.stringify(events), 'ex', this.CACHE_DURATION_SEC); // Intentionally no await
		return events;
	}

	private async fetchEvents(): Promise<EventDto[]> {
		const response = await this.httpService.get<string>(this.EVENTS_SITE).toPromise();
		const doc = parse(response.data);
		const eventsItems = doc.querySelectorAll('.grid-col-desk-1 .jet-listing-grid__item');
		const result: EventDto[] = [];

		for (const item of eventsItems) {
			const nameLink = item.querySelector('a');
			const fields = item.querySelectorAll('.jet-listing-dynamic-field__content');
			const dateString = `${fields[0].textContent} ${fields[1].textContent}`;
			const date = DateTime.fromFormat(dateString, this.DATE_TIME_FORMAT, {
				locale: 'en',
				zone: SharedConstants.FFXIV_SERVER_TIMEZONE,
			});

			if (!date.isValid) {
				// Theoretically the date can fail to parse, but we strive to avoid this possibility
				continue;
			}

			result.push({
				name: nameLink.querySelector('span').textContent || '',
				location: fields[2].textContent || '',
				link: nameLink.getAttribute('href') || '',
				date: date.toMillis(),
			});
		}

		return result;
	}
}
