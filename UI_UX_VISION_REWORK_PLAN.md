# Elpis Reborn 2 — Vision Rework Plan
## "From a beautiful archive to a living town square"

**Companion to:** [`UI_UX_VISION.md`](./UI_UX_VISION.md) (findings, features, roadmap tiers) · Penpot file "Elpisgarten - Elpis Reborn", page **"Vision (Konzept)"** (concept boards) · [`UI_UX_REWORK_PLAN.md`](./UI_UX_REWORK_PLAN.md) + [`UI_UX_REWORK_BACKLOG.md`](./UI_UX_REWORK_BACKLOG.md) (Elpis Reborn, Aetherium) · [`memory.md`](./memory.md) (status, constraints)
**Date:** 2026-10-18
**Constraint:** Lifts memory.md hard constraint #1 (layout/IA freeze) **only** for tickets tagged `[IA]`. Every other Elpis Reborn constraint stays binding.

---

## 0. North Star

Elpis Reborn made the archive beautiful. Elpis Reborn 2 makes it **useful at 20:40 on a Saturday**: a roleplayer opens the site and within seconds knows what is happening tonight, where it is, and who is there, and every character, venue and story reads like a calling card instead of a form.

**Three measurable goals** (targets from Vision §7.2, measured after Phase D):

1. **Wayfinding.** ≥ 80 % task success without help on the three task tests ("Finde ein Event heute Abend", "Finde einen Charakter und seine Kontakte", "Lies eine Geschichte mit Inhaltswarnung"); ≤ 2 misclicks per task; SEQ ≥ 5.5.
2. **"What's on tonight."** "Event heute" solved in < 30 s from a cold start on `/`.
3. **Content integrity.** 0 raw `[[wikilinks]]` and 0 visible "(FOLGT)" placeholders on a 20-profile sample; content warnings perceived before the text by 5/5 testers.

Performance gates inherited from Elpis Reborn: Lighthouse ≥ 85 on Slow 4G, CLS ≤ 0.05, INP ≤ 200 ms p75.

---

## 1. Constraint delta

| memory.md constraint | Elpis Reborn | Elpis Reborn 2 |
|---|---|---|
| #1 Layouts / routes / IA do not change | binding | **lifted for `[IA]` tickets** — see route rule below |
| #2 Quasar stays | binding | binding |
| #3 German UI strings stay German | binding | binding (add `lang="de"`, mark English passages) |
| #4 DSGVO (no CDN fonts, no trackers) | binding | binding — presence (ER2-806) is opt-in with auto-expiry |
| #5 Reduced motion in the same commit | binding | binding — timeline, palette, veil, lightbox included |
| #6 AA body / AAA headlines, both themes | binding | binding |
| #7 No FFXIV asset extraction | binding | binding |
| #8 No emojis | binding | binding |
| Brand tokens / `quasar.variables.scss` | preserve | preserve |

**Route rule.** No existing public URL is renamed or removed. New structure is added as children or aliases (e.g. `/:server/:character/:tab`), old URLs keep working, and existing redirects (`/event-calendar` → `/calendar`) stay.

---

## 2. Starting point — verified facts

Collected from the working tree on 2026-10-18 (client paths relative to `client/src/`, server paths to `server/`).

### 2.1 Shell & routing
- Every route in `router/routes.ts` declares `component: MainLayout` on its own top-level record, so the shell re-mounts between sections. A persistent nav, palette or player-state needs **one parent route** first.
- Header (`layouts/MainLayout.vue:3–137`): nameplate toggles the drawer; inline nav (`navGroups`, `:256–303`, four hover dropdowns) is `gt-lg` only; hamburger `lt-xl`; theme toggle `:83–95`.
- Search exists only inside the left drawer (`:139–148`, `components/search/SiteSearchField.vue`, Enter → `/search?q=`). No keyboard shortcut anywhere.
- Logo hero renders on every route (`:151–184`, 50 px padding, 540 px logo).
- Calendar widget lives in the `.layout__page-shell` grid `1fr | 1300px | 320px | 1fr` (`:186–194`, CSS `:1356–1380`), hidden only on `/calendar*`, leaving an empty 320 px column there.
- `MainLayout.vue` is ~1500 lines including ~120 lines of dark-mode nav variables (`:795–917`).

### 2.2 Pages & components
- **Section drawers are bespoke:** `pages/Character.vue:2–119` (local `tab` state, no URL), `pages/Venue.vue:3–58` (`:section` parsed on load, not written back on click). `Community.vue` / `FreeCompany.vue` are linear pages with inline member grids.
- **Raw wikilinks:** `components/character/CharacterContacts.vue:5–17`, `CharacterPersonality.vue`, `CharacterAppearance.vue` render text as readonly `q-input`; `CharacterPenAndPaper.vue:398` sets `html:false`. `LinkField.vue` and `HtmlViewer.vue` already parse links via `client-common/src/common/wikilinks.ts` (regex does not span newlines — possible second cause).
- **Locale:** `boot/display.ts:27` `DATE_FORMAT = 'd MMMM yyyy'` ("2 April 2026"); `<q-calendar-month>` in `pages/EventCalendar.vue:63–67` has no `locale` prop (English weekdays).
- **Reusable today:** `components/aetherium/{AetheryteBadge,GlyphCorner,TriskelionDivider}.vue`, `common/ScrollProgressRule.vue`, `common/WikilinkHint.vue` (popup proxy), `images/ThumbGallery.vue`, `images/ImageSlidesDialog.vue`, `eventbar/EventItem.vue`, `eventbar/CalendarSidebarWidget.vue`, `sidebar/UserMenu.vue`, `.elpis-*` blocks in `css/app.scss`, tokens in `css/aetherium/*.scss`.

