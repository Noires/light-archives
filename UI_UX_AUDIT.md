# Light Archives — UI/UX Audit

**Scope:** Vue 3 + Quasar SPA (`client/`), Quasar newspaper SPA (`news/`), shared infrastructure (`client-common/`, `wsclient/`)
**Snapshot date:** 2026-04-27
**Branch:** `symphony/tr-7`
**Domain language:** German throughout (no i18n framework)

This document describes the *current state* of the user-facing surfaces of Light Archives (Elpisgarten), including layout shell, navigation, design system, all major content domains, editor flows, and the spin-off newspaper app. It is a structural and behavioral audit, not a recommendations document — observations and gaps are noted inline where the implementation diverges from convention or where placeholder content is still present.

---

## Table of Contents

1. [Application Shape & Surfaces](#1-application-shape--surfaces)
2. [Global Shell — `MainLayout.vue`](#2-global-shell--mainlayoutvue)
3. [Navigation & Routing](#3-navigation--routing)
4. [Authentication, Sessions, and Roles](#4-authentication-sessions-and-roles)
5. [Design System](#5-design-system)
6. [Home Page](#6-home-page-indexvue)
7. [Character Domain](#7-character-domain)
8. [Free Companies](#8-free-companies)
9. [Events & Calendar](#9-events--calendar)
10. [Venues](#10-venues)
11. [Communities](#11-communities)
12. [Stories](#12-stories)
13. [Noticeboard](#13-noticeboard)
14. [Wiki](#14-wiki)
15. [Gallery, Images & Upload Pipeline](#15-gallery-images--upload-pipeline)
16. [Search](#16-search)
17. [Support Tickets](#17-support-tickets)
18. [Moderation & Violations](#18-moderation--violations)
19. [Static Pages](#19-static-pages)
20. [Telemetry & Privacy Surface](#20-telemetry--privacy-surface)
21. [Rich Text Editing & Markdown](#21-rich-text-editing--markdown)
22. [The Harborwatch (`news/`) — Newspaper App](#22-the-harborwatch-news--newspaper-app)
23. [Shared Frontend Infrastructure](#23-shared-frontend-infrastructure)
24. [Cross-Cutting UX Patterns](#24-cross-cutting-ux-patterns)
25. [Responsive Behavior](#25-responsive-behavior)
26. [Accessibility Posture](#26-accessibility-posture)
27. [Known Placeholders, Inconsistencies, and Gaps](#27-known-placeholders-inconsistencies-and-gaps)

---

## 1. Application Shape & Surfaces

The product is a community portal for the Light EU FFXIV roleplay datacenter. It comprises three Vue 3 + Quasar SPAs sharing a TypeScript API client:

| Surface | Path | Purpose |
|---|---|---|
| Main client | `client/` | Character archive, communities, events, venues, stories, wiki, gallery, support |
| News app | `news/` | The Harborwatch — newspaper-style article publication |
| Shared API | `client-common/` | Strongly-typed REST API class hierarchy with token management |
| WebSocket client | `wsclient/` | Socket.io transport for live RPP character updates |

The main client has **~60 page components** and **~75 leaf components**, organized by domain folder under `client/src/components/` (`character/`, `event/`, `eventbar/`, `venues/`, `communities/`, `free-company/`, `stories/`, `noticeboard/`, `wiki/`, `images/`, `upload/`, `sidebar/`, `mainpage/`, `search/`, `common/`).

The news app is an order of magnitude smaller (~10 pages, ~12 components) and is intentionally low-fidelity: minimal animations, classical newspaper typography, fixed sidebars.

---

## 2. Global Shell — `MainLayout.vue`

`client/src/layouts/MainLayout.vue` (1519 lines) is the single layout used for every authenticated and unauthenticated route. `App.vue` is a 9-line file containing only `<router-view />` — there are no global wrappers above the layout.

### 2.1 Header (top bar)

A custom-built header (not Quasar's `q-header`) with a fixed grid:

- **Left cluster — character pill**
  - Avatar (42px desktop, 36px ≤600px) inside a gradient pill with a vertical divider, character first name + server abbreviation. Animates in over 670ms via `navReveal` and `navRevealDivider` keyframes.
  - When logged out, shows the placeholder string **"Eine fremde Gestalt"**.
- **Center — navigation**
  - Logo with `<picture>` retina sources (1×/2×/3×/4× WebP+PNG, dark/light variants).
  - Four expandable menu groups via `q-menu` with jump-down/up transitions and a 120ms close delay (so the user can sweep the cursor between trigger and menu without losing the popup):
    - **Datenbank** → Charaktere, Treffpunkte, Communities, Freie Gesellschaften
    - **Rollenspiel** → Eventkalender, Anschlagbrett, Geschichten
    - **Medien** → Screenshots, Kunstwerke
    - **Wissenswertes** → Neueste Änderungen, Regeln, FAQ, Anfängerguide, Über uns
- **Right cluster**
  - Theme toggle button (cycles Light → Dark → System; tooltip shows current and next mode).
  - Hamburger button revealed below `lt-xl` (≤1399px). Hamburger opens a single dropdown with `q-expansion-item` blocks per nav group.

### 2.2 Left drawer

Single drawer (no right drawer), dark-themed gradient (`rgba(26,26,26,0.98)` light mode, `rgba(16,25,37,0.97)` dark mode). Two sections:

- **`SiteSearchField`** — clearable input that pushes to `/search?q=…` on Enter, using `toSearchKeywords()`.
- **`UserMenu`** — see [§4.4](#44-user-menu).

### 2.3 Page shell

Below the header, a 3-column CSS grid:

```
[ flex gutter ] [ 1300px content ] [ 320px sticky calendar widget ] [ flex gutter ]
```

The 1300px content slot has 30px border-radius and a near-white surface (`#fdfdffee` light / `rgba(14,19,27,0.92)` dark). The sticky right-rail `CalendarSidebarWidget` is hidden on the `/calendar` route to avoid duplication. Below 1200px the grid collapses to a single column.

### 2.4 Footer

Fixed footer with FFXIV/Square Enix copyright, German rights notice, and links to `/privacy-statement` and `/impressum`. Background `#ebebeb` light / matched dark surface.

### 2.5 Telemetry consent prompt

`mounted()` calls `promptTelemetryConsentIfRequired()`, which checks a session flag, Sentry configuration, and the store getter `shouldPromptTelemetryConsent`. If true, opens `TelemetryConsentDialog` (see [§20](#20-telemetry--privacy-surface)).

---

## 3. Navigation & Routing

### 3.1 Router setup

`client/src/router/index.ts` (98 lines) installs two guards:

- **`beforeEach`** — intercepts Discord OAuth callbacks of the form `?token=…&refreshToken=…`. On callback it calls `api.user.getSession()`, commits the user, then redirects:
  - To `/terms` if terms not yet accepted.
  - To `/verify` if no character is verified.
  - Otherwise to `/`.
- **`afterEach`** — sets `document.title` from `route.meta.title` (which can be a string or a function of the route).

### 3.2 Route catalogue

`client/src/router/routes.ts` (650 lines) — every route is rendered through `MainLayout`:

| Path | Page | Notes |
|---|---|---|
| `/` | `Index.vue` | Hero + activity panels |
| `/about`, `/rules`, `/contact`, `/faq`, `/changes`, `/beginner-guide` | static pages | German titles in meta |
| `/terms`, `/verify` | onboarding | gated by router guard |
| `/edit-character/:id/{profile,appearance,personality,contacts,rumors,diary,gallery,inventory,pen-and-paper}` | `EditCharacter` shell + child views | nested children |
| `/stories`, `/story/:id`, `/create-story`, `/edit-story/:id` | story CRUD | |
| `/noticeboard`, `/noticeboard/:id`, `/create-noticeboard-item`, `/edit-noticeboard-item/:id` | noticeboard CRUD | |
| `/event/:id`, `/calendar`, `/calendar/:year/:month`, `/create-event`, `/edit-event/:id` | events | `/event-calendar` redirects to `/calendar` |
| `/gallery/:category`, `/image/:id`, `/edit-image/:id`, `/my-content` | gallery | |
| `/venues`, `/my-venues`, `/venue/:server/:name/:section`, `/venue/:id`, `/create-venue`, `/edit-venue/:id` | venues | section-routed venue subpages (per backlog T1) |
| `/communities`, `/my-communities`, `/community/:name`, `/create-community`, `/edit-community/:id` | communities | |
| `/free-companies`, `/my-free-company`, `/fc/:server/:fc`, `/edit-free-company/:server/:fc` | FC | dynamic title from route |
| `/wiki/:title`, `/create-wiki-page`, `/edit-wiki-page/:id` | wiki | |
| `/search` | `Search.vue` | tabbed result types |
| `/support/tickets`, `/support/tickets/new`, `/support/tickets/:id` | tickets | requires `Role.USER` |
| `/support/queue`, `/support/queue/:id` | admin queue | requires `Role.MODERATOR` |
| `/violations` | `Violations.vue` | requires `Role.MODERATOR` |
| `/privacy-statement`, `/impressum` | legal | |
| `/test-editor`, `/test-character-selector`, `/test-sentry` | dev/admin | hardcoded admin gating on `/test-sentry` |
| `/:catchAll(.*)*` | `Error404.vue` | |

### 3.3 Per-page guards

Most pages use `beforeRouteEnter` and `beforeRouteUpdate` to load data *before* the component mounts, then call a `setContent()` method on the resulting view-model. `beforeRouteLeave` is used by edit pages to confirm discard of unsaved changes.

---

## 4. Authentication, Sessions, and Roles

### 4.1 Login flow

1. The user clicks **"Mit Discord einloggen"** in `UserMenu` or on the home hero.
2. They are redirected to `api.user.getDiscordLoginUrl(origin)` (Discord OAuth2).
3. Discord redirects back with `?token=…&refreshToken=…`.
4. The router guard parses the tokens, calls `getSession()`, commits the user, and notifies *"Du wurdest erfolgreich eingeloggt"*.
5. Redirects flow: terms → verify → home.

### 4.2 Token persistence

Tokens are stored by the API client. `boot/axios.ts` (43 lines) restores the session on app init if a token exists, and registers a global error handler that clears the user store when the refresh token fails.

### 4.3 Role hierarchy

Roles are exposed via store getters and used both for route gating and template-level conditionals:

- **`UNVERIFIED`** — logged in but has not yet verified a character via Lodestone. Most write actions are blocked.
- **`USER` / verified** — default state after verification.
- **`TRUSTED`** — `isTrusted` getter; required to create wiki pages.
- **`MODERATOR`** — sees `/support/queue` and `/violations` menu items and routes.
- **`ADMIN`** — sees test routes; hardcoded check on `/test-sentry`.

Two parallel getters distinguish *the active character's* effective role (`role`) from *the user's underlying* role (`realRole`), so that switching to an unverified character downgrades the visible UI without revoking the underlying account.

### 4.4 User menu

`client/src/components/sidebar/UserMenu.vue` (390 lines), rendered inside the left drawer. Sections vary by state:

- **Logged out:** Discord login button (brand color `#5865f2` with hover/active states and inline SVG logo); telemetry settings link (only if Sentry is configured).
- **Unverified character:** "Account oder Charakter verifizieren" → `/verify`.
- **Verified user:** profile view/edit links, FC management, content creators ("Community erstellen", "Treffpunkt erstellen", "Neue Geschichte", "Neues Event", "Neuer Aushang", "Bild hochladen"), "Meine Inhalte", support tickets.
- **Trusted user:** adds "Neuer Wikibeitrag".
- **Moderator:** adds support queue and violations entries.

The menu also contains:
- An async-imported **Character Switcher** dialog (`SwitchCharacterDialog`) — see [§7.5](#75-character-switcher).
- The **image upload** entry, which lazy-imports `UploadDialog` and pipes its result into `PostUploadDialog` for metadata.
- A graceful **logout** that calls `api.user.logout(refreshToken)`, swallows errors, clears local tokens, commits `setUser(null)`, and notifies *"Du hast dich ausgeloggt."*.

### 4.5 Vuex store

`client/src/store/index.ts` (339 lines) holds:

- **`user`** — id, role, `currentCharacterId`, a `Map<id, SessionCharacterDto>` of all linked characters, terms acceptance, telemetry consent state.
- **`events`** — cached events (powering the sidebar widget and reused across views).
- **`telemetryConsent`** — preference object persisted to localStorage and synced to the server.

Notable getters: `characterId`, `characterShortName`, `character`, `characters[]`, `role`, `realRole`, `isTrusted`, `hasAcceptedTerms`, `telemetryConsentStatus`, `shouldPromptTelemetryConsent`. The `setUser` mutation auto-selects the first verified character (or restores from localStorage), so multi-character users land on a familiar character after login.

---

## 5. Design System

### 5.1 Color palette

Defined via CSS custom properties on `body` in `client/src/css/app.scss` (1038 lines). Two complete sets — light (lines 14–56) and dark (`body.body--dark`, lines 62–115).

| Token | Light | Dark |
|---|---|---|
| `--app-body-bg-color` | `#ddb476` (gold) | `#0d1118` (deep navy) |
| `--app-text-color` | `#1f1f1f` | `#d9e1ea` |
| `--app-link-color` | `#ddb476` | `#8db5df` |
| `--app-link-hover-color` | `#c59826` | (lighter blue) |
| `--app-page-surface` | `#fdfdffee` | `rgba(14,19,27,0.92)` |
| `--app-card-surface` | `rgba(255,255,255,0.95)` | `rgba(17,24,34,0.95)` |
| `--app-card-border` | `rgba(221,180,118,0.24)` | `rgba(141,181,223,0.28)` |
| `--app-toggle-on` | `#1f4d64` | `#8db5df` |

`quasar.variables.scss` then maps Quasar primitives:

```scss
$primary:   #DDB476;  // warm gold
$secondary: #9F84BD;  // muted purple
$accent:    #EBC3DB;  // dusty pink
$dark:      #1D1D1D;
$positive:  #4caf50;
$negative:  #C10015;
$info:      #31CCEC;
$warning:   #F2C037;
```

The actual surfaces used in pages don't lean on `$primary` — most cards, hero blocks and accents use the CSS-variable layer above. The Quasar primitives are mostly visible through `q-btn color="primary"`.

### 5.2 Typography

Three typefaces are used contextually:

- **Body — Noto Sans** (`$body-font`).
- **Headers — Cinzel** (`$header-font`), with a custom **Cinzel Eorzea** WOFF2 face (Medium weight) reserved for `h2` (centered, 2.5rem, letter-spacing 0).
- **Form section headers — Michroma** (`$form-header-font`).

`h3`–`h6` use Cinzel at descending sizes (2.0, 1.7, ~1.5, ~1.3 rem). Below the `sm` breakpoint, `h2`–`h4` step down by ~0.5rem and page padding tightens to `20px 14px`.

### 5.3 Quasar configuration

`quasar.conf.js` (lines 114–142):

```js
framework: {
  config: { loadingBar: { position: 'top', color: 'accent', size: '4px' } },
  lang: 'de',
  plugins: ['Dialog', 'Loading', 'LoadingBar', 'LocalStorage', 'Meta', 'Notify']
}
```

The accent-pink top loading bar is the primary "navigating / saving" visual.

### 5.4 Boot files

Six boot files registered in this order:

1. **`theme.ts`** (7 lines) — applies stored theme mode.
2. **`sentry.ts`** (20 lines) — registers Sentry if env-configured; watches the consent getter and toggles reporting.
3. **`axios.ts`** — API client + session restore + 401-on-refresh logout.
4. **`display.ts`** (156 lines) — registers `$display`, a global with:
   - Localized labels for races, tribes, story types, noticeboard types/locations, image categories, venue locations, housing areas, page types, support categories/priorities/statuses.
   - `relativeTime(ts)` → German Luxon `"vor 2 Stunden"`.
   - `formatDate`, `formatDateTimeServer` (FFXIV server timezone via `SharedConstants.FFXIV_SERVER_TIMEZONE`), `formatFileSize`.
5. **`iframe-resizer.ts`** (27 lines) — `v-iframe-resize` directive used by Carrd embeds in profiles, FCs and venues.
6. **`polyfills.ts`** (7 lines) — `reflect-metadata` for `class-transformer`.

### 5.5 Scrollbars, motion and dark mode breadth

- Custom Webkit scrollbar styling in both modes (`#eeeeee`/`#cccccc` light, accent-tinted dark).
- `prefers-reduced-motion: reduce` (lines 1076–1092 and 1291–1301) disables animations, transitions and hover translateY effects globally.
- Dark mode is *not* a token swap — there are ~460 lines (lines 480–944) of explicit `.body--dark .page-X` overrides for cards, borders, gradients, button states and form fields per page.

---

## 6. Home Page (`Index.vue`)

`client/src/pages/Index.vue` (1094 lines).

### 6.1 Hero

- Logo + **"Elpisgarten"** title (Cinzel header).
- Three-line lead paragraph.
- Spoiler warning.
- CTA branches:
  - Logged out → Discord login button (brand color, hover effects).
  - Logged in → welcome card with avatar, name and greeting.
- Background: layered radial gradients (light: gold + blue tint over `#f8f4ee→#ffffff→#fafaf8→#f2ede4`; dark: `#0f151f→#121d2b→#0d141d`).

### 6.2 Activity grid

A 2-column responsive panel grid:

| Panel | Layout | Source |
|---|---|---|
| Neueste Änderungen | Full-width list | `api.changes.getChanges({limit:3})` |
| Neue Geschichten | 3-col card grid | story type badge, title, excerpt, author, relative time |
| Neue Kunstwerke | thumb grid (6) | category=Artwork |
| Neue Aushänge | list | type/location/timestamp |
| Neue Charaktere | 2-col card grid | avatar, name, race, server |
| Neue Freie Gesellschaften | list with metadata | |
| Neue Treffpunkte | list | |
| Neue Communities | list | |
| Neue Screenshots | thumb grid (6) | category=Screenshot |

All panels use the same card styling (white/`rgba(18,26,37,0.96)` surface, gold/blue border, `0 4px 12px rgba(0,0,0,0.08)` shadow, hover lifts -2px and deepens shadow).

Loading uses `beforeRouteEnter` to fetch `getMainPageContent()` and `getChanges({limit:3})` in parallel; failure shows *"Hauptseite konnte nicht abgerufen werden"*.

---

## 7. Character Domain

The character system is the deepest part of the product: 12 dedicated pages and ~12 components.

### 7.1 Public profile — `Character.vue`

A `q-layout` with its own collapsible drawer:

- **Drawer** — 200px wide, mini-state collapses to 56px; on desktop, hovering re-expands. Section items render only when `character.show*` flags are true:
  - Profile (always)
  - Appearance, Personality, Contacts, Rumors, Diary, Gallery, Inventory (gated)
  - Pen & Paper (when `hasPenAndPaperSheet` computed flag is true)
  - **Edit** (purple-tinted, only if `character.mine`) → `/edit-character/:id/profile`
- **Content** — single `<router-view>` per active section.
- **Not-found state** — *"Der Charakter {name} ({server}) ist nicht auf **Elpisgarten** registriert."*
- **OG/Twitter meta** — uses `q-meta` to set OG image (banner) and Twitter card.

The drawer is hidden when `$q.screen.lt.md` collapses the layout.

### 7.2 Character directory — `Characters.vue`

- **Hero** — *"Die Bevölkerung Hydaelyns"*, subtitle, big stat number ("{count} Profile").
- **Alphabet bar** — A-Z buttons + *Alle*. 36px buttons with active highlight.
- **Toolbar** — search (200ms debounce), race filter, server filter, stats line, page-jump pagination.
- **Grid** — `q-table` in grid mode, `auto-fill minmax(240px, 1fr)`. Each card: 56px avatar, name, race–server, profession.
- **URL sync** — page, rowsPerPage, searchQuery, server, race, letter all push into the route query.

### 7.3 Profile rendering — `CharacterProfile.vue` family

`CharacterProfile.vue` is the canonical public render:

- **Banner** via `BannerView` (lazy `q-img`, aspect ratio).
- **Header** flex row: spacer | (avatar + optional title + h2 name + optional «nickname») | spacer. On mobile (≤460px) the header collapses to a vertical stack and `CharacterDetail` rows switch to column layout.
- **Details box** (`CharacterDetailsBox`) — flex-wrap pairs of `CharacterDetail` rows for Server, Race/Tribe, Family, Deity, Profession, Age, Birthday, Pronouns, Birthplace, Residence, Relationship Status, Free Company. Each row only renders when its value is set.
- **Background** — `HtmlViewer` for rich HTML.
- **Carrd iframe** — when `character.carrdProfile` is set, an iframe loads `${api.prefix}carrd/character/${id}` with `v-iframe-resize`. Height defaults to 500px (70vh on mobile).

Sibling views — `CharacterAppearance`, `CharacterPersonality`, `CharacterContacts`, `CharacterDiary`, `CharacterGallery`, `CharacterRumors`, `CharacterPenAndPaper` — all share the same readonly-input idiom: `q-input readonly` for short fields, `HtmlViewer` for long-form.

### 7.4 Pen & Paper sheet — `CharacterPenAndPaper.vue` (recently added)

This is the most visually distinctive character sub-view:

- **Hero** — eyebrow "Pen & Paper Dossier", h2 character name, lead, plus a **Würfel-Orakel** (dice oracle) sidebar.
  - Dice oracle: W6 / W20 / W100 buttons, current result panel, contextual interpretation (e.g. W100 1–5 = *"Kritischer Erfolg"*, 96–100 = *"Patzer"*). Note explicitly states results are not persisted.
- **Summary cards** (4-card grid): Kernprofil, Auftreten, Verortung, Spielhaken — each pulls 2–3 fields.
- **Ledger panels**: Identität (9 entries), Eindruck (8), Antrieb (9), Umfeld & Beziehungen — only entries with values render.
- **Notes**: HTML blocks for Background, Personality, Rumors, with an *accent* style for OOC info.
- **Empty state** — *"Noch kein Dossier — Für diesen Pen-&-Paper-Bogen wurden noch keine kompakten Sheet-Angaben hinterlegt."*

Its editor (`EditCharacterPenAndPaper.vue`) is a 2-column grid of 5 themed cards (Identität, Eindruck, Antrieb, Umfeld, Beziehungen) of `q-input autogrow` textareas, all of which write through to fields *also* edited on the dedicated tabs — the page is explicitly framed as a *bundle* view of compact sheet fields, with a caption clarifying that long-form text remains on its proper tab.

### 7.5 Character switcher

`SwitchCharacterDialog.vue`:

- Lists current characters via `CharacterNameList`.
- Clicking activates that character (commits `setCurrentCharacterId`, redirects to `/` if verified or `/verify` if not, notifies, closes).
- Sliding "Add new character" form, gated by `CharacterFinderField`:
  - `q-select` with debounced (200ms) Lodestone search; option template renders avatar, name, server.
  - Server validated against cached `allowedServers`.
  - Registration status banners:
    - `CLAIMED_BY_ANOTHER_USER` — negative
    - `ALREADY_REGISTERED` — negative
    - `RENAMED` — informational dark banner explaining that the user used in-game rename and can choose to register a new profile or update an existing one.

### 7.6 Edit shell — `EditCharacter.vue`

Mirrors the public layout but in editor mode. Same drawer, same sections; renders `<router-view @updateCharacter="onUpdateCharacter" />` so each child page can push back updates without remounting the shell.

### 7.7 Profile editor — `EditCharacterProfile.vue`

- **Header** — title + **Wiki Import** button (`download` icon) opening `WikiImportDialog`.
- **Inactive banner** — when `character.active === false` (post-rename), a dark warning explains the situation.
- **Profile display section** — 7 checkboxes for `showAppearance`, `showPersonality`, `showContacts`, `showRumors`, `showDiary`, `showGallery`, `showInventory`.
- **Banner editor** — `BannerEditSection` (image picker + crop).
- **Biographie** — readonly Lodestone fields (Name, Race, Tribe), refresh button (opens `RefreshCharacterDialog`), then editable `q-input`s for Title, Nickname, Family, Deity, Profession, Age (200px wide), Birthday, Pronouns (200px, max 30 chars), Birthplace, Residence, Relationship Status. All fields are capped at 500px max-width.
- **Wiki-link hint** — *"Du kannst [[Wikilinks]], z.B. [[Charaktername]], in allen obigen Feldern nutzen."*
- **Einleitung** — `HtmlEditor` for background prose.
- **Carrd profile** — `CarrdEditSection`.
- **Button bar** — `Bearbeitung / Vorschau` toggle, **Zurücksetzen** (with confirmation), **Speichern**.
- **Preview mode** — renders `<character-profile :preview="true" />`.

### 7.8 Wiki import — `WikiImportDialog.vue`

Two-step wizard:

1. **URL input** — `https://ff14-light.fandom.com/de/wiki/...` placeholder, link icon, error display, "Laden" action.
2. **Field selection** — checkbox per detected field, grouped by section (Profile, Appearance, Personality, Contacts, Rumors). Each row shows a truncated value preview. A status banner shows *"X Felder aus Y Abschnitten ausgewählt"*. There is also an **"Importiere den gesamten Seiteninhalt"** option for bulk import into the editor.

Per `WIKI_IMPORT_PLAN.md`, the *server-side* HTML sanitizer currently strips positioning, transforms, overflow, z-index, viewport units and `background:url()`. A planned Phase 1–5 expansion will allow Fandom tab structures and positioned visuals (`fandom-tabs.ts` already exists in `client/src/common/`).

### 7.9 Lodestone refresh — `RefreshCharacterDialog.vue`

Confirmation dialog: *"Dies wird den neuen Charakternamen, das neue Volk und den neuen Server von [Name] via Lodestone abfragen…Dieser Vorgang kann nicht rückgängig gemacht werden."* Cancel (primary outline) + Confirm (negative). On success commits store updates and notifies *"Charakterdaten aktualisiert."*.

### 7.10 Appearance editor — `EditCharacterAppearance.vue`

The only edit page with **bespoke color-picker UX**:

- Two-column grid: form (left) + 2:3 portrait image (right). Single column below 900px.
- For Hair / Eye / Skin: a free-text `q-input` whose width auto-resizes to its measured rendered width via `getTextWidthPx()`, plus two **dual-shade pickers** rendered as 20×20 circular buttons with checkered transparency backgrounds and `q-popup-proxy` color swatches. Validated through `CSS.supports('color', value)` and a regex for `#RGB`/`#RRGGBB`/`#RRGGBBAA`. Falls back to `#7a7a7a` on invalid input.
- Right column: 2:3 character image with Remove / Select (gallery) / Upload buttons, min-height 420px desktop / 280px mobile.
- Lower sections: Build, Height, Weight, Apparent Age, Voice, Special Features, then `HtmlEditor` blocks for **Erscheinungsbild** and **Äther**.
- Same toolbar pattern (toggle, revert, save) and `<character-appearance :preview="true" />` preview.

### 7.11 Other character editors

- **`EditCharacterPersonality.vue`** — Loves, Hates, Wishes, Fears, Slogan, Motivation, then Strengths/Weaknesses/Ticks, plus a long-form `HtmlEditor`. Wiki-link hint repeats.
- **`EditCharacterContacts.vue`** — Partners, Parents, Children, Relatives, Friends, Acquaintances, Enemies, Past, then Free Companies, Meeting Places, Communities (and "Mentioned In" in some variants).
- **`EditCharacterDiary.vue`** — *not* a form; renders `StoryList` filtered to `StoryType.DIARY`, plus a "Geschichte erstellen" outline button.
- **`EditCharacterGallery.vue`** — `ThumbGallery` plus an upload button that chains `UploadDialog` → `PostUploadDialog`.
- **`EditCharacterInventory.vue`** — two `HtmlEditor`s for Besitz and Besondere Gegenstände. **Inconsistency:** preview reuses `<character-rumors :preview="true" />` rather than a dedicated inventory display component.
- **`EditCharacterRumors.vue`** — disclaimer paragraph distinguishing *Häufig* (general knowledge) from *Selten* (only with prior RP agreement), then three `HtmlEditor` blocks: Offene Informationen, Häufige Gerüchte, Seltene Gerüchte.

### 7.12 Editor invariants

Every character editor (and most other domain editors) shares:

- An **isDirty** ref (currently *module-level*, not component-scoped — a latent bug if multiple editors are mounted at once).
- A **`beforeRouteLeave` guard** that confirms discard. The wording differs depending on whether the user is navigating within the same character (*"Bitte speichere oder setze deine Änderungen zurück…"*) or away.
- A **revert confirmation** dialog: *"Möchtest du die ungespeicherten Änderungen auf die letzte gespeicherte Version zurücksetzen?"* / Cancel (secondary) + Zurücksetzen (negative).
- A **save loading spinner** (`q-inner-loading`) and a success notification with an optional *"Schließen"* action.
- An **edit/preview toggle** (`q-btn-toggle`) that swaps the form for the public component with `:preview="true"`.

There is **no auto-save** anywhere; tab close or browser crash loses changes.

---

## 8. Free Companies

### 8.1 Public — `FreeCompany.vue`

- `<free-company-profile>` for banner, name, FC details, description and Carrd iframe.
- **Members section** — auto-fill `minmax(240px,1fr)` grid of cards (avatar 56px, name, race-server, profession). Empty state *"Keine Mitglieder gefunden."*.
- **Permissions section** (`fc.mine` only) — `FreeCompanyMemberPermissionEditor` to delegate edit rights.
- **Report violation** at the bottom.
- 404 state: *"Die Freie Gesellschaft {name} ({server}) ist nicht auf **Elpisgarten** vertreten."*

### 8.2 Editor — `EditFreeCompany.vue`

- Read-only Lodestone Name + Tag.
- `BannerEditSection`.
- Editable Website, Goal, Status, Area of Operations, Recruiting Officers.
- HTML description, Carrd profile.
- Same toggle/revert/save pattern, with `<free-company-profile :preview="true" />` preview.

`FreeCompanies.vue` and `MyFreeCompany.vue` follow the same directory + my-content patterns established for Venues and Communities.

---

## 9. Events & Calendar

### 9.1 `EventCalendar.vue`

Two-panel layout:

- **Header** — h2 "Eventkalender", subtitle showing year/month with transitions, view toggle **Kalender / Liste**.
- **Toolbar** — Previous/Today/Next month buttons, event-type filter, sort (Time/Type), **+ Neues Event** (role-gated).
- **Calendar grid** — `QCalendarMonth`, Monday-start, day cells `min-height: 140px`. Each day shows up to 3 event icons with tooltips. Day click populates the sidebar.
- **Sidebar (right)** — sticky `top: 120px`, collapsible header that swaps between *"Bevorstehende Events"* and *"X bevorstehende Events"* when collapsed. Below 1100px the layout stacks.
- **List view** — single-column grid replacing the calendar; events grouped by date headers (`dd.LL.yyyy` + German weekday).

### 9.2 `Event.vue`

- Owner edit/delete bar (if `event.mine`).
- **`EventView`** (see §9.4).
- **Closed event registration** (when applicable):
  - Registration deadline.
  - "Anmeldung offen/geschlossen" status.
  - Participant count.
  - Character selector (when logged in) with "Für Event anmelden" / "Vom Event abmelden" actions.
  - **Admin-only** (`event.canManageParticipants`) participant list with avatar, character name + server, registration timestamp.
- Image gallery (`event.images`) via `ThumbGallery`.
- Report violation section.

### 9.3 `EditEvent.vue` — 7-step wizard

Quasar `q-stepper` (animated, contracted on `md`, vertical on `lt-md`):

1. **Treffpunkt** (place icon) — character selector (create only), debounced (250ms) venue finder. Selecting a venue auto-fills location name, address, server, *and pulls a venue template* (title, description, links, event type, adult flag, registration deadline, times, banners, icon, content notes). Then location name (required), address, world (custom WorldSelect), location link (URL-validated), link text.
2. **Eckdaten** (schedule icon) — accordion **Titel und Typ** (title, event-type radio in 2-col grid: RP/Party/Talk/Begegnung/Workshop/Sonstiges, AdultOnly selector, content-notes multi-checkbox in 2-col grid) and **Zeit und Teilnahme** (closed-event toggle, registration deadline days+time, start/end date+time popups). End fields are validated against start.
3. **Inhalte** (article icon) — accordion of three `HtmlEditor`s: Description (default open), OOC, Extra.
4. **Kontakt** (link icon) — contact text + dynamic event-link array (URL + label, delete per row, add button).
5. **Medien** (image icon) — `EventIconEditSection` (50×50 preview, 12px radius, gold border + shadow; Remove/Select/Upload buttons), main `BannerEditSection`, Discord banner section (5:2 min, recommended 1500×600).
6. **Discord** (campaign icon) — info note about the bot announcing in `#rp-event-announcements`. Per announcement, `EventAnnouncementEditor` with caption preview ("6 Wochen vorher", "Zum Eventbeginn", "3 Stunden nach Beginn"). Add/remove rows.
7. **Vorschau** (visibility icon) — `<event-view :preview="true" />`.

Stepper navigation:
- Header steps unlock only after the prior step validates.
- Bottom bar: **Zurücksetzen** (with confirm), **Zurück** (conditional), **Weiter / Zur Vorschau** (conditional), **Änderungen speichern** (final step).
- Validation failure auto-opens the relevant accordion.

State internals: separate `startDate`, `startTime`, `endDate`, `endTime` synced via watchers; Luxon converts to/from `SharedConstants.FFXIV_SERVER_TIMEZONE`.

### 9.4 `EventView.vue`

- Banner.
- Header: 50×50 event icon (rounded, gold-bg) + h2 title with subtitle showing server-TZ time range and the event-type label (uppercase, 0.06em letter-spacing). Tooltip on the time shows the local TZ.
- **Meta grid** — auto-fit `minmax(220px, 1fr)`: Beginn, Ende, Typ, Links (clickable), Closed status (lock/unlock icon).
- **Content warnings** — chips with `rgba(221,180,118,0.22)` background.
- **Standorte** — h3 + grid of location cards (title + "Treffpunkt anzeigen" link if `venueId`, then place/public/link icon rows).
- **Details / OOC Details / Extra Infos** — h3 + `HtmlViewer` (each rendered only when populated).

### 9.5 `CalendarSidebarWidget.vue` (right rail)

- Card layout: header (icon + "Eventkalender", subtitle adapts to selected date or shows count when collapsed; action buttons for Add (role-gated), Maximize → `/calendar`, Collapse (`expand_more`/`expand_less`)).
- Body: minimal `q-date` (flat, no popup, event color dots), filter dropdowns, list header with conditional "Zurücksetzen", grouped event list.
- Each event card: icon + 2-line clamped title + warning/18+ badges + location + time/type meta. Click expands an in-card panel with full meta and an action button.
- Loads upcoming events on `created()` (6-month lookahead fallback) and the current month for the calendar; reloads month on navigation.
- Collapse state is sticky in session.
- Two recent commits (`4f0965b`, `bb9c4f2`) fixed collapse-toggle / collapse-height regressions; the toggle now drives a `q-slide-transition` around the body.

### 9.6 `EventItem.vue` (sidebar list item)

Collapsed: 32×32 event icon avatar + bold title + caption with server date (HTML `<br>` for multi-day, tooltip for local TZ). With link → click opens externally; without link → click expands.

Expanded: action buttons (open + collapse), definition list (Beginn, Ende), per-location cards (name, address, server).

---

## 10. Venues

### 10.1 `Venues.vue` directory

- Hero ("Community" eyebrow, h2 *Treffpunkte*, lead, count box).
- Toolbar: search (200ms debounce), area filter (`HousingArea` enum incl. `__none__` for Open World), server filter, stats line, page-jump pagination.
- Grid: `VenueList` (12 per page).

### 10.2 `Venue.vue` detail (section-routed)

The route is `/venue/:server/:name/:section` — venue subpages are first-class. The `VenueSection` enum drives navigation through a mini-state drawer (200px, hover-expand on desktop, no breakpoint — always visible):

- **OVERVIEW** (star) — `VenueProfile` + planned-events grid.
- **RULES / PREMISES / MENU / OOC** (gavel / home / restaurant / chat) — h3 + `HtmlViewer` or *"Keine Beschreibung"*.
- **STAFF** (people) — avatar grid (56px) of members linked to character pages (filtered by member's `showInStaff` flag, per backlog T2).
- **JOBS** (briefcase) — noticeboard items for this venue, split into Stellenangebote / Stellengesuche (backlog T3).
- **MEDIA** (photo) — `ThumbGallery` of images linked to venue (backlog T4).
- **EVENTS** (event) — upcoming events at this venue.
- **NETWORK** (share) — links to communities / FCs.

Owner actions: **Edit** (when `canEdit`) and **Delete** (when `mine`) at the bottom of the drawer.

Membership actions (above the section content): join request, status banners (*"Du hast eine Anfrage…"*, *"Deine Mitgliedschaftsanfrage wurde abgelehnt."*, *"Du bist ein Mitglied…"*).

### 10.3 `EditVenue.vue`

220px mini-drawer with Basic / Location / Event Template / Offerings / Members / Description / Media sections.

- **Basic** — character selector (create), name, world, founded date, website, purpose & status (with wiki-link support), tags (CSV).
- **Location** — radio group:
  - Open World → address required.
  - House → housing area select, ward, plot, subdivision flag.
  - Apartment → housing area, ward, room, subdivision flag.
  - FC HQ → housing area + ward.
- **Offerings** — `VenueOfferingsEditor` (add/edit/remove with description, price, etc.). Public render via `VenueOfferingsView` and per-offering `VenueOfferingCard`.
- **Members** — `VenueMemberEditor` controls per-member permissions including `showInStaff`.
- **Applicants** — `VenueApplicantEditor` for approve/reject.
- **Description** — `HtmlEditor`.
- **Media** — image-to-venue linking (backlog T4).
- **Event template** — schedule/title/description/type/adult flag/deadline/weekday selection.

`VenueProfile.vue` itself: banner, h2 title, `CharacterDetailsBox` info block (Founded, Website, Discord, Purpose, Status, Recruiting), `HtmlViewer` description, optional Carrd iframe, tag list.

`MyVenues.vue` is the personal-list view (uses the `venues/my-editable` endpoint introduced in T5).

---

## 11. Communities

`Communities.vue` directly mirrors `Venues.vue` minus area/server filters: hero, count, search (200ms debounce), pagination, `CommunityList` grid (12 per page).

`CommunityProfile.vue` likewise mirrors `VenueProfile.vue`: banner, h2, info box (Founded / Website / Discord / Goal / Status / Recruiting), description, Carrd, tag list.

The remaining views — `Community.vue`, `EditCommunity.vue`, `MyCommunities.vue`, `CommunityApplicantEditor`, `CommunityMemberEditor`, `MyCommunityList` — are functional analogues of the venue counterparts (no section-routed subpages — communities are single-page).

---

## 12. Stories

### 12.1 `Stories.vue` directory

- Hero: h2 *Geschichten*, count.
- Toolbar: search (200ms debounce), type filter (populated from unique types), tag autocomplete, stats, pagination (input mode).
- `q-table` grid (no header, no bottom): card per story with type label (uppercase eyebrow) + author + relative time, h3 title, multi-line excerpt, **Lesen** action link.
- Empty state: *"Noch keine Geschichten gefunden — Passe die Filter an oder starte mit einer neuen Geschichte."*

### 12.2 `Story.vue` and `EditStory.vue`

- Public view: optional banner, title, author + server, type badge, tags chips, timestamps, `HtmlViewer` content. Edit/Delete buttons gate on ownership; Report violation at bottom.
- Editor uses `CharacterSelector`, title, type select, tag input, `HtmlEditor` body, banner picker, the universal toggle/revert/save bar.

`StoryList.vue` is the shared card list used both on the directory and on `CharacterDiary` / `EditCharacterDiary`.

---

## 13. Noticeboard

`Noticeboard.vue` — same shape as Venues/Communities directories with location and type filters.

`NoticeboardItem.vue` — type/location badges, author + timestamp, `HtmlViewer` content, optional venue link (T3), and (per commit `13601e4`) **Discord embed integration** — a "Share to Discord" affordance and an embed preview showing how the post would render in `#discord`.

`EditNoticeboardItem.vue` — character selector, type, location, title, body editor, optional venue association.

---

## 14. Wiki

- `Wiki.vue` — edit/delete bar (when `canEdit || canDelete`), `WikiPageView`, report-violation section.
- Permissions: anyone trusted (`isTrusted`) can edit pages with `EditPermission.EVERYONE`; otherwise only `page.mine`.
- `WikiPageView.vue` — title, content (with `[[Wikilinks]]` rendered as internal links — the same syntax used throughout character editors), last-updated timestamp, metadata.
- `EditWikiPage.vue` — title, slug/title path, edit-permission select, rich body via `HtmlEditor`.

Wiki link rendering and click handling is unified via `client/src/common/html-view-utils.ts` (intercepts internal anchor clicks and converts to `router.push()`).

---

## 15. Gallery, Images & Upload Pipeline

### 15.1 `Gallery.vue` directory

- Hero with category-aware title.
- Toolbar: search, range stats (*X-Y von Z*), pagination.
- `ThumbGallery` (auto-fit grid, `minmax(150px,1fr)`).

### 15.2 `Image.vue` detail

Lightbox via `ImageSlidesDialog` (prev/next), title, creator+timestamp, category, description, dimensions, related-content cards (venue/event), edit button (gated), delete via `ConfirmImageDeleteDialog` (with linked-content guard from T4), report-violation.

### 15.3 Upload wizard — `UploadDialog.vue`

Quasar stepper, 4 steps (5 in banner mode):

1. **`StepSelectImage`** — drag-and-drop zone (overlay *"Datei hier einfügen"*) + file input, preview with aspect-ratio validation. Flow modes: default / banner / event-icon — minimum aspect ratio enforced when applicable.
2. **`StepBannerCrop`** (conditional, banner flow) — interactive crop with locked aspect (e.g. 5:2 for Discord banners), preset crop areas, output width control.
3. **`StepThumbnail`** — generates 1:1 (or auto) thumbnail from main/cropped image.
4. **`StepImageDetails`** — `ImageEditor` form: title, description, category, NSFW flag, visibility, optional venue relation.

Navigation: Cancel / Back (conditional) / Next (validated) / Upload (final). `q-inner-loading` during upload. Visual drag overlay during file drop. Step transitions guarded by a `transitioning` flag.

`PostUploadDialog.vue` runs after upload with metadata edits (used from the home and character gallery flows).

`ImageSlidesDialog`, `ThumbGallery`, `MyImages`, `MyImage` round out the image surfaces; `MyContent.vue` is the user-content overview shown via `MyContentList`.

---

## 16. Search

`Search.vue` — h2 *Suchergebnisse*, "Suchergebnisse für **{query}**", then a `q-card` with `q-tabs` per result type (Charaktere, Events, Treffpunkte, Communities, Geschichten, …). Each panel renders a `<dl>` of results, with `<dt>` containing the result name link + optional thumbnail (hidden below `gt-sm`) + updated date, and `<dd>` containing a snippet with matched keywords highlighted (HTML).

Empty state: *"Kein Ergebnis zu **{query}** gefunden"*.

The shared `SiteSearchField` (used in the drawer) routes to `/search?q=…` after passing through `toSearchKeywords()`.

---

## 17. Support Tickets

User-facing routes (`Role.USER`):

- **`SupportTickets.vue`** — list of own tickets.
- **`NewSupportTicket.vue`** — category dropdown (Bug/Feature/Abuse/General), title, description (HTML editor), optional attachments and affected-content selector.
- **`SupportTicket.vue`** — status & category badges, title, submitter info, description, threaded messages with timestamps, reply form for admins.

Moderator routes (`Role.MODERATOR`):

- **`SupportQueue.vue`** — queue of all open tickets.
- **`SupportTicketAdmin.vue`** — admin reply, resolve/close.

The `$display` helper exposes labels for `SupportTicketCategory`, `SupportTicketPriority`, `SupportTicketStatus`, `SupportLevel`.

---

## 18. Moderation & Violations

- **`Violations.vue`** — moderator-only list of violation reports; restricted via route `meta.role`.
- **`ReportViolationDialog.vue`** — modal opened from `ReportViolationSection` on most public pages (profile, FC, venue, community, event, story, image, noticeboard, wiki). Captures the `pageType` (PageType enum) + `pageId`, presents a textarea (validated to `SharedConstants.MIN_VIOLATION_REPORT_LENGTH`), captures `document.title` for context. Cancel/Send buttons; loading state while submitting.

---

## 19. Static Pages

- **`About.vue`, `Faq.vue`, `Rules.vue`, `BeginnerGuide.vue`, `Changes.vue`, `Contact.vue`** — content-led pages, often rendering markdown imported from `client/src/markdown/` (`faq.md`, `rules.md`).
- **`PrivacyStatement.vue`, `Impressum.vue`, `Terms.vue`** — German legal pages, content from `markdown/privacy-statement.md`, `markdown/impressum.md`. Footer always links to `/privacy-statement` and `/impressum` (DSGVO requirement).
- **`Verify.vue`** — Lodestone bio-string verification flow for newly-added characters. Reached automatically on first login (router guard) until at least one character is verified.

`PRIVACY_COMPLIANCE_CHECKLIST.md` notes the privacy statement and impressum are present, Sentry is opt-in only, and outstanding work is formal legal review of the texts and a DPA verification.

---

## 20. Telemetry & Privacy Surface

- **Initial prompt** — fired from `MainLayout.mounted()` when the store says `shouldPromptTelemetryConsent`. Modal cannot be dismissed without choosing Allow/Deny.
- **`TelemetryConsentDialog`** — settings mode allows dismiss. Body explicitly enumerates what is sent (error messages, stack traces, browser/device, page route minus query params) and what is **not** (access tokens, emails). Buttons: link to `/privacy-statement`, *"Ablehnen"*, *"Fehlerdiagnose erlauben"*.
- **Persistence** — Quasar LocalStorage + server sync.
- **Runtime sync** — `boot/sentry.ts` watches the consent getter and toggles Sentry reporting on the fly.
- **User control** — UserMenu entry *"Datenschutz & Fehlerdiagnose"* re-opens the dialog in settings mode.

---

## 21. Rich Text Editing & Markdown

### 21.1 `HtmlEditor.vue` (client)

TinyMCE 6 (Vue 3 wrapper) with:

- Toolbar: undo/redo, format select, bold/italic, alignment, image, gallery, upload, link, hr, lists, removeformat.
- Menus: Edit / View (with code, visualaid), Insert (image, gallery, upload, link, charmap, nbsp, hr, **hidedetails**), Format, List, Table, Help.
- **Custom buttons** — Gallery (insert from user gallery), Upload (chains to `UploadDialog`), Hide-Details (creates a `<section class="hide-details">` collapsible — handled at render time by `html-view-utils`).
- **Wikilinks** — `[[Page]]` and `[[Page|Display]]` with caption hint above the editor.
- **Fonts** — Noto Sans, Cinzel, Michroma + 10 Google fonts.
- Block formats limited to Heading 3–6 + paragraph (no h1/h2 — those are reserved for layout).
- Toolbar fixed-position container, configurable height (default 400px).
- An `allowImages=false` prop disables image-related buttons.

### 21.2 Wiki link / Hide-details rendering

`html-view-utils.ts` (one version per app — the news version is simpler) intercepts clicks on rendered HTML:

- Internal links → `router.push()`.
- Toggleable `.hide-details` sections → class toggling for collapse/expand.
- `fandom-tabs.ts` provides Fandom WDS-style tabber initialization (proper ARIA: `role="tab"`, `aria-controls`, `aria-selected`, `tabpanel`, Enter/Space activation) — currently used to leave hooks for the planned wiki-import expansion.

### 21.3 Markdown sources

`client/src/markdown/` holds static-page content (faq, rules, privacy, impressum). Both apps have a `shims-md.d.ts` so `*.md` imports compile to HTML at build time via a Webpack markdown loader.

---

## 22. The Harborwatch (`news/`) — Newspaper App

Distinct visual identity, intentionally low-fidelity.

### 22.1 Build & shape

- Quasar 2 SPA on **port 8081**, proxies `/api` to `localhost:8111`.
- Only `fadeOut` animation enabled (no other Quasar animations).
- Plugins: Dialog, Loading, LoadingBar, LocalStorage, Meta, Notify.

### 22.2 Routes

| Path | Page |
|---|---|
| `/` | `Index.vue` (latest issue) |
| `/login` | `LogIn.vue` |
| `/create-article`, `/edit-article/:id` | `EditArticle.vue` |
| `/my-articles` | `MyArticles.vue` |
| `/submitted` | `Submitted.vue` (editor) |
| `/issue/:id` | `Issue.vue` |
| `/:year/:month/:day/:slug` | `Article.vue` (dated URL) |
| `/:catchAll(.*)` | `Error404.vue` |

### 22.3 Layout — `MainLayout.vue`

- `<user-navigation>` fixed top-left (20/20).
- `<issue-navigation>` fixed top-right (20/20) — list of issue numbers fetched via `api.news.getIssues()`.
- `<site-header>` masthead.
- `<main>` page container, `5rem auto`, max-width 1280px, font-size 18px.
- `<site-footer>`.

### 22.4 Masthead — `SiteHeader.vue`

**Currently uses placeholder strings:**
- Title: *"Newspaper Name sobald man sich auf einen einigt"*
- Location: *"Gebiet sobald man sich auf eines einigt"*
- Price: *"Preis in Gil"*

Triple horizontal rule dividers (top and bottom). Font: Playfair Display SC with `text-shadow: #ddd 4px 4px`. Three-column layout: location (left flex), date (centered), price (right flex).

### 22.5 Typography

- **Body & header — Crimson Pro** (single serif).
- **Custom Cinzel Eorzea** WOFF2 face loaded as Medium.
- Heading sizes: h3 2rem, h4 1.7rem, etc.
- `.subtitle` 1.6em centered.
- **Drop caps**: first letter of `.article__content` styled at 350% size, floated left, right-padded.

Background `#EDEDED` (light gray); link color `#556` with hover `#551a8b`. Webkit scrollbars `#CCCCCC` on `#EDEDED`. Striped lists alternate white / `#f5f5f5`.

### 22.6 Sidebars

- **`UserNavigation`** — circular avatar (36px) and Material icons:
  - Logged out → `login` icon → `/login`.
  - Logged in (verified): switch character, create article, my articles, [editor] submitted, logout.
- **`IssueNavigation`** — bordered `q-list` of issue numbers; each `q-item` routes to `/issue/{id}`.
- **`SiteFooter`** — credit + Discord invite + fictional disclaimer + German Square Enix copyright.

### 22.7 Article display — `ArticleView.vue`

```
<article>
  <header>
    <h2>{{ title }}</h2>
    <div class="article__subtitle">{{ subtitle }}</div>
    <div class="article__author">by <a>{{ pseudonym }}</a></div>
  </header>
  <div class="article__content" v-html="content"></div>
</article>
```

- `flex-grow:1`, 20px right margin, `column-rule: 1px solid #555` between columns when the parent uses CSS columns.
- 4rem bottom margin between articles.
- Author link uses `CHAOS_ARCHIVES_ROOT` (legacy interop) to format `/{server}/{character}` URLs back to the main client.

`Index.vue`, `Article.vue`, `Issue.vue` apply CSS columns at the page level (`columns: 2` for `Article.vue`, flex containers for the others) — the multi-column print look.

### 22.8 Publication workflow — `EditArticle.vue`

States: **Draft** → **Submitted** → **Published**.

- Form fields: Title (required), Subtitle, Summary (required, "Kurze Zusammenfassung" — main-site teaser, not shown in newspaper), Content (HTML, required). Editors choosing a thumbnail can pick from existing article images (lazy-loaded `GalleryDialog`).
- View toggle: Bearbeitung / Vorschau (renders `ArticleView`).
- Button bar branches on status:
  - **Draft** → Reset (with confirm), Save Draft, Submit for Publication (with confirm).
  - **Submitted** → Reset, Publish (editors only, with confirm).
  - **Published** → Save Changes.
- Status indicators: *"ENTWURF"*, *"Zur Veröffentlichung eingereicht"*, *"Veröffentlicht am {Eorzean date}"*.
- `formatDateEorzean()` produces strings like *"12th Sonne des Ersten Lichtmondes"* (FFXIV calendar).
- Same isDirty + revert dialog pattern as the main client.

### 22.9 Article lists

`ArticleList.vue` — striped `q-list`. Each row: title, status badge, edit button (when `article.canEdit`), author. Used by `MyArticles.vue` ("Meine Artikel", subtitle *"for {newsPseudonym or character name}"*, prominent **Neuen Artikel einreichen** CTA) and the editor `Submitted.vue` queue.

### 22.10 News-app specifics

- **Hardcoded TinyMCE API key** in `HtmlEditor.vue` (`dnguuf3c…`) — security concern.
- **No status filter** on `MyArticles` — all statuses listed together.
- **No auto-save** — same friction as the main client.
- **No mobile design verified** — fixed sidebars at 20px on a 1280px max layout will overlap or run off-canvas on small screens.

---

## 23. Shared Frontend Infrastructure

### 23.1 `client-common/` — API client

A class hierarchy of typed sub-APIs, all accessible via the singleton:

```
api.{characters, changes, contentNotes, communities, events, freeCompanies,
     images, links, locations, lodestone, news, noticeboard, search, servers,
     statistics, stories, support, user, venues, violations, weather, wiki}
```

Token management on the singleton: `setAccessToken`, `setRefreshToken`, `clearTokens`. `api-transport.ts` handles auth headers, refresh logic, and logout-on-401.

### 23.2 `wsclient/` — WebSocket client

Socket.io client used for **RPP (real-time character updates)** — driven from the FFXIV plugin, displayed reactively wherever the active character is rendered. The plumbing is present but the visible UX is mostly "the avatar/name in the header updates without reloading".

### 23.3 Shared utilities (in `client/src/common/`)

- `html-view-utils.ts`, `fandom-tabs.ts`, `wiki-import.ts` — see [§21](#21-rich-text-editing--markdown).
- `images.ts` — image URL helpers (`previewUrl > thumbUrl > url`).
- `notify.ts` — `notifyError(e)` / `notifySuccess(msg)` wrappers around Quasar Notify.
- `event-types.ts`, `pagelinks.ts`, `telemetry-consent.ts`, `theme.ts`, `sentry.ts`.

### 23.4 Top-level docs that influence direction

- **`CHARACTER_SELECTION_API.md`** — backend now accepts a unified `characterId` field on all content endpoints; the legacy name+server lookup still works.
- **`FRONTEND_MIGRATION_GUIDE.md`** — recommends migrating creation forms to use a character dropdown defaulting to the first verified character, with explicit error handling for unverified characters.
- **`IMPLEMENTATION_SUMMARY.md`** (Feb 12, 2026, marked complete) — security tightening (added missing `verifiedAt` checks in Venues/Communities; centralized `getVerifiedCharacter()`).
- **`PRIVACY_COMPLIANCE_CHECKLIST.md`** — DSGVO checklist, mostly green; outstanding: legal review of impressum text, full Verantwortlicher address, DPA verification with Sentry.
- **`VENUE_SUBPAGES_BACKLOG.md`** — all six tasks complete: section routing/SEO, staff visibility, jobs from noticeboard, image-to-venue media, `venues/my-editable` API, build verification.
- **`WIKI_IMPORT_PLAN.md`** — five-phase plan (sanitizer expansion → tab preservation → Fandom tab init → test page → security verification). Not yet implemented; `fandom-tabs.ts` is already in place as a downstream hook.

---

## 24. Cross-Cutting UX Patterns

These idioms recur across nearly every domain:

| Pattern | Implementation |
|---|---|
| **Edit / Preview toggle** | `q-btn-toggle` swapping form ↔ public component with `:preview="true"` |
| **Revert with confirm** | Modal: Cancel (secondary) + Zurücksetzen (negative); restores from `*Backup` |
| **Save loading** | `q-inner-loading` overlay; `saving` ref disables buttons |
| **Save success toast** | Notify with optional "Schließen" action |
| **Unsaved-changes guard** | `beforeRouteLeave` confirms discard, wording adapts to same- vs. different-character navigation |
| **Wiki Import** | Toolbar button → `WikiImportDialog` (URL → field selection wizard) |
| **Lodestone refresh** | Toolbar button → `RefreshCharacterDialog` confirming destructive sync |
| **Section drawer + section content** | Used by Character (view + edit), Venue (view + edit) |
| **Directory shape** | Hero + count box + filter toolbar + `q-table` grid + page-jump pagination |
| **Card** | `rgba(255,255,255,0.95)` / dark equivalent, gold/blue border, soft shadow, hover lift -2px |
| **Wikilink syntax `[[Name]]`** | Allowed in most string fields; never bolted to a visible UI affordance — only mentioned in caption text |
| **Report violation** | `ReportViolationSection` block at the bottom of public detail pages, opens `ReportViolationDialog` modal |
| **Carrd embedding** | `v-iframe-resize` directive on iframes, used by Character / FC / Venue / Community |
| **Time display** | Server TZ rendered, local TZ in tooltip; relative time via `$display.relativeTime` |
| **Loading bar** | Quasar's top accent-colored 4px bar during navigation/saves |

Edit and create pages share the same component file (e.g. `EditCommunity.vue` handles `/create-community` and `/edit-community/:id`); behavior diverges on whether `:id` is present.

---

## 25. Responsive Behavior

### 25.1 Breakpoints

Quasar defaults: `xs <600`, `sm 600–1023`, `md 1024–1399`, `lg 1400+`. The header gates desktop nav at `gt-lg` and shows the hamburger at `lt-xl`.

### 25.2 Header

- **`gt-lg`** — full desktop nav.
- **`lt-xl`** — hamburger appears, character pill shrinks to 180px min-width, nav-link `flex: auto`.
- **≤600px** — character pill at 12px padding / 8px gap, avatar 36px (from 42px), header height 56px (from 64px), menu icon 1.3rem.

### 25.3 Page shell

- **≥1200px** — 3-column grid (left gutter / 1300px content / 320px sticky calendar / right gutter).
- **<1200px** — single column; calendar widget falls below content.
- **≤sm** — page padding `20px 14px` (from 24px); h2/h3/h4 step down ~0.5rem each.

### 25.4 Domain-specific responsiveness

- **EventCalendar** stacks calendar + sidebar at <1100px. Stepper contracts on `md` and goes vertical on `lt-md`.
- **Character directory** & member grids switch from auto-fill to single-column.
- **EditCharacterAppearance** 2-col → 1-col at 900px; image min-height 420 → 280px.
- **EditCharacterPenAndPaper** 2-col card grid → 1-col at 900px.
- **Drawers** auto-collapse to mini-state on `$q.screen.lt.md`.

### 25.5 Reduced motion

A global `prefers-reduced-motion: reduce` media query disables all transitions, animations and hover translateY effects.

---

## 26. Accessibility Posture

### 26.1 What's in place

- Semantic landmarks (`<article>`, `<nav>`, `<section>`, `<header>`, `<main>`, `<footer>`).
- Definition lists for meta info (`<dt>`/`<dd>`).
- ARIA labels on icon-only buttons (e.g. *"Kalender ein- oder ausklappen"*, *"Treffpunkt beitreten"*, *"Event erstellen"*).
- `role="button"` and `tabindex="0"` on interactive non-button elements (calendar day cells, event cards).
- Quasar's built-in label associations on `q-input`/`q-select`/`q-checkbox`.
- Tooltips (`q-tooltip`) provide secondary information without crowding visible UI.
- Fandom-tab init applies full ARIA (`role="tab"`, `aria-controls`, `aria-selected`, `tabpanel`) and keyboard activation (Enter/Space).
- Focus visible on interactive elements (Quasar default).
- `prefers-reduced-motion` honored globally.

### 26.2 Gaps

- Heavy reliance on Material icons without text labels in some sidebars (especially the news-app `UserNavigation`).
- No documented dialog-focus-trap audits.
- No skip-link to main content.
- No formal screen-reader pass evident.

---

## 27. Known Placeholders, Inconsistencies, and Gaps

Compiled from the surface review, not interpretation:

1. **Newspaper masthead** still uses placeholder strings (*"Newspaper Name sobald man sich auf einen einigt"*, *"Gebiet sobald…"*, *"Preis in Gil"*) — visible to all visitors of `news/`.
2. **TinyMCE API key** is hardcoded in `news/src/components/common/HtmlEditor.vue` — should move to env config before public release.
3. **`isDirty` flag is module-scoped** in character editors — a latent bug if multiple editor pages are kept mounted simultaneously.
4. **`EditCharacterInventory.vue` preview** uses `<character-rumors :preview="true" />` — appears to be a copy/paste left over; there is no dedicated `CharacterInventory` view component.
5. **`CharacterRumors.vue`** is also reused for the Inventory section render (semantically misnamed).
6. **No auto-save** anywhere — long character/event/article editing sessions are vulnerable to tab close.
7. **No i18n framework** — all UI strings hardcoded German; no language switch.
8. **Wikilink syntax `[[…]]`** is only surfaced in small caption text under fields; first-time users may miss it.
9. **`MyArticles.vue` (news app)** has no status filter — drafts, submitted and published items intermix.
10. **News app mobile** is unverified — fixed 20px-positioned sidebars on a 1280px max layout will likely break below ~1100px viewport widths.
11. **Pen & Paper editor** writes to fields *also* edited on individual character tabs (Profile, Personality, Contacts, Inventory) — useful as a unified bundle, but creates conceptual ambiguity about where the canonical edit happens.
12. **`/test-editor`, `/test-character-selector`, `/test-sentry`** routes are in production routes.ts (admin-only via hardcoded check on `/test-sentry`; the others appear unguarded).
13. **`/event-calendar` legacy redirect** to `/calendar` indicates a recent rename — link rot guard, fine.
14. **Wiki Import sanitizer expansion (`WIKI_IMPORT_PLAN.md`)** — server-side limits currently strip the visual fidelity Fandom imports need (positioning, transforms, overflow, viewport units, background images). Plan exists, not yet shipped.
15. **DSGVO outstanding work** (`PRIVACY_COMPLIANCE_CHECKLIST.md`) — formal legal review of impressum/privacy texts, full Verantwortlicher address, DPA verification.
16. **Discord embed for noticeboard** (commit `13601e4`) is implemented but not yet documented in user-facing help (FAQ/BeginnerGuide).
17. **News app `LogIn.vue` and `Submitted.vue`** are referenced by routes but their detailed behavior couldn't be confirmed in the current snapshot of files reviewed.

---

*End of audit.*
