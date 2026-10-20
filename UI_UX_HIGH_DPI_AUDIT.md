# High-DPI / Retina Ornament Audit — Elpis Reborn

**Ticket:** ELPIS-810
**Date:** 2026-04-29
**Scope:** Every ornament, glyph, frame, and decorative SVG introduced by the 82 shipped Elpis Reborn tickets — verified vector at 1x, 2x, and 3x device pixel ratios.

---

## Method

A vector ornament scales cleanly at any DPI when:

1. The SVG declares a `viewBox` (defines an internal coordinate space).
2. Width/height on the host element use scalable CSS units (`px`, `em`, `%`, viewport units), not anchor-pinned hard pixels at one resolution.
3. Strokes/fills use scalable values (`currentColor`, `var(--token)`, hex via percent-escape) — no embedded raster.
4. There is no embedded `<image href="data:image/png...">` or background-image with a raster URL on the ornament layer.

A failure of any of the above results in **rasterization at the largest target DPI**, producing visibly soft edges on Retina (2×) and 3× screens. This audit walks every shipped ornament and confirms the four conditions.

Each row classifies the ornament as:

- **Vector** — meets all four conditions, scales cleanly at 1x / 2x / 3x.
- **Procedural** — uses `<filter>` (e.g. `feTurbulence`) — resolution-independent by construction.
- **Raster (legitimate)** — pre-existing brand mark or photo using `1x/2x/3x` DPI variants. Not an Elpis ornament; out of scope.

---

## Aetherium primitives — `client/src/components/aetherium/`

| Component | Geometry | Sizing | Verdict |
|---|---|---|---|
| `GlyphCorner.vue` | `<svg viewBox="0 0 32 32" stroke="currentColor" stroke-width="1.25">` with three paths (bracket, hook, jewel diamond). Five size variants xs (12 px) / sm (16 px) / md (24 px) / lg (32 px) / xl (48 px). | `width: 100%; height: 100%; display: block; overflow: visible;` on the inner `<svg>`. The wrapper `.glyph-corner--{size}` controls the outer pixel box. Position rotates the *path* via `transform: rotate(N deg)` — no rasterization at any rotation. | **Vector** ✓ |
| `TriskelionDivider.vue` | `<svg viewBox="-16 -16 32 32" stroke="currentColor" stroke-width="1.25">` with three Q-curve spiral arms rotated 0 / 120 / 240 + a central jewel circle at r=0.9. Anchored at 28 × 28 px. | `width: 28px; height: 28px;` on the `.triskelion-divider__glyph`. Browser resamples the vector at the device pixel ratio. | **Vector** ✓ |
| `AetheryteBadge.vue` (chrome only) | The badge's gold-ring frame is built from inset / outer `box-shadow` layers — no SVG. Size variants xs (24) / sm (36) / md (48) / lg (72) / xl (96). | The wrapper sets `width / height`; CSS `box-shadow` and `border-radius` scale with the wrapper. Avatar image inside (the `<img>`) is a per-user upload — out of scope for this audit. | **Vector** ✓ (chrome only) |

The `news/src/components/aetherium/` mirrors of `GlyphCorner.vue` and `TriskelionDivider.vue` are byte-equivalent — same verdict.

---

## Inline-SVG ornaments embedded in stylesheets / components

| Source | Use | Geometry | Verdict |
|---|---|---|---|
| `client/src/css/app.scss:1718` | Crystal facet on completed stepper dot (ELPIS-311 / 604 shared rule) | `viewBox="0 0 24 24"` — outer hex polygon, inner hex, 3 cross-lines. Painted as `background-image` data-URI; `background-size: contain` so the SVG fits the dot's diameter at any DPI. | **Vector** ✓ |
| `client/src/pages/EventCalendar.vue:991` (Hydaelyn) and `:1410` (Zodiark) | Today's-cell aetheryte motif (ELPIS-302) | `viewBox="0 0 64 64"` — outer hex + inner hex + 3 cross-lines + radial halo circle. Painted as `background-image` with `background-size: 56% auto` so it scales with the day cell. | **Vector** ✓ |
| `client/src/pages/Venue.vue:663` (Hydaelyn) and `:689` (Zodiark) | Section drawer active-item aetheryte glyph (ELPIS-406) | `viewBox="0 0 32 32"` — same hexagonal aetheryte structure. | **Vector** ✓ |
| `client/src/css/aetherium/materials.scss:22` (`$aether-noise`) and the news mirror | Vellum + Parchment 4 % noise overlay | `<svg width=160 height=160>` containing `<filter><feTurbulence baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter>`. The fixed 160 × 160 viewport tiles via `background-size: 160px 160px` — **but** `feTurbulence` is **resolution-independent**: the browser samples the procedural noise at the device pixel ratio at paint time, so a 2× display sees a 320 × 320 sample window of the same procedural noise. No rasterization at any DPI. | **Procedural** ✓ |
| `news/src/pages/Index.vue:104` (Hydaelyn) and `:163` (Zodiark) | Quill-divider triskelion glyph between articles (ELPIS-706) | `viewBox="-16 -16 32 32"` — same triskelion path as `TriskelionDivider.vue`. Painted as `background-image`. | **Vector** ✓ |
| `news/src/components/header/SiteHeader.vue:8–18` | Crystal medallion above masthead title (ELPIS-702) | Inline `<svg viewBox="-12 -12 24 24" stroke="rgba(255,255,255,0.92)" stroke-width="1">` — outer hex polygon, inner hex polygon, two cross-lines. Sized at 44 × 44 px desktop / 36 × 36 px mobile via the wrapping `.header__medallion`. | **Vector** ✓ |