### 2.3 Data & API
| Capability | Exists | Gap |
|---|---|---|
| Event sign-ups | `EventRegistration` entity, `POST/DELETE /events/:id/registrations` (`api/internal/events/events.controller.ts:119–137`), participants in `EventDto` | closed events only; no "interested", no capacity, no reminders |
| Recurrence | venue weekly template `eventStartWeekday/Time/EndTime/EndDurationDays` (server TZ) | no recurrence on events, no series |
| Venue location | `location`, `housingArea`, `ward`, `plot`, `room`, `subdivision` | events: `EventLocation.address` free text + optional `venue` link |
| Opening hours | one weekly slot (template above) | multi-day hours, exceptions |
| Presence | — (`Character.currently` is free text; socket `updates` namespace serves the RPP plugin only) | everything |
| Reactions | — | everything |
| Feed | `GET /changes` (`ChangeItemDto`, area filter), `GET /main-page` (`MainPageContentDto`) | — |
| Search | `GET /search?q=` (9 full-text queries, ≥ 3 chars, no prefix) | **bug:** `search/search.service.ts:194` queries noticeboard repo for wiki; hidden events not filtered; no autocomplete |
| Content warnings | M2M `ContentNote` on Story/Event/Venue | — |
| Draft / test content | `Event.hidden` only | no draft flag on Story/WikiPage; `/test-*` routes mostly unguarded |
| Schema | TypeORM `synchronize: true`, no migrations | new columns must be nullable/defaulted; new entities registered in `libs/configuration/src/db.config.ts` |

---

## 3. Design-system additions

### 3.1 Tokens
Mirror the Penpot `vision.*` tokens into `client/src/css/aetherium/color.scss` (Hydaelyn `:root`, Zodiark `body.body--dark`), and document them in `AETHERIUM.md`:

| Token | Hydaelyn | Zodiark | Use |
|---|---|---|---|
| `--vision-primary` / `--vision-on-primary` | `#DDB476` / `#2B2418` | `#C19BFF` / `#150B23` | primary button, active chip, active tab count |
| `--vision-primary-hover` | `#E8C68E` | `#D2B6FF` | hover |
| `--vision-danger` / `--vision-on-danger` | `#B3363E` / `#FFFFFF` | `#F08A93` / `#150B23` | destructive actions |
| `--vision-live` / `--vision-live-bg` | `#2E7D4F` / `rgba(46,125,79,.12)` | `#6EDCA8` / `rgba(110,220,168,.14)` | Live, Geöffnet, Im RP |
| `--vision-cw-bg` / `-text` / `-border` | `rgba(229,178,94,.16)` / `#6B4C21` / `rgba(186,140,60,.55)` | `rgba(243,217,164,.10)` / `#F3D9A4` / `rgba(243,217,164,.45)` | content warnings (AA in both themes) |
| `--vision-now` | `#C7484F` | `#FF8FA0` | timeline "Jetzt" marker, unread dot |
| `--vision-card` | `#FBF6EA` | `#1F1130` | card surface (aligns with `--surface-raised`) |

Concepts otherwise use existing Aetherium roles (`--surface-*`, `--ink-*`, `--rule-*`). Zodiark therefore uses the violet Elpis Reborn palette, not the legacy navy.

### 3.2 Shared components (`client/src/components/vision/`)
| Component | Penpot reference | Notes |
|---|---|---|
| Button variants | E · Komponenten › Vision / Button | Prefer `q-btn` + classes `elpis-btn--primary/secondary/ghost/danger`; sentence case, no `uppercase` |
| `StatusBadge.vue` | Vision / Badge | types Live, Open, Soon, Recurring, Countdown, Server, CW, RP-IC, RP-LFRP, RP-OOC |
| `AvatarStack.vue` | Vision / AvatarStack | overlap −8 px, 2 px ring, trailing label |
| `SectionTabs.vue` | Vision / Tab | labelled tabs with icon + count; syncs to a child route or `?tab=`; keyboard arrows; replaces bespoke drawers |
| `PageHead.vue` | every directory board "Kopf" | eyebrow, Cinzel title, lead, action slot |
| `Breadcrumbs.vue` | detail boards | from route `meta.breadcrumb` |
| `DirectoryCard.vue` | F/C·Treffpunkte/H/L cards | banner slot, avatar/crest overlap, meta, chips, footer |
| `EventCard.vue` | Vision / EventCard | Default/Live states; time + relative time; location; RSVP stack + action |
| `EmptyState.vue` | Vision / Empty · * | icon, title, one sentence, exactly one action; visitor vs owner copy |
| `HoverCard.vue` | Vision / HoverCard · * | character/venue/event; `q-menu` on hover + focus, long-press on touch; data via `links-api.resolve` or detail endpoints |
| `CommandPalette.vue` | Vision / CommandPalette | Ctrl+K / Cmd+K; grouped results; actions; focus trap |
| `TimelineStrip.vue` | A · Home-Hub "Timeline 18–02" | lanes, now marker, live bars |
| `CwVeil.vue` | D · Inhaltswarnung | blocks content until confirmed; per-session memory |
| `Lightbox.vue` | J · Lightbox | replaces `images/ImageSlidesDialog.vue` |

---

## 4. Epics & tickets

Conventions follow `UI_UX_REWORK_BACKLOG.md`: sizes **XS** (≤ 0.5 d) · **S** (0.5–1 d) · **M** (1–3 d) · **L** (3–5 d) · **XL** (split before pulling); statuses planned · in-progress · review · done · blocked, written inline as `**[done YYYY-MM-DD]**`. Deps reference ER2 numbers without prefix; `ELPIS-xxx` refers to the existing backlog. `[IA]` = needs the constraint lift.

