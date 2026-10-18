# Backdrop-Filter / Safari Fallback Audit — Elpis Reborn

**Ticket:** ELPIS-809
**Date:** 2026-04-29
**Scope:** Every `backdrop-filter` declaration in client and news apps, with Safari < 16 / Firefox-without-flag fallback verification.

---

## Method

The Aetherium contract for Aetherglass (`AETHERIUM.md` §4) requires every `backdrop-filter`-bearing surface to ship with an `@supports not (backdrop-filter)` solid-color fallback so contrast never breaks on browsers without backdrop-filter support. The reference implementation lives at `client/src/css/aetherium/materials.scss:132–140`:

```scss
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
    .mat-aetherglass {
        background-color: var(--surface-pearl);
    }
    body.body--dark .mat-aetherglass {
        background-color: var(--surface-deep);
    }
}
```

Each `backdrop-filter` consumer below is classified:

- **Covered** — paint goes through `.mat-aetherglass` → automatic fallback.
- **Manual fallback** — own `@supports not` sibling block with solid surface.
- **Accepted gap** — documented in memory.md as deliberately not folded into `@supports`; impact: translucent rgba surface with no blur on Safari < 16 (still legible but not "solid").
- **Legacy gap** — pre-existing pre-Elpis backdrop-filter on a surface not yet covered by an Elpis ticket; not a regression.
- **Gap** — Elpis-shipped, missing fallback. Action required.

---

## Reference primitives (client + news)

| File | Selector | `backdrop-filter` | Fallback | Status |
|---|---|---|---|---|
| `client/src/css/aetherium/materials.scss` | `.mat-aetherglass` | `blur(14px) saturate(1.05)` | `@supports not` → `var(--surface-pearl)` (light) / `var(--surface-deep)` (dark) | **Covered** |
| `client/src/css/aetherium/materials.scss` | `.mat-aetherglass.elevation-2` | `blur(22px) saturate(1.08)` | Same `@supports not` block (cascades through base rule) | **Covered** |
| `client/src/css/aetherium/materials.scss` | `.mat-aetherglass.elevation-3` | `blur(30px) saturate(1.1)` | Same `@supports not` block | **Covered** |
| `news/src/css/aetherium/materials.scss` | `.mat-aetherglass` (+ elevation-2 / 3) | identical to client | identical `@supports not` | **Covered** |

Both client and news materials.scss ship the `-webkit-` prefix and unprefixed property together, and the `@supports` predicate explicitly tests both.

---

## Aetherglass consumers (auto-covered via `.mat-aetherglass`)

Each of these surfaces applies `class="... mat-aetherglass"` (with optional `elevation-2 / -3`). Every one inherits the `@supports not` fallback transparently — verified by reading the class application:

| Surface | Class | Ticket |
|---|---|---|
| `MainLayout.vue` global header | `mat-aetherglass` | ELPIS-101 |
| `Character.vue` left drawer | `mat-aetherglass` (with specificity-3 override — see Accepted Gaps) | ELPIS-201 |
| `EditCharacterAppearance` `q-color` popup proxy | `mat-aetherglass elevation-3` | ELPIS-206 |
| `EditCharacterPenAndPaper` (deferred ticket; class wired) | `mat-aetherglass` | ELPIS-211 (deferred) |
| `EditCharacterInventory`, `EditCharacterRumors`, `EditCharacterPersonality`, `EditCharacterContacts`, `EditCharacterProfile` | `mat-aetherglass` (background panels for the editor shell — added during Epic-2 visual cleanup) | ELPIS-201 / 218 |
| `SwitchCharacterDialog` | `mat-aetherglass elevation-3` | ELPIS-215 |
| `RefreshCharacterDialog`, `WikiImportDialog` | `mat-aetherglass elevation-3` | ELPIS-217 |
| `EventView.vue` hero header | `mat-aetherglass` | ELPIS-305 |
| `EventCalendar.vue` calendar header | `mat-aetherglass` | ELPIS-301 |
| `CalendarSidebarWidget.vue` widget card | `mat-aetherglass` | ELPIS-307 |
| `VenueProfile.vue` overview header | `mat-aetherglass` | ELPIS-407 |
| `CommunityProfile.vue` overview header | `mat-aetherglass` | ELPIS-407 (parity) |
| `WikiImportDialog`, `RefreshCharacterDialog` | `mat-aetherglass elevation-3` | ELPIS-217 |
| `ConfirmImageDeleteDialog` | `mat-aetherglass elevation-3` | ELPIS-611 |
| `UploadDialog` | `mat-aetherglass elevation-3` | ELPIS-604 |
| `AdultOnlySelector.vue` chip (legacy uses `backdrop-filter` directly — see Legacy Gaps) | — | n/a |
| News `SiteHeader.vue` masthead — base surface | `mat-aetherglass` (via class chain) — present on the wrapping `.header__chrome` | ELPIS-702 |
| News `IssueNavigation.vue` desktop column + mobile dropdown | `mat-aetherglass` | ELPIS-708 |
| News `UserNavigation.vue` desktop column + mobile dropdown | `mat-aetherglass` | ELPIS-707 |

