# Light Archives — Visual Rework Backlog
## "Elpis Reborn" — engineering tickets

**Companions:** [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md) · [`UI_UX_REWORK_PLAN.md`](./UI_UX_REWORK_PLAN.md)
**Date:** 2026-04-27

**Conventions**

- ID prefix: `ELPIS-###`
- Sizing: **XS** (≤ 0.5 d) · **S** (0.5–1 d) · **M** (1–3 d) · **L** (3–5 d) · **XL** (≥ 5 d → split before pulling)
- Status: planned · in-progress · review · done · blocked
- Each ticket lists acceptance criteria (AC). All visual tickets have an implicit AC: *passes `prefers-reduced-motion` audit and AA contrast on both Hydaelyn and Zodiark surfaces*.

**Cross-cutting AC enforced via CI gates**

- ✅ AA contrast verification (axe-core)
- ✅ `prefers-reduced-motion` snapshot tests
- ✅ Lighthouse perf ≥ 85 on `/`
- ✅ Bundle delta within phase budget

---

## EPIC 0 — Foundations
> *Lay the system. No visible page rework yet.*
> Budget: +25 KB gzip. Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-001 | Self-host fonts via Fontsource (Cinzel, Spectral, IM Fell English, Inter) | M | – | All four families load from origin; no Google Fonts requests in network panel; closes `PRIVACY_COMPLIANCE_CHECKLIST` font gap |
| ELPIS-002 | **[done 2026-04-27]** Create `client/src/css/aetherium/` token tree | S | 001 | `color.scss`, `motion.scss`, `space.scss`, `type.scss` files exist and are imported into `app.scss`; tokens render as CSS custom properties on `:root` and `body.body--dark` |
| ELPIS-003 | **[done 2026-04-27]** Define Hydaelyn / Zodiark color tokens | S | 002 | `--surface-pearl`, `--surface-vellum`, `--surface-ink`, `--rule-gold`, `--glow-aether`, `--glow-elpis` and Zodiark equivalents present; sample page renders both |
| ELPIS-004 | **[done 2026-04-27]** Define motion easing + duration tokens | XS | 002 | `ease-elpis`, `ease-aether`, `ease-zodiark`, `ease-tide` exposed as CSS vars; `--motion-instant…--motion-ambient` present |
| ELPIS-005 | **[done 2026-04-27]** Implement `prefers-reduced-motion` global guard | S | 004 | One `@media` block in `aetherium/motion.scss` collapses durations to instant; ambient loops disabled; manual OS-flag test passes |
| ELPIS-006 | **[done 2026-04-27]** Modular type scale + new heading hierarchy | M | 001, 002 | h1–h6 sizes follow 1.250 scale; `.text-display`, `.text-body-lore`, `.text-ui-mono` utility classes available; visual diff vs. existing flagged for review |
| ELPIS-007 | Install Motion One; ship `useMotion` composable | M | 004 | `client/src/composables/useMotion.ts` exposes `animate`, `stagger`, `inView`; respects reduced-motion; tree-shaken in dist |
| ELPIS-008 | **[done 2026-04-27]** Build `.mat-vellum`, `.mat-aetherglass`, `.mat-obsidian`, `.mat-crystal`, `.mat-parchment` utilities | L | 003 | Each material renders correctly on a Storybook test page; Safari `backdrop-filter` fallback verified; documented inline |
| ELPIS-009 | Replace top loading bar with prismatic gradient | S | 003, 004 | `q-loading-bar` styled via `body` override; cycles through aether colors using `background-position`; no layout shift |
| ELPIS-010 | Move TinyMCE API key to env config (audit §27.2) | S | – | Key removed from `news/src/components/common/HtmlEditor.vue`; reads from `process.env.TINYMCE_API_KEY`; CI fails if hardcoded |
| ELPIS-011 | Storybook (Histoire) scaffolding under `client/storybook/` | M | 008 | Histoire boots; first stories: materials, motion primitives; doc page links from `AETHERIUM.md` |
| ELPIS-012 | **[done 2026-04-27]** `AETHERIUM.md` contributor guide | S | 002–008 | Documents tokens, materials, motion catalogue, do/don't examples; linked from CLAUDE.md |
| ELPIS-013 | Visual regression harness on key routes (Percy/Chromatic) | M | 002 | Baselines captured for `/`, `/characters`, `/calendar`, `/stories`, `/wiki/Test`; CI surfaces diffs per PR |

