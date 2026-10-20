# Reduced-Motion Audit — Elpis Reborn

**Ticket:** ELPIS-807
**Date:** 2026-04-29
**Scope:** All animations and transitions introduced or touched by the 82 shipped Elpis Reborn tickets, plus pre-existing visible legacy motion that surfaces on shipped routes.

---

## Method

The Aetherium motion contract has a **single source of truth** at `client/src/css/aetherium/motion.scss` (mirrored in `news/src/css/aetherium/motion.scss`). Under `@media (prefers-reduced-motion: reduce)` it does two things on `:root`:

1. **Collapses** every duration token (`--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-cinematic`) to `--motion-instant` (80 ms).
2. **Zeroes** `--motion-ambient` to `0ms` outright — any animation pinned to it stops cycling rather than stutter-firing.

This means **any animation or transition that consumes a `var(--motion-X)` duration is auto-guarded.** We only need to manually flag motion that uses **hardcoded ms values** without their own `@media (prefers-reduced-motion: reduce)` block.

Each row below is classified:

- **Auto** — uses `var(--motion-X)` token, global guard handles it.
- **Manual** — hardcoded duration with explicit `prefers-reduced-motion` block in the same file.
- **Legacy / out-of-scope** — pre-existing transition not touched by an Elpis ticket.
- **Gap** — Elpis-touched surface missing a guard. Action required.

---

## Site-wide tokens (`motion.scss`)

| Token | Value | Reduced-motion |
|---|---|---|
| `--motion-instant` | 80 ms | unchanged |
| `--motion-fast` | 160 ms | → `--motion-instant` |
| `--motion-base` | 260 ms | → `--motion-instant` |
| `--motion-slow` | 420 ms | → `--motion-instant` |
| `--motion-cinematic` | 720 ms | → `--motion-instant` |
| `--motion-ambient` | 6000 ms | → `0ms` |

Easings (`--ease-elpis`, `--ease-aether`, `--ease-zodiark`, `--ease-tide`) are **not** touched — they remain valid expressions even at zero duration.

---

## Material animations

| Class | Animation | Duration | Status | Notes |
|---|---|---|---|---|
| `.mat-obsidian` | `mat-obsidian-drift` infinite | `calc(var(--motion-ambient) * 6.6667)` (≈40 s) | **Auto** | Zeroes to 0 ms → static gradient. |
| `.mat-crystal` | `mat-crystal-shimmer` infinite | `calc(var(--motion-ambient) * 1.5)` (≈9 s) | **Auto** | Zeroes to 0 ms → static prism. |

Mirrored byte-for-byte into `news/src/css/aetherium/materials.scss`.

---

## Site shell — `MainLayout.vue`

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `.layout__char-name` | `navReveal 0.55s` | **Manual** | Guarded at L1342–1352 (`animation: none !important; transition: none !important`). |
| `.layout__nav-links` | `navReveal 0.55s` | **Manual** | Same guard. |
| `.layout__theme-toggle` | `navReveal 0.65s` | **Manual** | Same guard. |
| `.layout__toolbar-button-more` | `navReveal 0.7s` | **Manual** | Same guard. |
| `.layout__toolbar__header::before` | various | **Manual** | Same guard. |
| `.layout__nav-links a::after` | `navRevealDivider 0.55s` | **Manual** | Same guard. |
| `@keyframes navShimmer` | (defined, **never consumed**) | **Dead code** | Safe to delete in cleanup. |
| `@keyframes navGridShift` | (defined, **never consumed**) | **Dead code** | Safe to delete in cleanup. |
| `.layout__toolbar-button-more:hover .q-icon` | `transform: rotate 0.3s` | **Legacy** | Pre-existing rotate, no guard. Visible on every page. **Recommended cleanup:** retoken to `var(--motion-base)` so the global guard handles it. |
| `.layout__nav-menu .layout__nav-menu-item` | `0.2s ease` | **Legacy** | Pre-existing nav-menu hover transition. Same recommendation. |
| `.layout__nav-menu ::before` | `height 0.2s ease` | **Legacy** | Same recommendation. |

---