### EPIC 0 — Foundations
> *Make structural change cheap and safe. No visible redesign yet.*
> Budget: +15 KB gzip. Sprint: B1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-001 | **[done 2026-10-18]** `[IA]` Consolidate routes under one `MainLayout` parent | M | – | `router/routes.ts` has a single `{ path: '/', component: MainLayout, children: [...] }`; every existing path, param regex, guard and redirect preserved; shell no longer re-mounts between sections (verified via a mounted-counter log); smoke list of all routes passes |
| ER2-002 | **[done 2026-10-18]** Split `MainLayout.vue` into `layouts/shell/` parts | M | 001 | `ShellHeader.vue`, `ShellHero.vue`, `ShellFooter.vue`, `ShellDrawer.vue` extracted; behaviour unchanged; dark variables move with their component |
| ER2-003 | **[done 2026-10-18]** Vision tokens in Aetherium | S | – | §3.1 tokens in `css/aetherium/color.scss` for both themes; documented in `AETHERIUM.md`; contrast table (AA) recorded |
| ER2-004 | **[done 2026-10-18]** Button hierarchy classes | S | 003 | `elpis-btn--primary/secondary/ghost/danger` + hover/focus/disabled in `app.scss`; focus ring `--glow-aether`; sentence case globally (`text-transform: none` on `q-btn`) |
| ER2-005 | **[done 2026-10-18]** `StatusBadge`, `AvatarStack`, `EmptyState` | M | 003 | components in `components/vision/`; all badge types from §3.2; EmptyState supports visitor/owner copy |
| ER2-006 | **[done 2026-10-18]** `SectionTabs` with route sync | M | 001 | labelled tabs, counts, icons; v-model ↔ child route **or** `?tab=`; arrow-key navigation; `aria-selected`; mobile horizontal scroll |
| ER2-007 | **[done 2026-10-18]** `PageHead`, `Breadcrumbs`, `DirectoryCard`, `EventCard` | L | 005 | match Penpot boards in both themes; breadcrumbs read `route.meta.breadcrumb` (string or function) |
| ER2-008 | **[done 2026-10-18]** German locale everywhere | S | – | `boot/display.ts` `DATE_FORMAT = 'd. MMMM yyyy'` (+ datetime variant); Luxon `Settings.defaultLocale = 'de'`; `<q-calendar-month locale="de-DE">` in `pages/EventCalendar.vue`; no English weekday left (grep) |
| ER2-009 | **[done 2026-10-18]** Search fixes | S | – | `search/search.service.ts:194` uses a WikiPage repository; hidden events excluded; unit test for both in `server/` |
| ER2-010 | **[done 2026-10-18]** Wikilink rendering in character fields | M | – | Contacts, Personality, Appearance and P&P text blocks render through `LinkField.vue` / `HtmlViewer.vue`; `wikilinks.ts` regex handles line breaks inside `[[…]]`; no raw `[[` on the sample profiles from the audit |

