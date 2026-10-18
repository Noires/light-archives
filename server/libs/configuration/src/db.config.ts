
import { Character, Event, EventAnnouncement, EventLocation, EventRegistration, EventSeries, FreeCompany, FreeCompanyMemberPermission, Image, Location, LocationWeather, News, NewsCategory, NewsIssue, NoticeboardItem, Reaction, RefreshToken, Server, Story, StoryTag, SupportTicket, SupportTicketEvent, SupportTicketMessage, User, Venue, VenueMembership, VenueOffering, VenueOfferingCategory, VenueOpeningException, VenueOpeningHours, Violation, WikiPage, Weather, ContentNote } from '@app/entity';
import { CommunityMembership } from '@app/entity/community-membership.entity';
import { CommunityTag } from '@app/entity/community-tag.entity';
import { Community } from '@app/entity/community.entity';
import { VenueTag } from '@app/entity/venue-tag.entity';
// ER2 social
import { Follow } from '@app/entity/follow.entity';
import { Notification } from '@app/entity/notification.entity';
import { NotificationPreference } from '@app/entity/notification-preference.entity';
import { Bookmark } from '@app/entity/bookmark.entity';
import { CalendarToken } from '@app/entity/calendar-token.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from 'config';
import { DbConfigInterface } from './interfaces/db-config.interface';

const dbConfig = config.get<DbConfigInterface>('db');

export const dbConfiguration: TypeOrmModuleOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  timezone: 'Z',
  entities: [
    Character,
    Community,
    CommunityMembership,
    CommunityTag,
    ContentNote,
    Event,
    EventAnnouncement,
    EventLocation,
    EventRegistration,
    EventSeries,
    FreeCompany,
    FreeCompanyMemberPermission,
    Image,
    Location,
    LocationWeather,
    News,
    NewsCategory,
    NewsIssue,
    NoticeboardItem,
    Reaction,
    RefreshToken,
    Server,
    Story,
    StoryTag,
    SupportTicket,
    SupportTicketEvent,
    SupportTicketMessage,
    User,
    Venue,
    VenueMembership,
    VenueOffering,
    VenueOfferingCategory,
    VenueOpeningException,
    VenueOpeningHours,
    VenueTag,
    Violation,
    WikiPage,
    Weather,
    // ER2 social
    Follow,
    Notification,
    NotificationPreference,
    Bookmark,
    CalendarToken,
  ],
  synchronize: dbConfig.synchronize,
  // Logging can be: true (all), false (none), or array of types: 'query', 'error', 'schema', 'warn', 'info', 'log', 'migration'
  // Controlled by DB_LOGGING env var (JSON format) or config/default.yml
  logging: dbConfig.logging,
  keepConnectionAlive: true,
};

Object.assign(dbConfiguration, { type: dbConfig.type });
