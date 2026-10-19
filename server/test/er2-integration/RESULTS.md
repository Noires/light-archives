# ER2 integration results

**Date:** 2026-10-19 · **Branch:** `er2/db-verify` (from `vision/er2` at `f28469e`) · MariaDB 10.11.19, Redis 7, Node 24, Windows 11

## Summary

- **Schema (8347c89 → current):** purely additive. 14 new tables, 32 added columns/keys/foreign keys,
  0 removed or changed columns, keys or constraints. Data of all pre-existing columns identical before and after.
- **Endpoint run:** 203 PASS, 0 FAIL (also green with the server process at `TZ=UTC` and `TZ=America/New_York`).
- **Bugs fixed:** 2 (see below). `yarn build` OK, Jest 208/208.

## Schema diff

Old schema created by the server at `8347c89` (synchronize) in `la_old`, seeded with
`schema-check/old-seed.sql` (servers, users, characters, image, stories, event + registration + location,
venue, wiki page, FC, community + memberships, noticeboard item). Then the current server synchronized the
same database. Output of `diff-schema.mjs`:

```
# Additive changes (46)
  CREATE TABLE album
  CREATE TABLE album_images
  CREATE TABLE bookmark
  CREATE TABLE calendar_token
  ADD COLUMN character.rpStatus varchar(8) DEFAULT NULL
  ADD COLUMN character.rpLocation varchar(80) DEFAULT NULL
  ADD COLUMN character.rpStatusExpiresAt datetime DEFAULT NULL
  ADD COLUMN character.accentColor varchar(7) DEFAULT NULL
  ADD COLUMN character.playStyleTags text DEFAULT NULL
  ADD COLUMN community.recruiting tinyint(4) DEFAULT NULL
  ADD COLUMN community.focusItems text DEFAULT NULL
  ADD COLUMN event.programme text DEFAULT NULL
  ADD COLUMN event.seriesId int(11) DEFAULT NULL
  ADD KEY event.KEY `IDX_4ccd63876554023ce6a4e863c2` (`title`)
  ADD KEY event.KEY `FK_93cf0c5eddabbb913424a587722` (`seriesId`)
  ADD CONSTRAINT event.FK_93cf0c5eddabbb913424a587722 FOREIGN KEY (`seriesId`) REFERENCES `event_series` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
  ADD COLUMN event_registration.kind varchar(16) NOT NULL DEFAULT 'going'
  ADD COLUMN event_registration.remindedAt datetime DEFAULT NULL
  CREATE TABLE event_series
  CREATE TABLE follow
  ADD COLUMN free_company.recruiting tinyint(4) DEFAULT NULL
  ADD COLUMN free_company.focusItems text DEFAULT NULL
  CREATE TABLE free_company_application
  CREATE TABLE image_character_tag
  ADD COLUMN noticeboard_item.pinned tinyint(4) NOT NULL DEFAULT 0
  ADD COLUMN noticeboard_item.pinnedAt datetime DEFAULT NULL
  ADD COLUMN noticeboard_item.discordPosted tinyint(4) NOT NULL DEFAULT 0
  ADD COLUMN noticeboard_item.imageId int(11) DEFAULT NULL
  ADD KEY noticeboard_item.KEY `FK_d886a439a71c349feb300f43bf3` (`imageId`)
  ADD CONSTRAINT noticeboard_item.FK_d886a439a71c349feb300f43bf3 FOREIGN KEY (`imageId`) REFERENCES `image` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
  CREATE TABLE notification
  CREATE TABLE notification_preference
  CREATE TABLE reaction
  ADD COLUMN story.seriesTitle varchar(120) DEFAULT NULL
  ADD COLUMN story.seriesIndex int(11) DEFAULT NULL
  ADD COLUMN story.published tinyint(4) NOT NULL DEFAULT 1
  ADD COLUMN story.bannerId int(11) DEFAULT NULL
  ADD KEY story.KEY `IDX_652b018f49a71d11bf3660910e` (`title`)
  ADD KEY story.KEY `IDX_4c6e82f148fe3265949375d01b` (`seriesTitle`)
  ADD KEY story.KEY `FK_809a484d613144a5f224462ee11` (`bannerId`)
  ADD CONSTRAINT story.FK_809a484d613144a5f224462ee11 FOREIGN KEY (`bannerId`) REFERENCES `image` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
  ADD COLUMN venue.adultOnly tinyint(4) DEFAULT NULL
  CREATE TABLE venue_opening_exception
  CREATE TABLE venue_opening_hours
  ADD COLUMN wiki_page.published tinyint(4) NOT NULL DEFAULT 1
  CREATE TABLE wiki_page_revision

# Removed or changed (0)
```

