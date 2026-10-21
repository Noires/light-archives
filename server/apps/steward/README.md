# Steward (Discord bot)

Steward posts Elpisgarten content to the community Discord. The main API
(`apps/chaosarchives`) notifies it over HTTP on port 8112. Notifications are fire-and-forget, so a failure on Steward's side never breaks the site.

| Webhook | Sent when | Steward does |
|---|---|---|
| `POST /event { eventId }` | an event is created, edited or deleted | reschedules its reminders, syncs the Discord scheduled event, and re-renders reminders that were already posted (deleted or hidden events show as **Abgesagt**) |
| `POST /noticeboard { noticeboardItemId, action }` | `create` (only with "post on Discord"), `update`, `delete` | posts, edits or deletes the Discord post |

## Posts

- **Event reminders** are Components V2 messages in the announcement channel. They contain:
  - Discord timestamps (each reader's local time plus a countdown) alongside the in-game server time ("20:00 ST");
  - content warnings behind a spoiler;
  - the banner;
  - link buttons.
- **Aushänge** use the same layout in the noticeboard channel.
- **Message ids:** every post stores its channel and message id (`EventAnnouncement.discordMessageId`, `NoticeboardItem.discordMessageId`), so it can be edited or deleted later, even after a restart.
- **Mentions:** site texts can mention members as `@{Name}` (nickname, display name or username) and roles as `@Role`.
  - Roles are only pinged if the guild marked them as mentionable.
  - `allowedMentions` lists exactly the resolved ids, so `@everyone` and `@here` never ping.
  - Edits never ping.

## Reminders

Reminders are BullMQ delayed jobs (queue `steward-reminders`) in the shared Redis, so they survive restarts.
- **Reconciling:** on start, and on every event refresh, Steward reconciles the queue with the database: one job per future announcement of a visible event.
- **Retries:** failed posts retry 3 times with exponential backoff.
- **No duplicates:** a reminder that already has a message id is never posted twice.

## Discord scheduled events

Every visible site event is mirrored to the guild's **Events** list as an external event.
- **Fields:** location, end time (start + 3 h if the event has none), banner and link.
- **18+ events:** they get "[18+]" in the name.
- **Changes:** edits update the Discord event, and deleting or hiding the site event cancels it.
- **Switching it off:** set `DISCORD_SYNC_SCHEDULED_EVENTS=false`.

## Setup

- **Bot permissions in the guild:** View Channel, Send Messages, Embed Links, **Create Events** and **Manage Events**. Since 23 Feb 2026 Discord requires Create Events for creating scheduled events.
- **Environment / config** (`config/custom-environment-variables.yml`):
  - `DISCORD_BOT_TOKEN`, `DISCORD_SERVER_ID`, `DISCORD_ANNOUNCEMENT_CHANNEL`, `DISCORD_NOTICEBOARD_CHANNEL`, `DISCORD_SYNC_SCHEDULED_EVENTS`;
  - `REDIS_HOST` and `REDIS_PORT` (default `redis:6379`, the compose service).
- **Schema:** the new columns are created by TypeORM `synchronize` on start.
- **Dependencies:** discord.js ≥ 14.19 for Components V2, `bullmq` and `@nestjs/bullmq` 11. Version 12 is ESM-only and does not load in this CommonJS build.

## Tests

Run `yarn test apps/steward`. Message builders, mention resolution, scheduling, the scheduled-event sync and the posting flow have unit tests with mocked Discord and Redis.
