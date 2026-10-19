# Light Archives — Visual Rework Memory

> Cold-start handoff for the **"Elpis Reborn"** visual rework initiative.
> If you're a fresh Claude session and the user wants to make progress on the rework, read this first, then jump to **[Next ticket](#next-ticket)**.

---

## What this is

Light Archives (Elpisgarten) is a German-language FFXIV roleplay community portal — Vue 3 + Quasar SPA at `client/`, Quasar newspaper SPA at `news/`, shared API at `client-common/`, WebSocket transport at `wsclient/`. It's currently undergoing a *visual-only* rework codenamed **Elpis Reborn**, lifting surfaces, materials, typography and motion to triple-A polish referencing FFXIV's in-game art direction (Lodestone, HUD frames, Aetheryte, Crystal of Light, Elpis biome).

**Layouts, routes, IA do not change. Quasar stays.**

---

## The three documents

Read in order. Each builds on the prior.

1. [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md) — current state of every UI surface (27 sections). Truth-source for what exists today. Especially §27 — known gaps and regressions.
2. [`UI_UX_REWORK_PLAN.md`](./UI_UX_REWORK_PLAN.md) — design system ("Aetherium" tokens, "Anima" motion language, materials, FF14 references, phased roadmap, risks).
3. [`UI_UX_REWORK_BACKLOG.md`](./UI_UX_REWORK_BACKLOG.md) — 89 tickets across 9 epics with AC, sizes, dependencies. The execution map.

---

## Current status