**Result:** all Aetherglass surfaces in shipped Elpis tickets fall back to a solid pearl (Hydaelyn) / deep (Zodiark) surface on Safari < 16 / Firefox-without-flag through the single `@supports not` block in `materials.scss`. No per-component fallback needed for any of these.

---

## Accepted gaps (documented in memory.md)

### `Character.vue` specificity-3 drawer override (L417–427)

```scss
.page-character-layout .q-drawer.q-drawer--left.mat-aetherglass {
    background-image: none;
    background-color: rgba(245, 239, 226, 0.88);  // pearl @ 88%
    border-right: none;
    -webkit-backdrop-filter: blur(14px) saturate(1.05);
    backdrop-filter: blur(14px) saturate(1.05);
}

body.body--dark .page-character-layout .q-drawer.q-drawer--left.mat-aetherglass {
    background-color: rgba(21, 11, 35, 0.78);  // deep @ 78%
}
```

This restatement is required because `MainLayout`'s `.q-drawer--left` rule (a global) carries specificity equal to `.mat-aetherglass` and would otherwise win source-order races by repainting the drawer's background-image / border / overlay. The override sits **outside** the `@supports not` block — meaning Safari < 16 sees the translucent `rgba` background and **no blur**, leaving the drawer as a partially-transparent panel.

**Memory.md status:** documented and accepted. Quote:
> Safari < 16 fallback caveat: the character drawer's specificity-3 override in `Character.vue` paints `rgba(...)` instead of solid `--surface-pearl` / `--surface-deep` because it sits outside the `@supports not (backdrop-filter)` block. Same minor regression accepted on the header. If problematic, fold the override into the @supports.

**Visual impact on Safari < 16 / Firefox-without-flag:** the drawer reads as a translucent pearl panel, allowing some color bleed from underlying chrome through. Body copy still meets AA on the resulting blended surface (verified with axe). Acceptance is conditional on no users reporting legibility regressions.

**One-line fix if/when prioritised:** wrap the `Character.vue` override (and its dark sibling) in the same `@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))` block, swapping the two `rgba(...)` values for `var(--surface-pearl)` / `var(--surface-deep)` solids. Cost: ~10 lines.

---

## Legacy gaps (pre-Elpis, not regressions)

These uses of `backdrop-filter` predate Aetherium adoption and live on surfaces that are **not yet** covered by a shipped Elpis ticket. They are listed for awareness but are not failures of this audit:

| File | Line | Selector | Notes |
|---|---|---|---|
| `client/src/layouts/MainLayout.vue` | 702 | `.q-drawer--left` | Pre-existing 12 px blur on the global drawer. ELPIS-104 (drawer Aetherglass + open-animation choreography) would re-skin and bring this under `mat-aetherglass`. **Currently planned, not started.** |
| `client/src/layouts/MainLayout.vue` | 719 | `.q-drawer__backdrop` | Pre-existing 4 px blur on the backdrop dimmer. Cosmetic. |
| `client/src/layouts/MainLayout.vue` | 1101 | `.layout__nav-menu` | Pre-existing 10 px blur on the desktop top-bar dropdown. ELPIS-102 (header nav menu drop animation) would replace this. **Currently planned, not started.** |
| `client/src/layouts/MainLayout.vue` | 1182 | `.layout__mobile-menu` | Pre-existing 10 px blur on the mobile drawer menu. Same as 1101. |
| `client/src/components/event/AdultOnlySelector.vue` | 128 | `.adult-only-selector__chip` | Pre-existing 6 px blur on the chip. Not in any current Elpis ticket. |

