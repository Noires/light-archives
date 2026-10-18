# Routes snapshot (ER2-001)

Captured from `src/router/routes.ts` at commit `9fdaf31` (before the single-parent
restructure) by building a real `vue-router` 4.1.6 memory router from the transpiled
route table with stubbed page components. The same script was re-run after the
restructure: both lists below were byte-identical before and after.

## Registered route paths (77)

Every full path registered with the router (`router.getRoutes()`, deduplicated).

```
/
/:catchAll(.*)*
/:server([A-Z][a-z]+)/:character([^/]+)
/about
/beginner-guide
/calendar
/calendar/:year/:month
/changes
/communities
/community/:name
/contact
/create-community
/create-event
/create-location
/create-noticeboard-item
/create-story
/create-venue
/create-weather
/create-wiki-page
/edit-character/:id/
/edit-character/:id/appearance
/edit-character/:id/contacts
/edit-character/:id/diary
/edit-character/:id/gallery
/edit-character/:id/inventory
/edit-character/:id/pen-and-paper
/edit-character/:id/personality
/edit-character/:id/profile
/edit-character/:id/rumors
/edit-community/:id
/edit-event/:id
/edit-free-company/:server([A-Z][a-z]+)/:fc([^/]+)
/edit-image/:id
/edit-noticeboard-item/:id
/edit-story/:id
/edit-venue/:id
/edit-wiki-page/:id
/event/:id
/event-calendar
/event-calendar/:year/:month
/faq
/fc/:server([A-Z][a-z]+)/:fc([^/]+)
/free-companies
/gallery/:category
/image/:id
/impressum
/link/:name
/my-communities
/my-content
/my-free-company
/my-venues
/noticeboard
/noticeboard/:id
/privacy-statement
/profiles
/rules
/search
/stories
/story/:id
/support/queue
/support/queue/:id
/support/tickets
/support/tickets/:id
/support/tickets/new
/terms
/test-character-selector
/test-editor
/test-sentry
/venue/:id([0-9]+)
/venue/:id([0-9]+)/:section
/venue/:server/:name
/venue/:server/:name/:section
/venues
/verify
/violations
/weather
/wiki/:title
```

## Resolution smoke list

`router.resolve(url)` for one sample URL per route: rendered component chain,
merged `meta.title` (functions evaluated), number of `beforeEnter` guards in the
matched chain, and the redirect target. `MainLayout` must stay the outer
component everywhere except redirects and the 404 catch-all.