---

## EPIC 1 — Shell & Home
> *First visible upgrade. The "wow" landing.*
> Budget: +35 KB gzip (Three.js dynamic, tsparticles). Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-101 | **[done 2026-04-27]** `MainLayout` header → Aetherglass | M | 008 | Header uses `.mat-aetherglass`; inner gold rule visible; light-leak highlight present; existing menu behavior preserved |
| ELPIS-102 | Header nav menu drop animation (gold-rule draw + stagger fade) | M | 007, 101 | Open animation < 300 ms total; close < 200 ms; reduced-motion = instant; tested on all 4 menu groups |
| ELPIS-103 | Theme toggle → Crystal medallion + 480 ms hue-then-brightness cross-fade | M | 003, 007 | Toggle replaces button; medallion SVG; cycle Light → Dark → System preserved; no FOUC; commit telemetry preserved |
| ELPIS-104 | Left drawer Aetherglass + open-animation choreography | M | 008, 102 | Gold-rule draw 240 ms before items stagger-fade (35 ms × 8); `SiteSearchField` and `UserMenu` re-skinned; mini-state on mobile preserved |
| ELPIS-105 | **[done 2026-04-27]** Footer ornament (triskelion divider + Vellum/Obsidian surface) | S | 008 | Divider SVG above existing footer content; legal links unchanged; both themes verified |
| ELPIS-106 | **[done 2026-04-27]** Custom corner-flourish SVG sprite | S | 002 | 5 sizes; reusable via `<GlyphCorner :size="…">`; documented in Storybook |
| ELPIS-107 | Three.js dynamic-import scaffold | M | – | Dynamic-import wrapper; loads only on `/` and `/login`; tree-shaken; verified network waterfall |
| ELPIS-108 | Home hero — Crystal of Light WebGL component | XL → split | 107 | **Split:** -A geometry & material, -B rotation & lighting, -C performance gating (low-power → static SVG fallback) |
| ELPIS-108-A | Crystal-of-Light geometry & material | M | 107 | ~3000-vertex faceted crystal; PBR refractive material; renders at 60 fps on M1, 30 fps on integrated GPU |
| ELPIS-108-B | Crystal slow rotation + ambient bloom | S | 108-A | One full rotation every 30 s; bloom ramps with hover on hero CTA |
| ELPIS-108-C | Low-power / mobile fallback (static SVG crystal) | S | 108-B | Detects battery saver / `prefers-reduced-motion` / mobile UA; swaps to SVG with no layout shift |
| ELPIS-109 | tsparticles aether-mote field on hero | M | 002 | 12 motes max, 3 parallax layers, 0.4 vw/s drift, recolors with theme; lazy-loaded |
| ELPIS-110 | **[done 2026-04-29]** Home activity grid — diagonal-wave reveal on scroll | M | 007 | Cards reveal top-left → bottom-right with 60 ms stagger; `IntersectionObserver`; runs once per session |
| ELPIS-111 | **[done 2026-04-27]** Activity-grid card → Vellum + hairline gold rule + hover lift | M | 008 | Existing card layout preserved; hover Y −4 px, shadow elevation 1→2, rule alpha 0.28→0.6 |
| ELPIS-112 | Welcome card (logged-in hero variant) — gradient + Crystal accent | S | 108 | Avatar gets aether ring; greeting in Spectral; Crystal medallion in upper-right |
| ELPIS-113 | Login post-callback Crystal-bloom transition (720 ms) | M | 103, 108 | Bloom expands from avatar position; particles disperse; redirect happens after animation; reduced-motion = instant redirect |

---