Data check: `SELECT <all old columns> FROM <table>` for every pre-existing table, before and after: identical.
New NOT NULL columns all have defaults (`event_registration.kind = 'going'`, `story.published = 1`,
`wiki_page.published = 1`, `noticeboard_item.pinned/discordPosted = 0`), so existing rows read as before.

**No column recreation.** `simple-json` columns (`character.playStyleTags`, `event.programme`,
`free_company/community.focusItems`) are created as `text` and are not touched again on later boots.

**Pre-existing churn (not caused by ER2, harmless):** on every boot TypeORM runs 11 no-op
`ALTER TABLE … CHANGE` statements (`content_note.name`, `venue_tag.name`, `community_tag.name`,
`story_tag.name`, `*.carrdProfile` on venue/free_company/character/community, and `contentNoteName` on the
three content-note join tables, with their foreign keys dropped and re-added). The old server at `8347c89`
does exactly the same on its own schema (checked by booting it twice on `la_old2`). These are `CHANGE`
with the identical definition, not drop + add: a second database with rows in `content_note`,
`story_content_notes_content_note`, `story_tag` and a non-empty `carrdProfile` kept all of them after the
current server synchronized it.

## Bugs found and fixed

| # | Bug | Fix | Test |
|---|---|---|---|
| 1 | FC/community list cards: `memberAvatars` were not guaranteed "most recently active first". The window-function subquery ranked members, but the outer `SELECT … WHERE t.rn <= 3` had no `ORDER BY`, so MariaDB may return the rows in any order. | `ORDER BY t.groupId, t.rn` in both member queries (`apps/chaosarchives/src/common/group-summary.ts`) | Jest `group-summary.spec.ts` (fails without the fix); harness "community 5 members, 3 avatars, most recently active first" |
| 2 | `GET /api/internal/events` without `?refresh=` answered 400 ("boolean string is expected"): `ParseBoolPipe` runs before the parameter default. Pre-existing, the client always sends `refresh=false`. | `new DefaultValuePipe(false)` before `ParseBoolPipe` (`apps/chaosarchives/src/api/internal/events/events.controller.ts`) | harness "events list without ?refresh -> 200" |

Window functions (`COUNT(*) OVER`, `ROW_NUMBER() OVER`) work on MariaDB 10.11 for both FC and community
summaries, including empty groups, hidden avatars, applied (unconfirmed) memberships and the 3-avatar cap.

## Not covered

- **Image upload / delete** (S3): images are seeded as rows; tags, albums, banners and reactions on them are covered.
- **Discord**: Steward webhook calls fail by design in the test (logged, not fatal). Discord DM reminders are
  out of scope (being removed); reminders are checked as in-app notifications only.
- **Login flow** (Discord OAuth): JWTs are minted directly with the test secret.
- External event imports (`?refresh=true`) and Lodestone calls.

## Per section

| Section | PASS | FAIL |
|---|---|---|
| Events | 27 | 0 |
| Event series | 8 | 0 |
| Venues | 17 | 0 |
| RP status | 8 | 0 |
| Follows | 3 | 0 |
| Stories | 18 | 0 |
| Notifications | 11 | 0 |
| Reminder scheduler | 6 | 0 |
| Reactions | 7 | 0 |
| Search | 7 | 0 |
| Wiki | 12 | 0 |
| Albums | 9 | 0 |
| Image tags | 13 | 0 |
| Free companies | 11 | 0 |
| Group summaries | 13 | 0 |
| Community permissions | 6 | 0 |
| Characters lookup | 2 | 0 |
| Bookmarks + calendar | 13 | 0 |
| Noticeboard | 4 | 0 |
| Changes feed | 4 | 0 |
| Misc | 4 | 0 |