```
/ | MainLayout > Index | title="" | guards=0
/about | MainLayout > About | title="Über uns" | guards=0
/rules | MainLayout > Rules | title="Regeln" | guards=0
/contact | MainLayout > Contact | title="Kontakt" | guards=0
/faq | MainLayout > Faq | title="FAQ" | guards=0
/changes | MainLayout > Changes | title="Neueste Änderungen" | guards=0
/beginner-guide | MainLayout > BeginnerGuide | title="Anfängerguide" | guards=0
/test-editor | MainLayout > TestEditor | title="Wiki Import Test" | guards=0
/test-character-selector | MainLayout > TestCharacterSelector | title="Character Selector Test" | guards=0
/test-sentry | MainLayout > TestSentry | title="Sentry Test" | guards=1
/create-location | MainLayout > EditLocation | title="Ort erstellen" | guards=0
/create-weather | MainLayout > EditWeather | title="Wetter erstellen" | guards=0
/weather | MainLayout > Weather | title="Wetter" | guards=0
/privacy-statement | MainLayout > PrivacyStatement | title="Datenschutzerklärung" | guards=0
/impressum | MainLayout > Impressum | title="Impressum" | guards=0
/terms | MainLayout > Terms | title="Nutzungsbedingungen" | guards=0
/verify | MainLayout > Verify | title="Account verifizieren" | guards=0
/support/tickets | MainLayout > SupportTickets | title="Support-Tickets" | guards=1
/support/tickets/new | MainLayout > NewSupportTicket | title="Neues Support-Ticket" | guards=1
/support/tickets/12 | MainLayout > SupportTicket | title="Support-Ticket" | guards=1
/support/queue | MainLayout > SupportQueue | title="Support-Queue" | guards=1
/support/queue/12 | MainLayout > SupportTicketAdmin | title="Support-Ticket" | guards=1
/edit-character/5/ | MainLayout > EditCharacter | title="Profil bearbeiten" | guards=0
/edit-character/5 | MainLayout > EditCharacter | title="Profil bearbeiten" | guards=0
/edit-character/5/profile | MainLayout > EditCharacter > EditCharacterProfile | title="Profil bearbeiten" | guards=0
/edit-character/5/appearance | MainLayout > EditCharacter > EditCharacterAppearance | title="Profil bearbeiten" | guards=0
/edit-character/5/personality | MainLayout > EditCharacter > EditCharacterPersonality | title="Profil bearbeiten" | guards=0
/edit-character/5/contacts | MainLayout > EditCharacter > EditCharacterContacts | title="Profil bearbeiten" | guards=0
/edit-character/5/rumors | MainLayout > EditCharacter > EditCharacterRumors | title="Profil bearbeiten" | guards=0
/edit-character/5/diary | MainLayout > EditCharacter > EditCharacterDiary | title="Profil bearbeiten" | guards=0
/edit-character/5/gallery | MainLayout > EditCharacter > EditCharacterGallery | title="Profil bearbeiten" | guards=0
/edit-character/5/inventory | MainLayout > EditCharacter > EditCharacterInventory | title="Profil bearbeiten" | guards=0
/edit-character/5/pen-and-paper | MainLayout > EditCharacter > EditCharacterPenAndPaper | title="Profil bearbeiten" | guards=0
/stories | MainLayout > Stories | title="Geschichten" | guards=0
/story/3 | MainLayout > Story | title=(none) | guards=0
/create-story | MainLayout > EditStory | title="Geschichte erstellen" | guards=0
/edit-story/3 | MainLayout > EditStory | title="Geschichte bearbeiten" | guards=0
/noticeboard | MainLayout > Noticeboard | title="Anschlagbrett" | guards=0
/noticeboard/3 | MainLayout > NoticeboardItem | title=(none) | guards=0
/create-noticeboard-item | MainLayout > EditNoticeboardItem | title="Aushang erstellen" | guards=0
/edit-noticeboard-item/3 | MainLayout > EditNoticeboardItem | title="Aushang bearbeiten" | guards=0
/event/9 | MainLayout > Event | title=(none) | guards=0
/create-event | MainLayout > EditEvent | title="Event erstellen" | guards=0
/edit-event/9 | MainLayout > EditEvent | title="Event bearbeiten" | guards=0
/calendar | MainLayout > EventCalendar | title="Eventkalender" | guards=0
/calendar/2026/10 | MainLayout > EventCalendar | title="Eventkalender" | guards=0
/event-calendar |  | title=(none) | guards=0 -> /calendar
/event-calendar/2026/10 |  | title=(none) | guards=0 -> /calendar/2026/10
/image/1 | MainLayout > Image | title=(none) | guards=0
/gallery/art | MainLayout > Gallery | title=(none) | guards=0
/my-content | MainLayout > MyContent | title="Meine Inhalte" | guards=0
/edit-image/1 | MainLayout > EditImage | title="Bild bearbeiten" | guards=0
/venues | MainLayout > Venues | title="Treffpunkte" | guards=0
/my-venues | MainLayout > MyVenues | title="Meine Treffpunkte" | guards=0
/venue/Alpha/Some_Bar/info | MainLayout > Venue | title=(none) | guards=0
/venue/Alpha/Some_Bar | MainLayout > Venue | title=(none) | guards=0
/venue/12/info | MainLayout > Venue | title=(none) | guards=0
/venue/12 | MainLayout > Venue | title=(none) | guards=0
/create-venue | MainLayout > EditVenue | title="Treffpunkt erstellen" | guards=0
/edit-venue/12 | MainLayout > EditVenue | title="Treffpunkt bearbeiten" | guards=0
/violations | MainLayout > Violations | title="Verstöße" | guards=1
/communities | MainLayout > Communities | title="Communities" | guards=0
/my-communities | MainLayout > MyCommunities | title="Meine Communities" | guards=0
/community/Foo | MainLayout > Community | title=(none) | guards=0
/create-community | MainLayout > EditCommunity | title="Community erstellen" | guards=0
/edit-community/4 | MainLayout > EditCommunity | title="Community bearbeiten" | guards=0
/my-free-company | MainLayout > MyFreeCompany | title="Meine Freie Gesellschaft" | guards=0
/free-companies | MainLayout > FreeCompanies | title="Freie Gesellschaften" | guards=0
/fc/Alpha/My_FC | MainLayout > FreeCompany | title="fn:My FC" | guards=0
/edit-free-company/Alpha/My_FC | MainLayout > EditFreeCompany | title="Freie Gesellschaft bearbeiten" | guards=0
/wiki/Some_Page | MainLayout > Wiki | title=(none) | guards=0
/create-wiki-page | MainLayout > EditWikiPage | title="Wikibeitrag erstellen" | guards=0
/edit-wiki-page/7 | MainLayout > EditWikiPage | title="Wikibeitrag bearbeiten" | guards=0
/link/foo | MainLayout > Link | title="Link" | guards=0
/search | MainLayout > Search | title="Suche" | guards=0
/profiles | MainLayout > Characters | title="Profile" | guards=0
/Alpha/Jane_Doe | MainLayout > Character | title="fn:Jane Doe" | guards=0
/alpha/Jane_Doe | MainLayout > Character | title="fn:Jane Doe" | guards=0
/Alpha/Jane_Doe/extra | Error404 | title="Error" | guards=0
/does-not-exist | Error404 | title="Error" | guards=0
/a/b/c | Error404 | title="Error" | guards=0
```

## Notes

- `/alpha/Jane_Doe` resolving to `Character` is existing behaviour: vue-router
  matches case-insensitively by default, so `[A-Z][a-z]+` does not enforce case.
- `/event-calendar` and `/event-calendar/:year/:month` stay top-level redirect
  records (outside the shell parent), as before.
- The catch-all `/:catchAll(.*)*` stays the last top-level record and renders
  `Error404` without the layout, as before.