## EPIC 2 — Character Domain
> *Showpiece for the platform's core feature.*
> Budget: +5 KB gzip. Sprints: 2.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-201 | **[done 2026-04-27]** `Character.vue` shell — drawer Aetherglass + content Vellum | M | 008 | Drawer + content surfaces re-skinned; mini-state hover behavior preserved; section icons unchanged |
| ELPIS-202 | **[done 2026-04-27]** Avatar → job-frame stamped square treatment | M | 106 | Reusable `<AetheryteBadge>` primitive; used on `Character.vue` header, member grids, sidebar UserMenu |
| ELPIS-203 | **[done 2026-04-27]** `CharacterProfile` body → Parchment + glyph divider | M | 008 | Background prose section gets parchment surface, ruled lines, glyph divider above first heading |
| ELPIS-204 | **[done 2026-04-27]** Character header typography pass | S | 006 | h2 name in Cinzel 49 px; nickname in IM Fell italic; subtitle in Spectral |
| ELPIS-205 | **[done 2026-04-27]** `CharacterDetailsBox` rows — refined hover state | S | 002 | Detail rows get a subtle gold-rule on hover (alpha 0 → 0.4 over 160 ms); mobile column-layout preserved |
| ELPIS-206 | **[done 2026-04-27]** `CharacterAppearance` color picker → Crystal facet swatches | M | 008 | 20×20 swatches use `.mat-crystal`; popup proxy gets prism gradient sweep on open; existing color validation logic untouched |
| ELPIS-207 | **[done 2026-04-27]** `CharacterPersonality` / `CharacterContacts` re-skin | S | 203 | Section h6 → Cinzel; readonly inputs → Vellum; wikilink hint becomes ?-popover (see ELPIS-209) |
| ELPIS-208 | **[done 2026-04-27]** `CharacterDiary` cards — Parchment + Cinzel titles + IM Fell excerpts | M | 008 | Card list gets parchment treatment; hover lift; type badge re-skinned |
| ELPIS-209 | **[done 2026-05-04]** Wikilink discoverability — `?` popover with animated example (audit §27.8) | M | 007 | Replaces caption-only hint; small `?` icon next to inputs that accept wikilinks; popover demos `[[Name]]` typed character-by-character |
| ELPIS-210 | **[done 2026-04-27]** `CharacterRumors` — Parchment + ruled visibility tiers | M | 008 | Three sections (Offen, Häufig, Selten) get distinct Parchment variants with subtle rule weight differences |
| ELPIS-211 | **[done 2026-05-04]** `CharacterPenAndPaper` — Parchment cards with journal-page reveal | L | 007, 008 | 5 cards reveal in sequence (turning-page motion); ornamental corners; section stays accessible with reduced-motion |
| ELPIS-212 | **[done 2026-05-04]** Pen & Paper dice oracle — Crystal facet + rune flash | M | 007 | Dice button re-skinned to crystal; result panel gets soft rune flash on land; W100 interpretation text styled |
| ELPIS-213 | **[done 2026-04-27]** Fix Inventory preview using `CharacterRumors` (audit §27.4 / §27.5) | M | – | New `CharacterInventory.vue` view component; `EditCharacterInventory` preview wired to it; rumor reuse removed |
| ELPIS-214 | **[done 2026-04-27]** Fix module-scoped `isDirty` (audit §27.3) | M | – | Each character editor instance owns its `isDirty` ref; concurrent edits in tabs no longer cross-contaminate; regression test added |
| ELPIS-215 | **[done 2026-04-27]** `SwitchCharacterDialog` — ornamental treatment | S | 008 | Aetherglass dialog (elevation/3); corner flourishes; character list rows get hover gold-rule |
| ELPIS-216 | **[done 2026-04-27]** `CharacterFinderField` — registration-status banners restyled | S | 003 | Three states (claimed / already / renamed) use semantic surfaces; renamed banner gets Hydaelyn pearl + violet rule |
| ELPIS-217 | **[done 2026-04-27]** `RefreshCharacterDialog` + `WikiImportDialog` — dialog ornamentation | S | 008 | Both use elevation/3 Aetherglass; corner flourishes draw in 180 ms on open |
| ELPIS-218 | **[done 2026-04-27]** Edit/Preview toggle — re-skin to Crystal-faceted segmented control | S | 008 | Used across all 7 character editors; toggle slide animation 220 ms `ease-elpis` |
| ELPIS-219 | **[done 2026-05-04]** Save confirmation pulse + 7-mote particle burst | M | 007 | Save button pulses 1.0 → 1.04 → 1.0 (240 ms `ease-aether`); 7 motes radiate 80 px and dissipate (600 ms); reduced-motion = no animation, just toast |
| ELPIS-220 | **[done 2026-04-29]** Form error shake + delayed danger-color (replace instant flip) | S | 007 | 3 px ± shake over 160 ms; border color transitions to danger token *after* shake; applied via `useMotion` mixin to `q-input` wrapper |
| ELPIS-221 | **[done 2026-04-27]** Revert confirmation dialog — ornamental treatment | XS | 217 | Existing copy preserved; dialog uses elevation/3 Aetherglass |

---