### EPIC 1 — Quick wins (Vision tier S)
> *Fix what hurts today; valid inside the current Elpis Reborn rules (no `[IA]`).*
> Budget: +3 KB gzip. Sprint: A (can start immediately).

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-101 | **[done 2026-10-18]** Content-warning chips readable in Zodiark | XS | 003 | story/event CW chips use `--vision-cw-*`; warning icon; contrast ≥ 4.5:1 both themes (Vision #1, S1) |
| ER2-102 | **[done 2026-10-18]** Link and meta contrast in Hydaelyn | XS | – | links ≥ 4.5:1 on parchment (bronze `#8A5A14` or `--ink-link`), underline on hover/focus; meta text ≥ `#6B6B6B` equivalent (Vision #8, S2) |
| ER2-103 | **[done 2026-10-18]** Apply button hierarchy | S | 004 | lilac/orange/pink one-offs replaced; Discord blurple only on Discord login; ALL-CAPS removed (Vision #7, #9, S3) |
| ER2-104 | **[done 2026-10-18]** Remove hard-coded dark colours | XS | – | `#616161` byline, `#555` dialog hint, `#1D1D1D` tab panel tokenised; dark table dividers `rgba(255,255,255,.08)` (Vision #10, S4, live bugs) |
| ER2-105 | **[done 2026-10-18]** Copy fixes | XS | – | consent dialog umlauts; "Gallerie" → "Galerie"; "Edit/Preview/Description" German; MyContent `color="danger"` → defined colour, "Confirm Delete" → "Löschen bestätigen" (Vision #15, S6, live bugs) |
| ER2-106 | **[done 2026-10-18]** Consent dialog choice parity | XS | 004 | both options same weight (DSGVO), scrim 60 % |
| ER2-107 | **[done 2026-10-18]** Hyphenation and language | XS | – | `lang="de"` on `<html>`; `hyphens: auto` on body copy; P&P empty values dimmed (Vision #17, S7) |
| ER2-108 | **[done 2026-10-18]** Header indent alignment | XS | – | all directory hero titles align to the content grid (Vision #12, S8) |
| ER2-109 | **[done 2026-10-18]** Skip link | XS | – | "Zum Inhalt springen" first focusable element, visible on focus, targets `<main>` (§5, S9) |
| ER2-110 | **[superseded by ER2-401]** Character drawer active state | XS | – | interim fix until ER2-401: active item indicator like ELPIS-406 |
| ER2-111 | **[done 2026-10-18]** Hide test content from public lists | S | – | stories/wiki titled as tests or with empty body excluded from main page, changes and directory queries (server filter); `/test-*` routes admin-guarded (Vision #6, L6 partial) |
| ER2-112 | **[done 2026-10-18]** Hide empty fields for visitors | S | – | "(FOLGT)" and empty detail rows not rendered for non-owners on all character tabs (Vision #6) |

### EPIC 2 — Shell & navigation
> *Visible wayfinding on every page.* Penpot: **A · Shell & Home-Hub**, **E · Komponenten › Shell**.
> Budget: +20 KB gzip (palette lazy-loaded). Sprint: B2.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-201 | **[done 2026-10-18]** `[IA]` New top bar | L | 002, 004 | compact logo (≤ 40 px high) links home; 7 primary areas visible from `lg` (Charaktere · Treffpunkte · Events · Geschichten · Anschlagbrett · Galerie · Wiki) with active underline; search field + "Strg K" hint; notifications slot; theme toggle; account pill with avatar (+ RP status once ER2-806 lands); remaining `navGroups` items move into the account menu or a "Mehr" menu |
| ER2-202 | **[done 2026-10-18]** `[IA]` Logo hero on Home only | S | 002 | `ShellHero` renders only on `/`; all other routes start with content (≥ 200 px gained) |
| ER2-203 | **[done 2026-10-18]** `[IA]` Remove calendar widget from page shell | S | 002 | page-shell grid single-column on every route; `/calendar` empty column gone; widget component kept for ER2-302 |
| ER2-204 | **[done 2026-10-18]** Breadcrumbs on detail routes | S | 007 | `meta.breadcrumb` on character, venue, event, story, noticeboard item, wiki, FC, community routes |
| ER2-205 | **[done 2026-10-18 — done; safe-area needs viewport-fit (ER2-polish)]** Mobile navigation | M | 201 | below 1024 px: bottom bar with 5 targets (Start, Events, Charaktere, Suche, Profil) + "Mehr" sheet; replaces hamburger-only; safe-area insets |
| ER2-206 | **[done 2026-10-18]** Command palette v1 | L | 001, 005 | `CommandPalette.vue` opens on Ctrl/Cmd+K and from the search field; debounced (≥ 3 chars) call to `GET /search`; results grouped by type; actions (Event erstellen, Zu meinem Profil, Charakter wechseln); ↑↓/↵/Esc; focus trap; lazy-loaded chunk |
| ER2-207 | **[done 2026-10-18]** Command palette v2 | S | 206, 809 | switches to the autocomplete endpoint; prefix matches from 2 chars; recent items |
| ER2-208 | **[done 2026-10-18]** Hover cards | L | 005 | `HoverCard.vue` on every rendered wikilink, character/venue/event link in prose and lists; hover + focus; long-press on touch; data cached per session |

### EPIC 3 — Home hub
> *"Heute in Eorzea" replaces nine "Neue …" tiles.* Penpot: **A · Shell & Home-Hub**.
> Budget: +8 KB gzip. Sprint: C1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-301 | **[done 2026-10-18]** `[IA]` Home hero with today strip | M | 202 | hero keeps the large logo + tagline; "Heute-Leiste": events live now, tonight, venues open, characters in RP (last two fall back gracefully until 805/806); CTAs "Was läuft heute?" / "Event eintragen" |
| ER2-302 | **[done 2026-10-18]** `TimelineStrip` "Heute Abend" | L | 007 | 18:00–02:00 lanes from today's events (`events-api`), live bars, now marker updating each minute, tabs Jetzt / Heute Abend / Diese Woche; reduced-motion safe |
| ER2-303 | **[done 2026-10-18]** "Gleich & gerade" list | S | 007, 302 | next 3 events as `EventCard` (Live state when running) |
| ER2-304 | **[done 2026-10-18]** "Jetzt geöffnet" panel | M | 007 | venues open now / opening soon computed client-side from the weekly template (`eventStartWeekday/Time/EndTime/EndDurationDays`, server TZ); switches to ER2-805 data when available |
| ER2-305 | **[done 2026-10-18]** Activity feed | M | 005 | `GET /changes` rendered as a feed with avatars, previews (diary excerpt, image thumbs, rumour quote, event card) and area filter chips; replaces "Neueste Änderungen" |
| ER2-306 | **[done 2026-10-18]** Side modules + gallery band | S | 305 | "Neueste Geschichten" (with CW badges), "Neue Gesichter" (`newProfiles`), gallery band (`newScreenshots`/`newArtwork`); equal module heights |

### EPIC 4 — Characters & communities
> *Profiles become calling cards; "Charaktere" becomes the home of every "who".* Penpot: **B · Charakterprofil**, **F · Charaktere**, **L · Gemeinschaften**, **L · Freie Gesellschaft**.
> Budget: +10 KB gzip. Sprint: C2.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-401 | **[done 2026-10-18]** `[IA]` Character tabs as `SectionTabs` + child routes | M | 006 | `/:server/:character/:tab` (profil, aussehen, persoenlichkeit, kontakte, geruechte, tagebuch, galerie, inventar, pen-and-paper); old URL lands on profile; tabs with counts; empty tabs hidden for visitors, dimmed "+" for owners; drawer removed from `pages/Character.vue` |
| ER2-402 | **[done 2026-10-18]** `[IA]` Adventurer-plate header | L | 401 | full-bleed banner with scrim, `AetheryteBadge` overlapping, title above name (IM Fell), "World [Light]", race/clan, FC crest chip, play-style chips, share + contact actions in the header; profile accent colour slot (optional field later) |
| ER2-403 | **[done 2026-10-18]** Profile overview with previews | M | 402, 010 | fact tiles (3 columns, empty hidden), background with initial, latest diary entry, rumours excerpt, contacts as linked avatar rows, 4 gallery thumbs |
| ER2-404 | **[done 2026-10-18]** Owner view | S | 403 | owner sees dashed "Ergänzen" tiles, profile completeness bar and owner empty states (`EmptyState` owner copy) |
| ER2-405 | **[done 2026-10-18]** `[IA]` "Charaktere" area tabs | S | 006 | `/profiles`, `/free-companies`, `/communities` share a `PageHead` + `SectionTabs` (Personen · Freie Gesellschaften · Communities) linking the existing URLs; top-nav "Charaktere" active on all three |
| ER2-406 | **[done 2026-10-18 — partial: list API has no banner/lore title/last-active]** Characters directory cards | M | 007, 405 | `pages/Characters.vue` card grid (banner, avatar, title, meta, tags, last active); filters (Volk, Welt, Mit Galerie); "Mehr laden" |
| ER2-407 | **[done 2026-10-18]** "Gerade im RP" strip | S | 406, 806 | strip of characters with active RP status; hidden when none |
| ER2-408 | **[done 2026-10-18 — partial: summaries lack tag, member stack, next event]** FC & community directory cards | M | 007, 405 | crest, tag, seat, focus sentence, "Nimmt Mitglieder auf" badge (from existing recruiting/status data or new flag, see 810), member stack, next event |
| ER2-409 | **[done 2026-10-18]** Shared member card | S | 005 | extracted from `Community.vue:30–64` / `FreeCompany.vue:6–44`; rank + RP status dot |
| ER2-410 | **[done 2026-10-18 — partial: no "Was wir spielen"/events/gallery tabs (no data); FC "Bewerben" links to website]** `[IA]` FC / community detail | L | 006, 409 | hero with crest, "Bewerben"/"Beitreten" primary action, `SectionTabs` (Übersicht · Mitglieder · Events · Galerie · Geschichten), "Was wir spielen", key-facts card |

### EPIC 5 — Events & venues
> *Answer "what's on and where" in one glance.* Penpot: **C · Events**, **C · Event-Detail**, **C · Treffpunkte**, **G · Treffpunkt-Detail**.
> Budget: +10 KB gzip. Sprint: D.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-501 | **[done 2026-10-18]** `[IA]` Events list-first | L | 007, 008 | `pages/EventCalendar.vue` default view = list grouped by day (Heute / Morgen / date), tabs Heute · Diese Woche · Monat; month grid becomes the secondary "Kalender" view + mini calendar; `/calendar/:year/:month` still works |
| ER2-502 | **[done 2026-10-18]** Event filter chips | S | 501 | type, server, SFW, "Läuft jetzt" as chips; replace the two dropdowns |
| ER2-503 | **[done 2026-10-18]** Recurring evenings panel | S | 501 | groups events by venue template / series; shows rule + next 3 dates (uses 804 when available) |
| ER2-504 | **[done 2026-10-18]** `[IA]` Event detail hero + action bar | M | 007 | `pages/Event.vue`: hero with date block, live status, title, chips; sticky action bar; "Ich bin dabei" wired to existing `POST/DELETE /events/:id/registrations` for closed events, "Interessiert" + .ics after 801/802; participants as `AvatarStack` |
| ER2-505 | **[done 2026-10-18]** Structured event location | S | 504 | when `EventLocation.venue` is set: Welt › Wohngebiet › Bezirk › Haus from venue fields + copyable teleport command; free-text address otherwise |
| ER2-506 | **[done 2026-10-18]** Event programme | S | 504 | optional schedule rendered as a timeline when the description contains a list of times (or a field after 803) |
| ER2-507 | **[done 2026-10-18 — partial: venue list lacks banner, tags, SFW flag, next event]** Venue directory cards + status | M | 007, 304 | `pages/Venues.vue` banner cards with Open / Opens at / Closed badge (status logic shared with 304), tags, next event, regulars; filter "Heute geöffnet", SFW, category; server tag hidden when filtered |
| ER2-508 | **[done 2026-10-18]** `[IA]` Venue detail tabs with URL write-back | M | 006 | `pages/Venue.vue` drawer → `SectionTabs` driven by `visibleSections`; clicking updates `/venue/:server/:name/:section` |
| ER2-509 | **[done 2026-10-18]** Venue hero, hours card, location card | M | 508 | hero with status + motto + teleport copy; weekly opening-hours card (today highlighted); team card |
| ER2-510 | **[done 2026-10-18]** Carrd embed collapsed | XS | 508 | Carrd profile shown as collapsed "Externe Seite" card; expands on demand; no white block in Zodiark |

### EPIC 6 — Long-form: stories, noticeboard, wiki
> *Reading as a pleasure, warnings as protection.* Penpot: **D · Leseansicht**, **H · Geschichten**, **I · Anschlagbrett**, **I · Aushang**, **K · Wiki**.
> Budget: +8 KB gzip. Sprint: E1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-601 | **[done 2026-10-18]** Story reader layout | M | 007 | `pages/Story.vue`: 68ch column, title block (eyebrow, title, lede, byline, reading time + word count), reuse `ScrollProgressRule`, drop cap (ELPIS-502) kept; left rail with font size and Pergament/Nacht switch (persisted) |
| ER2-602 | **[done 2026-10-18]** `CwVeil` before content | S | 101 | stories/events with content notes show the veil until confirmed; "nicht mehr fragen" per session; screen-reader announces warnings first |
| ER2-603 | **[done 2026-10-18 — done without "Benachrichtigen" (no follow concept)]** Chapter navigation | S | 601, 808 | Teil n von m rail + previous/next cards; "Benachrichtigen" for the next part (after 808) |
| ER2-604 | **[done 2026-10-18]** `[IA]` Stories directory | M | 007, 006 | type tabs (Alle · Geschichten · Tagebücher · Gedichte · Serien), featured module, "Weiterlesen" from localStorage progress, cards with type, reading time, excerpt, CW badge, series chip; filters "Ohne Inhaltswarnung", "Unter 5 Min." |
| ER2-605 | **[done 2026-10-18 — partial: no pinned/image/Discord-posted fields in data]** `[IA]` Noticeboard masonry | M | 007 | `pages/Noticeboard.vue`: pinned row, `[Typ]` prefix in type colour + top rule, three-column masonry, type and location chips, "auf Discord" indicator |
| ER2-606 | **[done 2026-10-18]** Noticeboard item + Discord preview | M | 605 | `NoticeboardItemView.vue` parchment layout with image + caption, contact box, related notices; Discord-embed preview component mirroring `announcement.service.ts` output (closes ELPIS-511 clause) |
| ER2-607 | **[done 2026-10-18]** `[IA]` Wiki three-column layout | M | 010 | `components/wiki/WikiPageView.vue`: TOC from headings (active section on scroll), article column, infobox (from a leading table in content, optional), "Erwähnt in" populated from link back-references, edit/version actions in the rail |
| ER2-608 | **[done 2026-10-18]** Wiki "Erwähnt in" endpoint | S | – | server: list stories/noticeboard/events whose content links `/link/<title>`; cached |
| ER2-609 | **[done 2026-10-18]** Wiki index | S | 607 | `/wiki` landing (new route, additive) listing categories and recent pages |

### EPIC 7 — Media
> *The gallery as a showcase.* Penpot: **J · Galerie**, **J · Lightbox**.
> Budget: +6 KB gzip. Sprint: E2.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-701 | **[done 2026-10-18]** `[IA]` Gallery tabs + grid | M | 006 | `pages/Gallery.vue`: Screenshots · Kunstwerke · Alben tabs (existing `/gallery/:category`), filter chips, large tiles with hover caption (title, author, reactions after 807), keyboard focus ring |
| ER2-702 | **[done 2026-10-18]** `Lightbox` replaces `ImageSlidesDialog` | M | 005 | full-bleed dark stage, prev/next, counter, close, thumbnail strip, Esc/←/→, info panel (description, tagged characters, location, download, share); same props as `ImageSlidesDialog` for drop-in use |
| ER2-703 | **[done 2026-10-18]** Character gallery alignment | XS | 701 | last row left-aligned; optional album grouping |
| ER2-704 | **[done 2026-10-18 — partial: image DTO has no tagged characters; shows linked event/venue]** Tagged characters on images | S | 702 | display existing character/venue references as chips; server field only if missing (check `images` module first) |

### EPIC 8 — Backend features (Vision tier L)
> *Data the new UI needs. Additive schema only (`synchronize: true`).* Each ticket: entity in `server/libs/entity/src`, DTO in `server/libs/shared`, endpoint under `server/apps/chaosarchives/src/api/internal/`, client call in `client-common/src/common/api/`, registered in `db.config.ts`, Jest test.
> Sprint: interleaved B–E.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-801 | **[done 2026-10-18]** Interest + open-event RSVP | L | – | `EventRegistration` gains `kind` (`going` / `interested`, default `going`); open events accept both; counts + participant list in `EventDto`; `EventCard`/`Event.vue` actions wired |
| ER2-802 | **[done 2026-10-18]** `.ics` export | S | – | `GET /events/:id.ics` and a per-user feed of registered events; correct Europe/Berlin TZ |
| ER2-803 | **[done 2026-10-18]** Event programme field (optional) | S | – | nullable `programme` JSON (time, title, note[]) on Event; editor support in `EditEvent.vue` |
| ER2-804 | **[done 2026-10-18]** Recurring events / series | XL → split | – | split into 804-A `EventSeries` entity + rule (weekly/biweekly/monthly-nth), 804-B generation of occurrences, 804-C editor UI; directory shows one card per series with next dates |
| ER2-805 | **[done 2026-10-18]** Venue opening hours | L | – | `VenueOpeningHours` (weekday, open, close, overnight flag) + exceptions; editor in `EditVenue.vue`; `isOpenNow`/`opensAt` computed server-side in server TZ; weekly template used as migration seed |
| ER2-806 | **[done 2026-10-18]** RP presence status | L | – | character fields `rpStatus` (IC / LFRP / OOC / null), `rpLocation`, `rpStatusExpiresAt`; set from account menu; auto-expire; opt-in; broadcast on a new socket.io namespace (separate from `updates`); DSGVO note in privacy text |
| ER2-807 | **[done 2026-10-18]** Story & image reactions | L | – | `Reaction` entity (target type/id, character, kind from a fixed German set); counts in DTOs; one reaction per kind per character; moderation hook (report → hide) |
| ER2-808 | **[done 2026-10-18]** Story series | M | – | nullable `seriesId`, `seriesIndex` on Story; series DTO for chapter nav; "Benachrichtigen" via Discord/webhook later |
| ER2-809 | **[done 2026-10-18]** Autocomplete endpoint | M | 009 | `GET /search/suggest?q=` prefix match (`word*`), titles only, ≤ 5 per type, from 2 chars, < 100 ms p95 on prod data |
| ER2-810 | **[done 2026-10-18]** Draft / published + recruiting flags | M | – | `published` (default true) on Story and WikiPage, excluded when false from public lists; `recruiting` boolean on FreeCompany/Community if no equivalent exists |

### EPIC 9 — Accessibility & validation
> *Prove it works for people.* Sprint: continuous, sign-off in F.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-901 | **[done 2026-10-18 — code-level; no screen-reader/browser session yet]** Focus management | M | 206, 702 | palette, lightbox, dialogs and veil trap focus and return it on close; Esc closes |
| ER2-902 | **[done 2026-10-18 — code-level; no screen-reader/browser session yet]** Screen-reader pass | M | Epics 2–6 | NVDA + VoiceOver on Home, Profil, Events, Story; landmarks; heading order; badges have text alternatives |
| ER2-903 | **[done 2026-10-18 — code-level; no screen-reader/browser session yet]** Target sizes | S | – | interactive targets ≥ 24 × 24 px, primary actions ≥ 44 px (WCAG 2.5.8) |
| ER2-904 | Baseline task test | S | Epic 1 | three Vision §7 tasks, 5 participants, recorded in `memory.md` |
| ER2-905 | Re-test after Phase D | S | Epics 2–5 | same tasks; compare against §0 targets |
| ER2-906 | **[done 2026-10-19]** Board conformance review | S | per epic | each implemented page compared with its Penpot board in Hydaelyn and Zodiark; deviations logged |

---

## 5. Phased roadmap

Each phase ships on its own and has a demo target.

| Phase | Epics | Length | Demo target (Penpot boards) |
|---|---|---|---|
| **A — Quick wins** | 1 (+ 003, 004, 008, 009, 010 from Epic 0) | 1 sprint | CW chips readable in Zodiark, button hierarchy, German dates, no raw wikilinks on profiles |
| **B — Foundations & shell** | 0, 2 | 2 sprints | A · Shell: new top bar, hero only on Home, no global widget, Ctrl+K palette, breadcrumbs, mobile bar |
| **C — Home & characters** | 3, 4 | 2 sprints | A · Home-Hub, B · Charakterprofil, F · Charaktere, L · Gemeinschaften / Freie Gesellschaft |
| **D — Events & venues** | 5 (+ 801, 802, 805) | 2 sprints | C · Events, C · Event-Detail, C · Treffpunkte, G · Treffpunkt-Detail |
| **E — Long-form & media** | 6, 7 (+ 807, 808) | 2 sprints | D · Leseansicht, H · Geschichten, I · Anschlagbrett / Aushang, K · Wiki, J · Galerie / Lightbox |
| **F — Validation** | 9 (+ 806, 804) | continuous, sign-off 1 sprint | task re-test against §0 targets |

**Total runway:** ~10 sprints. **Critical path:** ER2-001 → 002 → 201 → 006 → 401 / 508. **Parallelisable:** Epic 1 (anytime), Epic 8 backend tickets (once their consumer ticket is scheduled), Epic 7 after 005.

**Before Phase B:** commit the current uncommitted Elpis Reborn working tree (97+ files) on its own branch, so ER2 work starts from a clean, reviewable base.

---

## 6. Mapping: vision → tickets → boards

| Vision ref | Topic | ER2 tickets | Penpot board |
|---|---|---|---|
| #1 / S1 | CW chips dark | 101, 602 | E · Komponenten, D · Leseansicht |
| #2 / M2 | Calendar widget everywhere | 203, 302 | A · Shell & Home-Hub |
| #3 / M1, M3, M4 | No visible navigation | 201, 204, 205, 401, 405 | A, B, F |
| #4 / M1 | Hero on every page | 202, 301 | A |
| #5 / M5 | Raw wikilinks | 010, 208 | B, C · Event-Detail, K · Wiki |
| #6 / L6 | Placeholders, test content | 111, 112, 404, 810 | B (Besitzer-Ansicht) |
| #7, #9 / S3 | Accent soup, ALL-CAPS | 004, 103 | E · Komponenten |
| #8 / S2 | Link contrast | 102 | – |
| #10 / S4 | Dark dividers, Carrd | 104, 510 | G · Treffpunkt-Detail |
| #11 / M7 | Home grid | 301–306 | A |
| #12 / S5, S8 | Indents, locale | 008, 108 | – |
| #13 / L4 | Directories without images | 406, 408, 507, 805 | F, L, C · Treffpunkte |
| #14 / M9 | Image slides | 702 | J · Lightbox |
| #15 / S6 | Consent dialog | 105, 106 | – |
| #16 | Gallery grid | 703 | J · Galerie |
| #17 / S7 | P&P hyphenation | 107 | – |
| #18 / M6 | Profile header | 402, 403 | B · Charakterprofil |
| §4.4 / M8, L1, L2 | Event discovery | 501–503, 801, 802, 804 | C · Events |
| §4.5 / M12 | Structured location | 505, 509 | C · Event-Detail, G |
| §4.6 / L4 | Open badges | 304, 507, 805 | A, C · Treffpunkte |
| §4.7 / M11, L5 | Reader, reactions | 601–604, 807, 808 | D, H |
| §4.8 / M10 | Hover cards, palette, empty states | 005, 206–208 | E · Komponenten |
| §4.9 / L3 | RP presence | 806, 407 | B, F |
| §5 / S9, M13 | Accessibility | 109, 901–903 | – |
| Live bugs | Gallerie, Edit/Preview, danger, drawer state, weekdays | 105, 110, 008 | – |
| ELPIS-511 clause | Discord-embed preview | 606 | I · Aushang |

---

## 7. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Route consolidation (001) breaks deep links or guards | Medium | High | keep every path/regex/guard verbatim; scripted smoke test over all routes; ship 001 alone |
| `MainLayout.vue` size makes shell work risky | High | Medium | 002 splits it first with zero visual change |
| `synchronize: true` alters prod schema unexpectedly | Medium | High | additive, nullable/defaulted columns only; DB backup before each deploy with Epic 8 changes; review generated DDL on staging |
| Presence status raises privacy concerns | Medium | Medium | opt-in, auto-expiry, no history stored, privacy text updated (806) |
| Palette floods the full-text search | Medium | Medium | debounce + 3-char minimum in v1, dedicated suggest endpoint (809) for v2 |
| Large uncommitted Elpis Reborn diff collides with ER2 | High | High | commit/branch it before Phase B; ER2 branches start from it |
| Concept images are low-res crops | High | Low | real banners from the API in implementation; boards are layout reference only |
| Scope creep from the outlook ideas | Medium | Medium | §8 out-of-scope list; XL tickets must be split before pulling |
| Community resistance to a new IA | Low | Medium | baseline + re-test (904/905); keep old URLs working; short changelog post on Discord |

---

## 8. Definition of Done

**Per ticket** — everything in the `UI_UX_REWORK_BACKLOG.md` per-ticket DoD (AC met, reduced motion, axe AA, light/dark/system, xs/md/lg, bundle budget, reviewer sign-off), plus:
1. `[IA]` tickets: every pre-existing URL still resolves (manual list + smoke test).
2. Matches its Penpot board in Hydaelyn and Zodiark (ER2-906 note).
3. German copy reviewed (no English labels, correct umlauts, `de-DE` dates).
4. Server tickets: Jest test added, new entity registered in `db.config.ts`, DTO shared via `libs/shared`.
5. `memory.md` updated (status + "Last session" entry); ticket marked `**[done YYYY-MM-DD]**` here.

**Per phase** — Lighthouse ≥ 85 on `/` and one representative page per epic; CLS/INP within budget; demo target shown; one-week observation window before the next `[IA]` phase.

---

## 9. Out of scope

- i18n / a language switch (German stays the only UI language).
- Framework change (Quasar stays), news-app IA redesign (separate).
- Three.js crystal hero, particles and audio — still owned by ELPIS-107/108/109 and Epic 8 of the Elpis Reborn backlog.
- Relationship constellation, Eorzea map, plate PNG export, feed personalisation (Vision §4.10 outlook) — candidates for a later plan.
- Real-time chat or messaging inside the portal.

---

## 10. How to start a session

1. Read §5 to find the current phase, then pick the lowest-numbered unblocked ER2 ticket in it.
2. Open its Penpot board on "Vision (Konzept)" (light board y = 0 / 7000, dark board +3200) and the yellow note next to it.
3. Read the matching `UI_UX_VISION.md` section via §6.
4. Implement on a feature branch; keep Elpis Reborn constraints from §1.
5. Verify: `cd client && yarn lint`; for server tickets `cd server && yarn lint && yarn test`; run `quasar dev` and check both themes at xs/md/lg.
6. Mark the ticket `**[done YYYY-MM-DD]**`, add a "Last session" entry to `memory.md`, and note any board deviations.

---

## 11. Round 2 — closing the gaps

> *Round 1 shipped the surfaces; several of them fall back to placeholders because the summary DTOs never carried the data, and the social layer (follow, notify, remember) was cut. Round 2 fills those gaps.* Same rules as Epic 8: additive schema only (`synchronize: true`), entity in `server/libs/entity/src`, DTO in `server/libs/shared`, endpoint under `server/apps/chaosarchives/src/api/internal/`, client call in `client-common/src/common/api/`, Jest test for every new endpoint. Tickets start as `**[planned]**`.

### A. Data gaps

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-1001 | **[done 2026-10-18]** Venue summary fields | M | 507, 805 | `VenueSummaryDto` carries banner URL, tags, SFW flag and the next upcoming event (id, title, start); `pages/Venues.vue` cards render them instead of placeholders; no extra request per card |
| ER2-1002 | **[done 2026-10-18]** Character summary fields | M | 406 | character summary DTO carries banner, title, last active (day precision) and play style; directory cards and hover cards show them; last active respects the existing privacy settings |
| ER2-1003 | **[done 2026-10-18]** FC / community summary fields | M | 408 | FC and community summary DTOs carry tag, member count and the next event; directory cards show them; counts computed in one grouped query |
| ER2-1004 | **[done 2026-10-18]** Story summary fields | M | 604, 807, 808 | story summary DTO carries content notes, series (id, title, index), word count and reaction counts; directory cards show CW badge, series chip, reading time from word count and reactions |
| ER2-1005 | **[done 2026-10-18]** Noticeboard fields | M | 605 | `NoticeboardItem` gains nullable `pinned`, `imageId` and `postedToDiscord` (set by the announcement path); summary DTO carries a plain-text excerpt; ER2-605 pinned row, image and "auf Discord" indicator use real data; pinning restricted to moderators |
| ER2-1006 | **[done 2026-10-18]** Change feed avatars and thumbnails | S | 305 | change feed items carry the actor avatar and, where the target has one, a thumbnail URL; `HomeActivityFeed` and `/changes` render them with initials fallback |
| ER2-1007 | **[done 2026-10-18]** Contact avatars and diary image | S | 403, 305 | contacts lookup returns avatar URLs for linked characters in one batch call; diary entries accept an optional image; `CharacterContacts.vue` shows both |
| ER2-1008 | **[done 2026-10-18]** FC / community tabs | M | 410, 1003 | FC and community pages gain Events, Galerie and Geschichten tabs fed by existing endpoints filtered by owner; empty states in German; tabs deep-linkable |

### B. Social

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-1009 | **[done 2026-10-18]** Follows | L | – | `Follow` entity (follower character → character / FC / community / venue / story series); follow button on each profile; follower count in DTOs; unfollow; no public follower list unless the profile opts in |
| ER2-1010 | **[done 2026-10-18]** Notifications and the bell | L | 1009 | `Notification` entity (recipient, kind, target, read flag); created on new event/story/chapter by a followed target and on RSVP to own events; bell in `ShellHeader` with unread count over the existing socket; mark read / mark all read; 90-day retention |
| ER2-1011 | **[done 2026-10-18; Discord DM option removed 2026-10-19, reminders are in-app only]** Reminder scheduler with optional Discord DM | M | 1010, 801 | registered/interested events create a reminder (default 1 h before, configurable); scheduler fires in-app notifications; opt-in Discord DM via steward; idempotent across restarts |
| ER2-1012 | **[done 2026-10-18]** Bookmarks and the Gemerkt page | M | – | `Bookmark` entity for stories, events, venues, wiki pages, noticeboard items; bookmark toggle on cards and detail pages; `/gemerkt` page grouped by type; private to the user |
| ER2-1013 | **[done 2026-10-18]** Calendar subscription token | S | 802 | per-user secret token for the `.ics` feed (`/events/feed/:token.ics`) so calendar apps can subscribe without a session; regenerate invalidates the old URL; shown in account settings |

### C. Content

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-1014 | **[done 2026-10-18]** Wiki revisions | M | 607 | every save stores a `WikiPageRevision` (content, author, timestamp); history view with diff against the previous revision; restore by moderators |
| ER2-1015 | **[done 2026-10-18]** Gallery albums | M | 701 | `Album` entity (owner character, title, ordered images); album view reuses `ThumbGallery` and the lightbox; images can belong to several albums |
| ER2-1016 | **[done 2026-10-18]** FC applications | M | 810 | recruiting FCs and communities accept applications (character, message); leaders accept / decline; applicant notified (after 1010) |
| ER2-1017 | **[done 2026-10-18]** Accent colour and play style | S | 402 | character fields `accentColour` (from a fixed Aetherium-safe palette) and `playStyle` (enum set); editor in profile settings; plate and hero tint use the accent; contrast checked in both themes |
| ER2-1018 | **[done 2026-10-18]** FC "Was wir spielen" | S | 410, 1017 | FC and community profiles gain a "Was wir spielen" block (play style tags + free text); shown on the profile and as directory filter |
| ER2-1019 | **[done 2026-10-18]** Image tags with consent | M | 701 | images can tag characters; tag stays hidden until the tagged character's owner accepts; owner can remove a tag at any time; tagged images appear on the character's Galerie tab |
| ER2-1020 | **[done 2026-10-18]** CW veil on events | S | 602 | events with content notes show `CwVeil` on the event page and blur the banner on cards, same behaviour as stories |

### D. Outlook

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-1021 | **[done 2026-10-18]** Venue map view | L | 1001 | `/venues` gains a map toggle: housing districts as schematic maps with ward / plot pins from structured locations; open-now state on pins; list and map share filters |
| ER2-1022 | **[done 2026-10-18]** Relationship constellation | M | 1007 | character page shows contacts as a constellation graph (SVG, keyboard navigable, reduced-motion safe); list fallback for screen readers |
| ER2-1023 | **[done 2026-10-18]** Plate PNG export | S | 402 | "Als Bild speichern" on the character plate renders a PNG client-side in both themes; no server round trip; image alt text in the share sheet |

### E. Cleanup

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ER2-1024 | **[done 2026-10-18]** Server ESLint | S | – | `server/.eslintrc.js` loads the `import/*` rules (extends `airbnb-base` as `airbnb-typescript` 17 expects); `npx eslint "{apps,libs}/**/*.ts"` runs; ER2 files clean; remaining legacy errors listed in the cleanup report |
| ER2-1025 | **[done 2026-10-18]** Dead code | S | – | unused `CalendarSidebarWidget`, `SiteSearchField`, `EventList`/`EventItem`, `CommunityList`, `FreeCompanyNameList` and their global styles removed; store `events` state kept (still dispatched) |
| ER2-1026 | **[done 2026-10-18]** Lifestream syntax | S | 509 | `/li` command matches Lifestream's parser: English district names, `W<ward> P<plot>` with subdivision plots 31–60, apartments as `W<ward> [sub] A<room>`; source cited in `venue-location.ts` |
| ER2-1027 | **[done 2026-10-18]** Accessibility re-check | S | 901–903 | rerun focus, screen-reader and target-size checks on every Round 2 surface (bell, Gemerkt, tabs, map, constellation) |
| ER2-1028 | **[done 2026-10-19]** Board conformance (ER2-906) | S | 906 | each Round 1 and Round 2 page compared with its Penpot board in Hydaelyn and Zodiark; deviations logged |

---

## 12. The one-line pitch

> **Elpisgarten tells you, the moment you arrive, where Eorzea is alive tonight — and who you'll meet there.**