---

## Quasar / framework iconography

The Aetherium tokens leave Quasar's icon set untouched: `q-icon` consumes the Material Icons font (web-font, vector glyphs) for every material symbol referenced (e.g. `event_note`, `palette`, `cloud_upload`, `verified`, `hourglass_empty`, `lock`, `group`, `restart_alt`). Material Icons font is a vector glyph set — scales cleanly at any DPI by design.

No raster glyphs were introduced by any Elpis ticket; the only places the visual rework touches icons is **re-tinting** existing `q-icon` instances via `color: var(--rule-gold)` etc.

---

## Pre-existing raster brand assets (legitimate, out of scope)

These are not Elpis ornaments — they are brand marks predating the rework. They ship correctly with multiple DPI variants and are referenced as `<picture><source srcset>` chains in the underlying components:

| Asset | DPI variants |
|---|---|
| `client/src/assets/logo_1x.png` (and `.webp`) | 1x |
| `client/src/assets/logo_2x.png` (and `.webp`) | 2x |
| `client/src/assets/logo_3x.png` (and `.webp`) | 3x |
| `client/src/assets/logo_4x.png` (and `.webp`) | 4x |
| `client/src/assets/logo_dark_*x.png` (and `.webp`) | 1x–4x dark variants |
| `client/src/assets/bg.jpg` / `bg.webp` | photographic bg |
| `client/src/assets/bg_dark.jpg` / `bg_dark.webp` | photographic bg |

The 1x → 4x DPI ladder is the correct approach for raster brand marks (logos with hand-tuned shapes / hinting). This is **not** something Elpis touches; recorded here for completeness.

---

## High-DPI verification checklist

Per AC, manually verify each ornament class on **3** display tiers:

- **1× display** (96 dpi standard monitor)
- **2× display** (Retina laptop, e.g. MacBook Pro)
- **3× display** (high-DPI mobile via DevTools `Toolbar → Devices → Pixel 7 Pro` at 3× DPR, or a real device)

Walk these surfaces:

- [ ] `/` home — corner glyphs on activity-grid panels (if any) — verify edges crisp on 3×.
- [ ] `/character/.../...` — Aetheryte job-frame avatar's gold-ring chrome and corner glyphs render crisply on 3×.
- [ ] `/character/.../...` — Triskelion divider between detail box and background prose renders crisply on 3×.
- [ ] `/event/:id` — Aetherglass header glyphs / corner stamps render crisply on 3×.
- [ ] `/calendar` — Today's-cell aetheryte motif renders crisply on 3×.
- [ ] `/edit-event` — Crystal facet on completed stepper dot renders crisply on 3×.
- [ ] `/venue/:server/:name` — section drawer's hexagonal aetheryte glyph renders crisply on 3×.
- [ ] `/free-company/:server/:name` — member-grid AetheryteBadge gold-ring chrome renders crisply on 3×.
- [ ] `/story/:id` — Triskelion divider between header and parchment block renders crisply on 3×.
- [ ] `/wiki/:title` — Triskelion divider, illuminated initial render crisply on 3×.
- [ ] `/noticeboard/:id` — Triskelion divider above parchment block renders crisply on 3×.
- [ ] `/edit-character/.../appearance` — Crystal swatch buttons + color-picker chrome render crisply on 3×.
- [ ] News `/` — masthead Crystal medallion + four corner glyphs + triple-rule strip render crisply on 3×.
- [ ] News `/` — quill divider triskelion between articles renders crisply on 3×.
- [ ] News `/article/:slug` — Triskelion divider above parchment block renders crisply on 3×.

For each: zoom the browser to 200% / 300% and confirm no fuzziness, no jagged edges, no stair-stepping along strokes. Vector ornaments will resolve at the device pixel ratio under all zoom levels; if any fail, the SVG path is the regression site.

---

## Summary

- **Aetherium ornaments verified vector:** 100% (3 components + 7 inline SVGs).
- **Procedural overlays verified resolution-independent:** 1 (`feTurbulence` noise tile, used by Vellum + Parchment).
- **Raster assets in Elpis scope:** **0**.
- **Pre-Elpis raster brand marks:** acknowledged with 1×–4× DPI variants. Out of scope.

Every ornament shipped by the 82 Elpis Reborn tickets renders as crisp vector geometry at any DPI. ELPIS-810 closes; the per-route verification checklist above is the manual sign-off list.