## EPIC 3 — Events & Calendar
> *Most motion-rich domain.*
> Budget: +5 KB gzip. Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-301 | **[done 2026-04-27]** `EventCalendar` — day cells → Vellum, header → Aetherglass | M | 008 | `q-calendar-month` re-skinned via slot overrides; layout unchanged |
| ELPIS-302 | **[done 2026-04-27]** "Today" cell — Aetheryte motif background | S | 106 | Static SVG behind day number; works in both themes |
| ELPIS-303 | **[done 2026-04-29]** Event icon hover lift in calendar cells | XS | 007 | Hover Y −2 px + shadow grow; tooltip behavior preserved |
| ELPIS-304 | **[done 2026-04-27]** Calendar view-toggle (Kalender / Liste) — segmented control restyle | S | 218 | Reuses Crystal-faceted toggle from ELPIS-218 |
| ELPIS-305 | **[done 2026-04-27]** `Event.vue` hero — Aetherglass header + 50×50 icon refinement | M | 008 | Banner unchanged; icon gets stronger gold ring + soft inner shadow; subtitle in Spectral |
| ELPIS-306 | **[done 2026-04-27]** Event meta grid — refined typography (uppercase labels, tabular numerals) | S | 006 | Labels in Inter 500 with `letter-spacing: 0.06em`; values in Spectral 500 |
| ELPIS-307 | **[done 2026-04-27]** `CalendarSidebarWidget` — Aetherglass card + Crystal divider | M | 008 | Header divider SVG; collapse toggle preserved; idle pulse on icon when collapsed (4 s) |
| ELPIS-308 | **[done 2026-04-29]** `CalendarSidebarWidget` expand/collapse — refined transition | S | 007 | `q-slide-transition` replaced with custom motion; 280 ms `ease-elpis`; preserves recent fix from commits `4f0965b`, `bb9c4f2` |
| ELPIS-309 | **[done 2026-04-29]** `EventItem` (sidebar) — hover/expand polish | S | 007 | Card lift on hover; expanded state fades meta block in (140 ms offset 80 ms after card lift) |
| ELPIS-310 | **[done 2026-04-27]** `EditEvent.vue` stepper — prism rule under steps | M | 002 | Active step has prism gradient bar beneath; transitions slide horizontally between steps |
| ELPIS-311 | **[done 2026-04-27]** Stepper "completed" state — Crystal facet replacing checkmark | S | 008 | Custom step icon component; reduced-motion = static facet SVG |
| ELPIS-312 | **[done 2026-04-27]** Event-type radio group — re-skin to ornamental tile selector | M | 008 | 6 event types as Vellum tiles with icons; selected state gets gold rule + glow |

---

## EPIC 4 — Venues / Communities / Free Companies
> *High-volume directory pages.*
> Budget: +0 KB gzip (reuses Phase 1 primitives). Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-401 | **[done 2026-04-27]** `Venues.vue` directory cards → Vellum (reuse `VenueList` slot) | S | 111 | Same card pattern as home activity grid |
| ELPIS-402 | **[done 2026-04-27]** `Communities.vue` directory cards → Vellum | XS | 401 | Visual parity with venues directory |
| ELPIS-403 | **[done 2026-04-27]** `FreeCompanies.vue` directory cards → Vellum | XS | 401 | Visual parity |
| ELPIS-404 | **[done 2026-04-27]** Directory toolbar — refined search/filter dropdowns | S | 003 | `q-input` and `q-select` get Aetherglass focus state; tabular numerals on count display |
| ELPIS-405 | **[done 2026-04-27]** Pagination input — re-skin | XS | 003 | Page-jump input gets gold focus ring; chevrons re-styled |
| ELPIS-406 | **[done 2026-04-27]** `Venue.vue` section drawer — Aetheryte "active" indicator | M | 008, 106 | Active section gets aetheryte glyph instead of plain highlight; smooth transition between sections |
| ELPIS-407 | **[done 2026-04-27]** Venue overview page — ornamental hero treatment | M | 008, 106 | Venue name in Cinzel 39 px; corner flourishes on overview card |
| ELPIS-408 | **[done 2026-04-27]** `VenueProfile` description → Parchment | S | 008 | Description block on parchment surface |
| ELPIS-409 | **[done 2026-04-27]** `CommunityProfile` description → Parchment | XS | 408 | Visual parity |
| ELPIS-410 | **[done 2026-04-27]** `FreeCompany.vue` member grid — job-frame avatars | S | 202 | Reuses `<AetheryteBadge>` |
| ELPIS-411 | **[done 2026-04-27]** Membership status banners — refined surfaces | S | 003 | "Anfrage gesendet" / "abgelehnt" / "Mitglied" banners use semantic surfaces with appropriate ornament |