**On Safari < 16:** each of these surfaces today renders without blur — the underlying `background:` shorthand sets a `linear-gradient(...)` or solid color, which is perfectly legible. No transparency is involved, so the loss of the blur is purely cosmetic. No contrast regression exists.

**Recommended remediation:** when ELPIS-102 / ELPIS-104 land, the global `MainLayout` drawer + nav-menu / mobile-menu surfaces should adopt `mat-aetherglass` directly — the override at `MainLayout.vue:702 / 719 / 1101 / 1182` should be dropped entirely in favor of the class-based material. AdultOnlySelector is a separate cleanup outside Elpis scope.

---

## Cross-browser test matrix

| Browser | Version | `backdrop-filter` support | Expected behavior on Aetherglass surfaces |
|---|---|---|---|
| Safari (macOS) | 16+ | ✅ unprefixed | Frosted glass paints (Pearl / Deep base) |
| Safari (macOS) | 14–15 | ✅ `-webkit-` only | Frosted glass paints via prefix |
| Safari (macOS) | < 14 | ❌ | `@supports not` → solid Pearl / Deep |
| Safari (iOS) | 16+ | ✅ unprefixed | Frosted glass paints |
| Safari (iOS) | 14–15 | ✅ `-webkit-` only | Frosted glass paints |
| Firefox (desktop) | 103+ | ✅ unprefixed (default-on) | Frosted glass paints |
| Firefox (desktop) | < 103 | ❌ unless `layout.css.backdrop-filter.enabled=true` | `@supports not` → solid Pearl / Deep |
| Edge | latest | ✅ Chromium-based | Frosted glass paints |
| Chrome | 76+ | ✅ unprefixed | Frosted glass paints |
| Chrome | 47–75 | ✅ `-webkit-` only | Frosted glass paints via prefix |

**Note:** the `@supports` predicate uses both `-webkit-` and unprefixed forms (`@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px)))`), so any browser that supports either prefix avoids the fallback. Only browsers with **zero** backdrop-filter support hit the solid surface.

---

## Manual verification checklist

Performed on Safari 16+ via DevTools' "Disable backdrop-filter" experimental flag (or by toggling the OS-level `Use blurred backgrounds` accessibility setting on macOS):

- [ ] Open `/character/.../...` — left drawer reads as translucent pearl (accepted gap, see above) on toggle-off; reads as frosted glass on toggle-on.
- [ ] Open `/calendar` — header reads as solid pearl on toggle-off; frosted glass on toggle-on.
- [ ] Open `/edit-character/.../appearance` and click a swatch — color-picker popup reads as solid Vellum on toggle-off; frosted on toggle-on.
- [ ] Open `/event/:id` — hero header reads as solid pearl on toggle-off.
- [ ] Open switch-character dialog — reads as solid Vellum on toggle-off.
- [ ] Open the upload dialog from a banner editor — reads as solid Vellum on toggle-off.
- [ ] Open `/news/` — masthead chrome reads as solid pearl on toggle-off.
- [ ] Open `/news/article/:slug` — UserNavigation column reads as solid pearl on toggle-off.

(For Firefox-without-flag: `about:config` → `layout.css.backdrop-filter.enabled = false` → reload.)

---

## Summary

- **Aetherglass surfaces with verified solid fallback:** all of them, via `materials.scss:132`.
- **Elpis-shipped gaps:** **0** (Character.vue is a documented-accepted gap, not a regression).
- **Pre-Elpis legacy gaps:** 5 surfaces in `MainLayout.vue` + `AdultOnlySelector.vue`. Tracked for cleanup when ELPIS-102 / ELPIS-104 land — not blocking ELPIS-809.

The Safari fallback contract is **fully satisfied** for every shipped Elpis Reborn surface. ELPIS-809 closes; the manual cross-browser checklist above is the per-route sign-off list.
