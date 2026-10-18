import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { AlbumsModule } from './albums/albums.module';
import { CarrdModule } from './carrd/carrd.module';
import { CharactersModule } from './characters/characters.module';
import { ChangesModule } from './changes/changes.module';
import { CommunitiesModule } from './communities/communities.module';
import { ContentNotesModule } from "./content-notes/content-notes.modules";
import { EventsModule } from './events/events.module';
import { EventSeriesModule } from './event-series/event-series.module';
import { FreeCompaniesModule } from './free-companies/free-companies.module';
import { ImagesModule } from './images/images.module';
import { LinksModule } from './links/links.module';
import { LocationsModule } from './locations/locations.module';
import { MainPageModule } from './mainpage/main-page.module';
import { NewsModule } from "./news/news.module";
import { NoticeboardModule } from './noticeboard/noticeboard.module';
import { ReactionsModule } from './reactions/reactions.module';
import { SearchModule } from './search/search.module';
import { ServersModule } from "./servers/servers.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { StoriesModule } from './stories/stories.module';
import { SupportModule } from './support/support.module';
import { UserModule } from './user/user.module';
import { VenuesModule } from './venues/venues.module';
import { ViolationsModule } from './violations/violations.module';
import { WeatherModule } from './weather/weather.module';
import { WikiModule } from "./wiki/wiki.module";
import { LodestoneModule } from './lodestone/lodestone.module';
// ER2 social
import { FollowsModule } from './follows/follows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CalendarTokenModule } from './calendar-token/calendar-token.module';

const controllerModules = [
	MainPageModule,
	EventsModule,
	EventSeriesModule,
	UserModule,
	CharactersModule,
  ChangesModule,
	CarrdModule,
  ContentNotesModule,
	StoriesModule,
	SupportModule,
	ImagesModule,
	NewsModule,
	NoticeboardModule,
	ReactionsModule,
	CommunitiesModule,
	FreeCompaniesModule,
	VenuesModule,
	LinksModule,
	LocationsModule,
	ViolationsModule,
	SearchModule,
	ServersModule,
	StatisticsModule,
	WeatherModule,
	WikiModule,
	LodestoneModule,
	// ER2 social
	FollowsModule,
	NotificationsModule,
	BookmarksModule,
	CalendarTokenModule,
	AlbumsModule,
];

@Module({
	imports: [
    ...controllerModules,
		RouterModule.register(controllerModules.map(module => ({
			path: 'internal',
			module,
		}))),
	],
})
export class InternalApiModule {}