---

## EPIC 5 — Long-form: Stories / Wiki / Noticeboard
> *Where the parchment treatment shines.*
> Budget: +0 KB gzip. Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-501 | **[done 2026-04-27]** `Story.vue` body → Parchment full-bleed | M | 008 | Story content area is parchment; 1 KB SVG noise overlay; ruled lines optional |
| ELPIS-502 | **[done 2026-04-27]** Story drop cap (Cinzel Eorzea, illuminated) | S | 006 | First letter of story body styled; only on stories ≥ 200 words; mobile size adjusted |
| ELPIS-503 | **[done 2026-04-29]** Scroll-progress rule (gold gradient, 0%→100%) | M | 007 | Thin rule along top of `.story__content`; smooth, throttled, accessible (uses `progress` semantics) |
| ELPIS-504 | **[done 2026-05-04]** Page-turn transition between stories of a series | M | 007 | Series-next click animates left fold-out (380 ms); single article = no animation |
| ELPIS-505 | **[done 2026-04-27]** `Stories.vue` directory cards (Quasar grid) — Vellum + type badge restyle | S | 111 | Card pattern aligned with home activity grid |
| ELPIS-506 | **[done 2026-04-27]** `Wiki.vue` body → Parchment + Cinzel h2 | M | 501 | Visual parity with story view; wikilinks distinct from external links |
| ELPIS-507 | **[done 2026-04-27]** Illuminated initial on Wiki h1 | S | 502 | Optional, opt-out per page; first heading gets larger drop cap |
| ELPIS-508 | **[done 2026-04-29]** Wikilink hover — underline draw + soft glow ring | S | 007 | Underline draws via `text-decoration-thickness` over 180 ms; ring is `box-shadow` glow |
| ELPIS-509 | **[done 2026-04-27]** `WikiPageView` — last-updated timestamp + edit-permission badge | XS | 003 | Subtle metadata footer with relative time and permission chip |
| ELPIS-510 | **[done 2026-04-27]** `Noticeboard.vue` cards → Vellum + type/location chips restyled | S | 111 | Type chips get color coding (Stellenangebot, Stellengesuche, Suche, Biete) |
| ELPIS-511 | **[done 2026-04-27]** `NoticeboardItem.vue` — ornamental treatment + Discord embed preview re-skin | M | 008 | Item view on parchment; Discord embed preview gets actual Discord-style frame |

---

## EPIC 6 — Editors, Gallery, Upload
> *Where users do work — restraint required.*
> Budget: +5 KB gzip (Lottie). Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-601 | **[done 2026-04-27]** `HtmlEditor` (TinyMCE) — gold-rule frame around toolbar + editor | M | 002 | Custom skin overlay on TinyMCE; existing button set unchanged; colors match Aetherium tokens |
| ELPIS-602 | **[done 2026-04-27]** TinyMCE active-button state — aether glow | S | 003 | Active toolbar buttons (bold, italic etc. when applied) gain a soft `--glow-aether` ring |
| ELPIS-603 | **[done 2026-04-28]** `BannerEditSection` crop tool — refined handles + grid overlay | M | 002 | Crop handles use crystal facets; rule-of-thirds grid in soft gold; reset works |
| ELPIS-604 | **[done 2026-04-29]** `UploadDialog` — Aetherglass dialog + step transitions | M | 008, 310 | 4-step (or 5-step banner mode) wizard; horizontal slides between steps; prism rule under stepper |
| ELPIS-605 | **[done 2026-04-28]** `StepSelectImage` drag-drop overlay — aether-glow border on dragover | S | 003 | Border lights up on dragenter; aspect-ratio validation kept |
| ELPIS-606 | **[done 2026-04-28]** `StepBannerCrop` — reuse refined crop handles from ELPIS-603 | XS | 603 | Same handle component |
| ELPIS-607 | `StepThumbnail` — visual feedback during thumbnail generation | S | – | Lottie loader plays during thumbnail render; replaces blank state |
| ELPIS-608 | **[done 2026-04-27]** `StepImageDetails` — form refinements (no layout change) | S | 002 | Inputs use refined Aetherium styling |
| ELPIS-609 | Lottie aetheryte loader (>1.5 s loads) | M | 005 | Slow rotating crystal silhouette + 3 concentric pulses; replaces `q-inner-loading` on long ops |
| ELPIS-610 | **[done 2026-04-29]** `ImageSlidesDialog` lightbox — refined nav buttons + transitions | M | 007 | Prev/next buttons get crystal styling; image swap = 220 ms cross-fade |
| ELPIS-611 | **[done 2026-04-27]** `ConfirmImageDeleteDialog` — danger surface treatment | S | 003 | Uses elevation/3 Aetherglass with red-shifted border; warning icon |
| ELPIS-612 | **[done 2026-04-29]** `ThumbGallery` hover lift + soft caption fade | S | 007 | Hover lifts 4 px and reveals image title in lower-third caption (140 ms fade) |