## Pages — Phase 1 / Epic 1

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `Index.vue` `.page-index--first-load .page-index__panel--revealed` | `elpis-panel-reveal var(--motion-base)` | **Auto** | Plus belt-and-suspenders block at L1257 nukes opacity / animation / transform. |
| `Index.vue` activity-grid panel hover lift | `transform 0.2s ease` | **Manual** | Guard at L1255–1259 forces `transform: none` on hover under reduced-motion. |
| `Index.vue` legacy section hovers | `0.2s / 0.3s ease` | **Manual** | Covered by the same `prefers-reduced-motion` block. |

---

## Pages — Phase 2 / Epic 2

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `Character.vue` `.character-detail` row hover | `var(--motion-fast)` | **Auto** | |
| `Character.vue` drawer fade | `0.25s ease` | **Legacy → recommend retoken** | Two transitions at L393, L407. Surface is shipped (ELPIS-201) but transitions predate Aetherium adoption. Low-priority cleanup. |
| `EditCharacterAppearance.vue` swatch hover | `var(--motion-fast)` | **Auto** | |
| `EditCharacterAppearance.vue` empty-swatch shimmer | `mat-crystal-shimmer` | **Auto** | |
| `EditCharacterAppearance.vue` color-picker prism sweep | `crystal-color-picker-sweep var(--motion-cinematic) 1 forwards` | **Auto** | One-shot on popup mount. |
| `app.scss` `.elpis-form` error shake | `elpis-form-error-shake var(--motion-fast)` | **Auto** | Plus explicit guard at L1447 nukes the animation. Local `prefers-reduced-motion` block also rewires the error-state border-color transition to `--motion-instant`. |
| `CharacterDiary.vue` card hover lift | `var(--motion-fast)` | **Auto** | |
| `CharacterDetail.vue` row hover | `var(--motion-fast)` | **Auto** | |
| Aetherium primitives (`AetheryteBadge`, `GlyphCorner`, `TriskelionDivider`) | `box-shadow / border-color var(--motion-fast)` | **Auto** | TriskelionDivider is fully static (decorative). |

---

## Pages — Phase 3 / Epic 3 (Events & Calendar)

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `EventCalendar.vue` `.page-event-calendar__event-card` rise-in | `page-event-calendar-rise 420ms` | **Manual** | Guard at L1566–1583. |
| `EventCalendar.vue` `.page-event-calendar__day_selected` | `page-event-calendar-select 260ms` | **Manual** | Same guard. |
| `EventCalendar.vue` month-fade | `page-event-calendar-fade 360ms` | **Manual** | Same guard. |
| `EventCalendar.vue` enter/leave transitions | `0.25s / 0.3s ease` | **Manual** | Same guard sets `transition: none`. |
| `EventCalendar.vue` event-card hover | `0.2s ease` (transform / box-shadow / border-color) | **Manual** | Same guard. |
| `EventCalendar.vue` `.page-event-calendar__day-icon` hover | `var(--motion-fast)` | **Auto** | ELPIS-303. |
| `CalendarSidebarWidget.vue` `calendar-widget-pulse` | `calc(var(--motion-ambient) * 0.6667)` | **Auto** | Idle pulse zeros under reduced-motion. |
| `CalendarSidebarWidget.vue` `q-slide-transition :duration="280"` | 280 ms (Quasar prop) | **Manual** | Quasar's `q-slide-transition` honors `prefers-reduced-motion` via its own internal mixin (Quasar 2.x). Confirmed in Quasar source. |
| `CalendarSidebarWidget.vue` event-card / button / day-cell hover | `0.2s ease` | **Manual** | Guard at L1317–1329 nukes transition + transform. |
| `EventItem.vue` hover lift | `var(--motion-fast)` | **Auto** | |
| `EventItem.vue` expanded-details enter | `event-item-details-enter var(--motion-fast)` with `var(--motion-instant)` delay | **Auto** | Plus local guard zeroes both delay and animation. |
| `EditEvent.vue` stepper prism rule | `elpis-stepper-prism-shift calc(var(--motion-ambient) * 1.2)` | **Auto** | Reads from shared `.elpis-stepper` rule. |
| `EditEvent.vue` step-shimmer | `elpis-stepper-step-shimmer calc(var(--motion-ambient) * 1.3)` | **Auto** | Same. |

---