## All checks

| Section | Check | Result |
|---|---|---|
| Events | create open event -> 201 | PASS |
| Events | create closed event -> 201 | PASS |
| Events | create event starting in 20 min (reminder) -> 201 | PASS |
| Events | create past event -> 201 | PASS |
| Events | register going -> 2xx | PASS |
| Events | register interested -> 2xx | PASS |
| Events | register without kind (legacy body) -> 2xx | PASS |
| Events | event detail -> 200 | PASS |
| Events | detail goingCount=2 interestedCount=1 | PASS |
| Events | detail myRegistrationKinds for Otto = interested | PASS |
| Events | detail programme stored | PASS |
| Events | switch interested -> going -> 2xx | PASS |
| Events | switch keeps a single registration row | PASS |
| Events | register foreign character -> 4xx | PASS |
| Events | register for past event -> 400 | PASS |
| Events | register for closed event before deadline -> 2xx | PASS |
| Events | events list without ?refresh -> 200 | PASS |
| Events | events list -> 200 | PASS |
| Events | list goingCount=3 interestedCount=0 after switch | PASS |
| Events | list contains closed event with closedEvent=true | PASS |
| Events | list hides past event | PASS |
| Events | withdraw RSVP -> 2xx | PASS |
| Events | event ics -> 200 | PASS |
| Events | event ics is a VCALENDAR with the event | PASS |
| Events | my.ics -> 200 | PASS |
| Events | my.ics has both registered events | PASS |
| Events | my.ics anonymous -> 401 | PASS |
| Event series | create series -> 201 | PASS |
| Event series | series has label and nextOccurrences | PASS |
| Event series | series next -> 200 | PASS |
| Event series | series next: weekly Fridays 20:00 Berlin, ascending, in future | PASS |
| Event series | series mine contains it | PASS |
| Event series | attach event to series -> 200 | PASS |
| Event series | event detail shows seriesId + nextOccurrences | PASS |
| Event series | foreign user edits series -> 403/404 | PASS |
| Venues | PUT opening hours (owner) -> 200 | PASS |
| Venues | PUT opening hours (venue 2, closed today) -> 200 | PASS |
| Venues | PUT opening hours by stranger -> 403 | PASS |
| Venues | PUT invalid opening hours -> 400 | PASS |
| Venues | GET opening hours -> 200 | PASS |
| Venues | GET opening hours roundtrip (7 slots, HH:mm, exception date string) | PASS |
| Venues | overnight flag derived for 20:00-02:00 | PASS |
| Venues | GET /venues -> 200 | PASS |
| Venues | venue 1 openNow=true + closesAt | PASS |
| Venues | venue 2 closed today by exception -> openNow=false + opensAt tomorrow | PASS |
| Venues | venue 1 bannerUrl | PASS |
| Venues | venue 2 bannerUrl null | PASS |
| Venues | venue 1 tags include own tag + housing labels | PASS |
| Venues | venue adultOnly flags | PASS |
| Venues | venue 1 nextEvent = Hafenfest | PASS |
| Venues | venue 1 nextEvent is the earliest upcoming (20-min event) | PASS |
| Venues | venue 2 nextEvent null | PASS |
| RP status | set rp status -> 200 | PASS |
| RP status | rp status response | PASS |
| RP status | set rp status of foreign character -> 403/404 | PASS |
| RP status | rp status duration > max -> 400 | PASS |
| RP status | rp-active -> 200 | PASS |
| RP status | rp-active lists Aria, not expired Mila | PASS |
| RP status | clear rp status | PASS |
| RP status | rp-active empty after clear | PASS |
| Follows | follow unknown series -> 404 | PASS |
| Follows | follow author | PASS |
| Follows | follow venue | PASS |
| Stories | create story part 1 -> 201 | PASS |
| Stories | follow series | PASS |
| Stories | follow twice is idempotent | PASS |
| Stories | follow status | PASS |
| Stories | my follows | PASS |
| Stories | create story part 2 -> 201 | PASS |
| Stories | create draft part 3 -> 201 | PASS |
| Stories | create standalone draft -> 201 | PASS |
| Stories | story list anonymous -> 200 | PASS |
| Stories | anonymous list hides draft | PASS |
| Stories | summary contentNotes/wordCount/series | PASS |
| Stories | owner list includes own draft | PASS |
| Stories | other user list hides draft | PASS |
| Stories | draft detail for other user -> 404 | PASS |
| Stories | draft detail for owner -> 200 | PASS |
| Stories | series parts (anonymous) = 1,2 ordered | PASS |
| Stories | series parts (owner) include draft | PASS |
| Stories | story detail seriesCount/contentNotes | PASS |
| Notifications | series follower got series-part notification for part 2 only (followed after part 1) | PASS |
| Notifications | author follower got author-story notifications | PASS |
| Notifications | author did not notify herself | PASS |
| Notifications | event owner got event-registration notifications | PASS |
| Notifications | publish draft -> 200 | PASS |
| Notifications | publishing a draft notifies series followers | PASS |
| Notifications | unread count = 2 | PASS |
| Notifications | mark read | PASS |
| Notifications | marking a foreign notification read has no effect | PASS |
| Notifications | read-all -> 0 unread | PASS |
| Notifications | update preferences | PASS |
| Reminder scheduler | register for event starting in 20 min | PASS |
| Reminder scheduler | reminder pass runs | PASS |
| Reminder scheduler | going user got event-reminder | PASS |
| Reminder scheduler | interested user got no reminder | PASS |
| Reminder scheduler | registration marked remindedAt | PASS |
| Reminder scheduler | second pass does not remind twice | PASS |
| Reactions | toggle on | PASS |
| Reactions | parallel toggles never create duplicates | PASS |
| Reactions | toggle off | PASS |
| Reactions | image-only kind on story -> 400 | PASS |
| Reactions | react as foreign character -> 4xx | PASS |
| Reactions | summary counts | PASS |
| Reactions | reaction table has a unique index | PASS |
| Search | search finds character | PASS |
| Search | search finds published stories, not drafts | PASS |
| Search | suggest hides draft story and unpublished wiki page | PASS |
| Search | suggest returns venue prefix match | PASS |
| Search | suggest returns story | PASS |
| Search | suggest with 1 char -> empty | PASS |
| Search | suggest handles SQL wildcards | PASS |
| Wiki | create wiki page -> 201 | PASS |
| Wiki | edit wiki page -> 200 | PASS |
| Wiki | create unpublished wiki page -> 201 | PASS |
| Wiki | wiki create by non-trusted -> 403 | PASS |
| Wiki | wiki list has published page only | PASS |
| Wiki | wiki mentions list the published stories, not drafts | PASS |
| Wiki | two revisions, newest first | PASS |
| Wiki | revision detail content | PASS |
| Wiki | restore -> 201 with new revision id | PASS |
| Wiki | page content restored | PASS |
| Wiki | three revisions after restore | PASS |
| Wiki | revisions of unpublished page anonymous -> 404 | PASS |
| Albums | create album -> 201 | PASS |
| Albums | album with foreign image -> 4xx | PASS |
| Albums | album detail | PASS |
| Albums | set album images -> 200 | PASS |
| Albums | edit album -> 200 | PASS |
| Albums | album list summary | PASS |
| Albums | edit foreign album -> 403/404 | PASS |
| Albums | delete album -> 200 | PASS |
| Albums | deleting album keeps images | PASS |
| Image tags | tag Cyra on Aria image -> pending | PASS |
| Image tags | tag on foreign image -> 403 | PASS |
| Image tags | tag Bran -> pending | PASS |
| Image tags | self tag auto-approved | PASS |
| Image tags | public image shows only approved tags | PASS |
| Image tags | Cyra sees pending tag | PASS |
| Image tags | stranger cannot decide -> 403/404 | PASS |
| Image tags | Cyra approves | PASS |
| Image tags | Bran declines | PASS |
| Image tags | public tags = Aria + Cyra | PASS |
| Image tags | re-tagging after decline -> 409 | PASS |
| Image tags | tag request notified Cyra | PASS |
| Image tags | tagged owner removes tag | PASS |
| Free companies | apply to FC -> 201 | PASS |
| Free companies | apply twice (idempotent) -> 201 | PASS |
| Free companies | apply to unclaimed FC -> 409 | PASS |
| Free companies | member applies to own FC -> 409 | PASS |
| Free companies | non-manager lists applications -> 403 | PASS |
| Free companies | leader lists applications | PASS |
| Free companies | FC detail shows my application | PASS |
| Free companies | accept application -> 201 | PASS |
| Free companies | decide twice -> 409 | PASS |
| Free companies | application accepted with decider | PASS |
| Free companies | withdraw accepted application -> 201 | PASS |
| Group summaries | FC list -> 200 | PASS |
| Group summaries | FC memberCount=2 | PASS |
| Group summaries | FC memberAvatars skip hidden avatar | PASS |
| Group summaries | FC nextEvent = earliest member event (20-min event by Bran) | PASS |
| Group summaries | FC tag + recruiting | PASS |
| Group summaries | unclaimed FC not listed | PASS |
| Group summaries | empty FC: 0 members, no event | PASS |
| Group summaries | community list -> 200 | PASS |
| Group summaries | community memberCount=2 (applied not counted) | PASS |
| Group summaries | community memberAvatars | PASS |
| Group summaries | community nextEvent | PASS |
| Group summaries | empty community | PASS |
| Group summaries | community 5 members, 3 avatars, most recently active first | PASS |
| Community permissions | community detail | PASS |
| Community permissions | non-member edits community -> 403 | PASS |
| Community permissions | member without canEdit edits community -> 403 | PASS |
| Community permissions | non-member manages members -> 403 | PASS |
| Community permissions | owner edits community -> 200 | PASS |
| Community permissions | community goal changed by owner only | PASS |
| Characters lookup | lookup finds case-insensitive + server-qualified, skips unknown | PASS |
| Characters lookup | lookup > 50 names -> 400 | PASS |
| Bookmarks + calendar | bookmark event | PASS |
| Bookmarks + calendar | bookmark story | PASS |
| Bookmarks + calendar | bookmark a foreign draft -> 404 | PASS |
| Bookmarks + calendar | bookmark missing target -> 404 | PASS |
| Bookmarks + calendar | bookmark list resolves titles | PASS |
| Bookmarks + calendar | bookmark status | PASS |
| Bookmarks + calendar | create calendar token | PASS |
| Bookmarks + calendar | public feed has bookmarked + registered events | PASS |
| Bookmarks + calendar | feed with bad token -> 404 | PASS |
| Bookmarks + calendar | rotation invalidates old token | PASS |
| Bookmarks + calendar | revoke token | PASS |
| Bookmarks + calendar | feed after revoke -> 404 | PASS |
| Bookmarks + calendar | remove bookmark | PASS |
| Noticeboard | pin as non-moderator -> 403 | PASS |
| Noticeboard | pin as moderator -> 200 | PASS |
| Noticeboard | pinned old item first, then newest | PASS |
| Noticeboard | unpinned -> newest first | PASS |
| Changes feed | changes -> 200 | PASS |
| Changes feed | changes contain items | PASS |
| Changes feed | changes items by Aria carry authorAvatar | PASS |
| Changes feed | changes hide drafts | PASS |
| Misc | character list | PASS |
| Misc | main page | PASS |
| Misc | venue detail | PASS |
| Misc | statistics | PASS |