---

## EPIC 7 — News App (The Harborwatch)
> *Distinct masthead, parchment articles.*
> Budget: +0 KB gzip. Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-701 | **[done 2026-04-28]** News app — replace placeholder masthead text (audit §27.1) | S | – | Title / region / price become config-driven (env or API); no placeholder strings ship |
| ELPIS-702 | **[done 2026-04-28]** News masthead — Cinzel display + Crystal medallion + ornament | M | 008, 106 | Triple horizontal rules redrawn; first-paint draws in over 480 ms; mobile collapses gracefully |
| ELPIS-703 | **[done 2026-04-28]** News app — adopt Aetherium tokens (parallel `news/src/css/aetherium/`) | M | 002 | Token files mirrored to news app; news-specific overrides documented |
| ELPIS-704 | **[done 2026-04-28]** `ArticleView` body → Parchment + drop cap + IM Fell italic subtitle | M | 501, 502 | Article reads as printed page; column rules preserved |
| ELPIS-705 | **[done 2026-04-29]** News scroll-progress rule | XS | 503 | Reused composable from main client |
| ELPIS-706 | **[done 2026-04-28]** News article navigation — quill divider between articles in `Index.vue` | XS | 106 | Reuses ornament sprite |
| ELPIS-707 | **[done 2026-04-28]** `UserNavigation` (left sidebar) — Aetherglass + icon-only with tooltips | M | 008 | Existing icon set kept; tooltips show on hover; mobile fallback (audit §22.10) — collapses to header dropdown below 1024 px |
| ELPIS-708 | **[done 2026-04-28]** `IssueNavigation` (right sidebar) — Aetherglass + ornament | S | 707 | Issue list gets parchment-strip styling; selected issue gets gold rule |
| ELPIS-709 | **[done 2026-04-28]** `EditArticle` — Bearbeitung/Vorschau toggle restyle | XS | 218 | Reuses Crystal-faceted segmented control |
| ELPIS-710 | **[done 2026-04-28]** `MyArticles` — add status filter chips (audit §27.9) | M | 003 | Filter chips: All / Entwurf / Eingereicht / Veröffentlicht; persists per session |
| ELPIS-711 | `LogIn.vue` — Crystal hero treatment | M | 108-A | Smaller crystal than home; Discord button gets brand styling consistent with main client |

---

## EPIC 8 — Polish, Audio, QA
> *The final 10%.*
> Budget: +25 KB gzip (Howler.js, optional). Sprint: 1.