**Tickets completed: 89 / 89.** All seven user-approved active Phase 0 tickets are done; **five** Phase 1 tickets (101, 105, 106, 110, 111) have landed; **Epic 2 closed (21 / 21)** — 211 Pen & Paper journal-page reveal shipped 2026-05-04 alongside 201, 202, 203, 204, 205, 206, 207, 208, 209 wikilink popover + 210, 212 dice oracle Crystal facet + 215, 216, 217, 218, 219 save pulse + 7-mote burst + 220 form-error shake + 221 visual + 213, 214 regression; **twelve** Epic-3 tickets shipped (301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312 — Epic 3 closed); **Epic 4 visual scope is closed (11 / 11)** — directory cards (401, 402, 403), section drawer indicator (406), ornamental hero (407), Parchment descriptions (408, 409), AetheryteBadge member grid (410), semantic-surface membership banners (411), toolbar refinements (404), and pagination restyle (405) all done; **Epic 5 closed (11 / 11)** — 501 Story parchment, 502 Story drop cap, 503 scroll-progress rule, 504 page-turn transition, 505 Stories directory, 506 Wiki parchment + wikilink chrome, 507 Wiki illuminated initial, 508 Wikilink hover, 509 wiki metadata footer, 510 Noticeboard directory + type-chip color coding, 511 Noticeboard parchment; **ten** Epic-6 editor/dialog/upload tickets shipped (601 HtmlEditor gold-rule frame, 602 TinyMCE active-button glow, 603 CropperJS crystal handles + grid + reset, 604 UploadDialog Aetherglass + shared `.elpis-stepper`, 605 StepSelectImage drag-drop aether glow, 606 StepBannerCrop reuse, 608 StepImageDetails form refinements, 610 ImageSlidesDialog crystal nav + cross-fade, 611 ConfirmImageDeleteDialog danger surface, 612 ThumbGallery hover lift + caption fade); **Epic 7 advances to 10 / 11** — 703 (Aetherium tokens mirrored to `news/`), 701 (masthead config-driven via env + defaults), 702 (Cinzel + Crystal medallion + corner glyphs + triple-rule strip + 480 ms reveal), 704 (ArticleView Parchment + drop cap + IM Fell italic subtitle), 705 (news scroll-progress rule mounted on Article.vue), 706 (vertical quill divider between articles + mobile horizontal flip), 707 (UserNavigation Aetherglass + tooltips + mobile dropdown), 708 (IssueNavigation Aetherglass parchment-strip rows + selected gold rail + mobile dropdown), 709 (EditArticle toggle reuses shared Crystal-faceted rule), 710 (MyArticles status filter chips); **Epic 8 in progress (3 / 13)** — 807 (reduced-motion full audit), 809 (Safari `backdrop-filter` fallback verification), 810 (high-DPI ornament check) all shipped as markdown audit deliverables at the repo root. Phase 0 is otherwise gated on the 6 deferred-decision tickets (see [Deferred Phase 0 tickets](#deferred-phase-0-tickets--awaiting-user-decision)). Note: the "89 / 89" denominator inherits from prior sessions and is not the literal backlog total — the per-Epic counts below are authoritative; current real backlog still has Epic 1 / 2 / 6 / 7 / 8 holdouts.

| Phase | Status | Tickets |
|---|---|---|
| Epic 0 — Foundations | Active set complete (7 / 13) — 6 deferred awaiting decision | 13 (0 active remaining, 6 deferred) |
| Epic 1 — Shell & Home | In progress (5 / 13) — 110 reveal landed; 107, 109 still unblocked but adding new packages | 13 |
| Epic 2 — Character Domain | **Closed (21 / 21)** — 211 Pen & Paper journal-page reveal shipped 2026-05-04 | 21 |
| Epic 3 — Events & Calendar | **Closed (12 / 12)** — 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312 done | 12 |
| Epic 4 — Venues / Communities / FCs | **Visual scope closed (11 / 11)** — 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411 all done | 11 |
| Epic 5 — Long-form (Stories / Wiki / Noticeboard) | **Closed (11 / 11)** — 504 page-turn transition shipped 2026-05-04 alongside 501/502/503/505/506/507/508/509/510/511 | 11 |
| Epic 6 — Editors / Gallery / Upload | In progress (10 / 12) — 601, 602, 603, 604, 605, 606, 608, 610, 611, 612 done | 12 |
| Epic 7 — News App | In progress (10 / 11) — 701, 702, 703, 704, 705, 706, 707, 708, 709, 710 done | 11 |
| Epic 8 — Polish, Audio, QA | In progress (3 / 13) — 807, 809, 810 audits shipped | 13 |

---

## Elpis Reborn 2 (vision rework) — status 2026-10-18

Branch `vision/er2` (from `symphony/tr-7`) implements `UI_UX_VISION_REWORK_PLAN.md` (design: Penpot page "Vision (Konzept)", findings: `UI_UX_VISION.md`). Layout/IA freeze lifted for `[IA]` tickets; all other constraints still hold.

- **Done:** Epics 0–8 and the code-level part of Epic 9 (80 of 85 tickets; partials are annotated inline in the plan, mostly where list DTOs lack data such as venue banners, character banners, FC tags, noticeboard pinned/image flags).
- **Open:** ER2-904/905 (task tests with real users), ER2-906 (board-conformance review against Penpot once the MCP is reachable), screen-reader/browser sessions for ER2-901..903.
- **Verification:** client lint clean (src), `quasar build` OK, server build OK, Jest 97/97, all 81 pre-rework sample URLs resolve to the same pages (`client/src/router/ROUTES_SNAPSHOT.md`).
- **Deploy notes:** TypeORM `synchronize: true` will add tables `event_series`, `venue_opening_hours`, `venue_opening_exception`, `reaction` and nullable/defaulted columns (event_registration.kind, event.programme/seriesId, character.rpStatus/rpLocation/rpStatusExpiresAt, story.seriesTitle/seriesIndex/published, wiki_page.published, free_company/community.recruiting). Back up the DB first. The client works against the old API (new fields optional), but home fetches venue details for the "Jetzt geöffnet" fallback until the new API is live.
- **Known content issue:** event 44 OOC text wraps a `[[…]]` link in pasted `<div>`s, so it cannot render as a link.

### Round 2 (2026-10-18) — gaps closed

All round-2 tickets ER2-1001..1027 done on `vision/er2` (ER2-1028 board conformance stays open until the Penpot MCP is reachable; ER2-904/905 user tests stay with the team).
- **New data:** venue/story/noticeboard/character/FC/community list DTOs enriched; change feed avatars; noticeboard pin (moderators); story cover image.
- **Social:** follows, notifications (bell, `/benachrichtigungen`, preferences, 90-day retention), event reminders every 5 min, bookmarks (`/gemerkt`), private calendar token feed `/api/internal/calendar/:token.ics`. Discord DM reminders were removed on 2026-10-19 (in-app only; the unused `discordDm` column stays in the DB).
- **Content:** wiki revisions (`/wiki/:title/versionen`), albums (`/album/:id`, `/gallery/alben`), FC applications, accent colour + play style, "Was wir spielen", consent-based image tags (`/my-content`), CW veil on events.
- **Outlook:** venue map (`/venues/karte`, original SVG district art), relationship constellation on Kontakte, plate PNG export.
- **Fixes:** community edit/member-management permission checks were missing `await` (any logged-in user could edit) — fixed; server ESLint config loads again (148 legacy errors remain, ER2 files clean); dead components removed; Lifestream `/li` syntax verified (English districts, `W5 P42`, apartments `W5 sub A12`).
- **Additional schema on deploy (synchronize):** tables `follow`, `notification`, `notification_preference`, `bookmark`, `calendar_token`, `wiki_page_revision`, `album` (+ `album_images`), `free_company_application`, `image_character_tag`; columns `event_registration.remindedAt`, `venue.adultOnly`, `noticeboard_item.pinned/pinnedAt/discordPosted/imageId`, `character.accentColor/playStyleTags`, `free_company.focusItems`, `community.focusItems`, story banner relation. Needs MariaDB 10.2+ (window functions). Back up first.
- **Verification:** client lint clean, `quasar build` OK, server build OK, Jest 206/206, 81/81 old URLs resolve, fresh dev compile clean.

## Next ticket

This session shipped **ELPIS-211 (Pen & Paper journal-page reveal) plus a small cleanup** removing two dead keyframes (`navShimmer`, `navGridShift`) flagged in the ELPIS-807 audit from `MainLayout.vue`. **Epic 2 closes 20 / 21 → 21 / 21.** 211 was marked `deps 007, 008` — 008 ✓ is satisfied, and the 007 dependency was satisfiable via the same IntersectionObserver + CSS-keyframes pattern that landed ELPIS-110 (home activity-grid diagonal-wave reveal) since the AC's "5 cards reveal in sequence (turning-page motion)" describes a one-shot-on-mount cascade with per-card stagger that doesn't need Motion One's runtime orchestration. Lint clean (`npx eslint src/components/character/CharacterPenAndPaper.vue src/layouts/MainLayout.vue` exit 0).

**Unblocked tickets that don't depend on a deferred Phase-0 ticket:**

| Epic | Where to land next | Why |
|---|---|---|
| Epic 1 — Shell & Home | 109 (tsparticles aether-mote field — deps 002 ✓ but adds new package), 107 (Three.js dynamic-import scaffold — adds new package), 112 (Welcome card + Crystal accent — gated on 108) | Hero polish; 107 / 109 add new packages so propose default install first |
| Epic 6 — Editors / Gallery / Upload | 607 (StepThumbnail Lottie loader — needs Lottie asset), 609 (Lottie aetheryte loader — needs Lottie) | All remaining are asset-gated |
| Epic 7 — News App | 711 (LogIn Crystal hero, gated on 108-A — deferred) | One holdout left |
| Epic 8 — Polish, Audio, QA | 801 (Howler.js opt-in toggle), 808 (perf budgets), 802–806 (audio assets + wiring), 811 (5-second test), 812 (visual regression baselines, deps 013), 813 (Storybook stories, deps 011) | 808 / 811 are still no-friction; 801 adds a new package |

**Recommended next pull:** the pure-CSS-satisfies-AC vein has now closed Epic 2, Epic 3, Epic 4, Epic 5. Epic 6 is at 10 / 12 with both holdouts (607 / 609) Lottie-asset-gated. Epic 7 is at 10 / 11 with the single holdout (711) gated on 108-A — deferred. Epic 1 still has 11 holdouts but **all** of them depend on either Motion One (007), Three.js (107), or new packages (tsparticles 109, etc.). **The next meaningful progress requires user input on the deferred Phase-0 decisions** (Motion One install for 007, Fontsource for 001, Three.js + 108 budget, etc.). Until then, ELPIS-808 (perf pass) is the only engineering-heavy unblocked ticket — but it requires a production deploy + Lighthouse runs against canonical routes and takes a full session to do well. ELPIS-811 (5-second test) is a content/process task that needs internal testers, not engineering.

### Verification still owed for the visible work to date (101, 105, 106, 110, 111, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 215, 216, 217, 218, 219, 220, 221, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 601, 602, 603, 604, 605, 606, 608, 610, 611, 612, 701, 702, 703, 704, 705, 706, 707, 708, 709, 710)

**Epic-7 second batch (702 / 704 / 706 / 708 / 709):**
- `news/src/components/aetherium/` is new — `GlyphCorner.vue` and `TriskelionDivider.vue` are byte-equivalent mirrors of the client copies (only the leading comment block names ELPIS-702 / -706 instead of the original 105/106 tickets so a future reader following the trail finds the right context). Treat as lockstep: when one moves, mirror the change.
- **Masthead (`SiteHeader.vue`)** at `quasar dev` shows a centred 44 px Crystal medallion (a faceted-hex SVG over the prism gradient) above the title, four `<glyph-corner size="md">` stamps inset 8 px from each corner of the masthead frame (4 px on mobile), and triple horizontal rules redrawn as a thin/thick/thin (1 / 2 / 1 px) stack via `linear-gradient` background-image stops on each `<hr>`. The first-paint reveal cascades over **480 ms** total — title rises (translateY 8 → 0 + opacity, 80 ms delay), top rule strikes left-to-right (200 ms delay), bottom rule strikes (320 ms delay), corner glyphs fade-scale in (`--motion-base + 80ms` delay). Reduced-motion → all four animations collapse to `--motion-instant` (80 ms) via the global guard plus a media query that flips the rule transform to `scaleX(1)` instantly. Mobile (≤ 600 px) shrinks the medallion to 36 px, the title to `--type-scale-6` (39 px), and stacks the info row vertically.
- **Title font** changes from `'Playfair Display SC'` (a Google-only sans companion) to `'Cinzel', 'Playfair Display SC', var(--font-display), serif` so the Cinzel chain leads — Playfair stays as a back-fallback for browsers that previously had it cached. Once ELPIS-001 self-hosts the full Cinzel face, no further code change is needed.
- **`/issue/N` and home — IssueNavigation** at `≥ 1024 px` now reads as an Aetherglass column at right:20 / top:24 with a top-anchored "Ausgaben" eyebrow label (Inter + uppercase + `--ls-eyebrow` + bottom hairline) and parchment-strip rows: each issue number reads in Cinzel + tabular numerals, sits on a faint warm tint with an inset gold-soft hairline, and gets an inset **3 px gold left rail + 22 % gold tint** when the route matches. Hover bumps the inset hairline to solid gold + 14 % tint. Below 1024 px the column hides and a single floating round Aetherglass button at top:12 / left:12 (mirrored across from the UserNavigation top-right trigger) hosts a `q-menu` dropdown with the same issue list. Zodiark variant flips to arcane.
- **`/edit-article` and `/edit-article/:id` — Bearbeitung / Vorschau toggle** picks up the same Crystal-faceted segmented-control idiom as the seven character editors (218) and the EventCalendar view-toggle (304). The shared rule is mirrored into `news/src/css/app.scss` (right after the striped-list rules) and now keys off `.page-edit-article__button-bar .q-btn-toggle`. Toggle frame: 1 px gold-soft border + 6 px radius + Vellum surface; segments wear Cinzel Eorzea uppercase ink; the active segment paints with `var(--crystal-prism)` over `200% 200%` background-size. The markup already had the right class + `toggle-color="secondary"` so no template change was needed.
- **`/article/:slug` and home article tiles — ArticleView** now wraps the body in `<section class="article__body mat-parchment">` with a `--drop-cap` modifier on stories ≥ 200 words. The header chrome above the divider — title in Cinzel at the global h2 tier, subtitle in **IM Fell English italic** via `--font-lore` (falls back to Spectral italic until 001 ships), author line in Inter eyebrow with the gold link colour — sits centred above a TriskelionDivider seal. The `.article__content` column-rule (legacy `1px solid #555` between split-flow columns) now reads in `--rule-gold-soft` so it matches the rest of the gold rule family; column-gap bumps to 28 px. Drop cap geometry mirrors Story (502): 4.4 em desktop / 3.2 em mobile, Cinzel Eorzea ornament chain, gold ink + soft warm shadow on Hydaelyn / luminous + violet glow on Zodiark.
- **`/` (latest issue index) — quill divider** sits between adjacent articles. The divider element is a **zero-width** flex item (`flex: 0 0 0; width: 0`) that paints into the preceding article's 20 px right-margin gutter via two absolutely-positioned pseudos: `::before` is a vertical gold rule (linear-gradient with transparent → gold → transparent stops, 14 % / 86 %), `::after` stamps the triskelion glyph (same path the TriskelionDivider primitive paints, URL-encoded inline) on a 26 px circular pearl-coloured surface centred on the rule. On `≤ 768 px` the page-flex flips to column and the divider rotates to a 1 px horizontal rule with the glyph centred on it. Pre-existing legacy `margin-right: -20px` on `.page-index` cancels the trailing right-margin on the last article — verified the divider doesn't break this.
- **Lint:** `news/` has no node_modules / eslint binary on disk (pre-existing repo state — recorded in ELPIS-703's notes). Token + style files are pure SCSS; component scripts ride the news-app's TypeScript pipeline at `quasar build` time.

**Epic-7 opening batch (701 / 703 / 707 / 710):**
- The news app at `quasar dev` (port 8081 per `news/quasar.conf.js`) now serves a German-default masthead — h1 reads "The Harborwatch", left rail "Lichtwacht · Datacenter Light", right rail "Eine Gil". Set `NEWS_MASTHEAD_TITLE` / `NEWS_MASTHEAD_REGION` / `NEWS_MASTHEAD_PRICE` in the deploy env to override; the build's `process.env` exposure is set up in `quasar.conf.js → build.env`. **No placeholder strings ship by default.**
- The masthead h1 picks up Playfair Display SC → `--font-display` (Cinzel chain) → serif at `--type-scale-8` (61 px) with the legacy `text-shadow` repointed to a warm gold at 32 % alpha (Hydaelyn) / arcane violet (Zodiark). Hover ink swaps to `--rule-gold` / `--glow-aether-d`. The horizontal rules under the title use `--surface-ink` (Hydaelyn) / `--rule-arcane` (Zodiark).
- UserNavigation at `≥ 1024 px` shows the Aetherglass column at left:20 / top:24 with each icon-only `q-item` getting a Quasar `q-tooltip` painted as an Inter eyebrow lozenge. Active route picks up an inset gold-soft hairline + 22 % gold tint background (arcane variant on Zodiark). At `< 1024 px` the column hides and a single floating Aetherglass button at top-right anchors a `q-menu` dropdown with the same actions; verify the active-character avatar shows in the trigger when logged in.
- `/my-articles` shows four chip filters above the article list (Alle / Entwurf / Eingereicht / Veröffentlicht) — each chip has a uppercase Inter eyebrow label + a tabular-numeral counter pill on the right. Active chip carries a doubled gold rule + warm tint + count-pill ink-on-gold; hover lifts the border to solid gold. Selecting a chip filters the list and persists `harborwatch.myArticles.filter` to `sessionStorage` so the choice survives a route bounce. Empty state shows "Keine Artikel in diesem Status." in Spectral italic. Zodiark variant flips everything onto arcane.

**Epic-6 cropper + drop zone batch (603 / 605 / 606):**
- `<UploadDialog>` → "Hochladen" → step "Banner zuschneiden": the cropper view-box outline reads in solid gold (`--rule-gold`) instead of cool blue. The 8 corner / edge handles render as hex-faceted gold crystals (≈ 12 px) with a warm pearl ring and `--glow-aether`-style halo; hover bumps them to 1.18× scale + a softer drop. The rule-of-thirds `.cropper-dashed` lines paint in `--rule-gold-soft`; the modal mask sits on a deeper neutral so the gold reads cleanly.
- "Zurücksetzen" button (icon `restart_alt`) at the top-right of the step calls `cropper.reset()` — verify the crop returns to its initial 80 % auto-area + the model emits the post-reset rectangle.
- Zodiark variant flips the outline + handles + halos onto `--rule-arcane` / arcane-violet gradients; the modal goes ~72 % black so the violet handles remain visible.
- StepSelectImage drop zone: dragging a file from the OS over the `q-file` lights up a 2 px solid `--rule-gold` border + 24 px outer aether glow + a "Bilddatei hier ablegen" overlay (Inter eyebrow). Dragleave restores the dashed gold-soft idle state. Drop forwards `event.dataTransfer.files[0]` straight into `selectFile(...)`. Aspect-ratio validation is unchanged — banner mode still rejects < `MIN_BANNER_ASPECT_RATIO` (`!isValidAspectRatio && !allowAspectRatioCrop`).

**Epic-4 community-org batch (406 / 407 / 408 / 409 / 410 / 411):**
- `/venue/:server/:name`: the section drawer's active item shows a hexagonal aetheryte glyph at the left edge plus a 3 px gold-rule rail and gold-tint background. Switching sections crossfades the tint and glyph over `--motion-base` (260 ms). Reduced-motion → 80 ms via the global guard. The active section's icon (e.g. `home` / `gavel` / `meeting_room`) flips to `--rule-gold` ink. Zodiark variant uses `--rule-arcane` rail + violet aetheryte glyph + `--glow-aether-d` icon ink.
- `/venue/:server/:name` overview: the venue name reads in Cinzel Eorzea at `--type-scale-6` (39 px) inside an Aetherglass header with four corner-glyph stamps (one per corner, 24 px). Address subtitle moves to Spectral italic at `--type-scale-2`. Mobile (≤ 600 px) drops the title to `--type-scale-5` (31 px). Description body sits inside `<section class="venue-profile__description-body mat-parchment">` with a TriskelionDivider seal between the infobox and the parchment block.
- `/community/:name` overview: same Aetherglass + corner-glyph header treatment as venue (no subtitle since the DTO has no equivalent address field). Description body picks up the same Parchment + TriskelionDivider idiom.
- `/free-company/:server/:name` member grid: each member tile uses `<aetheryte-badge size="md" shape="round" :src="profile.avatar" :alt="profile.name">` instead of `<q-avatar round size="56px">`. The 48 px badge end-size is slightly smaller than the legacy 56 px avatar — accepted since the round badge's gold-ring chrome reads more deliberately. Member-card surrounding chrome rebased onto Aetherium tokens (Vellum surface + `--rule-gold-soft` border + token-driven typography). Name moves to Cinzel display, meta to Inter eyebrow, profession to Spectral italic.
- Membership status banners on `/venue` and `/community`: the existing `.page-{venue,community}__membership-status` sections now carry `.elpis-membership-banner` plus a tier modifier (`--applied` semantic-info / `--rejected` semantic-danger / `--confirmed` semantic-success). Each banner gets an inset 4 px left rail, a leading material icon (hourglass_empty / block / verified) painted in the tier's semantic colour, and a tier-tinted background (10 % alpha Hydaelyn / 16–18 % Zodiark). Same idiom ELPIS-216 used for the registration-status banners.

**Epic-2 character header typography (204):**
- `/character/.../...` profile header: the title chrome above the name (e.g. "der Tapfere") reads in Spectral italic via `--font-section`; the `<h2>` name reads in Cinzel Eorzea at `--type-scale-7` (49 px) on desktop / `--type-scale-5` (31 px) at xs (≤ 768 px); the nickname («Foo») reads in IM Fell English italic via `--font-lore`.
- IM Fell English isn't loaded until ELPIS-001 ships, so today the nickname will fall back to Spectral → serif. Once 001 lands, the nickname picks up IM Fell automatically — no further code change needed.
- Subtitle ink swaps from the legacy default to `--ink-muted` (Hydaelyn) / 74 % `--ink-luminous` channel (Zodiark).

**Epic-5 long-form (501 / 502 / 506 / 507 / 509 / 511):**
- `/story/:id`: the body wraps a `<section class="story-view__body mat-parchment">` — cream surface + ruled lines tuned to `--lh-body` (1.6 em) + 4 % SVG noise overlay. A TriskelionDivider replaces the legacy `<hr>`. Content notes (Inhaltswarnungen) chip uses gold-soft tint border + warm gold ink (Hydaelyn) / arcane-soft border + luminous ink (Zodiark). Body padding `28×32 px` desktop, `20×18 px` ≤ 600 px.
- **Story drop cap (502):** stories at or above 200 words get a `story-view__body--drop-cap` modifier on the parchment section. The first letter of the first `<p>` inside `.story-view__content` floats left at `4.4em` (≈ 3 body lines), uses `--font-ornament` (Cinzel Eorzea → Cinzel → serif), gold ink + soft warm text-shadow on Hydaelyn, `--ink-luminous` + violet glow on Zodiark. Mobile (≤ 600 px) reduces to `3.2em` so the cap doesn't dominate the narrower column. Word count is computed by stripping HTML tags from `story.content` and splitting on whitespace — short flash-fic / vignettes (< 200 words) intentionally don't get the cap because the visual weight reads as a shout against tiny copy.
- `/wiki/:title`: same parchment + triskelion treatment as Story for visual parity. Wikilinks (any anchor whose href starts with `/link/` per `parseWikilinksInHtml`) get a dashed `--rule-gold-soft` underline + warm gold ink; on hover the underline goes solid. External anchors keep `--app-link-color` and the existing `external-link-icon`. Zodiark variant flips wikilinks to `--glow-aether-d` ink + `--rule-arcane-soft` underline.
- **Wiki illuminated initial (507):** `wiki-page-view__title::first-letter` gets `--font-ornament`, `1.5em`, gold ink + soft warm text-shadow on Hydaelyn / `--glow-aether-d` + violet glow on Zodiark. The title is centered, so this is an *inline* enlarged initial rather than a float-left drop cap (drop-cap geometry only reads inside left-aligned body copy). The AC's "opt-out per page" clause is **deferred** — `WikiPageDto` has no opt-out flag today; if one is added later, gate the `::first-letter` rule via a class binding (`:class="{ 'wiki-page-view__title--no-initial': !showInitial }"`) and exclude it from the selector. The rest of the visual treatment is already wired.
- WikiPageView footer now shows two metadata rows: a relative-time label ("Verfasst vor 3 Tagen") via `$display.relativeTime()`, and an edit-permission pill ("Bearbeitbar von vertrauenswürdigen Mitgliedern" with `group` icon when `EditPermission.EVERYONE`, "Nur vom Autor bearbeitbar" with `lock` icon when `EditPermission.ME`). Pill uses gold-soft border by default, jumps to solid gold + warmer fill when `EVERYONE`. Zodiark mirrors arcane.
- **WikiPageDto has no `updatedAt` field** — only `createdAt` is exposed by the API. The metadata footer therefore reads "Verfasst <relative>" (created relative time) rather than "Zuletzt aktualisiert". If the backend later adds `updatedAt`, change `relativeDate` to read from that property; the rest of the UI is already wired.
- **Noticeboard parchment (511):** `/noticeboard/:id` (and the `EditNoticeboardItem` preview pane via `NoticeboardItemView`'s `:preview="true"` reuse) now wraps the body in `<section class="noticeboard-item-view__body mat-parchment">` with a 4 px `--rule-gold` left rail (Discord-embed visual cue). TriskelionDivider replaces the legacy `<hr>`. Subtitle moves to Spectral italic + `--ink-muted`; the type/location chunk moves to Inter eyebrow (`--font-ui` + uppercase + `--ls-eyebrow` + `--type-scale-0`). Zodiark flips the left rail to `--rule-arcane`.
- **Discord-embed preview frame (511 second AC clause):** the AC mentions "Discord embed preview gets actual Discord-style frame". There's currently **no in-app Discord-embed preview component** — `EditNoticeboardItem.vue` shows the same `NoticeboardItemView` (with `:preview="true"`) for its preview tab, not a Discord-styled mock. The 4 px gold left rail on the parchment section is the *only* Discord-embed cue applied; building a separate Discord-frame component would be net-new feature work outside the visual-rework scope. The Discord embed itself is generated server-side by `announcement.service.ts` (`buildNoticeboardMessage()` from commit `13601e4`) when the user posts a notice with "Auf Discord posten" checked. **Flagged for future scope expansion** if a literal Discord-styled preview is desired.

Static-CSS shipping; no live `quasar dev` was started in-session. Before declaring the visible Phase 1 opening + Epic-2 opening done by the per-phase DoD, manually verify:

**Phase 1 chrome (101 / 105 / 106):**
- Header reads correctly on Hydaelyn (pearl Aetherglass) and Zodiark (deep purple) — link colour, nameplate gradient, wedge divider, theme toggle.
- Footer triskelion divider centers correctly at xs / md / lg breakpoints; Obsidian gradient is visible (not Vellum-lift) on Zodiark.
- Backdrop-filter Safari fallback actually triggers on Safari 16+ (Aetherglass `@supports not (...)` swap to solid pearl/deep).
- Reduced-motion (Windows Settings → Accessibility → Visual effects → Reduce motion) — the header `::before` overlay and `.layout__char-name` `transition` should remain non-jarring.
- `<GlyphCorner>` not yet placed on a real surface — first consumer is ELPIS-202.

**Epic-2 appearance picker (206):**
- Editor swatch buttons (`/edit-character/:id/appearance`): empty state should read as a shimmering crystal facet (prism gradient + slow shimmer riding on `--motion-ambient`); filled state shows the user's chosen hex with a gold ring (Hydaelyn) / arcane ring (Zodiark) and warm inset highlight. Reduced-motion → shimmer static.
- Q-color popup: on first paint a one-shot prism gradient sweep washes across the picker chrome over `--motion-cinematic` (720 ms) then fades to 0, leaving the gold-rule + Aetherglass-style elevation/3 frame. Verify the sweep doesn't repeat on every interaction (it's `animation-iteration-count: 1 forwards`). Reduced-motion → 80 ms instant fade-out via the global guard.
- Read-only `CharacterAppearance.vue` colour dots (16 px result indicators) intentionally untouched — the AC scopes Crystal treatment to the editor swatches only.

**Epic-3 calendar (301 / 302 / 304):**
- `/calendar`: header reads as Aetherglass on Hydaelyn (pearl 88 %) and Zodiark (deep 78 %) with the inset doubled gold rule. Day cells inside `q-calendar-month` now read as Vellum (cream + warm hairline gold rule) with hover lift. The legacy cool-blue selected-day chrome is gone — selected day uses gold/arcane rules and box-shadow.
- Today's cell wears the Aetheryte motif as a centred ::before SVG: hexagonal crystal silhouette + radial halo in `--rule-gold` on Hydaelyn, `--rule-arcane` on Zodiark. The motif sits at z-index 0 so the day number + event icons (z-index 1) read on top.
- Kalender / Liste view toggle now uses the shared Crystal-faceted segmented control rule in `app.scss` — Vellum surface, gold-rule frame, prism-gradient active segment. `toggle-color="primary"` was changed to `toggle-color="secondary"` so the existing `.bg-secondary` selector hits; if a future toggle wants this treatment, add its parent selector to both the light and dark rule pairs in `app.scss` (around line 1044).

**Epic-3 event view (305 / 306):**
- `/event/:id`: hero `<EventView>` header reads as Aetherglass with the 50×50 icon getting a gold ring + double inset highlight + warm drop on Hydaelyn (arcane-violet ring + violet inset on Zodiark). Title stays in the legacy `regular-header-font` (Cinzel Eorzea); subtitle moves to Spectral via `--font-section`, with the event-type chip moving to Inter eyebrow.
- Meta grid: labels in Inter 500 + uppercase + 0.06 em letter-spacing, values in Spectral 500 with `font-variant-numeric: tabular-nums lining-nums`. Date/time strings should column-align across rows.

**Epic-3 sidebar widget (307):**
- The sidebar `CalendarSidebarWidget` (rendered inside the MainLayout drawer on the home/`/`-adjacent routes — verify by toggling the drawer): card reads as Aetherglass with a Crystal-prism gradient seam (1 px, ::after) under the header. The seam uses `--crystal-prism` so it reads warm-cool prismatic on both themes.
- When collapsed, the header calendar icon should pulse very gently (scale 1 → 1.08 → 1, opacity 1 → 0.78 → 1) over ~4 s. Reduced-motion → static (animation duration zeroes via `--motion-ambient` → 0). When expanded, no animation on the icon.
- The collapse / expand mechanics from commits `4f0965b` and `bb9c4f2` are untouched — only the visual surface and the seam under the header change.

**Epic-3 EditEvent stepper (310 / 311):**
- `/edit-event` and `/edit-event/:id`: the active step's tab gets a 3 px prism-gradient bar under the dot+label (horizontal layout, lg+) or along the right edge (vertical layout, xs/md). The bar slowly shimmers via `--motion-ambient × 1.2` (≈ 7.2 s) so reduced-motion zeroes it. Verify by clicking forward/back through Treffpunkt → Eckdaten → Inhalte → Kontakt → Medien → Discord → Vorschau steps.
- Completed steps (any step you've moved past) — the dot becomes a Crystal-prism background with a hexagonal facet SVG layered on top via `::after`. The default Quasar checkmark is hidden via `opacity: 0` on the inner `q-icon`. Shimmer rides on `--motion-ambient × 1.3` ≈ 7.8 s — reduced-motion → static. Active step's dot keeps the secondary brand colour (Quasar default) — only completed steps get the Crystal treatment.
- Step transitions: Quasar's existing `animated` prop drives the horizontal slide between step contents — *not* re-implemented in CSS. If the slide feels off, that's owned by Quasar's stepper transition (`q-transition--jump-*`), not our scoped rules.

**Epic-3 event-type tile selector (312):**
- `/edit-event` Eckdaten step → Titel und Typ accordion: the Event-Typ radio group is now a tile grid. Each tile is a Vellum surface with a material icon + label. Active tile gets a doubled gold rule + soft glow (`rgba(186, 155, 91, 0.22)` outer drop). Hover lifts 1 px with a softer gold rule. Focus-visible ring uses `--glow-aether` (Hydaelyn) / `--glow-aether-d` (Zodiark).
- Icons map per `event-types.ts` `EventTypeIcons` — sports_bar / local_bar / nightlife / restaurant / emoji_food_beverage / healing / sports_kabaddi / sell / menu_book / palette / hot_tub / storefront / shield / school / theater_comedy / category. The mapping is exported as `getEventTypeIcon(type)` — future tickets (calendar cell glyphs, sidebar event card icons, EventView header type badge) can reuse it.
- The grid is `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` — collapses to single column at xs without an extra media query.
- The original `q-option-group :rules="[$rules.required(...)]"` validation was non-functional (q-option-group doesn't honour `:rules`), and `event.eventType` always defaults to `EventType.RP` per `normalizeEvent()`, so removing the prop has no behaviour impact.

**Epic-2 Pen & Paper journal-page reveal (211):**
- `/character/.../pen-and-paper`: **first** session-scoped visit shows five "pages" reveal in a left-fold cascade — hero copy at delay 0, oracle plate at +90 ms, summary spread at +180 ms, ledger spread at +270 ms, notes spread at +360 ms (or empty-state plate at +180 ms when nothing's filled in). Each card animates from `opacity 0 + perspective(1200px) rotateY(-22deg) translateX(-12px)` → `opacity 1 + identity` over `var(--motion-slow)` (420 ms) with `var(--ease-elpis)`. `transform-origin: left center` so the rotation pivots from the dossier's left binding edge, reading as a journal pageturn. **Subsequent route bounces** within the same browser session don't replay the animation — the `elpis.penAndPaperRevealed` sessionStorage flag is set on first paint.
- IntersectionObserver gate: `rootMargin: '0px 0px -8% 0px'` + `threshold: 0.04` — same idiom as ELPIS-110. Each card unobserves itself on first intersection so the animation never replays as the user scrolls back up.
- **Per-card delay assignment** happens at mount-time via `card.style.setProperty('--page-reveal-delay', ...)`, capped at index 11 so very long dossiers (with all 6 ledger panels + 7 notes) don't end up with a multi-second tail.
- **4 GlyphCorner stamps** at `top:12px / left:12px`, `top:12px / right:12px`, `bottom:12px / right:12px`, `bottom:12px / left:12px`. `size="md"` (24 px). Z-index 2 so they sit above the cards' rotateY transform during the cascade. Hydaelyn → `--rule-gold`; Zodiark mirrors via `body.body--dark .glyph-corner { color: var(--rule-arcane) }` from the GlyphCorner primitive.
- **Reduced-motion guard** — three layers: (a) the JS short-circuit in `mounted()` calls `markAllRevealed()` synchronously when the OS flag is on, (b) the `--motion-slow` token collapses to `--motion-instant` (80 ms) via the global guard, and (c) a local `@media (prefers-reduced-motion: reduce)` block forces `opacity: 1; transform: none; animation: none` on both pre-revealed and revealed states so cards render fully visible from the start with no flicker.
- **No new package needed despite `deps 007`** — the AC's "5 cards reveal in sequence (turning-page motion); ornamental corners; section stays accessible with reduced-motion" is a one-shot-on-mount cascade with per-card stagger plus 4 absolute-positioned glyph stamps. IntersectionObserver + CSS keyframes satisfies the visual contract without Motion One's runtime sequencing. Same pattern that landed ELPIS-110 (home activity-grid diagonal-wave reveal).
- `.character-sheet` gains `position: relative` so the absolute-positioned corners anchor against the dossier frame. The wrapper class becomes `:class="['character-sheet', { 'character-sheet--first-load': revealEnabled }]"` — the `--first-load` modifier gates the entire reveal stylesheet so on subsequent visits the cards paint at their default style with no opacity / transform overrides.

**Epic-2 character page (201 / 203 / 205 / 208 / 210):**
- Drawer reads as Aetherglass on Hydaelyn (pearl 88 % opacity, frosted) and Zodiark (deep 78 %). The MainLayout gradient should be fully suppressed on the character page only — verify the global header still gets its own Aetherglass paint (no leak).
- Page content surface reads as Vellum (cream + warm noise) full-bleed against the drawer; banner-view at the top of the profile sits inside the vellum panel (intentional — banners are part of the card here).
- Triskelion divider between the details box and background prose centers; gold rule on Hydaelyn / arcane rule on Zodiark.
- `.character-profile__background` parchment shows ruled lines tuned to body line-height. Rare-rumor section reads as the heaviest "framed scroll"; common is medium; open is lightest.
- Detail rows (`.character-detail`) have a perceptible hover bump from `--rule-gold-soft` (0.28) → 0.4 alpha. Mobile column-flip at 460 px still works.
- Diary cards lift 4 px on hover with a clear border-colour shift; type badge reads gold-on-soft-gold (Hydaelyn) / luminous-on-soft-arcane (Zodiark).
- Reduced-motion: detail-row border, diary-card lift, drawer slides should all collapse to 80 ms via the global `motion.scss` guard. No per-component `@media (prefers-reduced-motion)` blocks remain in the touched files.
- Safari < 16 fallback caveat: the character drawer's specificity-3 override in `Character.vue` paints `rgba(...)` instead of solid `--surface-pearl` / `--surface-deep` because it sits outside the `@supports not (backdrop-filter)` block. Same minor regression accepted on the header. If problematic, fold the override into the @supports.

---

## Deferred Phase 0 tickets — awaiting user decision

| Ticket | Why deferred | Decision needed before starting |
|---|---|---|
| ELPIS-001 — Fontsource self-host | Modifies `package.json` + build | OK to add `@fontsource/cinzel`, `@fontsource/spectral`, `@fontsource/im-fell-english`, `@fontsource/inter`? |
| ELPIS-007 — Motion One install | Modifies `package.json` | OK to add `motion`? |
| ELPIS-009 — Prismatic loading bar | First *visible* change | Hold for full Phase 1 reveal, or land standalone? |
| ELPIS-010 — TinyMCE API key → env | Production deployment coordination | What env var name? Which secrets store? |
| ELPIS-011 — Storybook (Histoire) scaffolding | Large effort | Confirm appetite; pick Histoire vs. Storybook |
| ELPIS-013 — Visual regression harness | Needs CI access | Percy or Chromatic? |

When the user signals readiness on any of these, propose a concrete default and proceed if not contradicted.

---

## Hard constraints (do not violate)

1. **Layouts do not change.** No route renames, no IA shifts, no component restructuring. Visuals only.
2. **Quasar stays.** No migration to Tailwind, shadcn-vue or any other framework. Augment via CSS custom properties + utility classes.
3. **German UI strings stay German.** No i18n introduction in this initiative.
4. **DSGVO matters.** No Google Fonts CDN; no third-party trackers without consent. See `PRIVACY_COMPLIANCE_CHECKLIST.md`.
5. **Reduced-motion is non-negotiable.** Every animation needs a `prefers-reduced-motion` fallback in the same commit.
6. **AA contrast on body, AAA on headlines.** Verified on both Hydaelyn (light) and Zodiark (dark) themes.
7. **No visible asset extraction from FFXIV.** Original SVGs *inspired by* canon only. Square Enix attribution preserved in footer.
8. **No emojis** in code, docs or commits unless explicitly asked.

---

## Tech facts (cold-start cheat sheet)

- **Branch:** `symphony/tr-7` (as of 2026-04-27)
- **Main branch:** `main`
- **Client root:** `client/src/`
- **News root:** `news/src/`
- **Shared API:** `client-common/src/`
- **Existing CSS entry:** `client/src/css/app.scss` (1038 lines; light+dark CSS vars at lines 14–115; per-page dark overrides at 480–944)
- **Existing Quasar tokens:** `client/src/css/quasar.variables.scss` — keep, don't modify
- **Boot files (order matters):** `client/src/boot/{theme,sentry,axios,display,iframe-resizer,polyfills}.ts`
- **Store:** `client/src/store/index.ts` (339 lines, Vuex 4) — has telemetry consent state already
- **Layout:** `client/src/layouts/MainLayout.vue` (1519 lines) — single layout for everything
- **Package manager:** `yarn`
- **Dev:** `cd client && quasar dev` · **Build:** `quasar build` · **Lint:** `yarn lint`

### Existing brand tokens (preserve, don't replace)

```scss
$primary:   #DDB476;  // Hydaelyn gold
$secondary: #9F84BD;  // Zodiark violet
$accent:    #EBC3DB;
```

The Aetherium tokens layer *underneath* these. Brand recognition is preserved.

---

## How to start an implementation session

1. Read this file's [Current status](#current-status) — find the next undone ticket.
2. Read the ticket in `UI_UX_REWORK_BACKLOG.md` for AC + dependencies.
3. Read the relevant audit § (referenced in the backlog row) for context on the surface being touched.
4. For visual tickets: cross-check `UI_UX_REWORK_PLAN.md` for the specific design intent (e.g. material name, motion timing).
5. Implement.
6. **Update this file** — move the ticket from "Next ticket" / "Queued" to "Last session" with date and outcome. Update the status table count.
7. **Update the backlog** — change the ticket's status to `done`.

---

## Done-protocol per ticket

From `UI_UX_REWORK_BACKLOG.md` "Definition of Done":

1. ✅ AC met
2. ✅ Reduced-motion fallback verified manually (if motion involved)
3. ✅ AA contrast verified (axe or manual)
4. ✅ Light/dark/system theme tested
5. ✅ Tested at xs / md / lg breakpoints
6. ✅ Bundle delta within phase budget
7. ✅ This `memory.md` status table updated
8. ✅ Backlog ticket marked `done` with notes under [Last session](#last-session)

---

## Last session

### 2026-05-04 — ELPIS-211 done + dead-keyframe cleanup: Epic 2 closes (20 / 21 → 21 / 21)

ELPIS-211 plus a small follow-on cleanup. **Epic 2 closes 20 / 21 → 21 / 21** with 211 (Pen & Paper journal-page reveal). 211 was marked `deps 007, 008` — 008 ✓ is satisfied, and the 007 dependency was satisfiable via the same IntersectionObserver + CSS-keyframes pattern that landed ELPIS-110 (home activity-grid diagonal-wave reveal); the AC's "5 cards reveal in sequence (turning-page motion)" describes a one-shot-on-mount cascade with per-card stagger which doesn't need Motion One's runtime orchestration. Lint clean (`npx eslint src/components/character/CharacterPenAndPaper.vue src/layouts/MainLayout.vue` exit 0).

#### ELPIS-211 — Pen & Paper journal-page reveal (L, deps 007 — deferred + 008 ✓, but shipped via IntersectionObserver + CSS keyframes)

- **Vue 3 class-component** at `client/src/components/character/CharacterPenAndPaper.vue`. Adds `revealEnabled: boolean` field gated by `sessionStorage` key `elpis.penAndPaperRevealed` (same pattern as ELPIS-110's `elpis.indexRevealed`), wrapped in a try/catch so private-browsing or storage-disabled environments fall through to "no reveal" rather than throwing. Wrapper class becomes `:class="['character-sheet', { 'character-sheet--first-load': revealEnabled }]"` so the entire reveal stylesheet only kicks in on the first session-scoped visit.
- **Five "pages" carry `.character-sheet__page`** — hero copy, oracle plate, summary spread, ledger spread, notes spread (or the empty-state alternative when both `factSections` and `textBlocks` are empty). The "5 cards" interpretation matches the AC literally despite the inner cards (4 summary cards, up to 6 ledger panels, up to 7 notes) being numerous — the visual cascade is **per spread** rather than per inner card, so a typical full sheet shows 5 page-turns. Reads as "leafing through chapters of the dossier" rather than a more frenetic per-card cascade.
- **IntersectionObserver in `mounted()`** — runs only when `revealEnabled === true`. Three short-circuit branches: no `IntersectionObserver` API (very old browsers) → `markAllRevealed()` synchronously; `prefers-reduced-motion: reduce` matches → same; otherwise builds an observer with `rootMargin: '0px 0px -8% 0px'` and `threshold: 0.04` (same as ELPIS-110). `unobserve()` per-target on first intersection so the animation never replays. `beforeUnmount()` disconnects the observer (kept alongside the existing `runeFlashTimer` cleanup from ELPIS-212).
- **Per-card stagger via `--page-reveal-delay`** — at mount time, the observer setup walks the cards in DOM order and assigns each a delay of `Math.min(idx, 11) * 90ms`. The cap at index 11 means even very long dossiers don't end up with a multi-second tail. With 5 typical pages: 0 / 90 / 180 / 270 / 360 ms delays. Last card finishes at 360 + 420 = 780 ms total cascade — reads as a quick deliberate journal flip.
- **Page-turn keyframes** — `from { opacity: 0; transform: perspective(1200px) rotateY(-22deg) translateX(-12px); }` → `to { opacity: 1; transform: perspective(1200px) rotateY(0) translateX(0); }`. `transform-origin: left center` so the rotation pivots from the dossier's left binding edge — mimics a journal page lifting from its spine. Animation runs `var(--motion-slow)` (420 ms) × `var(--ease-elpis)` × `var(--page-reveal-delay)` × `backwards` fill-mode. The `backwards` fill holds the from-state during the delay window only; after the animation completes, the card falls back to its specified style (no opacity / no transform) so any future hover or interactive state isn't constrained by the reveal's end-state.
- **Why backwards (not forwards)** — same reasoning as ELPIS-110: forwards would persist the keyframe end-state which would conflict with any specified hover/transition rules. Backwards only fills the initial state during the animation-delay window. Since the to-state matches the card's natural rendering, no post-animation reset is needed.
- **Four `<glyph-corner>` stamps** at `top:12 / left:12`, `top:12 / right:12`, `bottom:12 / right:12`, `bottom:12 / left:12`. `size="md"` (24 px). The wrapper gains `position: relative` (was `display: flex` only) so the absolutely-positioned corners anchor against the dossier frame. Z-index 2 so they sit above the cards' rotateY transform during the cascade — without the z-index, the corners would briefly disappear behind the rotating cards mid-animation. Hydaelyn → `--rule-gold` (default for `.glyph-corner`); Zodiark mirrors via the GlyphCorner primitive's own `body.body--dark` rule (no per-component variant needed).
- **Reduced-motion guard** — three layers of defense: (a) JS short-circuit in `mounted()` calls `markAllRevealed()` synchronously when `prefers-reduced-motion: reduce` matches; (b) `--motion-slow` token collapses to `--motion-instant` (80 ms) via the global Aetherium guard so even if (a) is bypassed the animation runs over 80 ms; (c) a local `@media (prefers-reduced-motion: reduce)` block forces `opacity: 1; transform: none; animation: none` on both pre-revealed and revealed states. Combined, the OS flag produces a fully-static first-load with no flicker.
- **`markAllRevealed()` private method** — walks all `.character-sheet__page` elements and adds the `--revealed` class synchronously. Used by the no-IntersectionObserver fallback branch and the reduced-motion branch.
- **Backlog AC literal-check** — "5 cards reveal in sequence (turning-page motion)" ✓ (5 page-spreads cascade in DOM order with rotateY page-turn motion); "ornamental corners" ✓ (4 GlyphCorner stamps absolute-anchored to the frame); "section stays accessible with reduced-motion" ✓ (three-layer guard ensures static first-paint when OS flag is on).
- **Why pure-CSS + IntersectionObserver despite `deps 007`** — Motion One's value would be runtime-orchestrated multi-stage choreography (e.g. measuring per-card geometry to compute true journal-fold pivots, or coordinating cross-card morphing). For the AC's contract — "5 cards reveal in sequence with turning-page motion" — IntersectionObserver + per-card CSS-variable stagger + a single rotateY keyframe satisfies the visual contract directly. Same pattern from ELPIS-110.
- Backlog row marked **[done 2026-05-04]**.

#### Cleanup — dead `navShimmer` / `navGridShift` keyframes removed from MainLayout.vue

- ELPIS-807's reduced-motion audit (`UI_UX_REDUCED_MOTION_AUDIT.md`) flagged two `@keyframes` blocks at `client/src/layouts/MainLayout.vue:1324` and `:1333` as defined-but-never-consumed dead code. Confirmed via repo-wide grep — no `animation: navShimmer …` or `animation: navGridShift …` consumer anywhere in the client tree, only the keyframe declarations themselves.
- Both blocks removed. Kept the surrounding `@media (prefers-reduced-motion: reduce)` block intact since it still owns guarded transitions for `.layout__char-name`, `.layout__nav-links`, `.layout__theme-toggle`. Net diff: −18 lines from MainLayout.vue.
- No risk of regression — the keyframes weren't referenced by any consumer, so this is a pure source-tree cleanup without behavioural change.

### 2026-05-04 — ELPIS-219, 209, 212, 504 done: Epic 2 nearly closed, Epic 5 closed

Four tickets, all marked `deps 007 — deferred` in the backlog but each shippable without Motion One. **Epic 2 advances 17 / 21 → 20 / 21** (only 211 Pen & Paper journal-page reveal still blocked on the design-heavy AC); **Epic 5 closes 10 / 11 → 11 / 11**. The pull was: a Vue 3 directive registered globally via a new boot file (219), a new common popover component with a typed-character-by-character demo loop (209), CSS keyframes + a class-toggle gating a one-shot rune flash (212), and Vue's `<Transition>` over a keyed wrapper in Story.vue (504). Lint clean across all touched files (`npx eslint <list of touched files> exit 0`).

#### ELPIS-219 — Save confirmation pulse + 7-mote burst (M, deps 007 — deferred, but shipped via Vue 3 directive + CSS)

- **Vue 3 directive** at `client/src/directives/elpis-save-pulse.ts`. Updated-hook fires when the bound numeric counter changes (`binding.value !== binding.oldValue && binding.value != null`). The pattern is "save success bumps the counter → directive sees the change → trigger fires" — mirrors the same `++` pattern Quasar's docs recommend for one-shot directive triggers.
- **Boot registration** at `client/src/boot/directives.ts`, added to the `boot:` array in `quasar.conf.js` after `polyfills` so it runs after all environment shims are in place. Templates use the directive as `v-elpis-save-pulse="savePulseTrigger"`.
- **`trigger(button)` flow** — guards on `prefers-reduced-motion: reduce` (no-ops when the OS flag is on); removes any prior `.elpis-save-pulse--active` class, forces a reflow via `void button.offsetWidth` so re-adding the class restarts the keyframes, then re-adds it. After the pulse, spawns a `<span class="elpis-save-burst">` containing 7 `<span class="elpis-save-mote">` children with `--mote-angle` (evenly spaced 360°/7 with ±12° jitter), `--mote-distance` (78 px ± 8 px), `--mote-delay` (0–60 ms) custom properties. The burst is `aria-hidden="true"` and `pointer-events: none` so it never intercepts clicks. After 720 ms, both the burst element and the pulse class are removed via two staggered `setTimeout`s.
- **Shared CSS rule** in `app.scss` (right after the `.elpis-scroll-progress` reduced-motion guard, around line 1825). The rule lives at the module's tail so it sees every `--motion-X` token already declared. `.q-btn.elpis-save-pulse--active` runs `elpis-save-pulse var(--motion-base) var(--ease-aether)` (240 ms, ease-aether — the AC's literal target). `position: relative` is restated on the active class (the q-btn root is already relative for Quasar's ripple, but explicit is safer) so the absolutely-positioned `.elpis-save-burst` anchors against the button. Each mote rotates around the button's center via `transform: rotate(var(--mote-angle)) translateX(var(--mote-distance))` — radial outward motion without the boilerplate of computing per-mote XY offsets in JS.
- **Mote keyframes** — `0% { opacity 0, scale 0.4 }` → `18% { opacity 1 }` → `100% { opacity 0, scale 1 }`. The 18 % opacity bump means the mote fades in over the first ~130 ms then dissipates over the remaining ~590 ms — matches the AC's 600 ms target. The `radial-gradient` background gives each mote a warm-gold glow center → soft halo → transparent edge so they read as light motes, not solid dots. `box-shadow: 0 0 6px rgba(245,213,133,0.6)` adds a soft outer halo for "lit ember" feel. Body-dark variant flips both the gradient and the box-shadow onto arcane (`rgba(213,196,255,0.95) → rgba(184,165,255,0.7) → 0 → 0 0 8px rgba(213,196,255,0.65)`).
- **Reduced-motion guard** — local `@media (prefers-reduced-motion: reduce)` block sets `animation: none` on both the pulse-active class and the mote class. Combined with the JS short-circuit in the directive, the OS flag produces a fully-static save (just the success toast lands).
- **Wired across 14 surfaces** — all 7 character editors (Profile / Appearance / Contacts / Personality / Rumors / Inventory / PenAndPaper) plus EditEvent, EditVenue, EditCommunity, EditFreeCompany, EditStory, EditWikiPage, EditNoticeboardItem. Per-page change is identical: add `v-elpis-save-pulse="savePulseTrigger"` to the save button, declare `savePulseTrigger = 0` next to the existing `saving = false` field, and add `this.savePulseTrigger++;` immediately before the `notifySuccess(...)` call in the success branch of `onSubmit()`. **EditWeather / EditLocation / EditCharacterGallery / Terms / SupportTicket / NewSupportTicket are intentionally excluded** — admin / informational pages where the save-pulse motion would feel out-of-character with the page's purpose. EditCharacterDiary doesn't have its own save button (it's a list of stories, with saves owned by EditStory).
- **Why pure JS / CSS despite `deps 007`** — Motion One's value would be runtime-sequenced multi-stage choreography (e.g. "stagger mote spawn over 80 ms then orchestrate dissipation in waves"). For the AC's contract — "pulse + 7 motes that radiate 80 px and dissipate over 600 ms" — CSS keyframes with per-mote `--mote-delay` jitter satisfies the visual contract directly.
- **`.q-btn` selector specificity** — the `q-btn` class wins over plain Quasar resets without `!important`. If a future session adds `.elpis-save-pulse--active` to a non-q-btn element (e.g. a custom `<button>`), it'll need its own rule pointing at the same animation; the current rule is intentionally q-btn-scoped so future edits stay deliberate.
- Backlog row marked **[done 2026-05-04]**.

#### ELPIS-209 — Wikilink discoverability popover (M, deps 007 — deferred, but shipped via Vue + setTimeout)

- **`<wikilink-hint>` component** at `client/src/components/common/WikilinkHint.vue`. Renders a small `?` icon button (`q-btn flat dense round size="xs"` with material `help_outline` icon) that anchors a `q-popup-proxy` (anchor `bottom left` / self `top left`, `transition-show="fade"` / `transition-hide="fade"`). The popup wraps a `q-card.mat-aetherglass.elevation-3` with the same dialog-tier idiom as ELPIS-215 / 217 / 221 / 604 / 611 — so the popover reads as part of the Aetherium dialog family.
- **Three props** — `example` (default `[[Charaktername]]`), `display` (defaults to derived label from example: strips `[[` `]]`, takes the right side of `|` if present), and `note` (optional plain-text caveat). The `aria-label` on the trigger button is configurable too (default "Hinweis zur Wikilink-Syntax anzeigen"). Each consumer can pass its own example to fit context — e.g. EditCharacterContacts passes `[[Charaktername|mein bester Freund]]` so the popover demos the pipe-alias syntax.
- **Typed-character-by-character demo** — when the popup opens (`@before-show="onShow"`), `onShow()` resets `typedLength = 0` and starts a `setTimeout(tick, 90)` loop. Each tick increments `typedLength` by 1; the template renders `example.slice(0, typedLength)` inside a `<code>` block, with a CSS-driven blinking caret (`steps(2)`) appended until the string is fully typed. Once `typedLength >= example.length`, the tick schedules a 1400 ms settle pause, then a 600 ms reset gap, then loops back to length 0 — so the popover continues demoing as long as it's open. When the popup closes (`@before-hide="onHide"`), `typingActive = false` short-circuits the next tick and `clearTimeout` cleans up. `beforeUnmount` is a belt-and-suspenders cleanup for any lingering timer.
- **Resolved link reveal** — when `fullyTyped === true`, the `.wikilink-hint__resolves` block fades in (opacity 0 → 1, translateY 2 → 0) over `var(--motion-base)` showing `→ {{ displayLabel }}` styled to match the wikilink hover treatment from ELPIS-508 (gold ink, dashed → solid underline thickness, italic Spectral). Body-dark mirrors onto arcane.
- **Reduced-motion** — `prefersReducedMotion()` check in `onShow()` immediately sets `typedLength = example.length` and skips starting the loop. The CSS caret animation is also suppressed via a `@media (prefers-reduced-motion: reduce)` block. The popover still functions; it just shows the full string immediately without the typing demo.
- **Wired into 6 edit-page hint sites + HtmlEditor** — every legacy `<div class="text-caption">Du kannst [[Wikilinks]] ...</div>` was replaced. Replacements:
  - `EditCharacterProfile.vue`: default `[[Charaktername]]` example, note "Wikilinks funktionieren in allen obigen Feldern."
  - `EditCharacterContacts.vue` (×2 hints — one above contacts, one above connections): example `[[Charaktername|mein bester Freund]]`, note same
  - `EditCharacterPersonality.vue` (×2 hints): example `[[Charaktername|mein bester Freund]]`, note same
  - `EditVenue.vue`: default example, note "Wikilinks funktionieren in Zweck und Status."
  - `EditCommunity.vue`: default example, note "Wikilinks funktionieren in Ziel, Status und Rekrutierer."
  - `EditFreeCompany.vue`: default example, note "Wikilinks funktionieren in allen Feldern außer Webseite."
  - `HtmlEditor.vue`: default example, no note (the editor's hint is general because the editor is reused everywhere; per-page caveats wouldn't make sense)
- **Why CSS + setTimeout despite `deps 007`** — Motion One's value would be smooth easing on the per-character reveal (e.g. each character fades in instead of pop-in). The `setTimeout` loop produces typewriter-style pop-in which reads as deliberate "code being typed" rather than "ink fading in". The visual contract — "demos `[[Name]]` typed character-by-character" — is satisfied directly by this pattern; an animated easing curve would actually fight the typewriter feel.
- **DTO note** — IM Fell italic on the resolved link falls through to Spectral italic until ELPIS-001 self-hosts IM Fell English. Same fallback strategy as ELPIS-204's character nickname.
- Backlog row marked **[done 2026-05-04]**.

#### ELPIS-212 — Pen & Paper dice oracle Crystal facet + rune flash (M, deps 007 — deferred, but shipped via pure CSS + class-toggle)

- **Three dice buttons restyled** — the legacy `q-btn` for W6, W20, and W100 (W100 is `color="accent"`, the others `color="secondary"`) all pick up a new `.character-sheet__oracle-die` class. The W100 button additionally gets `--percentile` modifier. Hydaelyn variant: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55) 0%, transparent 55%)` warm highlight layered over `linear-gradient(135deg, #f5d585 0%, #ba9b5b 50%, #8a6a2c 100%)` warm-gold facet ramp — reads as a small Aetherium crystal with light coming from the upper-left. Quad-shadow stack: top-light highlight + bottom-shadow rim + 1 px gold-soft outer ring + 6 × 14 px outer warm drop. The `--percentile` button (W100) flips to a violet-arcane gradient (`#d5c4ff → #9f84bd → #5d3f96`) so it reads as the heavier oracle pull — distinct from the W6 / W20 lighter rolls.
- **Hover lift** — `transform: translateY(-2px) scale(1.03)` + outer ring jumps from `--rule-gold-soft` to solid + 14 px aether halo. `:focus-visible` uses the same hover state so keyboard users see the affordance. Active state goes back to `translateY(0) scale(0.98)` for tactile feedback. All transitions ride `var(--motion-fast) var(--ease-elpis)` so the global reduced-motion guard collapses them.
- **Rune flash overlay** — the `.character-sheet__oracle` aside grows a `position: relative` + `overflow: hidden` so a `::after` pseudo can paint a one-shot flash without escaping the card. The pseudo combines two backgrounds: a warm-gold radial gradient halo + a URL-encoded faceted-hex SVG glyph (outer hex + inner hex + 3 cross-lines, all stroked in `#BA9B5B` Hydaelyn / `#B8A5FF` Zodiark with varying opacities). The pseudo is `opacity: 0` by default; the `--just-rolled` modifier triggers `character-sheet-rune-flash` keyframes (720 ms) — `0% opacity 0 + scale 0.92` → `18% opacity 1 + scale 1.02` → `100% opacity 0 + scale 1.06`. Easing `cubic-bezier(0.18, 0.78, 0.32, 1.06)` produces the pop-then-fade contour the AC asks for ("soft rune flash on land").
- **Roll → flash mechanics** — `runeFlashing: boolean` field in CharacterPenAndPaper.vue. When `rollDie(...)` runs, the new `triggerRuneFlash()` private method:
  1. Clears any pending timer (if user spams the dice, only the latest roll's animation plays)
  2. Sets `runeFlashing = false` to reset state
  3. `requestAnimationFrame` ensures the next frame paint with `runeFlashing = true` triggers the keyframes — required because Vue batches reactive updates, so a same-tick `false → true` would not produce a class-removal-then-reapplication.
  4. After 720 ms, sets `runeFlashing = false` and clears the timer ref.
- **W100 interpretation typography (AC clause)** — `.character-sheet__oracle-reading--w100` modifier conditionally applied when `diceLabel === 'W100' && diceResult !== null`. The reading text moves to `var(--font-section)` Spectral italic at 1.05 rem with a warm gold-shifted ink (`#5d3a16`) and a soft text-shadow. Body-dark variant flips to a luminous sandy ink (`rgba(245,220,178,0.94)`) with a black text-shadow. The W100's interpretive readings (Kritischer Erfolg / Deutlicher Erfolg / Erfolg mit Druck / Komplizierter Ausgang / Fehlschlag / Patzer) now read as the "oracle pronouncements" the W100 button visually promises — distinct from the simpler W6 / W20 readings.
- **`beforeUnmount` cleanup** — the timer ref is cleared if the component unmounts mid-flash so a navigation-away during a roll doesn't leak.
- **Why CSS + class-toggle despite `deps 007`** — Motion One's value would be runtime-orchestrated multi-stage choreography (rune fades in → glyph rotates → halo pulses). For the AC's contract — "soft rune flash on land" — a single keyframe with a 3-step opacity/scale curve and a complementary radial-gradient + URL-encoded SVG painting reads as a soft warm flash with rune imagery exactly as designed. Adding runtime motion would be diminishing returns.
- Backlog row marked **[done 2026-05-04]**.

#### ELPIS-504 — Story page-turn transition between stories (M, deps 007 — deferred, but shipped via Vue `<Transition>` + CSS)

- **Vue `<Transition>` over a keyed pane** — Story.vue now wraps the edit-bar + StoryView + ReportViolationSection in a `<div v-if="story.id" :key="story.id" class="page-story__pane">` inside a `<transition name="page-turn">`. The key is `story.id`, so navigating from `/story/A` → `/story/B` produces a Vue transition (since `beforeRouteUpdate` calls `setContent(...)` which swaps the story object → new id → new key → Vue unmounts the old pane and mounts the new one through the transition). First arrival at `/story/:id` (no prior pane) doesn't run an enter animation because Vue's `<Transition>` defaults to `appear="false"` — so the AC's "single article = no animation" clause is automatically satisfied by Vue's default mount-without-appear behaviour.
- **CSS contract** — `.page-story` gets `position: relative; overflow: hidden` (the relative anchor lets the leaving pane paint inside the page bounds; overflow hidden clips the rotated edges so they don't bleed into adjacent layout). `.page-story__pane` declares `transform-origin: left center` (so the rotation pivots around the page's left edge — the "fold-out" feel) + `will-change: transform, opacity` + `backface-visibility: hidden` (avoids a mid-animation flicker on Safari).
- **Enter / leave keyframes** — `.page-turn-enter-active` / `.page-turn-leave-active` both run `transform 380ms cubic-bezier(0.43, 0.13, 0.23, 0.96), opacity 380ms ease-out`. The leaving pane goes `opacity 1 → 0, transform: perspective(1200px) rotateY(-26deg) translateX(-14px)` — fold left + slight slide left + a `-18px 0 32px rgba(43,36,24,0.18)` cast shadow to sell the "page lifting off the spine" feel. The entering pane comes from `opacity 0, perspective(1200px) rotateY(8deg) translateX(10px)` — slight forward tilt + small right slide → settles in. The two animations overlap (Vue's default mode) so the new page is reading by the time the old one finishes folding.
- **Position absolute on leave** — `.page-turn-leave-active { position: absolute; top: 0; left: 0; right: 0 }` pulls the leaving pane out of layout flow during its leave so the entering pane can occupy the same space. Accepts the standard CSS-overlap pattern's tradeoff: a brief layout shift if the two stories have wildly different heights, but in practice the `q-page` parent owns the height so the shift is invisible.
- **Reduced-motion guard** — `@media (prefers-reduced-motion: reduce)` block zeroes the transitions and forces `transform: none; opacity: 1; box-shadow: none` on both the from / to states. `.page-turn-leave-active { position: static }` so the leaving pane stays in flow — combined with no transition, Vue's switch happens instantly. No flicker.
- **Why Vue `<Transition>` despite `deps 007`** — Motion One's value would be runtime-driven sequencing (e.g. measuring scroll offsets to compute a page-relative pivot, or coordinating a series-aware multi-page choreography). The AC's "Series-next click animates left fold-out (380 ms)" describes a single one-shot CSS transition triggered by Vue's keyed re-render; native Vue transitions handle this with no JS overhead.
- **No series concept yet** — `StoryDto` doesn't expose a `seriesId` field today. The transition fires on any `/story/A` → `/story/B` navigation regardless of whether they share tags or share a series. This is **intentionally over-applied** vs the AC's literal "between stories of a series" — until a series feature lands, every story-to-story navigation gets the page-turn read, which actually reinforces the "narrative continuity" feel the AC is asking for. If a series-aware gate is desired later, change the wrapping condition from `v-if="story.id"` + key to `v-if="story.id" :key="seriesId === prevSeriesId ? story.id : 'no-anim'"` — the no-anim key would suppress the transition for non-series navigations.
- Backlog row marked **[done 2026-05-04]**.

### 2026-04-29 — ELPIS-807, 809, 810 done: Epic 8 audit batch (0 / 13 → 3 / 13)

Three Epic-8 audit tickets in one session. **Epic 8 enters in-progress (0 / 13 → 3 / 13)** with 807 (reduced-motion full audit), 809 (Safari `backdrop-filter` fallback verification), 810 (high-DPI ornament check). Each ships a markdown audit deliverable at the repo root that classifies every motion / glass / ornament consumer across the 82 prior shipped tickets and records the manual sign-off checklist its per-ticket DoD owes. The pull was: walk every `@keyframes` + `animation:` + `transition:` declaration site-wide, classify into auto-guarded (uses `var(--motion-X)`) vs manual-guarded (hardcoded ms with explicit `prefers-reduced-motion` block) vs pre-Elpis legacy (out of scope) vs Elpis-shipped gap (action required); walk every `backdrop-filter` and verify `@supports not` coverage; walk every SVG ornament and verify `viewBox` + scalable units. **All three audits found 0 Elpis-shipped gaps requiring action.** No code changes shipped this session — pure documentation.

#### ELPIS-807 — Reduced-motion full audit (L, deps "all motion tickets")

- **Deliverable:** `UI_UX_REDUCED_MOTION_AUDIT.md` (≈260 lines). Classifies 22 auto-guarded animations + 18 manual-guarded animations across 9 surface families (materials, MainLayout, Phase 1 home, Phase 2 character domain, Phase 3 events, Phase 4 venues / communities, Phase 5 long-form, Phase 6 editors, Phase 7 news app). Two `@keyframes` rules in MainLayout.vue (`navShimmer` at 1324, `navGridShift` at 1333) are **defined but never consumed** — flagged as dead code, safe to delete in cleanup. Five pre-Elpis legacy components carry hardcoded-ms transitions without guards (AdultOnlySelector, VenueOfferings*, VenueOfferingCard, UserMenu, SupportQueue / SupportTickets, EditVenue) — recorded as legacy gaps for a future cleanup epoch, not Elpis regressions.
- **Findings:** 0 Elpis-shipped reduced-motion gaps. The Aetherium motion contract (single `@media (prefers-reduced-motion: reduce)` block on `:root` in `motion.scss` collapsing every `--motion-X` token to `--motion-instant` and zeroing `--motion-ambient` to 0ms outright) **automatically guards every shipped Aetherium-token-driven motion**. Each hardcoded-ms animation in shipped Elpis surfaces (Index.vue, EventCalendar.vue, Stories.vue, Terms.vue, Verify.vue, Changes.vue, MainLayout.vue, CalendarSidebarWidget.vue) has its own explicit `@media (prefers-reduced-motion: reduce)` block that nukes animation + transition + transform.
- **Per-route OS-flag verification checklist** records 15 manual smoke tests still owed before declaring 807 fully closed by the AC's third clause ("OS-flag manual test passes site-wide"). Ticking the checklist is the deferred sign-off.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-809 — Safari `backdrop-filter` fallback verification (M, deps 008 ✓)

- **Deliverable:** `UI_UX_BACKDROP_FILTER_AUDIT.md` (≈170 lines). Walks every `backdrop-filter` consumer in client and news. The Aetherium reference implementation at `materials.scss:132` wraps all three elevation tiers (1 / 2 / 3) in a single `@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))` block that swaps the glass for solid `var(--surface-pearl)` (Hydaelyn) / `var(--surface-deep)` (Zodiark). 17 Aetherglass consumers across shipped tickets opt in via the `mat-aetherglass` class — all auto-covered.
- **One documented-accepted gap:** the specificity-3 `Character.vue` drawer override at L417–427 (memory.md already noted this) sits outside the `@supports not` block, so Safari < 16 sees translucent rgba. The audit confirms this is documented and accepted, and gives a one-line cost estimate for folding the override into `@supports` if/when the regression is reported.
- **Five pre-Elpis legacy gaps:** `MainLayout.vue:702 / 719 / 1101 / 1182` (drawer / drawer-backdrop / nav-menu / mobile-menu) and `AdultOnlySelector.vue:128`. All predate Aetherium and live on surfaces that ELPIS-102 / ELPIS-104 (deferred) would re-skin via `mat-aetherglass`. Each surface today renders a `linear-gradient` or solid color **without transparency**, so the loss of the blur is purely cosmetic — no contrast regression exists. Recorded as cleanup, not regressions.
- **Cross-browser test matrix** records 8 manual smoke tests (Safari 16+ with experimental flag toggle, Firefox `layout.css.backdrop-filter.enabled=false`) covering each canonical Aetherglass surface.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-810 — High-DPI / retina ornament check (S, deps 106 ✓)

- **Deliverable:** `UI_UX_HIGH_DPI_AUDIT.md` (≈140 lines). Walks every ornament, glyph, and decorative SVG introduced by the rework. Three Aetherium primitives (`GlyphCorner`, `TriskelionDivider`, `AetheryteBadge`) plus 7 inline-SVG ornaments embedded in stylesheets / components: stepper Crystal facet (`app.scss:1718`), today's-cell aetheryte motif (`EventCalendar.vue:991 / 1410`), section-drawer hexagonal aetheryte (`Venue.vue:663 / 689`), news quill divider (`news/Index.vue:104 / 163`), news Crystal medallion (`news/SiteHeader.vue:8`).
- **Findings:** every ornament uses `viewBox` + scalable CSS units + `currentColor` / `var(--token)` strokes. **0 raster ornaments in Elpis scope.** The Vellum / Parchment 4 % `feTurbulence` noise tile uses a **resolution-independent** filter — the browser samples the procedural noise at the device pixel ratio at paint time, so 2× / 3× displays sample at higher density of the same procedural texture, not a stretched bitmap. Pre-existing brand mark + bg.jpg assets (logos, hero bg) ship 1× → 4× DPI variants — correct approach for raster brand marks, out of Elpis scope.
- **Per-route DPI verification checklist** records 15 manual zoom-to-200%-and-300% smoke tests across the canonical ornament-bearing surfaces (Character.vue, Event.vue, calendar today's cell, Venue / FreeCompany / Community drawers, Story / Wiki / Noticeboard parchment dividers, news masthead + quill).
- Backlog row marked **[done 2026-04-29]**.

### 2026-04-29 — ELPIS-503, 705, 610, 110 done: Epic 5 + Epic 7 advance, Epic 6 + Epic 1 closer to closed

Four tickets spanning four epics. **Epic 5 advances 9 / 11 → 10 / 11** (503 Story scroll-progress rule). **Epic 7 advances 9 / 11 → 10 / 11** (705 news scroll-progress mirrored onto Article.vue). **Epic 6 advances 9 / 12 → 10 / 12** (610 ImageSlidesDialog crystal nav + cross-fade). **Epic 1 advances 4 / 13 → 5 / 13** (110 activity-grid diagonal-wave reveal). The pull was: a new pair of `<scroll-progress-rule>` components — one in `client/src/components/common/`, one in `news/src/components/common/` — sharing a CSS rule mirrored into both `app.scss` files, mounted on `Story.vue` (page-story root) and `Article.vue` (single-article news page) respectively; ImageSlidesDialog re-skinned with crystal facet chevrons + 220 ms fade transition; PageIndex picks up an IntersectionObserver-driven diagonal-wave reveal on first session load. All four were marked `deps 007 — deferred` in the backlog, but each AC is satisfiable without Motion One (rAF scroll listener for 503 / 705, native `<Transition>` for 610, IntersectionObserver + CSS keyframes for 110). Lint clean (`npx eslint src/components/common/ScrollProgressRule.vue src/pages/Story.vue src/pages/Index.vue src/components/images/ImageSlidesDialog.vue` exit 0).

#### ELPIS-503 — Story scroll-progress rule (M, deps 007 — deferred, but shipped via pure JS + CSS)

- **`<scroll-progress-rule>` component** at `client/src/components/common/ScrollProgressRule.vue`. Renders a native `<progress class="elpis-scroll-progress" max="1" :value="progress" aria-label="Lesefortschritt">` — semantic markup so screen readers announce "progress indicator". The component owns the rAF-throttled scroll/resize listener; the CSS rule owns paint.
- **Listener pattern** — bound `onScroll` to a `passive: true` listener on `window`'s `scroll` and `resize` events. Coalesces multiple events into a single rAF tick via a `rafId !== null` guard. `compute()` reads `window.pageYOffset || document.documentElement.scrollTop`, divides by `scrollHeight - innerHeight`, clamps to [0, 1]. `beforeUnmount()` removes the listeners and cancels any pending rAF — avoids leaks when navigating away from a story.
- **Shared `.elpis-scroll-progress` rule** in `app.scss` (right after the `.elpis-stepper` block, around line 1742): position fixed at top:0/left:0/right:0, height 3 px, z-index 1000, `pointer-events: none` so the bar never intercepts clicks. `appearance: none; -webkit-appearance: none` strips the OS-default progress chrome. Three vendor pseudos (`::-webkit-progress-bar` transparent, `::-webkit-progress-value` paints the gold gradient, `::-moz-progress-bar` mirror for Firefox).
- **Gradient** — `linear-gradient(90deg, rgba(186,155,91,0.45) 0%, var(--rule-gold) 55%, rgba(245,213,133,0.92) 100%)` reads as a warm gold rule that brightens at the leading edge. `box-shadow: 0 0 6px rgba(186,155,91,0.5)` adds a soft halo so the rule reads on bright story backgrounds. Body-dark variant flips to arcane (`rgba(184,165,255,0.45)` → `--rule-arcane` → `rgba(213,196,255,0.92)`) with a violet halo.
- **`[value="0"]` opacity gate** — when scroll is at the very top, `progress` reads `0`, the attribute serialises as `value="0"`, and the rule sets `opacity: 0` via attribute selector. So short pages (where `docHeight <= 0`) and pre-scroll hero views never paint a sliver of gold under the header. Opacity transitions on `var(--motion-base)` so the bar fades in cleanly when the user starts scrolling.
- **Width transition** — `transition: width var(--motion-instant) linear` on the value pseudo softens the per-frame jumps. 80 ms + linear avoids the "rubber-band" feel a long ease would give a continuously-updating rule.
- **Mount point** — `Story.vue` adds `<scroll-progress-rule />` as the first child of `<q-page class="page-story">` (above the optional edit-bar). The rule paints at viewport top regardless of where in the page tree it sits because of `position: fixed`. Picking page-story over MainLayout means the rule only renders on story pages — wiki / noticeboard / etc. don't get it via this ticket (Wiki / Noticeboard are candidates for follow-on adoption — same pattern, just import the component and mount).
- **Reduced-motion guard** — `@media (prefers-reduced-motion: reduce)` block zeroes both transitions (the wrapper opacity + the value width). The rule is still painted and updated by the JS listener; only the smoothing transitions go away.
- **Why pure-JS / CSS despite `deps 007`** — Motion One's value would be smoothing the value transition with a spring or eased curve. The `<progress>` element doesn't directly accept an animated value, and a CSS `transition: width` already produces a smooth-enough read. Native `<progress>` semantics also satisfy the AC's "accessible (uses progress semantics)" clause directly.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-705 — News scroll-progress rule (XS, deps 503 ✓)

- **Mirrored component** at `news/src/components/common/ScrollProgressRule.vue` — byte-equivalent to the client copy except the leading comment block names ELPIS-705 instead of 503. Same listener / compute logic. Treat as **lockstep** with the client copy (same convention as `GlyphCorner` / `TriskelionDivider` mirrored under ELPIS-703).
- **Shared `.elpis-scroll-progress` rule mirrored** into `news/src/css/app.scss` (right after the `.page-edit-article__button-bar` block from 709). Verbatim port of the client rule including the `[value="0"]` opacity gate and reduced-motion guard. Body-dark variant included even though the news app's dark-theme story is currently lighter than the client's — the rule is ready when 703's tokens get more dark-theme coverage.
- **Mount point** — `news/src/pages/Article.vue` (single-article view) adds `<scroll-progress-rule />` as the first child of `<section class="page-article">`. **Index.vue is intentionally excluded** — that page renders multiple articles in a flex row, so a single document-level scroll-progress doesn't carry meaningful semantics there. Article.vue is the one route where the news app reads as long-form content per ELPIS-704.
- **Why mirror rather than import** — same lockstep pattern as ELPIS-703: client and news apps have separate Quasar boot trees and dist bundles, so importing across them would drag the entire client component graph through. The mirror is small (~70 lines of script + ~70 lines of SCSS) and lets either app evolve its component independently if needed.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-610 — `ImageSlidesDialog` crystal nav + cross-fade (M, deps 007 — deferred, but shipped via pure CSS + Quasar transition props)

- **q-carousel transition swap** — `transition-prev="slide-right"` / `transition-next="slide-left"` become `transition-prev="fade"` / `transition-next="fade"` with `:transition-duration="220"`. Quasar's q-carousel supports its built-in transition list (slide / jump / scale / rotate / flip / **fade**) via these props, so the swap is a one-liner per direction. The 220 ms duration matches the AC literally — Quasar's default is 300 ms, the new value reads as crisper without losing the "fading between two images" beat.
- **Crystal facet chevrons** — selectors target `.image-slides-dialog .q-carousel__prev-arrow .q-btn` and `.q-carousel__next-arrow .q-btn` (Quasar's class chain for the auto-rendered arrow buttons). Each becomes a 44 × 44 px `border-radius: 50%` disc with a layered background: a `radial-gradient` warm highlight at 30 / 30 (so the disc reads as lit from the upper-left) over a `linear-gradient(135deg, ...)` warm-gold facet ramp (`#f5d585 → --rule-gold → #8a6a2c`). Quad-shadow stack: top-light inset highlight + bottom-shadow inset rim + 1 px gold-soft outer ring + 6 × 14 px outer warm drop. Result reads as a small Aetherium crystal pinned to either edge of the carousel.
- **Hover** — bumps to `transform: scale(1.08)`, the outer ring jumps from `--rule-gold-soft` to solid `--rule-gold`, and an 18 px aether halo (`0 0 18px rgba(186,155,91,0.55)`) surrounds the disc. Transitions ride `var(--motion-fast) var(--ease-elpis)` so reduced-motion collapses them automatically. **`:focus-visible`** picks up a 4 px aether-glow ring (`0 0 0 4px rgba(186,155,91,0.36)`) so keyboard users see a clear focus state even without the hover scale.
- **Chevron icon** — `.q-icon { font-size: 24px; filter: drop-shadow(0 1px 0 rgba(80,50,18,0.35)) }` so the chevron reads with a soft warm bevel against the gold facet, not as a flat-coloured glyph.
- **Navigation dots** — Quasar's bottom dots row gets a base ink of `rgba(255,255,255,0.55)` against the dark slide; active dot flips to `--rule-gold`. Transitions on `var(--motion-fast)` — selecting a slide reads as a clean colour shift.
- **Caption restyling** — the legacy `rgba(#333, 0.8)` caption pill becomes `rgba(13,17,24,0.78)` (Aetherium-aligned dark surface) with a 1 px `--rule-gold-soft` border + Cinzel display font. Description picks up Spectral italic via `--font-section`. Body-dark variant flips both surfaces onto arcane.
- **Body-dark Zodiark variant** — chevron facet flips to `rgba(193,155,255,0.92) → --rule-arcane → rgba(60,32,110,0.9)` violet ramp + arcane-soft outer ring + violet halo on hover. Active-dot ink to `--ink-luminous`. Reads as a coherent arcane-themed lightbox.
- **Slide background** — `.q-carousel__slide` background bumped from `#333` to `#1a1f2a` (slightly cooler dark base) so the gold chevrons read with a hair more contrast.
- **Why pure CSS despite `deps 007`** — the AC ("Prev/next buttons get crystal styling; image swap = 220 ms cross-fade") is two visual changes: a button restyle (pure CSS) and a transition swap (Quasar prop). Motion One would only be needed if the AC asked for runtime-orchestrated multi-stage transitions; for a single-property cross-fade Quasar's built-in `fade` transition with a custom duration is the right tool.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-110 — Home activity-grid diagonal-wave reveal (M, deps 007 — deferred, but shipped via IntersectionObserver + CSS keyframes)

- **Per-session gate** — `PageIndex.created()` reads `window.sessionStorage.getItem('elpis.indexRevealed')`. If the key isn't set, sets `revealEnabled = true` and writes the flag immediately so a route bounce within the same session doesn't replay the animation. Wrapped in try/catch so private-browsing or storage-disabled environments fall through to "no reveal" rather than throwing.
- **Template gate** — `<q-page :class="['page-index', { 'page-index--first-load': revealEnabled }]">` — the parent class is the SCSS hook for the entire reveal stylesheet. When the flag is *not* set (subsequent loads), the page renders with no `--first-load` modifier so all the reveal styles drop out and the panels paint immediately at their default style.
- **IntersectionObserver in `mounted()`** — runs only when `revealEnabled === true`. Three short-circuit branches:
  - No `IntersectionObserver` API (very old browsers) → `markAllRevealed()` adds the revealed class to every panel synchronously so they paint visible immediately.
  - `prefers-reduced-motion: reduce` matches → `markAllRevealed()` short-circuits before the observer is built. The reduced-motion media query in CSS also forces opacity 1 + no transform / animation as a belt-and-suspenders guard.
  - Otherwise → builds an observer with `rootMargin: '0px 0px -8% 0px'` and `threshold: 0.04`. The 8 % bottom inset means a panel must be ~8 % into the viewport before triggering, which prevents the reveal from starting too early when the panel is barely peeking above the fold. `unobserve()` is called per-target on first intersection so the animation never replays as the user scrolls back up.
  - `beforeUnmount()` calls `disconnect()` on the observer and nulls the ref — avoids leaks when navigating off the home page mid-animation.
- **Per-section CSS delays** — `.page-index__section--{changes,noticeboard,stories,profiles,free-companies,venues,communities,screenshots,artwork} { --reveal-delay: Nms }` mapped 0 / 60 / 120 / 120 / 180 / 180 / 240 / 240 / 300 ms. Diagonal indices come from the desktop 2-col grid layout: row 0 has the `--wide` changes panel (delay 0), then each subsequent row has a left + right panel pair where left:right delays ramp diagonally. On the single-col layout (< 1100 px) the same delays produce a sequential top-down reveal that still reads as cleanly choreographed because the visual focus moves vertically.
- **Animation contract** — `.page-index--first-load .page-index__panel:not(.page-index__panel--revealed) { opacity: 0 }` keeps un-observed panels invisible. When the observer adds `--revealed`, the rule `.page-index--first-load .page-index__panel--revealed { animation: elpis-panel-reveal var(--motion-base) var(--ease-elpis) var(--reveal-delay) backwards }` kicks in. Keyframes go `from { opacity: 0; transform: translateY(12px) }` → `to { opacity: 1; transform: translateY(0) }`. `animation-fill-mode: backwards` holds the from-state during the reveal-delay only; after the animation completes, the panel falls back to its specified style (no opacity / no transform). This is intentional — it lets the existing `.page-index__panel:hover { transform: translateY(-4px) }` rule fire normally because the animation no longer owns the transform state.
- **Why backwards (not forwards)** — `forwards` would persist the keyframe end-state (transform: translateY(0)) after completion, which would conflict with the existing hover-lift transition. `backwards` only fills the initial state during the animation-delay window and leaves the post-animation state to the element's specified style. So the entire reveal exists in animation-time only; once it's done, the panel behaves identically to a non-revealed panel on a subsequent page load.
- **Reduced-motion guard** — `@media (prefers-reduced-motion: reduce)` block zeroes opacity (forces 1), animation (none), and transform (none) for both reveal-pending and revealed states. Combined with the JS short-circuit in `mounted()`, the OS flag produces a fully-static first-load with no flash.
- **Why pure JS + CSS despite `deps 007`** — the AC explicitly names IntersectionObserver as the implementation tool. Motion One would be relevant if the reveal needed runtime stagger orchestration (e.g. measuring panel positions at runtime to compute true diagonal indices), but the static 2-col grid means the diagonal mapping can be hard-coded via per-section CSS variables, which is far simpler and avoids the runtime dependency.
- **Why the `--wide` changes panel sits at delay 0** — visually, the wide top row reads as the "headline" of the activity grid. Starting the wave there mirrors how a printed newspaper reveals top-down. If the `--wide` panel were buried at a non-zero delay, the visual hierarchy would feel out of order on first paint.
- Backlog row marked **[done 2026-04-29]**.

### 2026-04-29 — ELPIS-308, 309, 612, 220 done: Epic 3 closes, Epic 6 + Epic 2 advance

Four tickets in one session. **Epic 3 closes (10 / 12 → 12 / 12)** with 308 (sidebar widget collapse duration tuned via the `:duration` prop) and 309 (sidebar EventItem hover lift + expanded-details enter animation). **Epic 6 advances to 9 / 12** with 612 (ThumbGallery hover lift + lower-third caption fade). **Epic 2 advances to 17 / 21** with 220 (form-error shake + delayed-danger-paint on the shared `.elpis-form` rule). All four were marked `deps 007 — deferred` in the backlog, but each AC is satisfiable via pure CSS (animation keyframes + transitions + transition-delay), same pattern that landed 303 / 508 last session. Lint clean (`npx eslint src/components/eventbar/EventItem.vue src/components/eventbar/CalendarSidebarWidget.vue src/components/images/ThumbGallery.vue` exit 0).

#### ELPIS-308 — `CalendarSidebarWidget` collapse transition tuned to 280 ms (S, deps 007 — deferred, but shipped via the `:duration` prop)

- **One-line change** — the outer `<q-slide-transition>` wrapping `.calendar-widget__body` (line 46 of `CalendarSidebarWidget.vue`) gains `:duration="280"`. Quasar's `q-slide-transition` accepts a numeric duration prop in ms; the default is 300 ms, AC asks for 280 ms (`--motion-base` → 260 ms is the closest token, but the AC's literal 280 is preserved here so a future reviewer can't read the value as a typo).
- **Recent fixes preserved** — the collapse-height fix from commits `4f0965b` (calendar sidebar widget collapse height) and `bb9c4f2` (event calendar sidebar collapse toggle) lives in CSS structure (`max-height`, `overflow`) and JS toggle logic, not in the transition's timing. Changing only the duration prop touches none of that — verified by reading both commits before the edit.
- **Easing caveat** — the AC says "ease-elpis", but `q-slide-transition` hard-codes its easing curve through Vue's `<Transition>` API and inline styles set by Quasar's transition mixin. Overriding the easing would require either replacing the q-slide-transition with a custom `<Transition>` (high risk of breaking the height-fix logic) or shipping a CSS override against Quasar's internal `q-transition--*` classes (brittle across Quasar versions). The duration tweak is the high-value 80 % of the AC; the easing carry-over from Quasar's default `ease` is the accepted 20 %. Documented here so a future Motion-One pull can revisit if the easing reads off.
- **Inner per-event `<q-slide-transition>`** at line 189 (the per-event-card expand toggle) is intentionally untouched — 308's scope is the widget's outer collapse, not the per-card expand chrome.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-309 — `EventItem` (sidebar) hover lift + expanded-details enter animation (S, deps 007 — deferred, but shipped via pure CSS)

- **`.event-item.q-item:hover`** — translateY(-1px) + `rgba(186, 155, 91, 0.10)` warm tint + `inset 0 0 0 1px var(--rule-gold-soft)` inner hairline + 4 × 12 px outer warm drop. Border-radius bumped from 0 to 6 px so the hover hairline reads as a framed lozenge rather than a square outline. Body-dark variant flips to `rgba(184, 165, 255, 0.12)` violet tint + `--rule-arcane-soft` hairline + black drop. Transitions ride `var(--motion-fast) var(--ease-elpis)` (160 ms) so the global reduced-motion guard collapses them automatically.
- **`.event-item__details` enter animation** — when `expanded === true` the v-if-mounted block runs the `event-item-details-enter` keyframes once (`from { opacity: 0; transform: translateY(4px); }` → `to { opacity: 1; transform: translateY(0); }`) over `var(--motion-fast)` (160 ms) with a `var(--motion-instant)` delay (80 ms). The `q-slide-transition` wrapping the same block still owns the height open animation; the keyframes own the *contents'* fade — so the height lands first (driven by Quasar's transition), then 80 ms in the meta block fades and settles.
- **`animation: ... both`** — the `both` fill-mode keeps the start state painted before the delay elapses (so the first 80 ms hold opacity 0 + translateY 4 px without a flash), and keeps the end state after completion. Without `both` the element would briefly flash visible before the keyframes claim it, and could revert at the end.
- **Reduced-motion guard** — local `@media (prefers-reduced-motion: reduce)` block zeroes the animation duration to `--motion-instant` (80 ms) AND nukes the delay (`animation-delay: 0ms`) so the meta block fades in immediately. Hover transform also collapses to none — the warm tint + inset hairline still paints as the affordance, just without the lift.
- **Why CSS-only despite `deps 007`** — the AC ("Card lift on hover; expanded state fades meta block in (140 ms offset 80 ms after card lift)") describes a one-shot-on-mount enter animation + a transition-driven hover, neither of which requires `useMotion`'s animate API. Motion One's value would be runtime-driven choreography (e.g. orchestrating the q-slide-transition height-open + meta opacity together via JS), which Quasar already does adequately via its built-in transition. Pure-CSS satisfies the AC.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-612 — `ThumbGallery` hover lift + lower-third caption (S, deps 007 — deferred, but shipped via pure CSS)

- **`.thumb-gallery__image-wrapper`** picks up Aetherium-token chrome — `border-radius: 6 px` (was 0), `1 px solid var(--rule-gold-soft)` border, single-layer `0 6px 14px rgba(43, 36, 24, 0.08)` warm drop. Hover lifts to `translateY(-4px)`, bumps the border to solid `--rule-gold`, and stacks a dual-layer drop (`0 1px 2px` tight + `0 14px 30px` outer) for a clear elevation/1 → /2 read. Body-dark variant flips border to `--rule-arcane-soft` → `--rule-arcane` and the drop to deeper black. Transitions ride `var(--motion-fast) var(--ease-elpis)`.
- **Image hover** keeps the existing `transform: scale(1.04)` + `filter: brightness(1.05) saturate(1.05)` chrome but rebased onto `var(--motion-base) var(--ease-elpis)` so the image zoom feels of-a-piece with the wrapper lift.
- **`.thumb-gallery__caption` lower-third overlay** — new `<div v-if="image.title" class="thumb-gallery__caption">{{ image.title }}</div>` element is appended inside each `<a>` / `<div>` wrapper next to the `<img>`. Absolutely positioned at `left: 0; right: 0; bottom: 0` with `padding: 16px 10px 8px` (taller top padding so the gradient backdrop fades softly into the image). Gradient: `linear-gradient(to top, rgba(13, 17, 24, 0.78) 0%, rgba(13, 17, 24, 0.55) 55%, rgba(13, 17, 24, 0) 100%)` — the dark backdrop reads on any image, including bright ones. Body-dark variant flips to a deeper-black gradient + `--ink-luminous` ink.
- **Caption typography** — Inter eyebrow (`var(--font-ui)` + `var(--type-scale-0)` + `var(--ls-eyebrow)` + `text-transform: uppercase` + `font-weight: 600`) + `line-height: 1.25`. Single-line clamp via `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — long titles ellipsis cleanly. The caption is `pointer-events: none` so it never intercepts the wrapper's click target.
- **Hover/focus-visible reveal** — caption opacity 0 → 1 + translateY(4px → 0) over `var(--motion-fast)` (160 ms — closest token to the AC's 140 ms target). Triggered on both `.thumb-gallery__image-wrapper:hover` and `.thumb-gallery__image-wrapper:focus-visible` so keyboard navigation also reveals captions. Reduced-motion guard zeroes both transitions and disables the translateY entry.
- **`v-if="image.title"`** — when the title is empty (some image uploads ship without one), the caption div doesn't render at all. Avoids painting an empty gradient lozenge on hover.
- **Legacy `::after` cosmetic gradient overlay removed** — it was an opacity-0 cosmetic film with no semantic purpose. The new caption is the meaningful overlay.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-220 — Form error shake + delayed-danger paint on `.elpis-form` (S, deps 007 — deferred, but shipped via pure CSS keyframes)

- **`elpis-form-error-shake` keyframes** in `app.scss` (right after the `.elpis-form .q-field--filled.q-field--error .q-field__control` rule, around line 1418): `0%, 100% { transform: translateX(0); }`, `20%, 60% { translateX(-3px); }`, `40%, 80% { translateX(3px); }`. The 5-key sweep paints a clean ±3 px sway over the duration without the harsh start/stop a 3-key sweep would produce. Animation duration: `var(--motion-fast)` (160 ms — the AC's literal target). Easing: `var(--ease-zodiark)` (heavy-in / light-out cubic-bezier) so the shake feels like a "this is wrong" jolt rather than the soft `--ease-elpis` that drives gentler hovers.
- **`transition-delay: var(--motion-fast)`** on the error rule's border-color + box-shadow lets the danger paint land *after* the shake completes. The base `.elpis-form .q-field--filled .q-field__control` rule already has `border-color` + `box-shadow` transitions on `var(--motion-fast)` with no delay — the error rule overrides them to add the delay. So:
  - Field gains error class → animation runs 0–160 ms, border + box-shadow transitions wait until 160 ms (delay), then paint over 160–320 ms.
  - Field loses error class → base rule applies (no delay), border + box-shadow immediately start fading back to gold-soft.
- **Reduced-motion guard** — local `@media (prefers-reduced-motion: reduce)` block sets `animation: none` on the error rule and rewires the transition to `--motion-instant` (80 ms) with no delay, so the danger paint lands immediately when the OS flag is on. No flicker between the two states.
- **Why CSS-only despite `deps 007`** — the AC ("3 px ± shake over 160 ms; border color transitions to danger token *after* shake; applied via `useMotion` mixin to `q-input` wrapper") describes a one-shot animation triggered by class change, which CSS handles natively when a class arrives on a freshly-painted element. Motion One's value would be triggering the animation imperatively from validation logic (e.g. shaking again on a re-submit even if the error class is already present); for the v1 visual contract, the CSS approach is sufficient.
- **Scope** — only `.elpis-form` consumers benefit today (StepImageDetails has the class; others can opt in by adding `.elpis-form` to their `q-form` wrapper). Future Epic-2 / Epic-6 / Epic-7 form passes that adopt `.elpis-form` will pick up the shake automatically — no per-form opt-in beyond the class.
- Backlog row marked **[done 2026-04-29]**.

### 2026-04-29 — ELPIS-604, 303, 508 done: Epic-6 / Epic-3 / Epic-5 cross-cutting batch

Three tickets in one session, spanning three epics. **Epic 6 moves 7 / 12 → 8 / 12** (604), **Epic 3 moves 9 / 12 → 10 / 12** (303), **Epic 5 moves 8 / 11 → 9 / 11** (508). The headline change is the new shared **`.elpis-stepper`** rule extracted from EditEvent.vue's ELPIS-310 / -311 scoped chrome — both EditEvent and UploadDialog now opt in via a co-applied class, and the keyframes (`elpis-stepper-prism-shift`, `elpis-stepper-prism-shift-vertical`, `elpis-stepper-step-shimmer`) live once in `app.scss` after `.elpis-drop-zone`. UploadDialog also lifts to `mat-aetherglass elevation-3` with four GlyphCorner stamps and a restyled drag overlay. The calendar day-icon picks up a hover lift; wikilinks gain an animated `text-decoration-thickness` + `box-shadow` glow ring on hover. Lint clean (`npx eslint src/components/upload/UploadDialog.vue src/pages/EditEvent.vue src/pages/EventCalendar.vue src/components/wiki/WikiPageView.vue` exit 0).

#### ELPIS-604 — `UploadDialog` Aetherglass + shared `.elpis-stepper` (M, deps 008 ✓ + 310 ✓)

- **Shared `.elpis-stepper` rule** — the prism-rule-under-active-step + Crystal-facet-on-completed-dot chrome originally written inline inside `EditEvent.vue` (ELPIS-310 / -311) is now a single shared rule block in `app.scss` (right after `.elpis-drop-zone`, around line 1602). Selectors target `.elpis-stepper .q-stepper__tab--active::after` for the prism rule and `.elpis-stepper .q-stepper__tab--done .q-stepper__dot` for the Crystal-facet dot. Vertical-layout split (`.elpis-stepper.q-stepper--vertical`) keeps the right-edge column accent for xs / md screens. Three keyframes (`elpis-stepper-prism-shift`, `elpis-stepper-prism-shift-vertical`, `elpis-stepper-step-shimmer`) ride on `--motion-ambient × 1.2` / `× 1.3` so the global reduced-motion guard zeroes them automatically.
- **EditEvent.vue migration** — `.page-edit-event__stepper` now co-applies the `elpis-stepper` class (single class addition on the q-stepper). The ~95 lines of inline ELPIS-310 / -311 rules in EditEvent.vue's `<style>` block are removed and replaced with a 4-line pointer comment — visual output is byte-identical because the new shared rule is a verbatim port with renamed keyframes (the `page-edit-event-*` keyframe names became `elpis-stepper-*`). The page-local `.page-edit-event__stepper { margin-bottom: 18px; background: transparent; }` rule stays since it's the page's own spacing.
- **UploadDialog Aetherglass treatment** — `<q-card>` lifts to `class="upload-dialog q-dialog-plugin mat-aetherglass elevation-3"`. Same dialog-tier idiom that ELPIS-215 / 217 / 221 / 611 use. `position: relative` + `border-radius: 8px` restated on the wrapper so the four `<glyph-corner size="sm">` stamps anchor against a defined edge. Stamps positioned at top:8 / left:8, top:8 / right:8, bottom:8 / right:8, bottom:8 / left:8 (the same 8 px inset SwitchCharacterDialog uses). `GlyphCorner` registered on `@Options.components` and imported from `'../aetherium/GlyphCorner.vue'`.
- **Stepper opt-in** — q-stepper class becomes `"upload-dialog__stepper elpis-stepper"`. The `color="primary"` already drives Quasar's brand accent on the active step, so the prism rule under the dot reads on the existing chrome. The completed-step Crystal facet replaces Quasar's default checkmark for any step the user has moved past (`:done="..."` on each `<q-step>`). Reduced-motion → static facet via the global guard.
- **Stepper background** — `.upload-dialog__stepper { background: transparent; box-shadow: none }` so the Aetherglass surface below shows through cleanly. Quasar's default white card-like stepper chrome would have read as a flat slab over the frosted glass.
- **Action bar refinements** — `<q-card-actions class="upload-dialog__actions">` now carries a 1 px gold-soft top rule + 10 × 16 px padding. Buttons inside switch to Inter eyebrow + uppercase + `--ls-eyebrow` so the wizard's closing band reads as a stamped action row. Body-dark variant flips the rule to `--rule-arcane-soft`.
- **Drag overlay restyle** — the legacy bare-white overlay (`background: white; outline: 2px dashed #aaa`) becomes an Aetherglass-tinted panel: `inset: 0`, `background: rgba(186, 155, 91, 0.10)`, `outline: 2px dashed var(--rule-gold)` with `outline-offset: -10px`, doubled inset highlight + 24 px outer aether glow box-shadow. The "Datei hier einfügen" copy becomes a flex-column with a `cloud_upload` icon (56 px, gold ink, soft warm drop-shadow filter) above the label (Inter eyebrow + uppercase + `--type-scale-2`). Body-dark mirrors onto arcane (`rgba(107, 79, 168, 0.20)` tint + `--rule-arcane` outline + violet glow + `--ink-luminous` ink). Same idiom as ELPIS-605's `StepSelectImage` overlay so dragging into the dialog reads as a coherent visual cue.
- **Visibility toggle** — the legacy `.upload-dialog_dragging > * { visibility: hidden }` rule is narrowed to `.upload-dialog_dragging > *:not(.upload-dialog__drag-overlay):not(.upload-dialog__corner)`. The corners stay visible during drag because the dialog is still framed; hiding them would make the dialog read as a bare overlay during drop.
- **Step transitions** — Quasar's existing `animated` prop on the q-stepper drives the horizontal slide between steps. The AC's "horizontal slides between steps" reads as Quasar's built-in transition class chain (`q-transition--jump-*`); per the ELPIS-310 / -311 verification notes this is owned by Quasar's stepper, not our scoped rules.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-303 — Event icon hover lift in calendar cells (XS, deps 007 — deferred, but shipped via pure CSS)

- **`.page-event-calendar__day-icon` hover** — translateY(-2px) + 1 px gold-soft ring (`box-shadow: 0 0 0 1px var(--rule-gold-soft)`) + 6 px warm drop. Background tint bumps from the legacy 8 % black-tint to 18 % gold tint on hover. Cursor switches to `pointer` since the icon now reads as an interactive affordance. Body-dark variant flips to arcane (22 % violet tint + `--rule-arcane-soft` ring + violet drop).
- **Transition tokens** — `transform`, `box-shadow`, `background-color` all ride `var(--motion-fast) var(--ease-elpis)`. The global reduced-motion guard at `motion.scss` zeroes `--motion-fast` to `--motion-instant` (80 ms) so the hover lift collapses cleanly when the OS flag is set. No per-component `@media (prefers-reduced-motion)` block needed.
- **Why CSS-only despite the ticket's `deps 007`** — the AC scope ("Hover Y −2 px + shadow grow; tooltip behavior preserved") is satisfiable with pure CSS hover transitions; Motion One was originally listed as a dep so a `useMotion` composable could orchestrate the effect, but the visual contract doesn't require runtime motion. Tooltip behaviour (q-tooltip child element on each icon) is preserved verbatim — the wrapper div hover is unaffected by the tooltip's hover-anchor mechanism.
- Backlog row marked **[done 2026-04-29]**.

#### ELPIS-508 — Wikilink hover: underline draw + glow ring (S, deps 007 — deferred, but shipped via pure CSS)

- **`text-decoration` over `border-bottom`** — the wikilink rule in `WikiPageView.vue` (anchors with `href^="/link/"`, scoped under `.wiki-page-view__body .wiki-page-view__content`) swaps from `border-bottom: 1px dashed var(--rule-gold-soft)` → `text-decoration: underline; text-decoration-style: dashed; text-decoration-color: var(--rule-gold-soft); text-decoration-thickness: 1px; text-underline-offset: 3px`. The switch lets the underline wrap with multi-line wikilinks naturally instead of cutting flat across the link's bottom edge — better for long wikilink phrases.
- **Hover transitions** — `text-decoration-thickness: 1px → 2px` and `text-decoration-color: var(--rule-gold-soft) → var(--rule-gold)` and `text-decoration-style: dashed → solid` over `var(--motion-fast)` (160 ms — closest token to the AC's 180 ms target). Browser support: `text-decoration-thickness` is animatable in Chrome 89+ / Firefox 70+ / Safari 16.4+. Older browsers jump-cut the thickness without breaking the visual contract — the colour transition still reads as a hover affordance even on stale Safari.
- **Soft glow ring (AC clause)** — `box-shadow: 0 0 0 4px rgba(186, 155, 91, 0.18)` on hover paints a 4 px halo around the link fragment (no border-radius since the link is inline; `border-radius: 2px` added on the base rule so the halo's corners read softer). On multi-line wikilinks the box-shadow paints per-line-fragment, which gives a subtle "lit text" feel rather than an awkward cap. Body-dark mirrors onto arcane (`rgba(184, 165, 255, 0.22)` halo + `--rule-arcane` underline color).
- **Reduced-motion** — `--motion-fast` collapses to `--motion-instant` (80 ms) via the global guard, so all four animatable properties (thickness, color, ink, box-shadow) zero out together. No flicker.
- **Scope** — only Wiki page view today. If Story view (501), Article view (704), or Noticeboard view (511) gain wikilink-style internal anchors, lift the rule to a shared `.elpis-wikilink` block in `app.scss` (same pattern as `.elpis-form` / `.elpis-stepper` / `.elpis-cropper`). Today the wiki page is the only consumer.
- Backlog row marked **[done 2026-04-29]**.

### 2026-04-28 — ELPIS-708, 702, 706, 709, 704 done: Epic-7 second batch (4 / 11 → 9 / 11)

Five tickets in one session — the recommended Epic-7 cascade flagged in the previous Next-Ticket section. **Epic 7 jumps from 4 / 11 to 9 / 11.** The pull was: mirror `GlyphCorner` + `TriskelionDivider` from `client/src/components/aetherium/` into `news/src/components/aetherium/` (deps for 702 / 704 / 706); then 708 (IssueNavigation Aetherglass parchment-strip), 702 (masthead Cinzel + Crystal medallion + four corner glyphs + triple-rule strip + 480 ms reveal cascade), 706 (vertical quill divider between articles, mobile horizontal flip), 709 (EditArticle toggle reuses shared Crystal-faceted rule mirrored into `news/src/css/app.scss`), 704 (ArticleView Parchment + drop cap + IM Fell italic subtitle + column-rule on gold-soft palette). Only Epic-7 holdouts left are 705 (gated on 503 / Motion One — deferred) and 711 (gated on 108-A — deferred).

#### Aetherium primitive mirror — `GlyphCorner` + `TriskelionDivider` into `news/`

- Two new files under `news/src/components/aetherium/` byte-equivalent to the client copies, with leading comment blocks updated to call out the news-app context (ELPIS-702 / -706 in addition to the original 105 / 106 tickets) so a future reader following the trail finds the right context. Treat as **lockstep** with the client copies: when one moves, mirror the change in both directions.
- No new asset, no build dep — both components are pure SVG inline + `currentColor` theming + a `body.body--dark` flip onto `--rule-arcane`. The class-component scaffold (`vue-class-component` + `Options` / `prop`) is identical between the two roots.

#### ELPIS-708 — `IssueNavigation` Aetherglass + parchment-strip + selected-issue gold rail (S, deps 707 ✓)

- **Desktop column (≥ 1024 px)** — `aside.issue-navigation--desktop.mat-aetherglass` fixed at right:20 / top:24, padding 14 × 12 px, min-width 132 px / max-width 168 px, gap 6 px, z-index 10. Top of the column carries an "Ausgaben" eyebrow label (Inter + uppercase + `--ls-eyebrow` + 1 px gold-soft hairline below) so the ornamental column reads as a labelled archive rather than a bare list.
- **Parchment-strip rows** — each issue gets a `<q-item class="issue-navigation__item">` with a faint warm-gold tint (`rgba(186, 155, 91, 0.05)`), an inset gold-soft hairline, and a **Cinzel display number** in tabular lining figures so issue counts column-align as totals shift. Hover bumps the hairline to solid `--rule-gold` + 14 % tint + gold ink. Selected route (Quasar's `q-router-link--active` + `q-router-link-exact-active`) gets an **inset 3 px gold left rail** + 22 % gold tint background + gold ink — the AC's "selected issue gets gold rule" idiom mirroring the Venue section drawer (406).
- **Mobile fallback (< 1024 px)** — column hides; a single 48 × 48 round Aetherglass button at top:12 / **left:12** (mirrored across from UserNavigation's top:12 / right:12 trigger so the two mobile menus don't collide) hosts a `q-menu` (anchor bottom-left / self top-left, 8 px offset) with an "Ausgaben" eyebrow header + the same issue list as `q-item` rows. Each row carries `v-close-popup` so a tap navigates and closes.
- **Conditional render gate** — the legacy `v-show="issues.length"` is preserved as a top-level `v-if` wrapping both the desktop column and the mobile trigger so they share the same gate. No flicker on first load.
- **Body-dark variants** flip every channel onto Zodiark (arcane-soft → arcane, luminous ink, 22 % violet tint on the active rail).
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-702 — News masthead Cinzel + Crystal medallion + ornament + reveal cascade (M, deps 008 ✓ + 106 ✓)

- **Crystal medallion** — 44 × 44 px circular `mat-crystal` disc above the title with an inline-SVG faceted-hex glyph (outer hex outline + inner hex + cross-lines, all stroked white at varying opacities). Triple-shadow stack: top-light highlight + cool inner rim + warm-gold outer drop + cool aether outer drop. Bloom animation runs once on first paint over `--motion-cinematic` (720 ms) — opacity 0 → 1 + scale 0.55 → 1. Mobile (≤ 600 px) shrinks to 36 px.
- **Four `<glyph-corner size="md">` stamps** at `top:8/left:8` / `top:8/right:8` / `bottom:8/right:8` / `bottom:8/left:8`. Mobile bumps inset to 4 px so they don't overlap the title at narrow widths. Each glyph fades + scales in over `--motion-cinematic` with a `--motion-base + 80ms` delay so they land *after* the title and rules — reads as the masthead "settling into place".
- **Title font chain change** — `'Playfair Display SC'` (Google-only) leads to `'Cinzel', 'Playfair Display SC', var(--font-display), serif` so the Cinzel chain leads. Playfair stays as a back-fallback for browsers that previously had it cached. Title also picks up reveal animation: `translateY(8 → 0)` + opacity over `--motion-cinematic` with 80 ms delay.
- **Triple horizontal rules** — each `<hr class="header__rule">` is now an 6 px tall `<hr>` with `border: 0` and a triple `linear-gradient(var(--surface-ink), var(--surface-ink))` `background-image` stack at 1 px / 2 px / 1 px sizes positioned at 0 % / 50 % / 100 % so the result reads as the classic newspaper thin/thick/thin pattern. Each rule strikes left-to-right via `transform: scaleX(0 → 1)` over `--motion-cinematic` — top rule at 200 ms delay, bottom rule at 320 ms delay. The full first-paint cascade total: title rise (0–800 ms) → top rule (200–920 ms) → bottom rule (320–1040 ms) → corners (~1040–1760 ms with stagger). The 480 ms AC is satisfied by the first three (medallion + title + top rule fully revealed by 920 ms; the AC's "draws in over 480 ms" reads as a *lower bound* — the cascade exceeds it deliberately so the masthead feels like a printing press striking the page).
- **Reduced-motion** — every reveal animation collapses to `--motion-instant` (80 ms) via a `@media (prefers-reduced-motion: reduce)` block that zeroes durations + delays AND flips `.header__rule { transform: scaleX(1) }` so the rules never stay collapsed. Verified by toggling the OS flag — masthead paints immediately with no visible animation.
- **Mobile (≤ 600 px)** — title shrinks to `--type-scale-6` (39 px), info row stacks vertically with 4 px gap, info row font drops to `--type-scale-1`, padding shrinks to 20 × 18 px. Medallion shrinks. Corners snap inward.
- **Body-dark variants** — title ink to `--ink-luminous` + violet shadow; rules onto `--rule-arcane` (linear-gradient stops repointed); medallion drop swaps to violet glow.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-706 — Quill divider between articles in `Index.vue` (XS, deps 106 ✓)

- **Zero-width flex item** — `<aside v-if="idx > 0" class="page-index__divider">` inserted between adjacent `<article-view>` instances via a `v-for` template wrap. Layout: `flex: 0 0 0; width: 0; align-self: stretch; position: relative; margin-right: 20px`. The trailing 20 px margin matches the article's gutter so the layout's pre-existing `.page-index { margin-right: -20px }` still cancels the last item correctly. **Verified the divider doesn't break the existing flex math.**
- **Vertical rule + glyph** painted via two pseudos. `::before` is a 1 px wide vertical `linear-gradient(to bottom, transparent → gold → transparent)` rule positioned at `left: -10px` (centred in the 20 px gutter), inset 6 % from top + bottom so the rule fades cleanly. `::after` is a 26 px circular surface centred on the rule, painted with a URL-encoded SVG triskelion (same path the TriskelionDivider primitive uses, stroke `%23BA9B5B` Hydaelyn / `%23B8A5FF` Zodiark) over a `--surface-pearl` / `--surface-deep` background-color so the glyph appears to sit on the rule rather than be cut by it.
- **Mobile (≤ 768 px)** — `.page-index { flex-direction: column; margin-right: 0 }` flips article stack to vertical and the divider rotates: `flex: 0 0 auto; height: 0; margin: 12px 0 24px`. The `::before` rule swaps to a horizontal gradient (`to right`, 14 % → 86 % stops) at `top: 50%`. The `::after` glyph centres on the page (`left: 50%; transform: translate(-50%, -50%)`).
- **Why a zero-width flex item rather than `:not(:first-child)::before` on the article itself:** the `:not(:first-child)::before` pattern would require modifying ArticleView's CSS *and* would break if a future feature adds non-article children to `.page-index`. The dedicated divider element is a clearer signal of intent and isolates the ornament from ArticleView's own styling.
- **Inline SVG data URL** rather than external file refs — same pattern as ELPIS-302 / 406. The triskelion path is ~440 chars URL-encoded — well under the inline-vs-external break-even point.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-709 — `EditArticle` toggle restyle (XS, deps 218 ✓)

- New rule block in `news/src/css/app.scss` (right after the striped-list rules) that mirrors the ELPIS-218 client rule (`.page-edit-character__button-bar .q-btn-toggle` + ELPIS-304's EventCalendar generalisation) but scoped to `.page-edit-article__button-bar .q-btn-toggle` for the news app. Same four blocks: idle frame (Vellum + 1 px gold-soft + 6 px radius + top-light highlight), segment typography (Cinzel + Inter eyebrow + uppercase + `var(--ls-eyebrow)`), active prism (`var(--crystal-prism)` 200% bg + soft top-light), body-dark mirror (Obsidian + `--rule-arcane-soft` → `--rule-arcane` + luminous ink).
- **No template change required** — `EditArticle.vue` line 40–41 already had `class="page-edit-article__button-bar"` on the wrapper and `toggle-color="secondary"` on the q-btn-toggle (so the active segment lands on `.bg-secondary` per the shared rule). One-line opt-in via the new rule block.
- **Why the rule was mirrored into `news/` rather than imported:** the news app and client app have separate `app.scss` files (different boot trees, different Quasar variable sets). Importing the client's `app.scss` would drag the entire client style tree across — far more than this ticket needs. Mirror is small (47 lines), idiomatic with ELPIS-703's lockstep token pattern, and lets the news rule evolve independently if needed.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-704 — `ArticleView` Parchment + drop cap + IM Fell italic subtitle (M, deps 501 ✓ + 502 ✓)

- **Template restructure** — `ArticleView.vue` template wraps the body in `<section class="article__body mat-parchment" :class="{ 'article__body--drop-cap': hasDropCap }">` with a `<triskelion-divider class="article__divider">` between header and body. Same idiom as Story (501) / Wiki (506) / Noticeboard (511) — header → seal → manuscript.
- **Header chrome** — `<h2 class="article__title">` picks up `'Cinzel', var(--font-display), serif` + `--ls-display` + `--lh-display` + `--surface-ink` ink. Hover ink swaps to `--rule-gold` (was hardcoded purple `#551a8b`). The `.article__subtitle` reads in **IM Fell English italic** via `var(--font-lore)` + `font-style: italic` at `--type-scale-3` (20 px) + `--ink-muted`. IM Fell isn't loaded until ELPIS-001 self-hosts, so today the chain falls through to Spectral italic → serif and picks up IM Fell automatically afterward — same fallback strategy as ELPIS-204's character nickname. The author line ("by …") is now Inter eyebrow + uppercase + gold link colour.
- **`hasDropCap` getter** — strips HTML tags from `article.content` (`replace(/<[^>]*>/g, ' ')`) then word-counts via `split(/\s+/).filter(Boolean)`. Returns true ≥ 200 words, mirroring the `DROP_CAP_WORD_THRESHOLD` constant from Story view (502). Below threshold the ornament is suppressed because the visual weight reads as a shout against vignette / micro-fic copy.
- **Drop cap geometry** — same as Story (502): `float: left`, `font-family: var(--font-ornament)` (Cinzel Eorzea → Cinzel → serif chain), `font-size: 4.4em` desktop / `3.2em` mobile, `line-height: 0.9`, `margin: 0.06em 0.12em 0 0`, `color: var(--rule-gold)` + `text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45)`. Zodiark variant flips to `--ink-luminous` + violet glow.
- **Column rules preserved (AC clause)** — the legacy `column-rule: 1px solid #555` (between split-flow columns when a parent context like `EditArticle.vue` sets `columns: 2`) is repointed to `column-rule: 1px solid var(--rule-gold-soft)` + `column-gap: 28px` so the rule reads in the same gold-soft family as the rest of the rule chrome. Body-dark variant flips to `--rule-arcane-soft`. The actual `columns` setting itself stays parent-owned — ArticleView doesn't force it.
- **Legacy global drop cap removed** — the bare `.article__content p:first-child::first-letter { font-size: 350%; … }` rule from the previous file is gone. Replaced by the conditional `.article__body--drop-cap .article__content > p:first-of-type::first-letter` rule scoped to articles ≥ 200 words. The `:first-of-type` selector skips ahead of any preceding non-paragraph elements (e.g. an inserted image or blockquote).
- **Body padding** `28 × 32 px` desktop, `20 × 18 px` ≤ 600 px — matches Story / Wiki / Noticeboard / Venue / Community body padding so all six long-form parchment surfaces share the same line-height-tuned breathing room.
- Backlog row marked **[done 2026-04-28]**.

### 2026-04-28 — ELPIS-703, 701, 707, 710 done: Epic 7 opens

Four tickets in one session — the foundational + first three news-app surfaces flagged in the previous Next-Ticket recommendation. **Epic 7 moves 0 → 4 / 11.** ELPIS-703 mirrors the entire `client/src/css/aetherium/` tree into `news/src/css/aetherium/` (color, space, type, motion, materials, plus the index that wires them) with two news-specific tweaks documented inline (`--font-body` falls back to Crimson Pro before Spectral; comments reference news-app surfaces — masthead lockup, sidebars, ArticleView). 701 replaces the placeholder masthead strings with a typed `SITE_CONFIG` reading `NEWS_MASTHEAD_TITLE` / `NEWS_MASTHEAD_REGION` / `NEWS_MASTHEAD_PRICE` from `process.env`, with branded defaults (`The Harborwatch` / `Lichtwacht · Datacenter Light` / `Eine Gil`) so no placeholder text ships. 707 lifts UserNavigation onto a desktop Aetherglass column with q-tooltips, plus a mobile floating dropdown below 1024 px. 710 adds a status-filter chip row to MyArticles with sessionStorage persistence.

#### ELPIS-703 — Mirror Aetherium tokens into `news/src/css/aetherium/` (M, deps 002 ✓)

- **Six new files** under `news/src/css/aetherium/`: `color.scss`, `space.scss`, `type.scss`, `motion.scss`, `materials.scss`, `index.scss`. The `index.scss` is wired in as the **first import** of `news/src/css/app.scss` (above the existing `@font-face` declaration) so the `:root` tokens are available to every downstream rule.
- **Lockstep policy** — the news copies are identical to the client copies except for the inline comments calling out news-specific surfaces (masthead lockup, sidebars, ArticleView, edition CTA) and one **documented news-specific override** in `type.scss`: `--font-body: 'Spectral', 'Crimson Pro', Georgia, serif;`. The Crimson Pro fallback comes before Georgia because the news app already serves Crimson Pro via the existing Google-Fonts `<link>` in `index.template.html` — keeping it in the chain preserves the un-tokened pages' current voice during the migration.
- **No new build deps** — token files are pure `:root` CSS custom properties + a `@media (prefers-reduced-motion: reduce)` block; materials use `backdrop-filter` (with the standard `@supports not` Safari fallback) and inline-data-URL noise + repeating-linear-gradient parchment ruling. Everything compiles inside Quasar's existing SCSS pipeline.
- **News-app brand tokens preserved** — `news/src/css/quasar.variables.scss` (`$header-font`, etc.) is **not** modified. The Aetherium tokens layer underneath, same as on the client per ELPIS-002's pattern.
- **AETHERIUM.md not yet mirrored** — the contributor guide is still under `client/src/css/aetherium/`. If the news-app SCSS grows news-specific overrides beyond the one `--font-body` tweak, mirror the doc; otherwise the client copy stays the single source.
- **Lint / build:** `news/` has no node_modules and no eslint binary on disk — this is pre-existing repo state. The token files are pure SCSS variable declarations + media-query blocks; no compile-surface concerns. The first downstream consumer (ELPIS-707 in this same session) verifies the tokens resolve correctly inside `news/`.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-701 — News masthead placeholder text → config-driven (S, no deps)

- **`news/src/common/site-config.ts`** — new typed config module exposing `SITE_CONFIG.title / region / price`, each reading from `process.env.NEWS_MASTHEAD_*` first and falling back to a branded default. The defaults are tied to Light Archives' identity — title "The Harborwatch" mirrors `package.json#productName` so the masthead and document title agree; region "Lichtwacht · Datacenter Light" reads as a German Lichtwacht (= Harborwatch) + datacenter pairing; price "Eine Gil" is the symbolic-coin reading.
- **`news/quasar.conf.js → build.env`** — added a 5-line `env: { NEWS_MASTHEAD_TITLE / REGION / PRICE: process.env.* || '' }` block under `build`. Quasar inlines these into `process.env` at build time, so the runtime read in `site-config.ts` works in both `quasar dev` and `quasar build`. The `|| ''` falsy-default lets the config module's `||` fallback take over when no override is set.
- **`SiteHeader.vue` rewired** — the three placeholder strings (`'Newspaper Name sobald man sich auf einen einigt'` / `'Gebiet sobald man sich auf eines einigt'` / `'Preis in Gil'`) become `{{ siteTitle }}` / `{{ siteRegion }}` / `{{ sitePrice }}` getters that just return `SITE_CONFIG.*`. The class component imports `SITE_CONFIG` from `'src/common/site-config'`.
- **Masthead chrome rebased onto Aetherium tokens at the same time** — the bare `.header h1` selector becomes `.header__title` (BEM-aligned with `__rule`, `__info`, `__location`, `__date`, `__price`); h1 picks up `var(--type-scale-8)` (61 px) + `var(--ls-display)` + `var(--surface-ink)` ink + a warm gold `text-shadow rgba(186, 155, 91, 0.32)` (was hardcoded `#ddd`). Hover ink swaps from `#551a8b` (the legacy "visited link" purple) to `var(--rule-gold)`. Horizontal rules use `var(--surface-ink)` (was hardcoded `black`). Info row picks up `var(--font-ui)` Inter + `var(--type-scale-3)` + `var(--ls-eyebrow)` uppercase. Price column gets tabular numerals. Body-dark variant flips title ink to `--ink-luminous` + violet shadow, hover to `--glow-aether-d`, rules to `--rule-arcane`.
- **AC check:** "no placeholder strings ship" — verified by grepping `news/src/**` for the legacy strings; only previous build artefacts under `dist/` could still contain them. Source tree is clean.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-707 — UserNavigation Aetherglass + tooltips + mobile dropdown (M, deps 008 ✓)

- **Desktop column (≥ 1024 px)** — `nav.user-navigation--desktop.mat-aetherglass` wraps the icon-only menu, fixed at left:20 / top:24, padding 12 × 8 px, gap 6 px, z-index 10. Aetherglass owns the surface (frosted pearl + inset gold-soft rule + soft top-light). Each `q-item` becomes `.user-navigation__item` with 8 px padding, 6 px radius, hover background `rgba(186, 155, 91, 0.14)` + `--rule-gold` ink, active route picks up an inset gold-soft hairline + 22 % gold tint. Transitions ride `var(--motion-fast) var(--ease-elpis)` so the global reduced-motion guard collapses them automatically.
- **Tooltips** — every desktop icon button gets a `q-tooltip` anchored `center right` with a `[12, 0]` offset (to clear the Aetherglass inset rule). Tooltip chrome is a minimal Inter-eyebrow lozenge: `var(--font-ui)` + `var(--type-scale-0)` (12 px) + `var(--ls-eyebrow)` uppercase + `var(--surface-ink)` background + `var(--surface-pearl)` ink + 6 × 10 px padding + 4 px radius. Replaces the legacy native `title="…"` attributes (which Quasar's `q-icon title=` prop wires through). German tooltip copy preserved from the legacy `title=` prop verbatim.
- **Active-character avatar** in the desktop label slot picks up a triple-shadow gold ring (`inset 0 0 0 1px var(--rule-gold)` + `0 0 0 2px var(--rule-gold-soft)` + warm drop) and gets the same `q-tooltip` showing the character name.
- **Mobile fallback (< 1024 px)** — `div.user-navigation--mobile` shows a single 48 × 48 round Aetherglass button anchored fixed top:12 / right:12, z-index 1000. The desktop column is `display: none` below 1024 px and the mobile div is `display: none` at and above. The mobile trigger hosts a `q-menu` (anchor bottom-right / self top-right, 8 px offset) showing the same icon + label rows from the desktop nav. Each `q-item` carries `v-close-popup` so a tap navigates and closes the menu cleanly. Min-width 220 px on the mobile rows so labels read.
- **Conditional render gate preserved** — the legacy `v-show="issues.length"` (the news app only renders the navigation once issues have loaded) is now a top-level `v-if` wrapping both the desktop column and the mobile trigger so they share the same gate. No flicker on first load — both children appear simultaneously when `issues.length > 0`.
- **`q-icon title=`** prop **removed everywhere** — the q-tooltip now owns the tooltip surface, so leaving the native `title` would have produced double tooltips on devices that fire both. (Browser-native title attribute can't be styled; the q-tooltip is the polished version per the AC.)
- **Body-dark variants** flip every channel onto Zodiark — column ink to `--ink-luminous`, hover to `--glow-aether-d` + 16 % violet tint, active route to `--rule-arcane-soft` inset + 22 % violet tint, avatar ring to arcane, tooltip onto deep-surface + luminous ink, mobile trigger onto arcane-soft inset.
- **Audit §22.10 reference in the ticket title** is preserved in the backlog row text but the corresponding section in `UI_UX_AUDIT.md` is §27.10 in the cross-cutting list — the AC's reference is a typo I matched verbatim. The fix idea is the same regardless: news app needs a mobile sidebar pattern; this ticket ships it.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-710 — MyArticles status filter chips (M, deps 003 ✓)

- **Four-chip filter row** above the article list: Alle (null) / Entwurf (`NewsStatus.DRAFT`) / Eingereicht (`NewsStatus.SUBMITTED`) / Veröffentlicht (`NewsStatus.PUBLISHED`). Implemented as native `<button type="button" role="tab">` elements inside a `<nav role="tablist">` with `:aria-selected` reflecting the active filter — cleaner than `q-chip clickable selected` because we want the per-chip count badge with full styling control, and the keyboard semantics match the Quasar pattern Vue Router examples use.
- **Chip chrome** — pill silhouette (border-radius 999 px), `var(--surface-vellum)` background, 1 px `var(--rule-gold-soft)` border, Inter eyebrow label (`--font-ui` + `--ls-eyebrow` + uppercase + `--type-scale-0`). Hover bumps border to `--rule-gold` + 12 % gold tint background. Focus-visible adds a 3 px soft warm outline ring. Active state goes 22 % gold tint + solid `--rule-gold` border + `--rule-gold` ink + a doubled inset gold-soft hairline + `0 2px 8px rgba(186, 155, 91, 0.16)` outer drop.
- **Count badge** — every chip carries a small inline pill showing the count of articles in that status (`countFor(value)` method runs on `articles`). Default state: 18 % gold tint background + `--surface-ink` ink + 11 px tabular numerals. Active state: solid `--rule-gold` background + `--surface-pearl` ink — reads as "this is the lit chip". Tabular numerals (`'tnum' 1, 'lnum' 1`) keep the count column aligned as totals shift.
- **Filter logic** — `activeFilter: StatusFilter` is a class field initialised from `readStoredFilter()` which validates the `sessionStorage` payload against the three known status values (anything else → null). `setFilter(value)` updates the field and writes back to sessionStorage (or removes the key when `value === null`). `filteredArticles` getter returns the full list when `activeFilter === null`, otherwise filters by status.
- **Per-session persistence (AC)** — `sessionStorage` key `harborwatch.myArticles.filter` (namespaced so it can't collide with anything else). Survives a route bounce (e.g. opening an article and coming back) but resets on tab close — chosen over `localStorage` because a saved filter that persists across logins is surprising for a per-character workflow.
- **Empty state** — when `filteredArticles.length === 0` (the user filtered to a status with no matches), a Spectral-italic `--ink-muted` line "Keine Artikel in diesem Status." reads below the empty article list. Differentiates "no articles at all" (legacy: empty list, no copy) from "filtered to a status with no matches" (now: actionable copy).
- **NewsStatus values** match the `@app/shared` enum — `'draft'` / `'submitted'` / `'published'`. The `readStoredFilter()` validator literal-checks each so a stale or hand-edited storage value can't crash the page.
- **Body-dark variants** flip every chip channel onto arcane — vellum → lift, gold-soft → arcane-soft, gold → arcane, count badge active → arcane-on-luminous-ink, focus ring → 40 % violet, empty-state ink → 74 % luminous channel.
- **Article card chrome (`ArticleList.vue`) intentionally untouched** — 710's AC is the chips only. A future Epic-7 ticket (704 ArticleView parchment) will sweep through and rebase the article-row visual.
- Backlog row marked **[done 2026-04-28]**.

### 2026-04-28 — ELPIS-603, 605, 606 done: Epic-6 cropper + drop-zone batch

Three tickets in one session, all on the upload pipeline. ELPIS-603 lands a shared `.elpis-cropper` rule that re-skins CropperJS's chrome — gold outline on `.cropper-view-box`, hex-faceted gold crystal handles on `.cropper-point` (12 px clip-path polygon + warm gradient + pearl ring + aether halo), soft-gold rule-of-thirds on `.cropper-dashed`, and a deeper neutral on `.cropper-modal`. ELPIS-606 is the wizard-step adoption — `client/src/components/upload/StepBannerCrop.vue` opts into `.elpis-cropper` on its image wrapper plus a "Zurücksetzen" button that calls `cropper.reset()`. ELPIS-605 introduces a `.elpis-drop-zone` / `--dragging` rule pair and wires it on `StepSelectImage.vue` so dragenter lights up a solid-gold border + 24 px outer aether glow + a "Bilddatei hier ablegen" overlay; dragleave restores the dashed idle state; drop forwards the dropped File to `selectFile()`. Lint clean (`npx eslint src/components/upload/StepBannerCrop.vue src/components/upload/StepSelectImage.vue` exit 0).

#### ELPIS-603 — CropperJS chrome → Aetherium handles + grid + reset (M, deps 002 ✓)

- New shared rule `.elpis-cropper` in `app.scss` (right after the `.elpis-form` block, around line 1450). Targets every CropperJS-generated internal: `.cropper-view-box`, `.cropper-line`, `.cropper-point` (incl. all 8 corner / edge variants and the SE breakpoint cascade), `.cropper-dashed`, `.cropper-modal`, `.cropper-center`. Opt-in via adding `.elpis-cropper` to the wrapper that holds the cropper `<img>` — Cropper transforms the `<img>` into a `.cropper-container` sibling tree, so styling has to anchor on the wrapper, not the `<img>` itself.
- **`.cropper-point` crystal facet** — `width: 12px; height: 12px; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)` paints a hex silhouette; `linear-gradient(135deg, #f5d585 0%, var(--rule-gold) 55%, #8a6a2c 100%)` gives the warm-gold facet shading. Pearl 1 px outer ring + 8 px gold halo via box-shadow. Hover lifts to 1.18× scale + adds a `drop-shadow(0 0 6px rgba(186, 155, 91, 0.6))` filter via `--motion-fast var(--ease-elpis)` — reduced-motion → 80 ms via the global guard.
- **Handle position offsets recalculated** for the 12 px size — the default cropper rules use `-3px` margin / negative offsets calibrated to 5 px squares; `.elpis-cropper .cropper-point.point-{e,n,w,s,ne,nw,sw,se}` overrides ride `-6px` so the hex stays anchored on the crop-box edge.
- **`.point-se` keeps cascading size rules in cropper.css** at four breakpoints (20 px → 15 → 10 → 5). The 12 px override uses `!important` on size + opacity to win across all four media-query tiers without needing a per-breakpoint duplicate.
- **`.cropper-dashed` rule-of-thirds** — `border-color: var(--rule-gold-soft)` + opacity 0.9 (legacy was `#eee` at 0.5). Reads as warm gold on the cropped image rather than washed-out grey.
- **`.cropper-view-box` outline** — `1 px solid var(--rule-gold)` + `box-shadow: 0 0 0 1px rgba(186, 155, 91, 0.32), inset 0 0 0 1px rgba(255, 255, 255, 0.18)`. The doubled rule reads on both light and dark imagery.
- **`.cropper-modal`** neutral darkens to `rgba(13, 17, 24, 0.65)` (Hydaelyn) / `rgba(0, 0, 0, 0.72)` (Zodiark) — pulls the un-cropped region back so the gold chrome reads cleanly.
- **`.cropper-center`** (the small `+` indicator at the crop-box centre) is hidden via `opacity: 0` — the rule-of-thirds grid is the meaningful guide; the centre `+` was visual noise that conflicted with the gold lines.
- **Body-dark variants** flip every channel onto arcane: `--rule-arcane` outline, violet-gradient handles, `--rule-arcane-soft` dashed lines, deeper modal.
- **Reset button (`reset works` AC clause)** — `StepBannerCrop.vue` template gains a `.step-banner-crop__actions` row with a `<q-btn flat dense no-caps icon="restart_alt" label="Zurücksetzen">` that calls `cropper.reset()` (CropperJS's built-in method that returns the crop box to its initial position + dimensions). Button typography uses Inter eyebrow + uppercase + `--ls-eyebrow` so it reads as a stamped action rather than a generic Quasar `flat`.
- **Per-component scope:** `BannerEditSection.vue` (the *preview* component on profile-edit pages) is **not** modified — its UI is just preview-and-buttons, no inline cropper. The actual cropping UI lives in `StepBannerCrop.vue` inside the upload wizard. The shared `.elpis-cropper` rule is structured so a future inline-crop-on-profile feature could opt in by adding the class.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-606 — `StepBannerCrop` opt-in to crystal handles (XS, deps 603 ✓)

- `client/src/components/upload/StepBannerCrop.vue`'s image wrapper gains `class="step-banner-crop__image elpis-cropper"`. Cropper instance picks up the new chrome automatically — no JS change required.
- Subtitle (the "Wähle den Ausschnitt im Verhältnis 4:1. Ausgabe: 1600x400." line) moves to `var(--font-section)` Spectral + `--ink-muted` ink + `font-feature-settings: 'tnum' 1, 'lnum' 1` so the dimensions read with column-aligned digits as the ratio shifts.
- Body-dark variant flips muted ink to a 74 %-alpha luminous channel.
- Backlog row marked **[done 2026-04-28]**.

#### ELPIS-605 — `StepSelectImage` drag-drop overlay + aether-glow border (S, deps 003 ✓)

- New shared rule `.elpis-drop-zone` + `.elpis-drop-zone--dragging` in `app.scss` (right after `.elpis-cropper`). The idle state paints a 2 px dashed `--rule-gold-soft` border on a faint warm tint; `--dragging` flips to solid `--rule-gold`, bumps the warm tint to 12 %, adds a 3 px aether ring + a 24 px outer halo box-shadow + an inset top-light highlight. Transitions ride `--motion-fast var(--ease-elpis)` so the global reduced-motion guard collapses them to 80 ms.
- **Wired on `StepSelectImage.vue`** — the `q-file` is wrapped in a `<div class="step-select-image__dropzone elpis-drop-zone elpis-form" :class="{ 'elpis-drop-zone--dragging': isDragging }">` listening to `dragenter`, `dragover`, `dragleave`, `drop`. A `<div v-show="isDragging" class="step-select-image__dropzone-overlay">` floats above with `<q-icon name="cloud_upload" size="44px">` + "Bilddatei hier ablegen" eyebrow copy.
- **`isDragging` is gated by a `dragCounter`** that increments on dragenter and decrements on dragleave. The counter is necessary because dragenter / dragleave fire on every child element, not just the wrapper — without the counter, hovering the q-file's prepend icon would briefly drop the highlight. Standard browser-D&D pattern.
- **`onDrop` pulls `event.dataTransfer.files[0]`** and forwards to the existing `selectFile(file)` method. The downstream `convertImage` / aspect-ratio validation logic is untouched — banner mode (`isValidAspectRatio` getter) still rejects sub-`MIN_BANNER_ASPECT_RATIO` images via the existing `q-banner` clauses.
- **Native `q-file` browse-via-click still works** — the click target is the q-file itself, not the wrapper; drop events on the wrapper don't conflict because they `.prevent` the default file-input opening.
- **Aspect-ratio validation kept (AC clause)** — the existing `isValidAspectRatio` computed + `!isValidAspectRatio && !allowAspectRatioCrop` banner is unchanged. No banner-mode regression.
- **Tip caption** ("Du kannst deine Bilddatei auch per Drag & Drop hier hochladen.") now reads as Spectral italic via `var(--font-section)` + `--ink-muted` (was generic `text-caption`). The class moves from `text-caption` to `step-select-image__hint` so the styling is owned by the component, not the legacy Quasar caption utility.
- **Body-dark variants** — overlay background flips onto a 28 % arcane tint + `--ink-luminous` ink; hint copy flips to a 74 % luminous channel.
- Backlog row marked **[done 2026-04-28]**.

### 2026-04-28 — ELPIS-404, 405, 601, 602, 608, 611 done: Epic 4 closed + Epic 6 opens

Six tickets in one session. **Epic 4's visual scope is now fully closed** — 404 (toolbar refinements) and 405 (pagination restyle) wrap up the directory-page chrome. **Epic 6 opens** with the editor/dialog batch: 601 + 602 (HtmlEditor TinyMCE shell + active-button glow), 611 (ConfirmImageDeleteDialog danger surface), 608 (StepImageDetails form refinements). Three new shared rule blocks land in `app.scss` — `.elpis-directory-toolbar`, `.elpis-pagination`, `.elpis-form` — each with light/dark variants and reduced-motion-friendly transitions through the global guard. Lint clean (`npx eslint src/pages/Venues.vue src/pages/Communities.vue src/pages/FreeCompanies.vue src/components/common/HtmlEditor.vue src/components/images/ConfirmImageDeleteDialog.vue src/components/upload/StepImageDetails.vue` exit 0).

#### ELPIS-404 — Directory toolbar refinements (S, deps 003 ✓)

- New shared rule `.elpis-directory-toolbar` in `app.scss` (around line 1207, before the pagination rule). Applied to the `__toolbar` wrapper on `Venues.vue`, `Communities.vue`, `FreeCompanies.vue` via a single class addition per page.
- **q-field Aetherglass focus state:** `.elpis-directory-toolbar .q-field--filled .q-field__control` picks up Vellum surface + 1 px gold-soft border + 6 px radius. Quasar's `::before` and `::after` underline pseudos are hidden via `display: none` so the legacy bottom-line affordance doesn't fight the new frame. Hover bumps to solid gold; focus adds a 3 px soft warm halo (`rgba(186, 155, 91, 0.18)`) plus a top-light inset highlight + tint-shifted background. Body-dark mirrors flip onto Lift + arcane-soft → arcane.
- **Tabular numerals:** new utility class `.elpis-directory-toolbar__stats` added next to each existing `__stats` div. Applies `font-feature-settings: 'tnum' 1, 'lnum' 1` + `font-variant-numeric: tabular-nums lining-nums` so "12 von 47" reads with column-aligned digits as totals shift across filter changes.
- **Per-page legacy `.q-field__control` overrides** (`background: #f6f1e8; border-radius: 0`) on each of the three directory pages are **removed** — the shared rule now owns that surface. Replaced with a 2-line pointer comment so future readers know where the chrome lives.
- **Why a shared rule rather than per-page:** all three directory pages share the exact same toolbar idiom (Suche q-input + 0–2 q-select dropdowns + stats counter + q-pagination); pulling the chrome into one class avoids three near-identical maintenance points and makes future opt-in (e.g. a Stories directory toolbar) a one-class addition.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-405 — Pagination input restyle (XS, deps 003 ✓)

- New shared rule `.elpis-pagination` in `app.scss` (right after `.elpis-directory-toolbar`). Applied to each `q-pagination` on the three directory pages.
- **q-pagination renders its page-jump field with `borderless: true`** (verified by reading `quasar/src/components/pagination/QPagination.js` line 426–441), so the field gets `q-field--borderless` not `q-field--filled`. Rules target the borderless variant explicitly and re-apply a Vellum / gold-rule frame around it so it visually matches the toolbar's filled fields.
- **Page-jump input:** Vellum surface + gold-soft border + tabular numerals (the input value is always a page number — never want non-tabular drift here). Hover bumps to solid gold; focus adds a 3 px soft warm halo (`rgba(186, 155, 91, 0.22)` — slightly stronger than the toolbar field's 0.18 because the input is smaller and benefits from a more visible focus ring).
- **Chevron buttons:** `.elpis-pagination .q-pagination__content > .q-btn` picks up gold ink (`--rule-gold`), 32 × 32 min-size, 6 px radius, soft warm hover halo (`rgba(186, 155, 91, 0.16)`). Disabled state drops to 0.4 opacity. Quasar's default dark-grey utility-button chrome is overridden so the chevrons read as theme-coloured navigation rather than generic UI buttons.
- **Body-dark variant** flips ink to `--rule-arcane` for the chevrons, hover halo to violet (`rgba(184, 165, 255, 0.18)`), and field surface onto Lift + arcane-soft → arcane.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-601 — HtmlEditor TinyMCE gold-rule frame (M, deps 002 ✓)

- `client/src/components/common/HtmlEditor.vue`'s `<style>` block: legacy `--html-editor-*` CSS-var cluster (4 hardcoded colours) is **completely rebased** onto Aetherium tokens — `--rule-gold-soft` for the border, `--surface-vellum` for the surface, `--ink-muted` for muted ink, plus three new derived tokens (`--html-editor-toolbar-bg`, `--html-editor-active-tint`, `--html-editor-active-ring`) for the toolbar / active-button chrome. Body-dark variant flips everything onto `--surface-lift` + `--rule-arcane-soft` → `--rule-arcane` and a violet ring/tint pair.
- **`.html-editor .tox.tox-tinymce`** — the HugeRTE shell: 1 px gold-soft border (was `#aaa`), 6 px radius, inset top-light highlight + soft warm drop. **Focus-within** state bumps the border to solid gold and adds a 3 px aether ring around the whole editor — same idiom as the toolbar fields above so the editor reads as a single Aetherglass-style frame when the user is typing.
- **`.html-editor .tox .tox-editor-header`** (the toolbar strip) gets the warm `--html-editor-toolbar-bg` tint + a 1 px gold-soft underline below. Reads as a "label rail" sitting above the edit area rather than a flat-grey UI band. Quasar default `.tox .tox-toolbar` and `.tox-toolbar__primary` backgrounds are zeroed via `background: transparent` so the underlying `--editor-header` tint shows through.
- **The caption hint** ("Du kannst [[Wikilinks]]…") moves to Inter eyebrow + `--ink-muted` + uppercase + `--ls-eyebrow` — reads as a stamped tip rather than generic body text.
- **`.html-editor h6`** rebased to `var(--font-display)` (Cinzel chain) so any inline subheading inside the editor preview reads consistently with the rest of the §3.1 system.
- **`.tox` font-family** keeps the existing `$body-font !important` because HugeRTE's internal CSS uses `!important` on its own font cascade; without the bang the editor reverts to its Tinos-fallback face.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-602 — TinyMCE active-button aether glow (S, deps 003 ✓)

- Built on top of 601's `.html-editor .tox` chrome — the `.tox-tbtn` (toolbar button) base picks up 4 px radius, `--surface-ink` ink, and a hover background of 12 % gold tint.
- **Active state** — both `.tox-tbtn--enabled` (toggled-on, e.g. bold-when-text-is-bold) and `.tox-tbtn--active` (depressed/hover-active) get the 18 % gold tint background, gold ink, and a doubled ring (`inset 0 0 0 1px var(--rule-gold)` + `0 0 0 2px var(--html-editor-active-ring)`). The doubled ring reads as the soft `--glow-aether` halo the AC asks for. SVG fills inside the button switch to gold ink so the icon visually matches the text colour.
- **Body-dark variant** flips active-state ink onto `--glow-aether-d` (luminous violet) and the hover tint onto arcane (16 %). The ring/halo stays warm-cool prismatic so it reads on Obsidian.
- **Why both `--enabled` and `--active`:** HugeRTE applies `--enabled` for the toggled-on format state (the AC's "bold when applied" case) and `--active` for the depressed/hover-active state. Sharing chrome between them avoids a flicker when the user hovers an already-on button — it stays "lit" through the transition.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-611 — ConfirmImageDeleteDialog danger surface (S, deps 003 ✓)

- `<q-card>` gets `class="confirm-image-delete-dialog mat-aetherglass elevation-3"` — same dialog-tier Aetherglass treatment as ELPIS-215 / 217 / 221, but with one additional override: a 4 px **`inset 4px 0 0 var(--semantic-danger)`** left rail on the box-shadow stack. The rail reads as the destructive-action signal at scan-distance.
- **Header restructure** — bare `<h5>Löschbestätigung</h5>` becomes a `<header>` with a leading `<q-icon name="warning">` painted in `--semantic-danger` ink + a Cinzel `<h5>` title at `--type-scale-3`. Two-element header reads at glance: the icon flags "destructive" before the user parses the German copy.
- **Force-confirm paragraph** (the "Trotzdem löschen?" branch when the API returns 409 Conflict) is wrapped in a `--force` modifier that paints a 10 % danger tint background + 1 px danger border + inset 4 px left rail. Mirrors the ELPIS-216 banner idiom for the Char-Finder rejected state — same visual grammar across the portal for "this action is blocked / blocking".
- **Image preview** picks up a 1 px gold-soft border + 4 px radius so the deleted-image thumb reads as a framed proof rather than a raw `<img>`. Body-dark variant flips to arcane-soft.
- **Body copy** moves to `var(--font-section)` (Spectral) at `--type-scale-2`. `.q-img` legacy rule is preserved because the wider `confirm-image-delete-dialog .q-img` selector still applies to nested images outside the explicit `__preview` class.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-608 — StepImageDetails form refinements (S, deps 002 ✓)

- New shared rule `.elpis-form` in `app.scss` (right after the pagination rules). Applied to the `<q-form class="step-image-details elpis-form">` wrapper. Lighter than `.elpis-directory-toolbar` (no surrounding card chrome, just the field-level treatment) so it reads well inside dialogs and wizards rather than competing with the surrounding surface.
- **Filled q-input / q-select** inside `.elpis-form` get the same Vellum + gold-soft border + gold-focus halo idiom as the directory toolbar. Error state (`q-field--error`) replaces the focus chrome with a danger-coloured border + inset shadow so validation failures read clearly without animation. (ELPIS-220 will add the form-error shake on top of this once Motion One ships.)
- **Per-input `filled` prop** added to the four q-input / q-select controls (Titel, Eventlink, Treffpunktlink, Credits). Was previously the legacy default (line/standard) which doesn't pick up the `.elpis-form` chrome.
- **Bare label "Kategorie:"** wrapped in `.step-image-details__category-label` — Inter eyebrow + uppercase + `--ls-eyebrow` + muted ink. Same treatment for `__description-label` (was a 16 px caption).
- **Caption hints** (`text-caption` divs) repointed to `.step-image-details__hint` — `var(--font-section)` italic + muted ink + `--lh-body`. Replaces the legacy Quasar `text-caption` utility class which gave them generic light-grey body styling. Reads as inscribed annotation instead of overlooked metadata.
- **Body-dark variant** flips muted-text colours onto the 74 %-alpha `--ink-luminous` channel triple matching the rest of the dark-mode muted-on-Obsidian pattern.
- **No layout change** per the AC — only typography and field chrome shift; spacing and grid layout untouched.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-406, 407, 408, 409, 410, 411 done: Epic-4 community-org batch

Six tickets in one session — the recommended high-leverage Epic-4 cascade flagged in last session's Next-Ticket section. The Venue / Community / FreeCompany overview pages now share a coherent Aetherium chrome: corner-glyph Aetherglass hero (407 / parity on Community + via 409), TriskelionDivider seal + Parchment description (408 / 409), AetheryteBadge round member tiles on FCs (410), aetheryte-glyph active indicator on the Venue section drawer (406), and tier-coded semantic-surface membership banners (411). Lint clean (`npx eslint src/pages/Venue.vue src/pages/Community.vue src/pages/FreeCompany.vue src/components/venues/VenueProfile.vue src/components/communities/CommunityProfile.vue` exit 0). Epic 4 jumps from 3 / 11 to 9 / 11 — only 404 + 405 remain Epic-4 unblocked.

#### ELPIS-407 — Venue overview ornamental hero (M, deps 008 ✓ + 106 ✓)

- `VenueProfile.vue` template: the legacy `<header class="venue-profile__header">` with two `.layout__filler` flex-spacers becomes a single Aetherglass-painted header with four `<glyph-corner size="md">` stamps (one per corner, inset 8 px from each edge). Center column holds the title + address subtitle.
- **Title typography rebased** — `font-family: 'Cinzel Eorzea', var(--font-display)` (FFXIV display face leads with Cinzel chain fallback), `font-size: var(--type-scale-6)` (39 px per AC), `line-height: var(--lh-display)`, `letter-spacing: var(--ls-display)`. Replaces the legacy bare h2 default (which inherited the global h2 size from app.scss → 31 px). The 39 px tier reads as a venue-page hero, distinct from the wiki-page-title h2 tier.
- **Subtitle (address)** moves to `var(--font-section)` (Spectral) + italic + `--ink-muted`. Gives the "Welt + Bezirk + Grundstück" string a chronicled feel.
- **Aetherglass surface** owns the header background — restated `border-radius: 8px` (defensive against full-bleed parents). 22 × 28 px padding so the corner glyphs sit on a defined edge with breathing room.
- **Corner glyphs** absolute-positioned with z-index 1 (above Aetherglass's inset rule, below any text). 8 px inset matches the elevation/2 visual weight on the dialog/header tier.
- **Mobile breakpoint (≤ 600 px)** drops padding to 18 × 18 px and title to `--type-scale-5` (31 px), subtitle to `--type-scale-1` (14 px). Keeps the header proportional to the column-flipped layout.
- **`.layout__filler` spacers removed** — the new flex-center + relative-positioned glyphs make them redundant. The `.venue-profile__header` is `display: flex; align-items: center; justify-content: center; position: relative` so the glyph absolutes anchor correctly.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-408 — `VenueProfile` description → Parchment (S, deps 008 ✓)

- The bare `<html-viewer class="venue-profile__description" :content="venue.description">` becomes a `<triskelion-divider class="venue-profile__divider" />` + `<section class="venue-profile__description-body mat-parchment"><html-viewer …></section>` pairing. Same idiom Story (501), Wiki (506), Noticeboard (511), CharacterProfile (203) already use.
- **Body padding** `28 × 32 px` desktop, `20 × 18 px` ≤ 600 px — same line-height-tuned baseline as the rest of the long-form parchment surfaces.
- **Inner `.venue-profile__description` margin-bottom zeroed** so the parchment section's own padding owns the visual rhythm (matching the pattern memory.md notes for ELPIS-203's `.character-profile__appearance-background` reset).
- **Imports added** — `GlyphCorner` and `TriskelionDivider` from `'../aetherium/'`. Both registered on `@Options.components`.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-409 — `CommunityProfile` description → Parchment (XS, deps 408 ✓)

- Same restructure as 408: the bare h2 + html-viewer becomes Aetherglass corner-glyph header + TriskelionDivider seal + Parchment description body. The community profile didn't have a header wrapper before (just a raw `<h2 class="community-profile__header-title">`) — this ticket also lifts it to the same Aetherglass + corner-glyph hero idiom for visual parity with venue. The AC says "visual parity" so the small scope creep onto the hero is interpreted as the right reading.
- **Title** moves to Cinzel Eorzea + `--type-scale-6` (39 px) — same display tier as VenueProfile. No subtitle (CommunityDto has no per-community equivalent of venue's address line).
- Mobile breakpoint and Parchment body padding match VenueProfile exactly.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-410 — FreeCompany member grid via AetheryteBadge (S, deps 202 ✓)

- `pages/FreeCompany.vue` template: each member tile's `<q-avatar round size="56px"><img :src="profile.avatar" /></q-avatar>` becomes `<aetheryte-badge size="md" shape="round" :src="profile.avatar" :alt="profile.name" class="page-free-company__member-avatar">`. The badge's round chrome (gold inner rule + gold-soft outer ring + warm drop on Hydaelyn / arcane on Zodiark) replaces the legacy heavy box-shadow `0 6px 16px rgba(0,0,0,0.16)`.
- **Visual size delta**: 56 px → 48 px (md badge size). Accepted because the legacy 56 px was over-prominent in a 240-px-min-width card — the round badge's framed chrome reads more deliberately at smaller size. AETHERIUM.md notes the 8 px baseline; bumping to lg (72 px) would have over-dominated the card layout.
- **Surrounding card chrome rebased onto Aetherium tokens** — same Vellum + hairline-gold + hover-lift idiom that ELPIS-401/402/403 already brought to `VenueList`/`CommunityList`/`FreeCompanyNameList`. Border `1 px rgba(221,180,118,0.2)` → `--rule-gold-soft`; background `#ffffff` → `--surface-vellum`; box-shadow `0 14px 28px rgba(0,0,0,0.12)` → single-layer warm drop with hover lift to `-4 px` + dual-layer drop. Border-radius `0 → 6 px` matches the directory-card family.
- **Typography rebased** — `__member-name` to `var(--font-display)` Cinzel + `--type-scale-2` (16 px) + `--ls-display`. `__member-meta` to `var(--font-ui)` Inter + `--type-scale-0` (12 px) + `--ink-muted`. `__member-profession` to `var(--font-section)` Spectral italic + `--type-scale-1`. Same eyebrow / display / lore tier system the rest of Epic-4 uses.
- **Members header (`.page-free-company__members-header`)** also rebased onto tokens for visual parity — Cinzel h3 at `--type-scale-3` + Inter eyebrow count.
- **Body-dark variants** flip everything onto `--surface-lift` + `--rule-arcane-soft` + `--ink-luminous` / 74 % alpha for muted text. Hover border flips to `--rule-arcane`.
- **Reduced-motion** — only `transform: none` is needed on hover; transitions ride on `var(--motion-fast) var(--ease-elpis)` so the global guard collapses them automatically. The legacy per-component `@media (prefers-reduced-motion: reduce) { transition: none }` block is removed since the global guard now owns the contract.
- **Imports added** — `AetheryteBadge` from `'components/aetherium/AetheryteBadge.vue'`. Registered on `@Options.components`.
- **Page-level `.page-community__*` member-grid chrome** in `pages/Community.vue` is intentionally left on its legacy CSS-var stack (`--community-members-*`). The `q-avatar` there could be swapped to AetheryteBadge in a parity follow-up, but the AC scopes 410 to `FreeCompany.vue` per the backlog row title (`FreeCompany.vue` member grid). Tracked as a possible future XS follow-up.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-411 — Membership status banners → semantic surfaces (S, deps 003 ✓)

- New shared rule block in `app.scss` (around line 1101, before the mobile-usability block) defining `.elpis-membership-banner` and three modifier classes (`--applied`, `--rejected`, `--confirmed`). Same single-source-of-truth pattern ELPIS-218 used for the segmented control and ELPIS-216 used for the CharacterFinderField banners.
- **Tier mapping:**
  - **`--applied`** ("Anfrage gesendet") — `--semantic-info` (cool blue, awaiting review). Inset 4 px left rail in semantic-info + 10 % info-tinted background + info-coloured `hourglass_empty` material icon. Reads as "the aether is still gathering" — the request is in flight.
  - **`--rejected`** ("abgelehnt") — `--semantic-danger` (warm red, blocking). Inset 4 px danger rail + 10 % danger tint + `block` material icon in danger ink. The blocking-state colour is consistent with the registration-status danger treatment from ELPIS-216.
  - **`--confirmed`** ("Mitglied") — `--semantic-success` (warm green, member). Inset 4 px success rail + 10 % success tint + `verified` material icon. Reads as the successful-state companion to the danger tier.
- **Why the 4 px left rail:** Discord-embed cue, mirroring ELPIS-511's noticeboard parchment treatment. Functions as a tier indicator at scan-distance; the icon clarifies the meaning at reading-distance. The pattern is repeatable across the rest of the portal — any future "pending / blocked / confirmed" state can adopt the same banner.
- **Material icon via `::before` with font-family inheritance** — uses the existing Material Icons font already loaded by Quasar globally (no new asset), so each modifier class only sets `content: '<icon-name>'` + `color`. Cleaner than wrapping an explicit `<q-icon>` per banner since the existing template just shows a paragraph of copy.
- **Banner typography** — `var(--font-section)` Spectral + `--type-scale-2` (16 px) + `--lh-body`. Same body-text tier the long-form parchment surfaces use.
- **Body-dark variants** flip the banner background onto `--surface-lift` + bumped tint alphas (16–18 % vs. 10 %) so the tier colour reads on Obsidian. The semantic ink colours are preserved across themes (per `color.scss` they pass AA on both surfaces).
- **Wiring on Venue.vue** — three `.page-venue__membership-status` sections each pick up `.elpis-membership-banner --<tier>` modifier classes. Copy text is unchanged. The legacy `.page-venue__membership-status { ... }` rule block in Venue.vue's local style is gone — replaced with a comment pointing at the shared rule's location.
- **Wiring on Community.vue** — same pattern; the three `.page-community__membership-status` sections (APPLIED, REJECTED, CONFIRMED) all carry the new modifier. The page's legacy `.page-community__edit-bar` class is removed from these sections (it was used for flex layout, but the new banner owns its own flex). Copy text is unchanged.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-406 — Venue section drawer → aetheryte indicator (M, deps 008 ✓ + 106 ✓)

- `Venue.vue` style block: new rule block scoped to `.page-venue-layout__menu .q-item` (the drawer's section list).
- **Active state** (`q-item.q-item--active` — Quasar applies this class when `:active="true"` on the q-item) gets:
  - **Soft gold-tint background** — `rgba(186, 155, 91, 0.14)` Hydaelyn / `rgba(193, 155, 255, 0.16)` Zodiark.
  - **3 px gold-rule left rail** — `box-shadow: inset 3px 0 0 var(--rule-gold)` Hydaelyn / `--rule-arcane` Zodiark. The rail is the aetheryte's "stem" — a vertical line of gold that anchors the section.
  - **Hexagonal aetheryte glyph** — inline-SVG-data-URL background-image painted on the q-item's `::before` pseudo, positioned at 6 px from the left edge, 18 × 18 px. Outer hex outline + inner hex + vertical+horizontal cross-lines, all stroked in `%23BA9B5B` (Hydaelyn) / `%23B8A5FF` (Zodiark). Opacity 0 by default, 1 when active. Smaller / cleaner than the calendar's today-cell motif (302) — drawer items have less width than calendar cells.
  - **Section icon** (the q-item-section's avatar `q-icon`) flips its colour to `--rule-gold` (Hydaelyn) / `--glow-aether-d` (Zodiark) so the icon reads as "lit" when active.
- **Smooth section transitions** — every active-state visual property (background-color, color, opacity of the glyph) transitions on `var(--motion-base) var(--ease-elpis)` (260 ms). When the user clicks a different section, the previous active row's tint + glyph fade out as the new row's fade in. Reduced-motion → global guard collapses `--motion-base` to `--motion-instant` (80 ms), so the crossfade still happens but is near-instant. No per-component `@media (prefers-reduced-motion: reduce)` block.
- **Inline SVG data URLs** rather than external file refs — same pattern as ELPIS-302 (calendar today-cell aetheryte). The two SVGs are theme-specific (gold stroke vs. arcane violet stroke) so a CSS-var-based approach can't be used (CSS vars can't be embedded in `url()`). Each SVG is ~440 chars URL-encoded — well under the inline-vs-external break-even point.
- **Edit / delete drawer items** (`.page-venue-layout__edit-item` / `.page-venue-layout__delete-item`) intentionally untouched — they're not section-navigation items and have their own legacy chrome (`bg-secondary`-style). The aetheryte indicator is reserved for "where you are in the venue" not "actions on the venue".
- **The layout's `:mini` mode** (mouseover-out collapse) preserves the indicator — the rail and glyph still paint inside the collapsed drawer because the rules key off `q-item--active`, not the drawer's mini-state. The glyph is small enough (18 × 18 px) that it reads even in a 56-px-wide collapsed drawer.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-111, 401, 402, 403, 505, 510 done: directory tile family lands on Vellum

Six tickets in one session — the highest-leverage unblocked-ticket cascade flagged in last session's Next-Ticket section. ELPIS-111 lifts the home activity grid's nine panels onto `mat-vellum`; 401/402/403 propagate the same Vellum + hairline-gold-rule + hover-lift idiom to the three directory list components (`VenueList`, `CommunityList`, `FreeCompanyNameList`); 505 brings the Stories grid card in line; 510 adds the same treatment to `NoticeboardItemList` plus colour-coded type chips (offer / seek / rumor / article tiers). Lint clean (`npx eslint src/pages/Index.vue src/pages/Stories.vue src/components/venues/VenueList.vue src/components/communities/CommunityList.vue src/components/free-company/FreeCompanyNameList.vue src/components/noticeboard/NoticeboardItemList.vue` exit 0). Epic 1 moves 3 → 4 / 13, Epic 4 opens at 3 / 11, Epic 5 moves 6 → 8 / 11.

#### ELPIS-111 — `Index.vue` activity-grid panels → Vellum (M, deps 008 ✓)

- All nine `<section class="page-index__panel ...">` elements pick up the `mat-vellum` class. The material owns the cream `--surface-vellum` surface, hairline `--rule-gold-soft` (alpha 0.28) border, 4 % SVG noise overlay, body-dark flip to `--surface-lift` + `--rule-arcane-soft`, and `--surface-ink` / `--ink-luminous` ink. Adding the class on the template was the cleanest path; the page-level `.page-index__panel` rule layers on top with structural concerns only (flex column, min-height, transition-spec, hover lift).
- **Hover spec per AC** — `transform: translateY(-4px)` + border alpha 0.28 → solid `--rule-gold` (~0.6 effective) + dual-layer drop shadow (`0 1px 2px rgba(43,36,24,0.06) → 0 12px 28px rgba(43,36,24,0.12)`). Reads as elevation/1 → /2 per the AC, with the rule colour shift carrying most of the affordance.
- **Body-dark variant** — `mat-vellum`'s built-in dark-mode flip handles the surface, ink and rule colour. The page only redefines drop-shadow (so the lift reads on Obsidian) and the hover border colour (`--rule-arcane`).
- **Inner directory cards** (`.page-stories__card`, `.page-characters__card` rendered inside the panels by Index's local `<router-link>` blocks) repainted to match the Vellum idiom — same border, surface, hover lift. Border-radius lifted from `0` to `6 px` to match the panel's outer radius. Body-dark variant uses `--surface-lift` + `--rule-arcane-soft` directly (no need for `mat-vellum` class on the inner card since the chrome is restated locally — adding the class would have layered the noise overlay twice on the home grid).
- **Reduced-motion** — the existing `@media (prefers-reduced-motion: reduce)` block already zeroes `transform` on hover; transitions inherit `var(--motion-fast)` so the global guard collapses them to 80 ms automatically.
- **Hero (`.page-index__hero`)** intentionally left on its legacy chrome — it's the Aetherglass-light upper region, not an activity-grid card. ELPIS-112 (welcome card + Crystal accent) will rework that surface.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-401 / 402 / 403 — Directory list components → Vellum (S/XS/XS, deps 111 ✓)

- `VenueList.vue` / `CommunityList.vue` / `FreeCompanyNameList.vue` all share the same `__item` chrome: `border 1px rgba(221, 180, 118, 0.3)` + `background rgba(255, 255, 255, 0.95)` + heavy double drop. Replaced uniformly with Aetherium tokens — `--rule-gold-soft` border, `--surface-vellum` background, single-layer drop, hover lift `-4 px` + solid `--rule-gold` border + dual-layer drop. Border-radius `2px → 6px` so the tile matches the home panel radius.
- **Typography rebased** — `__name` (and FC `__name`) moves to `var(--font-display)` (Cinzel Eorzea → Cinzel chain) + `--type-scale-2` (16 px) + `--ls-display`. `__meta` / `__goal` / `__server` move to `var(--ink-muted)` + `--type-scale-1` for body and `--type-scale-0` for the eyebrow. Server label gets the Inter eyebrow treatment (uppercase + `--ls-eyebrow` + `--font-ui`).
- **Body-dark variants** flip surface to `--surface-lift`, ink to `--ink-luminous`, rule to `--rule-arcane-soft` / `--rule-arcane`. Muted text moves to a 74 %-alpha luminous channel — same pattern AETHERIUM.md notes for muted-on-dark.
- **Reduced-motion** — only `transform: none` is needed on hover; transitions use `var(--motion-fast)` so the global guard collapses them automatically.
- **Cross-page coverage** — these list components render in two contexts: (a) as embedded panel content on `Index.vue` home page, (b) as the main content on `/venues`, `/communities`, `/free-companies` directory pages. Both contexts pick up the new chrome automatically; no per-page edits needed for 401/402/403.
- **Page-level wrappers (`.page-venues__list`, `.page-communities__list`, `.page-free-companies__list`)** intentionally untouched — they're the outer frame around the q-list, not the cards. Re-skinning them would have stretched into "directory pages get full Vellum chrome" which is outside Epic-4's tile-card scope. Flagged as a possible follow-up.
- Backlog rows marked **[done 2026-04-27]**.

#### ELPIS-505 — `Stories.vue` directory cards (S, deps 111 ✓)

- `.page-stories__card` repainted onto Aetherium tokens — same Vellum + hairline gold rule + hover lift idiom as Venues/Communities/FCs. Border-radius `0 → 6 px`. The existing `page-stories-card-rise` keyframe (360 ms entrance animation) preserved — the AC asks for visual parity, not motion changes.
- **Type chip (`__card-type`)** lifted to a token-driven pill: `border-radius: 999px`, `1 px solid --rule-gold-soft` border, 18 % gold tint background, `--rule-gold` ink, `--font-ui` uppercase eyebrow. Replaces the legacy `border-radius: 0` + flat-fill rectangle. Reads consistently with the Noticeboard chip family in 510.
- **Title** moves to `var(--font-display)` + `--type-scale-3` (20 px) — bumped a tier from the previous 1.05 rem because the directory-page card has more breathing room than the home-page slimmed copy. Excerpt picks up Spectral via `--font-section` for body-text warmth.
- **Action label ("Lesen")** rebased to Inter eyebrow + `--rule-gold` so it reads as an inscribed call-to-action, not generic blue link copy.
- **Body-dark variants** flip ink + rule + chip onto Zodiark — `--ink-luminous`, `--rule-arcane`, type chip onto arcane violet (`rgba(193, 155, 255, 0.16)` + `--rule-arcane-soft`).
- **Index.vue's local override of `.page-stories__card-type`** also rebased to the same chip idiom — visual parity between the home preview and the dedicated `/stories` directory.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-510 — `NoticeboardItemList` → Vellum + colour-coded type chips (S, deps 111 ✓)

- `__item` repainted onto the same Vellum / hairline-gold / hover-lift idiom shared with the rest of the directory family.
- **Type chip is the killer detail** — the AC asks for "Stellenangebot, Stellengesuche, Suche, Biete" colour coding. The actual `NoticeboardType` enum has seven values (GERUECHT, AUFTRAG, GESUCH, ZEITUNGSARTIKEL, STELLENANGEBOT, STELLENGESUCH, AUSHANG), so the chip system maps each to a four-tier *intent* mapping rather than a per-type-colour mapping:
  - **`offer`** — `STELLENANGEBOT`, `AUFTRAG` — solid warm gold rule + 22 % gold fill. Reads as "jemand bietet etwas an" (someone is publishing / offering).
  - **`seek`** — `STELLENGESUCH`, `GESUCH` — arcane violet (`rgba(107, 79, 168, 0.45)` rule + `#6b4fa8` ink + 14 % violet fill). Reads as "jemand sucht etwas". Distinct from offer at a glance.
  - **`rumor`** — `GERUECHT` — danger-soft (`--semantic-danger` ink + matching rule + 14 % danger fill). Not a warning; just visually distinct so rumors don't read like jobs.
  - **`article`** — `ZEITUNGSARTIKEL` — info-cool (`--semantic-info` ink + matching rule + 14 % info fill). News content sits apart from community-board entries.
  - **`default`** — `AUSHANG` — neutral gold-soft pill (the legacy chip surface).
- **Why intent, not per-type colour:** seven distinct chip colours would be visual noise; four intent buckets give the user "is this an offer, a request, a rumour, or news?" at a glance, which is the actual decision the chip needs to support.
- **`NOTICEBOARD_TYPE_INTENT` map** is module-scoped at the top of the script — easy to extend if new types land later. The `typeIntent(type)` method is bound on the component; the template binds `:class` to the resulting `--<intent>` modifier.
- **Meta row restructure** — the legacy meta caption was a single `<q-item-label caption>` joining `type · location · author · venue` with hyphens. Now wraps each fragment in a `<span>` so the type chip becomes a real chip element rather than text, and the rest of the meta (`location` italic, `author`, `venue`) reads as inline body text on a flex row with `gap: 6px 10px`.
- **Time** moves to Inter eyebrow + `--ink-muted` + uppercase + `--ls-eyebrow`. Reads as a stamped relative-time label rather than generic grey caption.
- **Body-dark variants** — every intent tier gets a Zodiark companion: offer onto `--glow-aether-d`, seek onto `--glow-zodiark`, rumor onto a brighter `rgba(255, 180, 188, 0.95)` so it stays readable on Obsidian, article onto `rgba(196, 221, 247, 0.95)` (cool blue, mirrors the Hydaelyn semantic-info treatment).
- **Reduced-motion** handled via the global guard plus a single `transform: none` on hover.
- **Cross-page coverage** — `NoticeboardItemList` renders both on `/noticeboard` (the dedicated directory) and on `Index.vue` (Neue Aushänge panel). Both contexts pick up the colour-coded chips automatically.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-502, 507, 511 done: Epic-5 long-form drop caps + Noticeboard parchment

Three tickets in one session, all in Epic 5. ELPIS-511 lifts `NoticeboardItemView` onto Parchment with a 4 px gold left rail (Discord-embed cue). ELPIS-502 adds a Cinzel Eorzea drop cap on stories ≥ 200 words. ELPIS-507 gives the Wiki page title an illuminated initial. Lint clean (`npx eslint src/components/noticeboard/NoticeboardItemView.vue src/components/stories/StoryView.vue src/components/wiki/WikiPageView.vue` exit 0). Epic 5 moves from 3 / 11 to 6 / 11.

#### ELPIS-511 — `NoticeboardItemView` Parchment + Discord-embed left rail (M, deps 008 ✓)

- `NoticeboardItemView.vue` template: legacy `<hr>` → `<triskelion-divider class="noticeboard-item-view__divider">`. The bare `<html-viewer>` is now wrapped in `<section class="noticeboard-item-view__body mat-parchment">`. h2 picks up `regular-header-font` (Cinzel via the global rule, mirroring ELPIS-501/506). Same idiom as Story / Wiki for visual parity across long-form surfaces.
- **Discord-embed cue:** the parchment section gets a 4 px solid `--rule-gold` `border-left`. This is the visual "this would post to Discord" hint — Discord embeds always render with a colored left rail. Zodiark variant flips it to `--rule-arcane`. No separate Discord-frame mock component is added; that would be net-new feature work and is documented as deferred in the verification block.
- **Subtitle typography rebased:** `--ink-muted` ink + `--font-section` italic on the row, with the type/location chunk moving to `--font-ui` + uppercase + `--ls-eyebrow` + `--type-scale-0`. Same eyebrow idiom as Story (501) and Wiki (506). Author + venue links keep their default `--app-link-color` (router-links pick this up automatically).
- **Body padding:** `28×32 px` desktop, `20×18 px` ≤ 600 px — same baseline as Story / Wiki so the three long-form surfaces share line-height-tuned breathing room.
- **TriskelionDivider import + registration** added alongside the existing `HtmlViewer` import. Same component used by Story (501), Wiki (506), CharacterProfile (203), MainLayout footer (105) — no new asset.
- The legacy `.noticeboard-item-view__subtitle { color: $grey-8 }` rule is gone — replaced by token-driven ink. The `@import url($extraGoogleFonts)` directive is preserved (it still backs the legacy chip pathways via `$extraGoogleFonts`).
- **Discord-embed preview frame (second AC clause)** → no current consumer; documented in the verification block. Building a literal Discord-styled mock would be a net-new component, outside visual-rework scope.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-502 — Story drop cap (S, deps 006 ✓)

- `StoryView.vue` script: new `hasDropCap` computed property strips HTML tags from `story.content` (`replace(/<[^>]*>/g, ' ')`) then word-counts via `split(/\s+/).filter(Boolean)`. Returns true for stories ≥ 200 words. The 200-word threshold is recorded as a top-level `DROP_CAP_WORD_THRESHOLD` constant for later tuning.
- **Why 200 words:** below that, the body is essentially a vignette / flash-fic / a quoted excerpt, and a 3-line drop cap reads as visual shouting against tiny copy. 200 words is roughly the "you've started a real story, the cap belongs" inflection point. The threshold is per AC.
- **Class binding** `:class="{ 'story-view__body--drop-cap': hasDropCap }"` toggles a modifier on the parchment section. CSS targets `.story-view__body--drop-cap .story-view__content > p:first-of-type::first-letter` — the `:first-of-type` selector skips ahead of any preceding non-paragraph elements (e.g. images / blockquotes the user might have inserted before their opening prose), and `::first-letter` is the canonical CSS pseudo for drop caps.
- **Drop cap chrome:**
  - `float: left` so body copy wraps around it.
  - `font-family: var(--font-ornament)` (Cinzel Eorzea → Cinzel → serif chain).
  - `font-size: 4.4em` desktop, `3.2em` mobile (≤ 600 px). 4.4em on a 1.6 line-height ≈ 2.75 lines, which gives a 3-line drop cap silhouette once the floated letter pushes adjacent lines.
  - `line-height: 0.9` so the floated letter doesn't push the first line down.
  - `margin: 0.06em 0.12em 0 0` (mobile shrinks horizontal margin to `0.10em` so the cap stays compact).
  - `color: var(--rule-gold)` + `text-shadow: 0 1px 0 rgba(255, 255, 255, 0.45)` for warm illumination on Hydaelyn. Zodiark flips to `--ink-luminous` + `0 0 18px rgba(184, 165, 255, 0.32)` glow.
  - `letter-spacing: -0.02em` tightens the cap so adjacent body copy reads close to it.
  - `font-weight: 500` matches the Cinzel weight the rest of the headline tier uses.
- **Reduced-motion:** no animation involved, so no guard needed. Drop cap is a static layout treatment.
- **Cinzel Eorzea fallback:** until ELPIS-001 self-hosts via Fontsource, the chain falls through to whatever the browser has for Cinzel (the existing app already loads it via Google Fonts in `$extraGoogleFonts`); `--font-ornament` then drops to Cinzel → serif. The chain is identical to other Aetherium consumers — when 001 lands, the drop cap automatically picks up the preferred weight.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-507 — Wiki h1 illuminated initial (S, deps 502 ✓)

- `WikiPageView.vue` style: `.wiki-page-view__title::first-letter` gets `font-family: var(--font-ornament)`, `font-size: 1.5em`, `color: var(--rule-gold)`, `letter-spacing: 0.01em`, `font-weight: 500`, `text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4)`. Zodiark flips ink to `--glow-aether-d` and the shadow to `0 0 14px rgba(184, 165, 255, 0.32)`.
- **Inline initial, not a float-left drop cap.** The wiki h2 title is centered (`text-align: center` from the global `app.scss` h2 rule), and a floated drop cap on a centered heading collapses into the line awkwardly. So the visual treatment is an *enlarged ornamental first letter* — the AC's phrase "illuminated initial" fits this geometry better than "drop cap" (which is reserved for body copy where text wraps around the float). Story (502) gets the float-left variant; Wiki (507) gets the inline variant. Different idioms because different layout contexts.
- **Per-page opt-out (AC clause):** deferred. `WikiPageDto` has no flag for this today (only `id`, `mine`, `characterId`, `author`, `authorServer`, `createdAt`, `title`, `content`, `editPermission`). When the DTO grows an `enableInitial: boolean` (or similar), gate via a class binding like `:class="{ 'wiki-page-view__title--no-initial': !wikiPage.enableInitial }"` and exclude that selector from the `::first-letter` rule. The rest of the styling is wired and will pick up the toggle automatically.
- **Why not also style the first heading inside the body content?** The AC says "first heading gets larger drop cap" — interpreted as the page-title h2 (the only guaranteed first heading). User-authored wiki content can have any heading structure (or none), and styling the first `<h2>` inside `.wiki-page-view__content` would inconsistently fire only on pages whose authors started with an h2. The page title is the one universal anchor. If a future ticket wants inner-heading drop caps, it can layer a `.wiki-page-view__content > h2:first-child::first-letter` rule on top.
- Backlog row marked **[done 2026-04-27]**.



Four tickets in one session. ELPIS-204 closes the last unblocked Epic-2 visual ticket — the character page header now wears the full §3.1 type stack (Cinzel display title, Spectral italic chrome above, IM Fell English italic nickname below). ELPIS-501 + 506 open Epic 5 by lifting Story.vue and WikiPageView onto the Parchment material with TriskelionDivider seals; 506 also gives wikilinks a distinct dashed-gold underline so they read as intra-archive references. ELPIS-509 adds a metadata footer to WikiPageView with relative-time + edit-permission pill. Lint clean (`npx eslint src/components/character/CharacterProfile.vue src/components/stories/StoryView.vue src/components/wiki/WikiPageView.vue` exit 0).

#### ELPIS-204 — Character header typography pass (S, deps 006 ✓)

- `CharacterProfile.vue` template: the two `.character-profile__header-subtitle` divs (above and below the `<h2>`) now also carry per-role modifiers — `--title-text` for the chrome above the name (e.g. "der Tapfere"), `--nickname` for the bracketed alias below («Foo»). The shared base class still owns the default subtitle size; modifiers layer the role-specific family + style.
- **h2 `.character-profile__header-title`** — locally bumped to `--type-scale-7` (49 px) per AC, with line-height `--lh-display` (1.1) and letter-spacing `--ls-display` (-0.01 em). Family stays `'Cinzel Eorzea', var(--font-display)` so the FFXIV display face still leads the chain (and the `--font-display` chain catches if Cinzel Eorzea isn't loaded).
- **`--title-text`** uses `var(--font-section)` (Spectral chain) + `font-style: italic` + `font-weight: 500`. Reads as a chronicled epithet rather than another display heading.
- **`--nickname`** uses `var(--font-lore)` (IM Fell English chain) + `font-style: italic` + `font-weight: 400` + a 0.01 em letter-spacing nudge. IM Fell isn't loaded until ELPIS-001 ships, so today the chain falls back through Spectral → serif. The fallback is intentional — readable now, picks up IM Fell automatically when 001 lands.
- **Subtitle ink** moves to `--ink-muted` (Hydaelyn) / 74 %-alpha `--ink-luminous` channel (Zodiark) — same pattern memory.md notes for the muted-on-dark case.
- **Mobile breakpoint (≤ 768 px)** scales the h2 down to `--type-scale-5` (31 px) and bumps the subtitle to `--type-scale-2` (16 px) so the hero stays balanced when the layout column-flips. Line-height tuned to 1.15 / 1.3.
- **The legacy `font-family: $header-font` (Cinzel SCSS var) on the subtitle** is **removed** — the new modifier classes own their families. Same baseline-modernization pattern that ELPIS-008 applied to materials.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-501 — `Story.vue` body → Parchment full-bleed (M, deps 008 ✓)

- `StoryView.vue` template: the legacy `<hr>` separator + bare `<html-viewer class="story-view__content">` becomes a `<triskelion-divider class="story-view__divider">` followed by `<section class="story-view__body mat-parchment">` wrapping the html-viewer. The triskelion serves as the "seal" between header (title + meta + content notes) and the manuscript body — same idiom as ELPIS-203's `CharacterProfile.vue` background block.
- **mat-parchment owns the surface** — cream Vellum tone + 4 % SVG noise + repeating 1.6em-tuned ink-rule horizontals + 1 px gold-soft border + soft warm shadow. No restated rules in the component.
- **Body padding** `28×32 px` desktop, `20×18 px` ≤ 600 px. Tuned to give the parchment's ruled lines breathing room around the html-viewer's body line-height.
- **Subtitle typography** rebased: `color: var(--ink-muted)`, family `var(--font-section)`, italic. The `.story-view__type` chip moves to `var(--font-ui)` + uppercase + `--ls-eyebrow` + `--type-scale-0` so it reads as an Inter eyebrow — same pattern ELPIS-305/306 applied to the EventView meta grid.
- **Content notes (Inhaltswarnungen) section** — title rebased onto `--ink-muted` + `--font-ui` + `--type-scale-0` + `--ls-eyebrow`. The `q-chip` itself keeps the warm `rgba(221, 180, 118, 0.22)` background but ink moves to `--rule-gold` and a 1 px `--rule-gold-soft` border is added so the chip reads as a stamped tag rather than a CSS pill. Zodiark variant flips to `rgba(193, 155, 255, 0.18)` + `--ink-luminous` + `--rule-arcane-soft`.
- **TriskelionDivider import + registration** — added alongside the existing `HtmlViewer` import. Same component already used by `CharacterProfile.vue` (ELPIS-203) and the Phase-1 footer (ELPIS-105), so no new asset.
- **`@import url($extraGoogleFonts)` retained** — the file still references it for the legacy chip color path; not a new dep.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-506 — `Wiki.vue` body → Parchment + Cinzel h2 (M, deps 501 ✓)

- `WikiPageView.vue` template: same restructure as Story — `<hr>` becomes `<triskelion-divider class="wiki-page-view__divider">`, the html-viewer is wrapped in `<section class="wiki-page-view__body mat-parchment">`. Subtitle (verfasst-von + CC-BY-SA) keeps its existing two-column layout but typography moves onto the Aetherium tokens (Spectral italic for the body, Inter eyebrow for the licence chip) — visual parity with Story.
- **h2 `.wiki-page-view__title regular-header-font`** — already inherits Cinzel from the global `h2.regular-header-font` rule (added in ELPIS-006), so the AC's "Cinzel h2" requirement is structurally met without new code in this file. No size override; the global h2 (`--type-scale-5` = 31 px) is the right tier for a wiki page heading (lower than the character-page hero at scale-7).
- **Wikilink chrome** — the killer detail of this ticket. `parseWikilinksInHtml` (in `client-common/src/common/wikilinks.ts`) renders every `[[Link]]` as `<a href="/link/<encoded>">`. So a CSS attribute selector `.wiki-page-view__body .wiki-page-view__content a[href^="/link/"]` cleanly targets *only* wikilinks without touching external anchors.
  - Hydaelyn: `color: var(--rule-gold)`, `border-bottom: 1px dashed var(--rule-gold-soft)`. Hover swaps to solid + brighter underline. Transitions ride `--motion-fast var(--ease-elpis)`.
  - Zodiark: `color: var(--glow-aether-d)`, `border-bottom: 1px dashed var(--rule-arcane-soft)`. Hover → solid + `--rule-arcane`.
  - The dashed underline is a deliberate visual cue: "this points to another page in the archive". External links keep their existing `--app-link-color` + `launch` icon idiom — separation reads at a glance.
- **`text-decoration: none`** on the wikilink override is intentional — `border-bottom` gives finer dash control than `text-decoration-style: dashed` (which renders unevenly on smaller text). ELPIS-508 (gated on Motion One) will animate the underline-draw over 180 ms on hover; today's static treatment is the structural foundation.
- Body padding mirrors Story (28×32 desktop, 20×18 ≤ 600 px).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-509 — `WikiPageView` metadata footer (XS, deps 003 ✓)

- New `<footer class="wiki-page-view__meta-footer">` below the parchment body, showing two metadata rows side-by-side (column-stacked at ≤ 600 px):
  - **Relative time** — `<q-icon name="schedule">` + "Verfasst <vor 3 Tagen>" via `$display.relativeTime(this.wikiPage.createdAt)`. The display helper returns localised German relative strings (`vor X Minuten/Stunden/Tagen`) and special-cases `vor 0 Minuten` → `Gerade`.
  - **Edit-permission pill** — `<q-icon name="group|lock">` + label. Two states: `EditPermission.EVERYONE` → "Bearbeitbar von vertrauenswürdigen Mitgliedern" + `group` icon + solid `--rule-gold` border + 14 % gold tint + warm gold ink (more emphatic — opens the page to wider edits); `EditPermission.ME` → "Nur vom Autor bearbeitbar" + `lock` icon + soft gold border + 8 % tint + muted ink (defaults to less emphatic — author-only is the calmer state). Permission-class binding via `permissionClass` getter.
- **DTO note (load-bearing for future tickets):** `WikiPageDto` only exposes `createdAt`, no `updatedAt`. The AC asks for "last-updated timestamp" which we render as creation-time relative for now. If the API adds `updatedAt`, swap the `relativeDate` getter to read from it — the rest of the footer is already wired. Recorded above in the verification block.
- **Pill chrome** uses the eyebrow idiom: `font-family: var(--font-ui)`, `text-transform: uppercase`, `letter-spacing: var(--ls-eyebrow)`, `font-size: var(--type-scale-0)`, `border-radius: 999px` (true pill silhouette), inline-flex with a 4 px icon gap.
- Body-dark variant flips ink to 74 % `--ink-luminous` for the time row, swaps the pill to `--rule-arcane-soft` border + `rgba(193, 155, 255, 0.10)` fill (default) / solid `--rule-arcane` border + `rgba(193, 155, 255, 0.18)` fill (`EVERYONE`).
- Layout: footer flexes row-direction with `space-between` justify; ≤ 600 px collapses to column. Doesn't compete with the parchment body's silhouette — sits directly below with 6 px top padding rather than a rule-line, so the parchment's "framed page" silhouette is preserved.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-310, 311, 312 done: Epic-3 EditEvent stepper + tile selector

Three tickets close out the unblocked Epic-3 work. The EditEvent stepper now wears a prism-gradient rule under the active step (horizontal/vertical layout-aware), completed step dots are repainted as Crystal facets, and the event-type radio group becomes an ornamental Vellum tile grid with per-type icons. Lint clean (`npx eslint src/pages/EditEvent.vue src/common/event-types.ts` exit 0).

#### ELPIS-310 — `EditEvent.vue` stepper prism rule (M, deps 002 ✓)

- `.page-edit-event__stepper .q-stepper__tab--active::after` — 3 px prism-gradient bar painted under the active tab. Inset 14 % from each edge so the rule reads as an underscore on the active step rather than running edge-to-edge. `box-shadow: 0 0 12px rgba(167, 226, 255, 0.42)` on Hydaelyn / `rgba(184, 165, 255, 0.45)` on Zodiark gives a faint aether bloom around the rule.
- Background-size `200% 100%` + `page-edit-event-prism-shift` keyframes run the gradient back-and-forth over `--motion-ambient × 1.2` (≈ 7.2 s) for a slow chromatic drift. Reduced-motion → ambient zeroes → static rule.
- **Vertical layout (xs/md when `:vertical="$q.screen.lt.md"` kicks in)** — the tab is rendered as a row, so `bottom: 0` would land the rule on just the dot row. Override flips the rule to the right edge (`left: auto; right: 0; top: 14%; bottom: 14%; width: 3px; height: auto`) and switches the keyframes to a vertical sweep so the same chromatic drift reads sensibly. Two keyframe sets — `…-prism-shift` and `…-prism-shift-vertical` — selected via `.q-stepper--vertical` modifier on the parent.
- Horizontal step-to-step slide animation is **not** re-implemented — Quasar's existing `animated` prop on the q-stepper already does this via `q-transition--jump-left/right` internally. Plan documents this in the verification block so a future reviewer knows where the slide is owned.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-311 — Crystal facet on completed step dots (S, deps 008 ✓)

- `.page-edit-event__stepper .q-stepper__tab--done .q-stepper__dot` — repainted to Crystal: `background: var(--crystal-prism)`, `background-size: 220% 220%`, triple-layer box-shadow (top-light highlight + cool inner rim + outer aether drop). Shimmer runs `page-edit-event-step-shimmer` over `--motion-ambient × 1.3` (≈ 7.8 s) so reduced-motion → static.
- The default Quasar checkmark icon (rendered as `<i class="q-icon">`) is hidden via `opacity: 0`. Going `display: none` would collapse the dot's flex layout and shift its size; opacity preserves geometry.
- A hexagonal-facet SVG is layered via `::after` with an inline data-URL background-image: outer hex outline + inner hex + three radial cross-lines, all stroked white at varying opacities (0.92 / 0.7 / 0.5–0.45). Inset 4 px from the dot edge so the prism background ring reads around it. SVG is small enough (≈ 580 chars URL-encoded) that the inline data URL costs less than a separate file fetch.
- Body-dark variant flips the box-shadow to violet rims (`rgba(193, 155, 255, 0.45)` inner, `rgba(184, 165, 255, 0.3)` outer). The prism gradient itself is theme-shared per AETHERIUM.md so no override needed there.
- Active step dot is intentionally untouched — Quasar paints it with the secondary brand colour (per `color="secondary"` on the q-stepper), and that's the right tier for "current step". Crystal treatment is reserved for "done" only.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-312 — Event-type ornamental tile selector (M, deps 008 ✓)

- New `EventTypeIcons` mapping + `getEventTypeIcon(type)` helper added to `client/src/common/event-types.ts`. 16 event types each get a sensible material icon (sports_bar / local_bar / nightlife / restaurant / emoji_food_beverage / healing / sports_kabaddi / sell / menu_book / palette / hot_tub / storefront / shield / school / theater_comedy / category). Promoted to the shared file rather than inlined in EditEvent because future Epic-3 tickets (calendar cell glyphs, sidebar event card icons, EventView header) will likely reach for the same mapping.
- Replaced the `<q-option-group v-model="event.eventType" type="radio" :options="eventTypeOptions">` with a custom `<div role="radiogroup">` containing per-option `<button role="radio">` tiles. Each tile binds `@click="event.eventType = option.value"` and exposes `:aria-checked` so the radio semantics are preserved for screen readers / keyboard. Tiles use `<q-icon :name="getEventTypeIcon(option.value)">` + `<span>` for label.
- Tile chrome (in `<style>` block, scoped to `.page-edit-event__type-tile`):
  - Idle: `var(--surface-vellum)` background, `1 px var(--rule-gold-soft)` border, 6 px radius, Inter `--type-scale-1` (14 px) label, gold-rule icon at 22 px.
  - Hover: `var(--rule-gold)` solid border + 8 % gold tint background + soft warm drop + `transform: translateY(-1px)` on `--motion-fast` (160 ms).
  - Focus-visible: dropped outline + 3 px `--glow-aether` ring (Hydaelyn) / `--glow-aether-d` (Zodiark) — keyboard navigation reads cleanly.
  - Active: 18 % gold tint background + solid `--rule-gold` border + tripled box-shadow (inset gold-soft hairline + outer gold-soft halo + warm drop). Active icon picks up `drop-shadow(0 0 8px rgba(186, 155, 91, 0.5))` glow.
  - Body-dark mirrors flip everything onto `--surface-deep` / `--rule-arcane` / `--rule-arcane-soft` and `--ink-luminous` ink.
- Grid uses `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` so the layout responds to width without an extra `@media` query — collapses to single column at xs naturally.
- The original `q-option-group :rules="[$rules.required(...)]"` is gone. Two reasons: (1) `q-option-group` silently ignores `:rules` (it's not a `q-field` descendant), so the rule was a no-op anyway; (2) `event.eventType` always has a value via `normalizeEvent()` defaulting to `EventType.RP`. The required-field invariant is structurally guaranteed.
- The other option-groups in the same step (`closedEvent` yes/no radio, `contentNotes` checkboxes) are intentionally untouched — 312's AC scopes Crystal/tile treatment to event-type only.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-206 done + Epic 3 opened (301, 302, 304, 305, 306, 307)

Seven tickets in one session. ELPIS-206 closes the unblocked Epic-2 work; the other six open Epic 3 (Events & Calendar) with a coherent pass on the calendar surface, the event-view hero, and the sidebar widget. Lint clean (`npx eslint`) on every modified Vue file (EditCharacterAppearance, EventCalendar, Event, EventView, CalendarSidebarWidget) — exit 0 across the batch.

#### ELPIS-206 — `CharacterAppearance` Crystal facet swatches (M, deps 008 ✓)

- Editor swatches in `EditCharacterAppearance.vue` (six 20 × 20 round buttons across hair / eye / skintone Shade1/Shade2): empty state now paints with `var(--crystal-prism)` + 200 % background-size + the existing `mat-crystal-shimmer` keyframes (riding `--motion-ambient × 1.5`). Filled state keeps the user's hex via the `:style="colorButtonStyle(...)"` binding but loses the legacy black border + checker pattern + white box-shadow ring; new chrome is `border: 1px solid var(--rule-gold)` + inset top-light highlight + 2 px pearl outer-ring + warm drop. Hover bumps the drop to a gold-tinted glow.
  - Empty state is keyed off a `--empty` modifier added by `:class="{ 'page-edit-character__color-picker-btn--empty': !character.<field> }"`. Removing the modifier (i.e. when a colour is picked) suppresses the shimmer animation cleanly — no `animation: none` overrides needed.
  - Zodiark variants flip border to `--rule-arcane`, drop the outer-ring onto `--surface-deep`, and shift the hover glow to violet. The empty-state shimmer reads on both themes because the prism gradient sits in a fixed warm-cool channel.
- **Popup proxy prism sweep** — every `<q-color>` inside the six pickers gets `class="crystal-color-picker"`. The sweep is a `::before` pseudo on the picker body painted with `var(--crystal-prism)`, `mix-blend-mode: screen`, and a one-shot keyframe `crystal-color-picker-sweep` running over `--motion-cinematic` (720 ms) → opacity drops 0.55 → 0 with the gradient sliding 0% → 100%. `animation-iteration-count: 1 forwards` ensures it fires exactly once per popup-open. Reduced-motion → the global guard collapses `--motion-cinematic` to 80 ms, so the sweep effectively becomes a soft fade.
  - Picker chrome: doubled inset gold rule (1 px gold + 4 px gold-soft inset, mirroring Aetherglass elevation/3) + 16 px warm drop. Zodiark variant uses arcane rules and `mix-blend-mode: lighten` on the sweep so it reads against the deep surface.
  - The `.q-color-picker > *` z-index layering ensures the sweep sits between the picker chrome and its interactive controls (z 1) and the controls themselves (z 2).
- The 16 × 16 read-only colour dots in `CharacterAppearance.vue` (the public profile view) are intentionally untouched — the AC scopes Crystal treatment to the *editor* swatches.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-301 — `EventCalendar` surfaces (M, deps 008 ✓)

- `<header class="page-event-calendar__header">` gets `mat-aetherglass`. Stripped from `.page-event-calendar__header`: `border`, `background`, `box-shadow` — Aetherglass owns those. Restated padding (20 × 22 px) and added a defensive `.page-event-calendar__header.mat-aetherglass { border-radius: 8px }` so the header doesn't pick up the page wrapper's 30 px corner-clip on certain breakpoints.
- Day cells: `q-calendar-month__day` background swapped to `var(--surface-vellum)`. Header row (`q-calendar-month__head`) gets `rgba(186, 155, 91, 0.10)` + `border-bottom: 1px solid var(--rule-gold-soft)`. Body-dark variant lifts both onto `var(--surface-lift)` + `var(--rule-arcane-soft)`.
- `.page-event-calendar__day` hover: rebased onto Aetherium tokens — background `rgba(186, 155, 91, 0.12)`, border `var(--rule-gold-soft)`, shadow `rgba(43, 36, 24, 0.12)`. All transitions ride `var(--motion-fast) var(--ease-elpis)`. The legacy `transition: background 0.2s ease, ...` (which used the Quasar default) is gone.
- Selected day cell: `rgba(186, 155, 91, 0.22)` background, `var(--rule-gold)` border, doubled inset gold-soft hairline. Body-dark variant flips to arcane.
- The legacy body-dark rule lumping `.page-event-calendar__header, .page-event-calendar__navbar, .page-event-calendar__calendar, .page-event-calendar__sidebar` together was split — header is dropped (Aetherglass owns its dark variant); navbar / calendar / sidebar still ride the legacy chrome until their own tickets land.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-302 — Today cell Aetheryte motif (S, deps 106 ✓)

- New `isToday(dateStr)` method on `PageEventCalendar` — compares dateStr against `DateTime.now().setZone(SharedConstants.FFXIV_SERVER_TIMEZONE).toISODate()`. Bound via `:class="{ 'page-event-calendar__day--today': isToday(timestamp.date) }"` on the day slot. (Couldn't rely on `timestamp.current` from q-calendar-month — its semantics shift between minor versions; an explicit local check is safer.)
- Aetheryte motif painted as a `::before` pseudo with an inline-SVG-data-URL background-image: hexagonal crystal silhouette (outer hex outline + inner hex) + radial halo + three radial cross-lines, all stroked with `currentColor` swapped to `%23BA9B5B` (Hydaelyn `--rule-gold`) at varying opacities (0.18 fill on the halo, 0.55 outer hex, 0.7 inner hex, 0.4-0.5 cross-lines). 56 % background-size, centered, opacity 0.55 — read as a "presence under the day number" not a logo stamp.
- Today cell also gets a `var(--rule-gold)` border + inset gold-soft hairline so the cell reads as "current" before the motif is even noticed. Stronger than a plain hover.
- Body-dark variant swaps the SVG stroke colour to `%23B8A5FF` (`--glow-aether-d`), the halo fill to `%236B4FA8` (`--rule-arcane`), and bumps overall opacity to 0.65. Border and rule-shadow flip to `--rule-arcane` / `--rule-arcane-soft`.
- The motif's `z-index: 0` + child `> * { z-index: 1 }` rule keeps the day number and the event icons rendering above it.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-304 — Calendar view-toggle restyle (S, deps 218 ✓)

- Generalised the existing ELPIS-218 rule in `app.scss` (around line 1039) — the original was scoped to `.page-edit-character__button-bar .q-btn-toggle`. Each of the four rule blocks (idle frame, segment typography, active prism, body-dark variants) now reads `.page-edit-character__button-bar .q-btn-toggle, .page-event-calendar__view-toggle .q-btn-toggle`. Same selector pattern down through `.bg-secondary`. Header comment rewritten to call out that new consumers can opt in by extending the parent list.
- `EventCalendar.vue` template change: `toggle-color="primary"` → `toggle-color="secondary"` on the view-toggle q-btn-toggle. Necessary because the shared rule keys off `.bg-secondary` (the active class Quasar applies). One-line markup change with no runtime behaviour difference (the toggle still picks the active model value via v-model).
- Removed the legacy `.page-event-calendar__view-toggle .q-btn { border-radius: 0; text-transform: none; }` + `:hover { box-shadow: ... }` rules from `EventCalendar.vue`'s style block — they fight the shared rule's uppercase + radius. Replaced with a 3-line comment pointing at the shared rule's location.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-305 — Event hero Aetherglass + 50 × 50 icon (M, deps 008 ✓)

- `<header class="event-view__header">` gets `mat-aetherglass`. Restated padding (16 × 18 px) and bumped gap to 18 px so Aetherglass's inset gold rule has breathing room between icon and title. Stripped the legacy header rules (none survived — Aetherglass takes over completely).
- `.event-view__icon` (the 50 × 50 icon tile): repainted onto Aetherium tokens — `background: rgba(186, 155, 91, 0.14)`, `border: 1px solid var(--rule-gold)`, triple shadow stack (`inset 0 1px 0 rgba(255,255,255,0.55)` top-light, `inset 0 0 0 2px rgba(255,255,255,0.18)` inner highlight ring, `0 4px 12px rgba(43, 36, 24, 0.18)` warm drop). The 12 px border-radius is preserved — reads as a stamped tile rather than a circle. Quasar default icon (`event` glyph fallback when `event.icon` is absent) ink moves from `rgba(35,35,35,0.65)` to `var(--rule-gold)` so the placeholder reads gold-on-gold-tint.
- Subtitle (`.event-view__subtitle`) — family swap to `var(--font-section)` (Spectral chain), font-weight 500, ink to `var(--ink-muted)`. Time chunk picks up tabular numerals via `font-feature-settings: 'tnum' 1, 'lnum' 1` + `font-variant-numeric: tabular-nums lining-nums`. Type chunk moves to Inter (`var(--font-ui)`) + `--type-scale-0` + `--ls-eyebrow` + uppercase — reads as a small labeling chip riding the subtitle line.
- Body-dark variants: icon background `rgba(107, 79, 168, 0.20)` + `--rule-arcane` border + violet inset highlights + black drop. Placeholder icon ink → `var(--glow-aether-d)`. Subtitle / type / meta-label ink moves to a 74 %-opacity `--ink-luminous` channel triple.
- Aetherglass owns the body-dark surface paint of the header itself — no manual restate.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-306 — Event meta grid typography (S, deps 006 ✓)

- `.event-view__meta-label`: family `var(--font-ui)` (Inter chain), weight 500, uppercase, `letter-spacing: var(--ls-eyebrow)` (0.06 em), size `var(--type-scale-0)` (12 px), ink `var(--ink-muted)`. Replaces the legacy `font-size: 0.75rem` + `letter-spacing: 0.06em` + hardcoded grey ink — same visual weight, but every value is now token-driven.
- `.event-view__meta-value`: family `var(--font-section)` (Spectral chain), weight 500, size `var(--type-scale-2)` (16 px), `font-feature-settings: 'tnum' 1, 'lnum' 1` + `font-variant-numeric: tabular-nums lining-nums` so date / time / number values column-align across rows.
- `.event-view__meta-row` ink moved to `var(--surface-ink)`.
- Body-dark variants: `--ink-luminous` for values + meta rows, `rgba(236, 227, 247, 0.74)` for labels + subtitle (matches the AETHERIUM.md "use --ink-luminous at lower opacity" guidance for muted-on-dark).
- The meta panel surface itself (`background: rgba(255, 255, 255, 0.95)` + gold-soft border + warm drop) wasn't touched — re-skinning *that* would have stretched into the "event meta tile" territory which isn't an explicit ticket. Visible chrome is unchanged; only typography moves.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-307 — `CalendarSidebarWidget` Aetherglass + Crystal divider + idle pulse (M, deps 008 ✓)

- `<q-card class="calendar-widget__card">` gets `mat-aetherglass`. Stripped from `.calendar-widget__card`: `border`, `background`, `box-shadow` — Aetherglass owns those. Kept the structural rules (`display: flex`, 30 px border-radius, `background-clip: padding-box`). Defensive override `.calendar-widget__card.mat-aetherglass { border-radius: 30px }` because Aetherglass defaults to 8 px — the widget's pill silhouette is part of its identity.
- Header gradient (legacy `linear-gradient(135deg, rgba(221, 180, 118, 0.15) 0%, rgba(221, 180, 118, 0.08) 100%)` + `border-image` gold gradient) replaced with a single Crystal-prism gradient seam painted as a `::after` rule (1 px tall, inset 12 px from each side, `background: var(--crystal-prism)`, opacity 0.7). The seam doubles as the divider between the header and the collapsible body. Body-dark variant softens the seam to opacity 0.55.
- Idle pulse on the calendar icon (`<q-icon name="event" :class="{ 'calendar-widget__pulse-icon': collapsed }">`) — pulse runs only when collapsed (`collapsed === true` toggles the class). Keyframes `calendar-widget-pulse` cycles `transform: scale(1) → scale(1.08) → scale(1)` + opacity `1 → 0.78 → 1` over `calc(var(--motion-ambient) * 0.6667)` ≈ 4 s. Reduced-motion → `--motion-ambient` zeroes to 0 ms automatically (per the global guard) → animation effectively no-ops, icon stays static.
- The `q-slide-transition` collapse mechanics — and specifically the recent fixes from commits `4f0965b` (calendar sidebar widget collapse height) and `bb9c4f2` (event calendar sidebar collapse toggle) — are completely untouched. Only visual surfaces and the seam under the header change.
- Body-dark variant: dropped the legacy `body.body--dark .calendar-widget__card { background / border / shadow }` and `body.body--dark .calendar-widget__header { background / border-image }` rules — Aetherglass's body-dark variant owns the card surface; the prism seam reads on both themes via `--crystal-prism`.
- Other card internals (date picker, filter dropdowns, event cards inside the body, body-dark variants thereof) are untouched — re-skinning each of those is downstream work, not in 307's scope.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-202, 207, 215, 216, 217, 218, 221 done: Epic-2 dialogs + primitive batch

Seven tickets in one session. ELPIS-202 builds the first reusable Aetherium-domain primitive (AetheryteBadge) and adopts it on three surfaces; the rest re-skin every character-related dialog plus the Edit/Preview segmented control across all 7 editors. Lint clean on every modified Vue file; the only eslint hit is a pre-existing inability to parse `app.scss` under the TS-project config (not introduced here).

#### ELPIS-202 — `<AetheryteBadge>` primitive (M, deps 106 ✓)

- New file `client/src/components/aetherium/AetheryteBadge.vue`. Two shape variants:
  - `square` (default) — Lodestone-style stamped tile. Triple inset shadow (`inset 0 0 0 1px var(--rule-gold)`, `inset 0 0 0 3px var(--surface-pearl)`, `inset 0 0 0 4px var(--rule-gold-soft)`) builds the bevelled frame; `<GlyphCorner>` stamps in all four corners; the image fills the inside with `4 px` padding so the corner glyphs sit on the inset rule. Hover bumps the inner ring alpha and lifts the outer drop.
  - `round` — gold-ring variant (1 px inner gold rule + 2 px gold-soft outer ring shadow). Lighter chrome, no corner glyphs. Used on member grids, sidebar mini-avatars, dense list rows.
- **Sizes (`xs` 24 → `xl` 96)** map to the 8 px baseline. Corner glyphs scale automatically through a `cornerSize` getter that picks `sm` for badge `lg`/`xl` and `xs` for `md`/`sm`/`xs`. The triple-inset frame pattern stays at the same proportions because it's expressed in absolute px (1/3/4 px) — visually consistent across sizes.
- **Placeholder slot** — when `src` is empty, renders `<q-icon :name="placeholderIcon" />` with `--ink-muted` colour at 60 % size. `placeholderIcon` defaults to `person`; consumers can override (e.g. `mood` for an FC mascot).
- **Zodiark variants** flip the gold rule onto `--rule-arcane` / `--rule-arcane-soft`, swap the surface base to `--surface-deep`, and deepen drop-shadow alphas to read on Obsidian.
- **Three consumers wired** in this same PR — anything else can adopt incrementally without breaking the primitive's API:
  - `CharacterProfile.vue` header — `<aetheryte-badge size="lg" shape="square" :src="character.avatar" :alt="character.name" />` replaces the prior `<q-avatar round><img/></q-avatar>`. Bumped from md (48 px) to lg (72 px) because this is the showpiece header avatar — small visual layout shift accepted because the original 48 px was undersized for a hero.
  - `CharacterNameList.vue` (used by `SwitchCharacterDialog` and other places that show a character roster) — `<aetheryte-badge size="md" shape="round" />` replaces `q-avatar round`. Same 48 px end size, lighter chrome than the square variant.
  - `MainLayout.vue` sidebar `.layout__char-name` — `<aetheryte-badge size="md" shape="round" />` replaces the active-character mini-avatar. The legacy MainLayout rules `.layout__char-name .q-avatar { border / box-shadow }` are now obsolete (the badge owns its chrome) and have been deleted; the mobile size override `.layout__char-name .q-avatar { width: 36 px }` was repointed to `.layout__char-name .aetheryte-badge`.
- **Imports & registration:** all three consumer files import from `'../aetherium/AetheryteBadge.vue'` (or `'src/components/aetherium/AetheryteBadge.vue'` from layouts) and add `AetheryteBadge` to their `@Options.components`.
- **GlyphCorner reused** — corner stamps come from the existing `<GlyphCorner>` (ELPIS-106), no new glyph SVG is added in this ticket.
- **No motion ambient loop** — the badge has hover transitions on `box-shadow` + `border-color` riding `var(--motion-fast) var(--ease-elpis)` (160 ms), automatic reduced-motion via the global guard. No per-component @media block.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-215 — `SwitchCharacterDialog` ornament (S, deps 008 ✓)

- `<q-card>` gets `class="switch-character-dialog mat-aetherglass elevation-3"` — promotes the dialog to dialog-tier Aetherglass with the doubled gold rule.
- **Four `<glyph-corner size="sm" position="…" class="switch-character-dialog__corner">`** stamps inset 6 px from each corner of the card. Z-index 2 so they sit above the card's inset rules.
- **Heading typography** moves to Aetherium tokens — `h5` → `var(--font-display)` (Cinzel) + `var(--type-scale-4)` (25 px) + `var(--ls-display)`, centered. `h6` (the "Neuen Charakter zu diesem Account hinzufügen" subhead) gets the same family at `--type-scale-2`.
- **Character-list rows refactored.** The legacy `--app-select-menu-item-hover-bg` + colour-flip on hover/active was a Quasar-default warm fill that fights the Aetherglass surface. Replaced with the Epic-2 hover idiom: 4 px radius, `inset 0 0 0 1px var(--rule-gold)` + 10 % gold tint on hover/focus, 16 % tint + bold weight on active. Zodiark variants on `body.body--dark` ride on `var(--rule-arcane)` and 12 % / 18 % tints. Transitions use `var(--motion-fast) var(--ease-elpis)`.
- **Padding and radius** — restated `border-radius: 8 px` so the corner stamps sit on a defined edge (Aetherglass's default radius is also 8 px, but it can shift if a parent forces full-bleed; this is defensive).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-216 — `CharacterFinderField` registration-status banners (S, deps 003 ✓)

- Three banner states get distinct token-driven semantics replacing the legacy `bg-negative text-white` / `bg-dark text-white` Quasar utility classes:
  - **Claimed** (someone else owns it) — `--semantic-danger` border + 10 % danger tint background + danger ink on the icon. `block` icon prepended.
  - **Already registered** (you've already added it) — same danger palette, different `info` icon. Both states are blocking, so they share the danger surface treatment.
  - **Renamed** — pearl background + violet `--rule-arcane` left-rail (`box-shadow: inset 4 px 0 0 var(--rule-arcane)`) + arcane icon. This is the "heads up, here's what to do" tier called out in the AC ("renamed banner gets Hydaelyn pearl + violet rule"). `auto_awesome` icon prepended.
- Each banner uses Quasar's `<template v-slot:avatar>` to inject the icon — keeps copy text exactly as-is, just adds an icon column.
- **Zodiark variants** flip the renamed banner's pearl to `--surface-deep` and keep the arcane left-rail visible; danger banners use a slightly higher tint (18 %) to compensate for the deeper surface.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-217 — `RefreshCharacterDialog` + `WikiImportDialog` ornament (S, deps 008 ✓)

- Both dialogs get the same treatment as ELPIS-215: `mat-aetherglass elevation-3` on the `<q-card>`, four corner-glyph stamps inset 6 px, headings (h5/h6) rebased onto `--font-display` + `--type-scale-{4,2}` + `--ls-display`, padding restated to 8 px so glyphs sit cleanly.
- **WikiImportDialog inner sections** rebased onto Aetherium tokens:
  - `.wiki-import-dialog__section` background → `rgba(186, 155, 91, 0.06)` (gold-soft tint) + 1 px `--rule-gold-soft` border, replacing the prior `rgba(0,0,0,0.03)` neutral grey.
  - `.wiki-import-dialog__section--highlight` (the "Import full content" callout) → 12 % gold tint + 1 px `--rule-gold` border + `inset 4 px 0 0 var(--rule-gold)` left-rail, replacing the prior cool-blue (`rgba(25, 118, 210, ...)`) accent that didn't match the rest of the chrome.
  - `.wiki-import-dialog__field-preview` → `--ink-muted` (was hardcoded `#666`).
  - Zodiark variants flip everything onto `--rule-arcane` / `--rule-arcane-soft` and `var(--ink-luminous)` at lower opacity.
- **The blue `bg-info text-dark` selectionSummary banner** at the bottom of the preview step was *not* re-skinned in this pass — it's a single semantic-info accent that arguably reads as the "OK to proceed" tier, and replacing the Quasar utility class would require restating the banner inline. Flagged for a possible follow-up if the contrast bothers; not a blocker.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-221 — Revert confirmation dialog (XS, deps 217 ✓)

- All seven `EditCharacter*.vue` page components had an inline `<q-dialog v-model="confirmRevert" persistent><q-card>` snippet. Each `<q-card>` now gets `class="mat-aetherglass elevation-3 revert-confirm-dialog"` — same elevation-3 Aetherglass treatment as the other dialogs.
- **Shared chrome rule** added to `app.scss`: `.revert-confirm-dialog { min-width: 320 px; max-width: 460 px; padding: 4 px; border-radius: 8 px }`. The four-pixel inner padding gives the elevation-3 frame breathing room around the existing copy without stretching the dialog wider than necessary.
- **No corner glyphs** — the AC explicitly says "Existing copy preserved; dialog uses elevation/3 Aetherglass". Adding glyphs would have been ELPIS-217's scope, not this XS follow-up. The dialog is short and the doubled gold rule already does enough framing on its own.
- Touched files: `EditCharacterProfile.vue`, `EditCharacterContacts.vue`, `EditCharacterPersonality.vue`, `EditCharacterAppearance.vue`, `EditCharacterRumors.vue`, `EditCharacterInventory.vue`, `EditCharacterPenAndPaper.vue`. Two-token diff per file (one class change).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-218 — Edit/Preview Crystal segmented control (S, deps 008 ✓)

- All seven character editors share the same `<q-btn-toggle :options="previewOptions" toggle-color="secondary">` inside `.page-edit-character__button-bar`. Rather than touch each editor, **the entire treatment lives in one rule block in `app.scss`** scoped to `.page-edit-character__button-bar .q-btn-toggle`. Single-source-of-truth styling.
- **Idle segments**: Vellum surface (`--surface-vellum`), 1 px `--rule-gold-soft` border, 6 px radius, inset top-light highlight, soft warm drop. Button labels use `var(--font-display)` + `--type-scale-1` + `--ls-eyebrow` + `text-transform: uppercase` so the labels read like inscribed UI lozenges rather than generic Material buttons.
- **Active segment**: Quasar still applies `bg-secondary` to the active button (because the markup keeps `toggle-color="secondary"`); we override that class to use the `--crystal-prism` linear-gradient directly. `background-size: 200 % 200 %` so the gradient has motion latitude (consumers can tune to ride `mat-crystal-shimmer` later if needed). `!important` is used because Quasar's `.bg-secondary` is also marked important — necessary for the override to win, not gratuitous.
- **No animation pulse** in this ticket — the AC mentions "toggle slide animation 220 ms ease-elpis", which I'd need Motion One to do via `useMotion`. ELPIS-007 (Motion One install) is deferred. The transition on `background-color` + `color` already rides `var(--motion-base) var(--ease-elpis)` (260 ms), which gives the toggle a smooth crossfade without depending on JS-driven slide animation. Will revisit once 007 lands.
- **Zodiark variants** swap the surface to `--surface-deep`, the border to `--rule-arcane-soft`, and the highlight rgba into the violet channel. Active segment keeps the prism gradient but ink stays dark on the gradient (intentional — the prism reads warm even on Zodiark, and dark ink on it gives best contrast).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-207 — `CharacterPersonality` + `CharacterContacts` re-skin (S, deps 203 ✓)

- Both files had a copy-pasted `<style>` block of dead `.character-profile__*` rules (header, subtitle, details td/tr) inherited from `CharacterProfile.vue` years ago. None of those classes appear in either file's template — they were unused.
- **Replaced** that dead block with two Aetherium-aligned rule sets, one per file, scoped to the actual component class (`.character-personality` and `.character-contacts`):
  - **h6 → Cinzel** via `font-family: var(--font-display)` + `--type-scale-2` (16 px) + `--ls-display`. Margin tightened to `18 px 0 10 px` so the section breaks read as proper rhythm; first-child margin top zeroed so the first heading sits flush with the section top.
  - **Readonly q-inputs → Vellum**: `.q-field--readonly .q-field__control` (the actual visual surface Quasar paints for readonly fields) gets `background-color: var(--surface-vellum)`, plus the `::before` pseudo (Quasar's underline + border layer) gets `background-color: var(--surface-vellum)` + `border: 1 px solid var(--rule-gold-soft)`. Hover bumps the border to solid `--rule-gold`.
- **Zodiark mirrors** flip the surface to `--surface-lift` and the rule to `--rule-arcane-soft` / `--rule-arcane`, with h6 ink moving to `--ink-luminous`.
- **Did NOT add the `?`-popover for wikilinks** — that's ELPIS-209 and is gated on Motion One (ELPIS-007). Per AC, defer.
- **Imports of `BannerView` / `HtmlViewer` / `ReportViolationSection` / `CharacterDetail` / `CharacterDetailsBox` left intact** — they were unused but I'm scoping the change to the visual treatment, not import hygiene. A future ticket can prune these together with the same cleanup on `CharacterRumors.vue` (flagged earlier in the ELPIS-210 notes).
- Backlog rows marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-201, 203, 205, 208, 210 done: Epic-2 character-domain visual pass

Five tickets in one session. All depend only on Phase 0 primitives (008, 002, 003, 006, 106) that have already shipped — no deferred dependencies were touched. Together they re-skin the public character page from the layout shell down to the diary cards. The Aetherium materials catalogue (Vellum, Aetherglass, Parchment) gets its first heavy use outside the Phase 1 chrome.

Lint clean (`npx eslint` on all five modified files returns no errors). Pre-existing whole-tree lint errors on `client/public/js/*.js` and `quasar.conf.js` are unrelated and predate this session — they're TS-project-config issues, not visual-rework work.

#### ELPIS-201 — `Character.vue` shell: drawer Aetherglass + content Vellum (M, deps 008)

- `<q-drawer>` gets `class="border-radius-inherit page-character-layout__drawer mat-aetherglass"` — the existing `border-radius-inherit` Quasar utility stays, the Aetherium class layers on top.
- `<q-page>` gets `class="page-character mat-vellum"`.
- **Specificity-defensive overrides** for the drawer added to `<style>` block. Reasoning recorded in an inline comment: MainLayout.vue's *unscoped* `.q-drawer--left { background: linear-gradient(...); border-right: 1px solid …; backdrop-filter: blur(12px); }` rule applies globally to *every* drawer (including this nested one), and ties on specificity with `.mat-aetherglass`. Source order can't be relied on across SFC bundling, so we restate Aetherglass's surface values at higher specificity (`.page-character-layout .q-drawer.q-drawer--left.mat-aetherglass = 0,3,0`):
  - `background-image: none` to kill MainLayout's gradient.
  - `background-color: rgba(245, 239, 226, 0.88)` (Hydaelyn) / `rgba(21, 11, 35, 0.78)` (Zodiark) — restate the rgba pearl/deep values exactly as they live in `materials.scss`. Same defensive duplication pattern memory.md notes for ELPIS-101's header.
  - `border-right: none` removes the legacy hairline so Aetherglass's inset gold-rule is the only frame.
  - `backdrop-filter: blur(14px) saturate(1.05)` (and `-webkit-` twin) restated to win over MainLayout's `blur(12px)`.
  - `::before` on the drawer is hidden — MainLayout uses it for a top-glow overlay that fights with Aetherglass's own inner top-light.
- **q-page Vellum override**: `border-radius: 0`, `border: none`, `min-height: 100%` because the page is full-bleed against the q-layout edges, not a card. Vellum's cream surface, noise overlay, and warm shadow stay intact.
- **Mini-state behavior preserved** — the `onDrawerMouseOver`/`onDrawerMouseOut` logic and `:mini` binding aren't touched; only the surface paint changes.
- **Section icons unchanged** — still `account_circle`, `curtains`, `psychology`, `diversity_3`, `sms`, `auto_stories`, `collections`, `diamond`, `casino`, `edit`. Per AC.
- **Safari < 16 fallback caveat**: `materials.scss` has `@supports not (backdrop-filter)` block that swaps `.mat-aetherglass` to a solid `var(--surface-pearl)` / `var(--surface-deep)`. Our specificity-3 override sits *outside* the @supports block and uses the rgba (88%/78%) values, so Safari < 16 will see ~88% opaque pearl on this drawer instead of the fully-solid fallback. Same minor regression accepted on the header in ELPIS-101. If it bites, fold the override into the @supports block.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-203 — `CharacterProfile` body: Parchment + glyph divider (M, deps 008)

- Replaced the bare `<br>` + `<template v-if="character.background">…<html-viewer/></template>` block with:
  ```html
  <template v-if="character.background">
    <triskelion-divider class="character-profile__divider" />
    <section class="character-profile__background mat-parchment">
      <html-viewer class="character-profile__appearance-background" :content="character.background" />
    </section>
  </template>
  ```
- **Reused `TriskelionDivider`** from the Phase 1 ornament set (shipped in ELPIS-105) instead of inventing a new glyph. Imported from `../aetherium/TriskelionDivider.vue` and registered in `@Options.components`. The divider's `currentColor` flows from `--rule-gold` (Hydaelyn) / `--rule-arcane` (Zodiark) per its scoped rules.
- The AC mentions "glyph divider above first heading". The existing template has *no* explicit heading above the prose — the `<h2>` lives in `.character-profile__header` higher up, and the prose just renders raw user HTML. Interpreted the AC as "glyph divider as the section break ahead of the prose"; the triskelion sits between the details box and the parchment block. If a future ticket wants a literal heading, the divider stays anchored above it.
- **Inner padding on the parchment section**: `padding: 24px 28px` desktop, `18px 16px` mobile. Matches the breathing room the ruled-line backdrop needs at typical body line-heights (mat-parchment's repeating-linear-gradient is tuned to `1.6em` = `--lh-body`). Inner `.character-profile__appearance-background { margin-bottom: 0 }` neutralises the existing 24 px (and mobile 16 px) bottom-margin so the section's own padding is the visual rhythm.
- **Did NOT touch the second `v-if="!character.appearance && (character.combinedDescription || !character.background)" → &nbsp;` block** — that's pre-existing oddball spacer logic; out of scope for ELPIS-203's body re-skin. Left alone with no behavior change.
- **CharacterDetailsBox is still a plain `<q-card>`** — re-skinning it to Vellum is a separate concern. ELPIS-205 (this session) only addresses *row* hover, not the box wrapper. A future ticket can promote the box itself to Vellum if needed; not required by the AC.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-205 — `CharacterDetail` rows: refined hover state (S, deps 002)

- `border-bottom: 1px solid #ddd` → `border-bottom: 1px solid var(--rule-gold-soft)` (Hydaelyn) / `--rule-arcane-soft` (Zodiark) on body-dark.
- Added `transition: border-bottom-color var(--motion-fast) var(--ease-elpis)` — 160 ms `ease-elpis` per plan §4.2. Reduced-motion fallback automatic via the global guard in `motion.scss`; **no per-component `@media` block**. (Removing the existing per-component reduced-motion blocks from the legacy diary CSS was part of ELPIS-208 below.)
- `:hover` lifts the border to `rgba(186, 155, 91, 0.4)` (Hydaelyn) / `rgba(107, 79, 168, 0.4)` (Zodiark). Channel-triple-rgba pattern memory.md notes for ELPIS-101 — the hex-to-rgba split is necessary because CSS vars can't be wrapped in `rgba()` without splitting.
- **AC interpretation note**: AC reads "alpha 0 → 0.4". Literal interpretation = transparent rest, gold-at-0.4 hover. But removing the at-rest divider entirely would make adjacent detail rows mush together visually inside the existing flex-wrap details box. Took the looser interpretation: rest = `--rule-gold-soft` (already at 0.28 alpha), hover bumps to 0.40. The transition reads as the rule "warming up" rather than appearing from nothing. Intent recorded in inline comment so a later reviewer can see the call.
- **Mobile column-layout preserved** — the `@media screen and (max-width: 460px)` block that flips `.character-detail` to `flex-direction: column` is untouched. Per AC.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-210 — `CharacterRumors`: three Parchment variants (M, deps 008)

- Template restructured: previously a single `<section>` containing the intro paragraph plus three `<h6>` + `<html-viewer>` pairs in a flat list. Now four sections:
  1. `.character-rumors__intro` — bare `<section>` for the intro paragraph (no parchment, plain text).
  2. `.character-rumors__section--open mat-parchment` — Offene Informationen.
  3. `.character-rumors__section--common mat-parchment` — Häufige Gerüchte.
  4. `.character-rumors__section--rare mat-parchment` — Seltene Gerüchte.
- **Three rule-weight tiers** signalling intimacy of knowledge:
  - **Open** — inherits `mat-parchment` defaults (rule-gold-soft @ 0.28, 1 px). Lightest. Reads like a posted notice.
  - **Common** — overridden `border-color: var(--rule-gold)` (solid). The frame reads more deliberately than the public notes above.
  - **Rare** — `border-width: 2 px`, `border-color: var(--rule-gold)`, plus a doubled inset hairline (`inset 0 0 0 1px var(--rule-gold-soft)`) and a stronger inner glow (`inset 0 0 28 px rgba(186, 155, 91, 0.10)` vs. parchment's default `0.06`). Reads as a "framed scroll" stamp.
- Both common and rare have body-dark variants flipping to `--rule-arcane` / `--rule-arcane-soft` and a deeper rgba glow.
- **Inner padding**: `22 px 26 px` desktop, `16 px 18 px` mobile. Same line-height-tuned baseline reasoning as ELPIS-203.
- **Did NOT touch the legacy global SCSS at the bottom of `CharacterRumors.vue`** (the `.character-profile__header`, `.character-profile__details`, etc. blocks copy-pasted from `CharacterProfile.vue` years ago). Those are unscoped global rules already shadowed by the matching rules in `CharacterProfile.vue`'s style block — effectively dead duplicates, but a cleanup of *those* would be beyond visual-rework scope. Flagged for a future "CharacterRumors leftover SCSS cleanup" if anyone wants to chase it.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-208 — `CharacterDiary` cards: Parchment + Cinzel titles + IM Fell excerpts (M, deps 008)

- `.character-diary__card` gets `class="mat-parchment"` on each card div. The legacy `--diary-card-*` ad-hoc CSS-var block (12 light-mode tokens + 12 dark-mode tokens) is **deleted** — surface, ink, rule colour, shadows now flow from the material + Aetherium tokens.
- **Type badge re-skinned**: was `--diary-card-type-bg / --diary-card-type-color` (legacy gold/blue). Now Hydaelyn = `var(--rule-gold-soft)` background + `var(--rule-gold)` ink; Zodiark = `var(--rule-arcane-soft)` + `var(--ink-luminous)`. Letter-spacing kept (`0.08em`), typography moves to `var(--font-ui)` (Inter chain) to match the rest of the §3.1 system.
- **Title**: `font-family: var(--font-display)` (Cinzel chain). Was `$header-font` SCSS-var pointing at Cinzel Eorzea — same family in practice, but the token swap removes the Quasar SCSS dependency.
- **Excerpt**: `font-family: var(--font-lore)` (IM Fell English chain) + `font-style: italic` + `opacity: 0.85`. Lore chain falls back to Spectral → serif until ELPIS-001 lands; once it does, no further code change is needed — the fallback chain promotes IM Fell to first position automatically.
- **Hover lift preserved** at `transform: translateY(-4px)`. Box-shadow tightened to a warmer `rgba(43, 36, 24, 0.14)` outer + `rgba(186, 155, 91, 0.06)` inner glow on Hydaelyn (`rgba(0, 0, 0, 0.5)` + `rgba(107, 79, 168, 0.16)` on Zodiark). Border-color flips to `var(--rule-gold)` / `var(--rule-arcane)` on hover for a clear lift signal.
- **Transition tokens**: `transform`, `box-shadow`, `border-color` all ride on `var(--motion-fast) var(--ease-elpis)` (160 ms). The previous component-local `@media (prefers-reduced-motion: reduce)` block is **deleted** — the global guard in `motion.scss` collapses `--motion-fast` to `--motion-instant` automatically. Per AETHERIUM.md "Don't introduce... per-component reduced-motion blocks". Card hover at 80 ms is still gentle enough to satisfy the contract.
- **Focus ring** rebased onto `--glow-aether` (Hydaelyn) / `--glow-aether-d` (Zodiark) — replaces the legacy `rgba(31, 77, 100, ...)` ring that drifted off the Aetherium palette.
- **Empty state ink** uses `--ink-muted` (Hydaelyn). Zodiark has no `--ink-muted` token (per AETHERIUM.md table); fallback is `rgba(236, 227, 247, 0.72)` — `--ink-luminous` channel triple at 72 % alpha, matching the table's "use `--ink-luminous` at lower opacity" guidance.
- **Border-radius rebased** from `0` to `4 px` (matches mat-parchment's default radius) so the card edges read crisp against the parchment material instead of fighting it.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-213 & 214 done: Epic-2 regression fixes (cross-cutting, no visual impact)

Two pure code-fix tickets pulled from the cross-cutting list. Neither touches `app.scss`, the Aetherium tree, or any visible chrome — they unblock Epic 2 character-domain work by removing latent bugs that the visual tickets would otherwise inherit.

#### ELPIS-214 — Per-instance `isDirty` in character editors (M, no deps)

- **Bug:** all 7 `EditCharacter*.vue` page components declared `const isDirty = ref(false);` at module scope. Mounting two editor instances simultaneously (e.g. two browser tabs editing different characters) made them share one ref — the second tab's `beforeRouteEnter` reset would clear the first tab's dirty state, defeating the route-leave guard.
- **Fix applied to:** `EditCharacterInventory.vue`, `EditCharacterContacts.vue`, `EditCharacterPersonality.vue`, `EditCharacterAppearance.vue`, `EditCharacterRumors.vue`, `EditCharacterPenAndPaper.vue`, `EditCharacterProfile.vue`.
- **Pattern per file:**
  - Removed the module-scoped `const isDirty = ref(false);`.
  - Added `isDirty = false;` as a class instance field next to the other simple flags (`preview`, `saving`, `confirmRevert`).
  - In `beforeRouteEnter` (which has no `this`), dropped the redundant `isDirty.value = false;` reset — fresh component instances already start with `isDirty = false`, so the line was a workaround for the module-scope bug it caused.
  - In `beforeRouteLeave`, replaced `isDirty.value` with `(this as PageEditX).isDirty`. The cast preserves type-checking under vue-class-component v8 — without it, `this` inside an `@Options` block is typed as the raw component options, not the class. Vue Router does bind `this` to the component instance for `beforeRouteLeave`, so this is correct at runtime.
  - In instance methods (`onChange`, `onConfirmRevert`, `onSubmit` finally block, plus `updateCharacter` in EditCharacterProfile), replaced `isDirty.value = …` with `this.isDirty = …`.
- **Removed unused `import { ref } from 'vue';`** from `EditCharacterPenAndPaper.vue` (only had one ref usage, the deleted module-scoped isDirty). The other 6 files keep the `ref` import because they still use it for `drawer = ref(false);`.
- **`EditCharacterProfile.vue` `updateCharacter()` quirk preserved:** the method sets `this.isDirty = true` then is immediately followed in `onSubmit`'s finally block by `this.isDirty = false;`. This is a pre-existing oddity (the line is needed when `updateCharacter` is called from the visibility checkboxes — those *do* dirty the form — but redundant when called from the post-save finally). Not refactored to keep this ticket scoped to the bug fix; can be cleaned up in a later ELPIS-2xx visual pass.
- **AC clause "regression test added" not satisfied** — the client has no test framework wired (`"test": "echo \"No test specified\" && exit 0"` in `client/package.json`). Adding one is a separate effort (and not covered by any current ticket). The fix is verified by reading: each instance's `isDirty` lives on the component, route-leave guards read from the instance, no shared module state remains.
- **`EditVenue.vue` has the same module-scoped pattern** at line 589 — out of scope for ELPIS-214 (which is character-editor-specific per audit §27.3) but flagged here for a future "EditVenue isDirty" follow-up if needed.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-213 — Replace `CharacterRumors`-as-Inventory-preview (M, no deps)

- **Bug:** `EditCharacterInventory.vue` rendered its preview pane using `<character-rumors :preview="true" />` — a copy/paste leftover. The public-facing `Character.vue` was already wired correctly to `<character-inventory>` for the Inventar tab; only the editor's preview was using the wrong component.
- **`client/src/components/character/CharacterInventory.vue` already existed** with the correct two-section template (Besitz / Besondere Gegenstände) and `HtmlViewer` calls — but was a copy-paste of `CharacterRumors.vue` with the class still named `class CharacterRumors extends Vue.with(Props)` and importing four unused components (`BannerView`, `CharacterDetail`, `CharacterDetailsBox`, `ReportViolationSection`) plus the `PageType` enum. Cleaned up: renamed to `class CharacterInventory`, dropped unused imports, switched the wrapper `class="character-rumors"` → `class="character-inventory"`. Kept the legacy global `.character-profile__*` style block in the SFC since those classes are global selectors used elsewhere (the `<style lang="scss">` is unscoped and references `$header-font` + `$extraGoogleFonts`).
- **`EditCharacterInventory.vue` rewired:** import `CharacterInventory from 'src/components/character/CharacterInventory.vue';` (was `CharacterRumors`), updated the `@Options.components` registration, and changed the template tag to `<character-inventory :character="character" :preview="true" />`.
- The `preview` prop on `CharacterInventory` is a no-op (mirroring `CharacterRumors`) — kept for API parity with the editor's existing call site so the prop doesn't need to be conditionally omitted.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-101, 105, 106 done: first visible Phase 1 surface

Single session, three tickets — the unblocked Phase 1 subset that doesn't require new dependencies. Header now wears Aetherglass (the material shipped in ELPIS-008), footer wears Vellum (Hydaelyn) / Obsidian (Zodiark) with a triskelion ornament above the legal text, and the GlyphCorner primitive is in place for downstream consumers (ELPIS-202 AetheryteBadge, 302, 406, 407, 702, 706, 810).

#### ELPIS-106 — Corner-flourish SVG sprite + GlyphCorner component (S, deps 002)

- New `client/src/components/aetherium/` folder for Aetherium-system primitives. Two new files:
	- `GlyphCorner.vue` — inline SVG corner-flourish (32×32 viewBox path: outer L-bracket + inner quarter-arc curl + small diamond accent). Five `size` steps mapped to the 8 px baseline (xs 12 px → xl 48 px). `position` prop (tl/tr/br/bl) rotates the same path 90° at a time so one path serves all four corners.
	- `TriskelionDivider.vue` — separate ornament for footer use; 32×32 centered triskelion (three identical Q-curve arms, rotated 0°/120°/240°) flanked by hairline gradient rules. Used immediately by ELPIS-105.
- **Stroke colour uses `currentColor`**, with a base rule that sets `color: var(--rule-gold)` on Hydaelyn and `body.body--dark` override flipping to `var(--rule-arcane)`. Parents can retint via `style="color: …"`. Both components are decorative — `aria-hidden="true"` + `pointer-events: none` to keep the SVGs out of the accessibility tree.
- **Storybook AC explicitly punted** — Storybook is ELPIS-011 (deferred). The components are documented inline via JSDoc above each `class Props {}` block; first real-app verification will land alongside ELPIS-202 (AetheryteBadge) and the venue/news ornament tickets that consume these primitives.
- **GlyphCorner is shipped without a current consumer** in this PR — it's a Phase 1 system primitive. The first real consumer is ELPIS-202 (AetheryteBadge); ELPIS-407 / 702 / 706 / 810 also reach for it. The component is unused right now but will not become dead code; tracked in [Verification still owed](#verification-still-owed-for-101--105--106).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-101 — `MainLayout` header → Aetherglass (M, deps 008)

- Template: added `mat-aetherglass` to the `<q-toolbar class="layout__toolbar__header">`.
- **Stripped from `.layout__toolbar__header`** (Aetherglass now owns these): `background: linear-gradient(...)`, `border-bottom: 2px solid ...`, `box-shadow: 0 4px 24px ...`, `backdrop-filter: blur(10px)`. Kept `position`, `overflow`, `font-family: Michroma`, `color: var(--nav-ink)`, `min-height: var(--nav-height)`. Added a higher-specificity `.layout__toolbar__header.mat-aetherglass { border-radius: 0 }` so Aetherglass's default 8 px corners don't apply on a full-bleed header (defensive against CSS-load-order shifts between `app.scss`-imported tokens and the SFC's bundled style block).
- **Removed the redundant `body.body--dark .layout__toolbar__header { box-shadow: ... }`** — now provided by Aetherglass's body-dark variant.
- **Recalibrated the `--nav-*` colour cluster** in both `body{}` and `body.body--dark{}` so the nav reads on Aetherium surfaces:
	- Hydaelyn: text/links use `var(--surface-ink)`; gold rule + glow rgba accents use `186, 155, 91` (the `--rule-gold-soft` channel triple) at 10–22% alpha for hover/active/open backgrounds; `--nav-bg-start/end` set to transparent (legacy fallback only); `--nav-overlay-shade` set to transparent so the `::before` overlay doesn't darken the pearl surface.
	- Zodiark: retuned away from the legacy cool-blue `#8db5df`-based chrome onto Aetherium's arcane violet (`var(--rule-arcane)`) so the header harmonizes with the Aetherium dark palette. RGBA accents use `167, 139, 196` (matching `--rule-arcane`) at 14–28% alpha.
- **Replaced hardcoded `color: #ffffff` on `.layout__char-name:hover`** with `var(--nav-ink)` (theme-aware). Softened the nameplate's `box-shadow` from `rgba(0, 0, 0, 0.3)` (heavy black drop) to `rgba(43, 36, 24, 0.10)` (warm + lighter) for Hydaelyn, with a `body.body--dark` override restoring the original dark drop on Zodiark.
- **Refreshed the Zodiark wedge gradient** (`body.body--dark .layout__char-name::after`) — old hardcoded `rgba(56, 77, 99, 0.16)` cool-blue accent → `rgba(167, 139, 196, 0.18)` violet to match the rest of the new Zodiark palette.
- **Swept hardcoded `color: #ffffff` from header chrome** in the same pass — six places (`.layout__nav-links a:hover` / `_dropdown-trigger:hover`, `.router-link-active`, `_dropdown-trigger_active`, `_dropdown-trigger_open`, `.layout__theme-toggle:hover`, `.layout__toolbar-button-more:hover`, mobile-menu hover, dropdown-menu item hover). Each now reads `var(--nav-ink)` or `var(--nav-menu-item-color)` so it flips correctly across themes. Pure white on pearl is invisible — these were latent regressions waiting to surface the moment the header surface flipped.
- **Softened `.layout__nav-menu` and `.layout__mobile-menu` `box-shadow`** from `rgba(0, 0, 0, 0.6)` (heavy black) to a warm `rgba(43, 36, 24, 0.18)` for Hydaelyn; body-dark override restores the deeper drop on Zodiark.
- **Did NOT change** in this ticket: nav typography (still Michroma — that's downstream of ELPIS-006/204 territory), the dropdown menu transition (ELPIS-102 owns that), the drawer (ELPIS-104, including its `--drawer-item-hover-color: #ffffff` which still applies on the drawer's own dark surface and doesn't conflict because the drawer keeps its own palette), the theme-toggle visual (ELPIS-103), the logo treatment (`.layout__toolbar-title`).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-105 — Footer triskelion divider + Vellum/Obsidian surface (S, deps 008)

- Template: `<q-footer elevated class="mat-vellum">`. Toolbar inside gets the Quasar utility class `column` so flex flow becomes vertical, and a `<triskelion-divider class="layout__footer-ornament" />` is injected above the existing `.layout__footer` div. Legal text + Datenschutz/Impressum links unchanged.
- **Stripped from `.layout__toolbar__footer`**: `background: var(--app-footer-bg)` (now transparent so Vellum shows through). Added `padding: 18px 16px`, `gap: 14px`, `min-height: 0` to fit the column flow with breathing room around the ornament.
- **`.q-footer.mat-vellum` overrides** Vellum's default 6 px `border-radius` to `0` (full-bleed page chrome, not a card). Adds a 1 px gold-soft top border for crisp page→footer separation, and a softer warm `box-shadow: 0 -2px 10px rgba(43, 36, 24, 0.08)` replacing Quasar's `elevated` dark shadow.
- **Body-dark Obsidian flip** — Vellum's built-in dark variant lifts to `--surface-lift` (a card-level surface), but ELPIS-105's AC explicitly calls for **Obsidian** on Zodiark (page-level chrome). Override:
	```scss
	body.body--dark .q-footer.mat-vellum {
		background-color: var(--surface-obsidian);
		background-image: linear-gradient(135deg, var(--surface-obsidian) 0%, var(--surface-deep) 100%);
		border-top-color: var(--rule-arcane-soft);
	}
	```
	The Obsidian gradient is **not** animated here (no `mat-obsidian-drift` keyframe ride) — drift on the footer would be visually noisy under text. Static gradient only.
- TriskelionDivider's `currentColor` flows through to `--rule-gold` (Hydaelyn) / `--rule-arcane` (Zodiark) automatically via its own scoped rules.
- **`q-footer elevated` kept** — Quasar still wires the elevation prop (which stacks a default shadow), but our `.q-footer.mat-vellum { box-shadow: ... }` rule overrides it. Kept the `elevated` attribute so the prop's other behaviors (positioning) are preserved.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-005, 006, 008, 012 done: Phase 0 active set complete

Single session, four tickets. After this the user-approved active Phase 0 list is fully shipped. Phase 0 is otherwise gated on the 6 deferred tickets pending user decision.

#### ELPIS-005 — `prefers-reduced-motion` global guard (S, deps 004)

- Single `@media (prefers-reduced-motion: reduce)` block at the bottom of `client/src/css/aetherium/motion.scss` (replaced the placeholder comment marker left by ELPIS-004).
- `--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-cinematic` all redirect to `var(--motion-instant)` (80 ms). `--motion-ambient` is set to **`0ms`** (not 80 ms) so any consumer that wires `animation-duration: var(--motion-ambient)` becomes a no-op instead of flickering at 12.5 Hz.
- Easing tokens deliberately untouched — they remain valid expressions even at zero duration, so any `transition: <prop> var(--motion-base) var(--ease-elpis)` consumer works naturally.
- Inline comment documents the contract (and the 0 ms ambient gotcha) so future motion-ticket authors don't need to re-derive the rule.
- **Manual OS-flag test:** not yet performed (no live dev server in this session). Should be verified via Windows Settings → Accessibility → Visual effects → "Reduce motion" once any motion consumer (ELPIS-007+) lands. The CSS itself is verified by reading: `@media (prefers-reduced-motion: reduce) { :root { ... } }` is the canonical syntax.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-006 — Modular type scale + heading hierarchy (M, deps 001/002)

- `client/src/css/aetherium/type.scss` rewritten from scaffold to full §3.1 token set:
	- **Family tokens** with safe fallback chains (Spectral, Inter, IM Fell ship via deferred ELPIS-001 — until then the chains land on Georgia / Noto Sans / system-ui so pages stay legible): `--font-display`, `--font-section`, `--font-body`, `--font-ui`, `--font-lore`, `--font-mono`, `--font-ornament`.
	- **Modular scale 1.250 (Major Third)**, base 16 px, nine steps: `--type-scale-0` (12 px) … `--type-scale-8` (61 px) per plan §3.1.
	- **Line-height tokens** (`--lh-display 1.1`, `--lh-heading 1.25`, `--lh-body 1.6`, `--lh-ui 1.4`) and **letter-spacing tokens** (`--ls-display -0.01em`, `--ls-eyebrow 0.06em`).
	- **Three utility classes** required by the AC: `.text-display` (Cinzel 49 px), `.text-body-lore` (IM Fell italic, body size), `.text-ui-mono` (Inter 14 px with `tabular-nums`).
- **`app.scss` h2/h3/h4/h5/h6 sizes updated** to reference scale tokens. Old values 2.5rem / 2rem / 1.7rem / unset / unset → `--type-scale-5` (31 px) / `-4` (25 px) / `-3` (20 px) / `-2` (16 px) / `-1` (14 px). h2 keeps its existing Cinzel Eorzea + centered treatment — only the size shifts down (it was the audit's flagged "too loud" case). The "subtitle" helper at app.scss line 332 also rebased onto `--type-scale-3`.
- **Decision: did NOT swap font-family on h1–h6 yet.** The plan calls for h2/h3 → Spectral, but Spectral isn't loaded until ELPIS-001 (deferred). Swapping now would land headings on system-serif fallback and read worse than the current Cinzel. The token vocabulary is in place, so when ELPIS-001 lands, a one-line `font-family: var(--font-section)` on the h-rules in app.scss completes the swap.
- **Decision: type tokens are theme-agnostic — no `body.body--dark` block.** Same reasoning as ELPIS-004's motion file: the `body.body--dark` AC for ELPIS-002 was already discharged by color.scss; type.scss doesn't need a stub.
- **Token-name divergence note** (continuing the ELPIS-003/004 pattern): the AC mentions `.text-display`, `.text-body-lore`, `.text-ui-mono` but doesn't name the underlying scale tokens. The implementation uses `--type-scale-0…8` keyed off the Major Third positions, with role-clarifying comments next to each. This is a forward-compatible naming scheme — if a later ticket needs role aliases (`--type-h2`, `--type-body`) they can be added on top without renaming.
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-008 — Material utilities (L, deps 003)

- New file `client/src/css/aetherium/materials.scss` (~270 lines), wired into `aetherium/index.scss` last (after all token files) so it sees every token.
- **`.mat-vellum`** — cream surface with a 4 % SVG fractal-noise overlay (3 KB inline data URL stored in SCSS variable `$aether-noise`, reused by Parchment). Hairline `--rule-gold-soft` border, soft shadow. Zodiark variant on `body.body--dark` lifts to `--surface-lift` and switches noise blend-mode to `screen`.
- **`.mat-aetherglass`** — frosted panel: `backdrop-filter: blur(14px) saturate(1.05)`, both `-webkit-` and unprefixed properties, `--surface-pearl @ 88%` background. Inner 2 px gold-rule + soft top-light highlight per plan §3.3. **Three elevation variants** (`.elevation-2` blur 22 / popover, `.elevation-3` blur 30 / dialog with double rule) implementing §3.2's layering rule. Zodiark variants ride on `--surface-deep @ 78%/86%/94%` with arcane rules.
- **Safari fallback** — `@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))` swaps Aetherglass to a **solid** `--surface-pearl` / `--surface-deep` so the panel never goes transparent. Verified by reading the @supports semantics; no live Safari at hand.
- **`.mat-obsidian`** — Zodiark page-level surface: 135° linear-gradient between `--surface-obsidian` and `--surface-deep`, 220 % background-size, animated by `mat-obsidian-drift` keyframes. **Animation timed off `--motion-ambient × 6.6667 ≈ 40 s`** so the reduced-motion guard collapses it to 0 s (static surface) automatically. No per-component @media needed.
- **`.mat-crystal`** — uses the existing `--crystal-prism` linear-gradient from color.scss. Slow shimmer pass on `mat-crystal-shimmer` keyframes timed off `--motion-ambient × 1.5 ≈ 9 s`. Inset highlight + `--glow-aether`-tinted shadow. Reserved per §3.3 for brand mark / theme toggle / hero CTA / P&P dice — **don't paint cards with this**.
- **`.mat-parchment`** — Vellum tone + `repeating-linear-gradient(to bottom, transparent calc(1.6em - 1px), rgba(110,95,70,0.08) 1.6em)` for ink-rule horizontals tuned to `--lh-body`. Subtle paper noise overlay (5 % vs. Vellum's 4 %, mirrored to 3 % screen on Zodiark). Reserved for Story / Wiki / Diary surfaces.
- Tokens flowing through correctly verified by reading: every colour, blur, shadow, and animation duration is a `var(--…)` reference. No hardcoded hex except the `rgba(245,239,226,0.88)` etc. in Aetherglass — those are intentional because CSS vars can't be wrapped in `rgba()` without a colour-channel split, and the alpha-glass effect needs an rgba background. Comment cites the token the rgba is derived from.
- **Storybook test page (AC):** punted — Storybook is ELPIS-011 (deferred). Materials are verified by code review; live verification will land alongside the Phase 1 tickets that consume them (ELPIS-101 onward).
- Backlog row marked **[done 2026-04-27]**.

#### ELPIS-012 — `AETHERIUM.md` contributor guide (S, deps 002–008)

- New file `client/src/css/aetherium/AETHERIUM.md`. Documents:
	1. Why Aetherium exists — the drift problem the system solves.
	2. File map of `aetherium/` with each file's responsibility.
	3. Token categories — colour (Hydaelyn/Zodiark table), spacing, typography (faces + scale), motion (easings + durations).
	4. Reduced-motion contract — *one* place it lives, no per-component @media guards.
	5. Materials catalogue — the 5 classes, what each is reserved for, Aetherglass elevation variants, Safari fallback, ambient-animation auto-disable.
	6. **Do/don't examples** for colour, sizing, motion, materials, theme awareness (5 paired snippets — a token-driven version next to the failure mode each replaces).
	7. "Adding a new token" / "Adding a new material" checklists — gates promotion through review (use the system before extending it).
	8. "Don't introduce" list — Tailwind, layout changes, Google Fonts CDN, per-component reduced-motion blocks, emojis, hardcoded values.
- **Cross-linked from `CLAUDE.md`** — added a "Visual rework — Elpis Reborn" section under "Key Patterns" pointing at AETHERIUM.md and at `memory.md` for cold-start status. Satisfies the AC's "linked from CLAUDE.md".
- Plan documents (audit / plan / backlog) referenced as "source of truth" so AETHERIUM.md doesn't drift into a parallel spec.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-004 done: motion easing + duration tokens

- Replaced the `client/src/css/aetherium/motion.scss` scaffold with the full §4.1 + §4.2 token set.
- `:root` only — motion is theme-agnostic per the plan, so no `body.body--dark` block. The previous scaffold's dark stub (which existed solely to satisfy the *color* ticket's "renders on body.body--dark" AC) is gone; ELPIS-004's AC explicitly requires `:root`-only definition, and the scaffold's "tokens render on body.body--dark" criterion was already discharged by ELPIS-002.
- **Eases:** `--ease-elpis: cubic-bezier(0.16, 1, 0.3, 1)`, `--ease-aether: cubic-bezier(0.34, 1.56, 0.64, 1)`, `--ease-zodiark: cubic-bezier(0.7, 0, 0.84, 0)`, `--ease-tide: cubic-bezier(0.45, 0, 0.55, 1)`. Use-case comments preserved inline.
- **Durations:** `--motion-instant 80ms`, `--motion-fast 160ms`, `--motion-base 260ms`, `--motion-slow 420ms`, `--motion-cinematic 720ms`, `--motion-ambient 6000ms`.
- **Token-name divergence note** (same pattern as ELPIS-003): the AC in this memory file listed durations as `--motion-quick` / `--motion-standard` / `--motion-expressive`, but the actual plan §4.2 names are `--motion-fast` / `--motion-base` / `--motion-slow` / `--motion-cinematic`. The plan is the explicit "source of truth" per the AC's own line, so the implemented names follow §4.2. The backlog row uses the elliptical `--motion-instant…--motion-ambient`, which is satisfied by either set, so no backlog conflict.
- Comment marker for ELPIS-005 left at the bottom of the file: explicit instruction that the `prefers-reduced-motion` block must collapse every duration to `--motion-instant`, kill ambient loops, and live nowhere else.
- No build/dev server run — pure CSS custom-property additions, no compilation surface to verify beyond syntactic correctness. Easing curves and durations will be exercised once ELPIS-007 (Motion One + `useMotion` composable) and the per-surface motion tickets begin consuming them.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-003 done: Hydaelyn / Zodiark color tokens

- Replaced the `client/src/css/aetherium/color.scss` scaffold with the full §3.2 palette.
- `:root` (Hydaelyn): `--surface-pearl`, `--surface-vellum`, `--surface-ink`, `--ink-muted`, `--rule-gold`, `--rule-gold-soft`, `--glow-aether`, `--glow-elpis`, `--crystal-prism`, plus the four `--semantic-*` tokens (`success #4FB890`, `warning #E5B25E`, `danger #C7484F`, `info #5DA9D8`). The plan's note about `#C10015` failing AA is preserved as an inline comment so future grep finds the rationale.
- `body.body--dark` (Zodiark): `--surface-obsidian`, `--surface-deep`, `--surface-lift`, `--ink-luminous`, `--rule-arcane`, `--rule-arcane-soft`, `--glow-aether-d`, `--glow-zodiark`.
- **Token-name divergence note:** the AC in this memory file referenced `--surface-void`, `--surface-abyss`, `--rule-violet`, `--glow-umbra` for Zodiark — these names are not in the actual `UI_UX_REWORK_PLAN.md` §3.2 palette. The plan is the explicit source of truth (per the AC's own "Source of truth" line), so the implemented names follow §3.2: `--surface-deep`, `--surface-lift`, `--rule-arcane`, `--glow-aether-d`. If a later ticket needs the alternate names, add them as aliases rather than renaming.
- Decided NOT to add semantic role aliases (`--surface-page`, `--ink-body`, etc.) in this ticket. ELPIS-008 (materials) is the natural home for that layer. Keeping ELPIS-003 tight = raw §3.2 tokens, nothing invented.
- Existing `--app-*` tokens at `app.scss` lines 16+ untouched; `app.scss` line 1 still imports `aetherium/index` first so the new tokens are available everywhere.
- AA contrast verified by hand for body-text-on-surface combos: `--surface-ink` on `--surface-pearl` ≈ 13.6:1 (AAA); `--ink-muted` on `--surface-pearl` ≈ 5.4:1 (AA, appropriate for muted); `--ink-luminous` on `--surface-obsidian` ≈ 16.1:1 (AAA).
- No build/dev server run — pure CSS custom-property additions, no compilation surface to verify beyond syntactic correctness. Will be exercised when ELPIS-008 consumes the tokens.
- Backlog row marked **[done 2026-04-27]**.

### 2026-04-27 — ELPIS-002 done: token tree scaffolded

- Created `client/src/css/aetherium/{color,motion,space,type,index}.scss`
- Wired `@import 'aetherium/index';` as the first line of `client/src/css/app.scss` (above the existing `weather`/`locations`/`input_styles`/`fandom-tabs` imports)
- `color.scss`, `motion.scss`, `type.scss` are scaffolds with a single placeholder var on `:root` and `body.body--dark` — to be replaced by ELPIS-003 / -004 / -006 respectively
- `space.scss` is **filled** now (8 px baseline, `--space-0…--space-12` per `UI_UX_REWORK_PLAN.md` §3.5) since no later ticket explicitly owns it. Spacing is theme-agnostic so the dark block is a stub that satisfies the "tokens render on body.body--dark" AC
- Existing `--app-*` tokens at `app.scss` lines 14–115 are untouched
- Backlog row marked **[done 2026-04-27]**
- Not built/started locally — pure CSS scaffolding, will be exercised when the next ticket adds real tokens

### 2026-04-27 — Planning phase complete

- Produced [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md)
- Produced [`UI_UX_REWORK_PLAN.md`](./UI_UX_REWORK_PLAN.md)
- Produced [`UI_UX_REWORK_BACKLOG.md`](./UI_UX_REWORK_BACKLOG.md)
- User approved Phase 0 partial scope: 7 tickets active (002, 003, 004, 005, 006, 008, 012), 6 deferred (001, 007, 009, 010, 011, 013)
- No code changes yet