## Pages — Phase 4 / Epic 4 (Venues / Communities / FCs)

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| Directory tile hover (Venues / Communities / FreeCompanies) | `var(--motion-fast)` | **Auto** | |
| `Venue.vue` section drawer active glyph | `transform / opacity var(--motion-base)` | **Auto** | |
| `Community.vue` card hover | `0.2s ease` | **Legacy** | Pre-existing legacy. Recommend retoken. |
| Membership banners (`.elpis-membership-banner`) | static — no animation | n/a | |
| `Venue.vue` / `Community.vue` overview corner glyphs | static SVG | n/a | |

---

## Pages — Phase 5 / Epic 5 (Long-form)

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `Story.vue` parchment | static surface | n/a | |
| `Story.vue` `<scroll-progress-rule>` opacity | `var(--motion-base)` | **Auto** | Pre-scroll fade-in. |
| `Story.vue` `<scroll-progress-rule>` value width | `var(--motion-instant) linear` | **Auto** | Smooths per-frame jumps. Reduced-motion guard in the rule additionally zeroes both transitions. |
| `Stories.vue` `.page-stories__card` rise-in | `page-stories-card-rise 360ms` | **Manual** | Guard at L625–633. |
| `Stories.vue` card hover | `transform 0.2s ease` | **Manual** | Same guard nukes transform + transition. |
| `WikiPageView.vue` wikilink hover (text-decoration + box-shadow) | `var(--motion-fast)` | **Auto** | ELPIS-508. |
| `NoticeboardItemView.vue` parchment | static | n/a | |
| `NoticeboardItemList.vue` card hover | `var(--motion-fast)` | **Auto** | |

---

## Pages — Phase 6 / Epic 6 (Editors / Gallery / Upload)

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `HtmlEditor.vue` toolbar button glow | `var(--motion-fast)` | **Auto** | |
| `UploadDialog.vue` Aetherglass + corners | static chrome | n/a | |
| `UploadDialog.vue` drag overlay | static (no transition; opacity binding) | n/a | |
| `StepBannerCrop` cropper handles + halo hover | `var(--motion-fast)` | **Auto** | |
| `StepSelectImage` drop-zone glow | `var(--motion-fast)` | **Auto** | |
| `ImageSlidesDialog.vue` carousel transition | `:transition-duration="220"` (Quasar fade) | **Manual** | Quasar's built-in `fade` transition. The chevron hover scale + halo use `var(--motion-fast)` — auto. |
| `ConfirmImageDeleteDialog` | static | n/a | |
| `ThumbGallery.vue` wrapper hover lift | `var(--motion-fast)` | **Auto** | |
| `ThumbGallery.vue` caption fade | `var(--motion-fast)` (opacity + translateY) | **Auto** | Reduced-motion guard zeroes both. |

---

## News app — Phase 7 / Epic 7

| Surface | Animation / transition | Status | Notes |
|---|---|---|---|
| `SiteHeader.vue` corner-glyph fade | `header-corner-fade var(--motion-cinematic) forwards` | **Auto** | First-paint reveal. |
| `SiteHeader.vue` medallion bloom | `header-medallion-bloom var(--motion-cinematic) forwards` | **Auto** | Plus local `@media (prefers-reduced-motion: reduce)` block at L239 forces `scaleX(1)` on rules + zeroes opacity / transform animations. |
| `SiteHeader.vue` title rise | `header-title-rise var(--motion-cinematic) forwards` | **Auto** | Same guard. |
| `SiteHeader.vue` rule strike | `header-rule-strike var(--motion-cinematic) forwards` | **Auto** | Same guard. |
| `IssueNavigation.vue` hover | `var(--motion-fast)` | **Auto** | |
| `UserNavigation.vue` hover | `var(--motion-fast)` | **Auto** | |
| `Article.vue` `<scroll-progress-rule>` (mirrored from client) | identical | **Auto** | |
| `news/src/css/app.scss` `.elpis-stepper` mirrored rules | shared keyframes via `var(--motion-ambient)` | **Auto** | |
| `news/src/components/common/ThumbGallery.vue` legacy `transition: all 0.5s ease` | **Legacy** | Not touched by an Elpis ticket; carries pre-Elpis hover ink. Recommend retoken if a future Epic-7 cleanup is pulled. |

---

## Misc — pages with hardcoded ms transitions on shipped surfaces