| ID | Title | Size | Deps | AC |
|---|---|---|---|---|
| ELPIS-801 | Audio kit infrastructure — Howler.js, opt-in toggle in user prefs | M | – | Default OFF; preference persisted in store + localStorage; lazy-loaded; never autoplays on first paint |
| ELPIS-802 | Audio assets — record/license `confirm`, `error`, `nav`, `levelup` | M | 801 | OGG + MP3 fallbacks; –24 LUFS normalized; total ≤ 100 KB |
| ELPIS-803 | Wire confirm sound to save actions | XS | 801, 802 | All character/event/venue saves trigger sound (when enabled) |
| ELPIS-804 | Wire error sound to form errors | XS | 801, 802 | Validation errors trigger soft thud |
| ELPIS-805 | Wire nav sound to Story / Wiki / Diary navigation | XS | 801, 802 | Page-turn rustle on enter; not on initial load |
| ELPIS-806 | Wire `levelup` sound to first character verification | XS | 801, 802 | Plays once after `Verify.vue` success; flagged in store |
| ELPIS-807 | **[done 2026-04-29]** Reduced-motion full audit — every animation reviewed | L | all motion tickets | Spreadsheet of all animations; each has confirmed reduced-motion fallback; OS-flag manual test passes site-wide |
| ELPIS-808 | Performance pass — CLS, LCP, INP budgets | L | all visual tickets | LCP ≤ 2.5 s on Slow 4G; CLS ≤ 0.05; INP ≤ 200 ms p75 on `/`, `/character/...`, `/calendar`, `/story/...` |
| ELPIS-809 | **[done 2026-04-29]** Cross-browser verification — Safari `backdrop-filter` fallbacks | M | 008 | All Aetherglass surfaces have solid-color fallback; verified Safari 16+, Firefox latest, Edge latest |
| ELPIS-810 | **[done 2026-04-29]** High-DPI / retina ornaments | S | 106 | All SVG ornaments verified at 1x, 2x, 3x; no rasterization |
| ELPIS-811 | 5-second test with 3 internal testers | XS | all | Answers cluster around "FFXIV / Lodestone / fantasy journal / aetheryte" — never "generic CMS" |
| ELPIS-812 | Visual regression baselines refreshed for all phases | S | 013 | Baselines updated; 1-week monitoring period before declaring done |
| ELPIS-813 | Document all new components in Storybook | M | 011 | Every `<Aether*>` primitive has at least 3 stories (default, hover, dark mode) |

---

## Cross-cutting / regression fixes (already inlined)

| Audit § | Plan §27 item | Backlog ticket(s) |
|---|---|---|
| §27.1 | News masthead placeholder text | ELPIS-701 |
| §27.2 | TinyMCE API key hardcoded | ELPIS-010 |
| §27.3 | Module-scoped `isDirty` | ELPIS-214 |
| §27.4 / §27.5 | Inventory preview reuses CharacterRumors | ELPIS-213 |
| §27.6 | No auto-save | *Out of scope — separate effort tracked elsewhere* |
| §27.7 | No i18n framework | *Out of scope per plan §11* |
| §27.8 | Wikilink discoverability | ELPIS-209 |
| §27.9 | MyArticles status filter | ELPIS-710 |
| §27.10 | News mobile sidebars | ELPIS-707 |
| §27.11 | P&P duplicates other tabs' fields | *Design decision — not a code fix* |
| §27.12 | Test routes in production routes.ts | *Tracked separately as a routing audit* |
| §27.14 | Wiki Import sanitizer expansion | *Tracked in `WIKI_IMPORT_PLAN.md` Phase 1–5, parallel effort* |
| §27.15 | DSGVO outstanding work | Partially closed by ELPIS-001 (self-host fonts); rest tracked in `PRIVACY_COMPLIANCE_CHECKLIST.md` |
| §27.16 | Discord embed undocumented in FAQ | *Content task — tracked in CMS backlog* |
| §27.17 | News `LogIn.vue`, `Submitted.vue` opaque | ELPIS-711 covers LogIn; Submitted addressed indirectly via ELPIS-710 styling |

---

## Snapshot

- **Total tickets:** 89 (counting 108-A/B/C as 3)
- **Estimated effort:** ~38 dev-days at average S/M sizing
- **Critical path:** EPIC 0 → 1 → 8 (foundations + showpiece + polish)
- **Parallelizable:** EPIC 2 / 3 / 4 / 5 / 6 / 7 — once EPIC 0 lands, can run in any order or in parallel pairs
- **Bundle delta:** +95 KB gzip total (within plan's 90 KB target after Howler optionality)

---

## Definition of Done (per ticket)

1. ✅ AC met
2. ✅ Storybook story added/updated for any new primitive
3. ✅ Reduced-motion fallback verified manually
4. ✅ AA contrast verified (axe report attached to PR)
5. ✅ Visual regression baseline updated (or diff explicitly approved)
6. ✅ Bundle delta within phase budget (or explicit approval)
7. ✅ Reviewed by ≥1 design + ≥1 engineering reviewer
8. ✅ Light/dark/system theme tested
9. ✅ Tested at `xs`, `md`, `lg` breakpoints

## Definition of Done (per phase)

In addition to per-ticket DoD:

1. ✅ Phase Lighthouse score ≥ 85 on `/`
2. ✅ Phase visual regression baselines locked
3. ✅ Phase bundle delta documented in `AETHERIUM.md` changelog
4. ✅ One-week observation window with no rollback issues before next phase begins