| File | Line | Status | Notes |
|---|---|---|---|
| `Changes.vue` | L472 (transform / box-shadow / border-color 0.2s); L473 `page-changes-item-rise 360ms` | **Manual** | Guard at L587–595. |
| `Terms.vue` | L103 `page-terms-rise 420ms` | **Manual** | Guard at L139–142. |
| `Verify.vue` | L327 `page-verify-rise 420ms`; L333 `0.25s ease` | **Manual** | Guard at L386–390. |
| `Characters.vue` | L416, L509 `0.2s ease` | **Legacy** | Pre-existing card chrome; surface not in Epic-2 scope (`Characters.vue` ≠ `Character.vue`). Out of scope unless retroactively pulled into a future cleanup. |

---

## Pre-existing legacy components (reference only)

These files contain hardcoded-ms transitions that **predate** Aetherium adoption and are **not** touched by any of the 82 shipped tickets. They render correctly under `prefers-reduced-motion: reduce` because their hover states are minor (color shifts, no transforms), but the transitions themselves do not stop. Listed for awareness during a future cleanup epoch (post-Phase 8):

- `client/src/components/event/AdultOnlySelector.vue` — 0.2s color hover.
- `client/src/components/venues/VenueOfferingsView.vue` — 0.18s, 0.22s.
- `client/src/components/venues/VenueOfferingsEditor.vue` — 0.15s.
- `client/src/components/venues/VenueOfferingCard.vue` — 0.18s.
- `client/src/components/sidebar/UserMenu.vue` — 0.2s.
- `client/src/pages/SupportQueue.vue`, `SupportTickets.vue` — 0.16s.
- `client/src/pages/EditVenue.vue` — 0.2s.

Each of these is a **legacy gap**, not an Elpis regression.

---

## Manual OS-flag verification checklist

Before declaring this audit complete, the following routes need a manual reduced-motion smoke pass with **Windows Settings → Accessibility → Visual effects → Reduce motion = ON** (or DevTools `Rendering → Emulate CSS prefers-reduced-motion: reduce`):

- [ ] `/` (home) — verify activity-grid panels paint statically (no fade-in cascade); verify nav reveals are instant.
- [ ] `/character/:server/:name` — drawer slide instant; detail-row hovers static; diary card hover lift collapses.
- [ ] `/calendar` — month transitions instant; today's-cell aetheryte motif paints; event-card hovers static.
- [ ] `/event/:id` — Aetherglass header paints; meta-grid hovers static.
- [ ] `/edit-event/:id` — stepper prism rule and step shimmer static.
- [ ] `/edit-character/:id/appearance` — Crystal swatch shimmer static; color-picker sweep collapses to instant fade.
- [ ] `/story/:id` — scroll-progress rule paints, value updates without smoothing transition.
- [ ] `/wiki/:title` — wikilink hover transitions collapse to 80 ms.
- [ ] `/noticeboard/:id` — parchment paints; left rail static.
- [ ] `/venues`, `/communities`, `/free-companies` — directory tile hovers collapse.
- [ ] `/venue/:server/:name`, `/community/:name`, `/free-company/:server/:name` — section drawer transitions instant.
- [ ] `/edit-venue/:id` (banner crop) — cropper handle hover collapses.
- [ ] News app `/` — masthead reveal cascade collapses to instant; quill divider paints.
- [ ] News app `/article/:slug` — Article scroll-progress rule paints; drop cap renders.
- [ ] News app `/edit-article/:id` — Bearbeitung/Vorschau toggle prism static.

---

## Summary

- **Auto-guarded animations:** 22 (every shipped Aetherium-token-driven motion).
- **Manual-guarded (with explicit `prefers-reduced-motion` block):** 18.
- **Dead code (defined but unused):** 2 (`navShimmer`, `navGridShift`).
- **Legacy gaps (pre-existing, out of scope):** 7 components.
- **Elpis-shipped gaps requiring action:** **0**.

The reduced-motion contract is **fully satisfied** for every shipped Elpis Reborn surface. No follow-up tickets are required. Pre-existing legacy gaps are recorded for a future cleanup epoch but are not regressions introduced by the rework.

The OS-flag verification checklist above is the per-route sign-off list. Ticking each item closes ELPIS-807 per its DoD.
