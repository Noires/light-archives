# Aetherium

The design system for Light Archives' **"Elpis Reborn"** visual rework. This
folder contains the token vocabulary, material utilities, and motion contract
that every visible surface in the client should be expressed in.

> **Companions:** [`UI_UX_AUDIT.md`](../../../../UI_UX_AUDIT.md) ·
> [`UI_UX_REWORK_PLAN.md`](../../../../UI_UX_REWORK_PLAN.md) ·
> [`UI_UX_REWORK_BACKLOG.md`](../../../../UI_UX_REWORK_BACKLOG.md) ·
> [`memory.md`](../../../../memory.md) (cold-start handoff)

The plan documents are the *source of truth*. This file is a working
contributor reference — quick to read, opinionated, with do/don't examples.

---

## Why Aetherium exists

Before the rework, components reached for `#fdfdffee`, `rgba(221,180,118,...)`,
`2.5rem`, and bespoke `transition: 0.3s ease` strings inline. The result drifted
across pages, broke contrast in dark mode, and made motion feel arbitrary.

Aetherium is a single, named vocabulary. Every colour, gap, font face,
duration, and elevation has a token. Every recurring panel has a material.
Components reference the system; the system references the plan.

If a component needs a value that isn't in the system, **add it to the system
first**, then use it. Don't bypass.

---

## File map

```
client/src/css/aetherium/
├── index.scss        ← imports the rest in order; pulled in at app.scss line 1
├── color.scss        ← Hydaelyn (light, :root) + Zodiark (dark, body.body--dark)
├── space.scss        ← 8 px baseline scale, --space-0 … --space-12
├── type.scss         ← font families, 1.250 modular scale, .text-* utilities
├── motion.scss       ← easings, durations, prefers-reduced-motion guard
├── materials.scss    ← .mat-vellum / -aetherglass / -obsidian / -crystal / -parchment
└── AETHERIUM.md      ← this file

client/src/css/vision.scss   ← ER2 button hierarchy (.elpis-btn--*), imported last in app.scss
client/src/components/vision/ ← ER2 shared components; see its README.md
```

Import order is intentional. Materials reference colour and motion tokens, so
tokens load first. Don't reorder unless you also move the dependency.

---

## Token categories

### Colour (`color.scss`)

Zodiark uses the original blue night palette from `main` (blue-black
surfaces, `#D9E1EA` ink, sky-blue `#9EC4F3` links and CTA, steel-blue
`rgba(141,181,223,…)` rules). The violet Aetherium palette was reverted on
2026-10-20; the `--rule-arcane` / `--glow-zodiark` names stayed so components
didn't need renaming. Penpot binds these values as `theme.dark.*`.

Hydaelyn lives on `:root`; Zodiark lives on `body.body--dark`. Same token names
exist on both themes where the role is identical (e.g. `--rule-gold-soft` and
`--rule-arcane-soft` are theme-specific because the *colour* of "rule" differs,
but `--semantic-success` is theme-shared).

| Token group | Hydaelyn | Zodiark |
|---|---|---|
| Page surface | `--surface-pearl` | `--surface-obsidian` |
| Card/panel surface | `--surface-vellum` | `--surface-deep` / `--surface-lift` |
| Body text | `--surface-ink` | `--ink-luminous` |
| Muted text | `--ink-muted` | *(use `--ink-luminous` at lower opacity)* |
| Hairline rule | `--rule-gold` / `--rule-gold-soft` | `--rule-arcane` / `--rule-arcane-soft` |
| Hover/focus aura | `--glow-aether` / `--glow-elpis` | `--glow-aether-d` / `--glow-zodiark` |
| Brand accent | `--crystal-prism` *(linear-gradient)* | *(same — theme-agnostic)* |
| Semantic | `--semantic-{success,warning,danger,info}` | *(same)* |

`--semantic-danger` is `#C7484F`. The legacy `#C10015` is **gone** — it failed
AA on `--surface-pearl`. Don't reintroduce it.

### Role aliases (`color.scss`, ER2-003)

Theme-neutral names consumed by `components/vision/` and `css/vision.scss`.
Each resolves per theme, so a component that uses them needs no
`body.body--dark` override.

| Token | Hydaelyn | Zodiark | Role |
|---|---|---|---|
| `--surface-raised` | `#FBF6EA` | `#111822` | card / panel surface (= vellum / lift) |
| `--surface-glass`  | `rgba(251,246,234,.86)` | `rgba(14,19,27,.82)` | sticky bars, tab rails |
| `--ink-primary`    | `#2B2418` | `#D9E1EA` | body + heading ink |
| `--ink-muted`      | `#6E5F46` | `#A2ADBA` | meta, leads, inactive tabs (Zodiark value is new) |
| `--ink-link`       | `#8A5A14` | `#9EC4F3` | links, ghost buttons, eyebrows |
| `--rule-strong`    | `#9C7A3C` | `#8DB5DF` | active-tab underline, secondary border, avatar ring |
| `--rule-soft`      | `rgba(186,155,91,.28)` | `rgba(141,181,223,.32)` | hairlines, card borders |
| `--rule-tint`      | `rgba(186,155,91,.14)` | `rgba(158,196,243,.10)` | hover fill, neutral chip fill |

### Vision tokens (`color.scss`, ER2-003)

Mirror of the Penpot `vision.*` set (UI_UX_VISION_REWORK_PLAN.md §3.1).

| Token | Hydaelyn | Zodiark | Use |
|---|---|---|---|
| `--vision-primary`       | `#DDB476` | `#9EC4F3` | primary button, active chip, active tab count |
| `--vision-on-primary`    | `#2B2418` | `#0F1824` | text on primary |
| `--vision-primary-hover` | `#E8C68E` | `#C3DBFF` | primary hover |
| `--vision-danger`        | `#B3363E` | `#F08A93` | destructive actions |
| `--vision-on-danger`     | `#FFFFFF` | `#0F1824` | text on danger |
| `--vision-live`          | `#2E7D4F` | `#6EDCA8` | live dot, live bar |
| `--vision-live-bg`       | `rgba(46,125,79,.12)` | `rgba(110,220,168,.14)` | Live / Geöffnet / Im RP pill |
| `--vision-live-text`     | `#256A42` | `#6EDCA8` | label on `--vision-live-bg` (added: `#2E7D4F` reaches only 4.02:1 there) |
| `--vision-cw-bg`         | `rgba(229,178,94,.16)` | `rgba(243,217,164,.10)` | content-warning pill |
| `--vision-cw-text`       | `#6B4C21` | `#F3D9A4` | content-warning label |
| `--vision-cw-border`     | `rgba(186,140,60,.55)` | `rgba(243,217,164,.45)` | content-warning outline |
| `--vision-now`           | `#C7484F` | `#FF8FA0` | timeline "Jetzt" marker, unread dot |
| `--vision-on-now`        | `#FFFFFF` | `#0F1824` | text on `--vision-now` (timeline "Jetzt" label; 4.7:1 / 8.2:1) |
| `--vision-card`          | `#FBF6EA` | `#111822` | card surface (= `--surface-raised`) |
| `--vision-focus-edge`    | `#2B2418` | `transparent` | 1 px outer edge of the focus ring (see below) |

**Contrast (WCAG 2.1, alpha tokens composited over `--vision-card`).**
Text pairs need 4.5:1, non-text indicators 3:1.

| Pair | Hydaelyn | Zodiark | Result |
|---|---|---|---|
| on-primary / primary          | 7.94 | 9.90 | AA (AAA) |
| on-primary / primary-hover    | 9.43 | 12.66 | AA (AAA) |
| on-danger / danger            | 5.98 | 7.45 | AA |
| live-text / live-bg           | 5.19 | 7.89 | AA |
| live / card (dot, bar)        | 4.68 | 10.59 | AA non-text |
| cw-text / cw-bg               | 6.65 | 10.34 | AA |
| cw-text / cw-bg on page       | 6.31 | 11.17 | AA |
| now / card (marker)           | 4.36 | 8.23 | AA non-text |
| danger / card (button edge)   | 5.54 | 7.44 | AA non-text |
| ink-primary / card            | 14.23 | 13.51 | AAA |
| ink-muted / card              | 5.75 | 7.83 | AA |
| ink-muted / rule-tint         | 5.14 | 6.45 | AA |
| ink-link / card               | 5.48 | 9.89 | AA |
| ink-link / rule-tint          | 4.90 | 8.14 | AA |
| rule-strong / card            | 3.70 | 8.33 | AA non-text |
| glow-aether / card            | 1.36 | 12.16 | see note |

Notes:
- `--vision-primary` against the card is 1.79:1 in Hydaelyn. The button is
  identified by its label (WCAG 1.4.11 does not require a fill boundary), so
  this is accepted; do not use the primary fill alone as a state indicator.
- `--vision-cw-border` (1.70:1 in Hydaelyn) is decorative; the CW badge
  carries a warning icon and text.
- The focus ring is 2 px `--glow-aether` plus a 1 px `--vision-focus-edge`.
  The aether cyan alone is 1.36:1 on parchment; the dark edge brings the ring
  to 14:1 in Hydaelyn. In Zodiark the edge is transparent.

Recompute with any WCAG calculator if a value changes; keep this table in
the same commit as the token edit.

### Vision button hierarchy (`css/vision.scss`, ER2-004)

Loaded once at the end of `app.scss`. Apply to `q-btn`:

```html
<q-btn class="elpis-btn elpis-btn--primary" label="Speichern" />
<q-btn class="elpis-btn elpis-btn--secondary" label="Abbrechen" />
<q-btn class="elpis-btn elpis-btn--ghost" label="Mehr" />
<q-btn class="elpis-btn elpis-btn--danger" label="Löschen" />
```

Shared: 8 px radius, `--font-ui` 600 14 px, sentence case, focus ring as
above, disabled opacity .42. `vision.scss` also removes Quasar's default
uppercase from every `.q-btn`. Use `flat` / `unelevated` props freely; the
classes override fill and text colour.

### Spacing (`space.scss`)

8 px baseline. `--space-0: 0`, then `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 /
64 / 80 / 96`. Theme-agnostic.

Use `--space-2` (8 px) for inner padding inside small chips, `--space-4` (16 px)
for card padding, `--space-7` (32 px) for section gutters, `--space-10` (64 px)
for hero spacing.

### Typography (`type.scss`)

**Faces** — referenced by token, never by bare name:

| Token | Family chain | Use |
|---|---|---|
| `--font-display`  | Cinzel → Cinzel Eorzea → serif | Hero, h1, FFXIV-flavored titles |
| `--font-section`  | Spectral → Georgia → serif | h2 / h3 default |
| `--font-body`     | Spectral → Noto Sans → serif | Body copy |
| `--font-ui`       | Inter → Noto Sans → system-ui | Labels, dense UI, numerals |
| `--font-lore`     | IM Fell English → Spectral → serif | Character background, Story body, Wiki h-roman |
| `--font-mono`     | system mono | Code, hashes, ids |
| `--font-ornament` | Cinzel Eorzea → Cinzel → serif | Drop caps, ornament-only Eorzean glyphs |

Spectral, Inter, and IM Fell English self-host via Fontsource lands with
**ELPIS-001** (deferred). Until then the fallback chains keep pages legible.

**Modular scale 1.250 (Major Third), base 16 px:**

| Token | Size | Typical use |
|---|---|---|
| `--type-scale-0` | 12 px | Eyebrow, micro labels |
| `--type-scale-1` | 14 px | Small UI, footer, h6 |
| `--type-scale-2` | 16 px | Body, h5 |
| `--type-scale-3` | 20 px | Large body, h4 |
| `--type-scale-4` | 25 px | h3 / section heading |
| `--type-scale-5` | 31 px | h2 / page title |
| `--type-scale-6` | 39 px | Display medium |
| `--type-scale-7` | 49 px | h1, display large |
| `--type-scale-8` | 61 px | Home hero only |

Plus three line-height tokens (`--lh-display`, `--lh-heading`, `--lh-body`,
`--lh-ui`) and two letter-spacing tokens (`--ls-display`, `--ls-eyebrow`).

**Utility classes** (use directly via `class=`):

- `.text-display` — Cinzel 49 px, tight tracking. Hero pages, top-level callouts.
- `.text-body-lore` — IM Fell English italic, body size. Lore quotes, journal flavour.
- `.text-ui-mono` — Inter with tabular + lining numerals. Stat blocks, counts, timestamps.

### Motion (`motion.scss`)

**Easings** (named after the cosmology, not the curve):

| Token | Curve | Use |
|---|---|---|
| `--ease-elpis`   | `cubic-bezier(0.16, 1, 0.3, 1)`     | Default — hovers, drawer slides |
| `--ease-aether`  | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Confirmations, badge pops (overshoot) |
| `--ease-zodiark` | `cubic-bezier(0.7, 0, 0.84, 0)`     | Modals closing, errors disappearing |
| `--ease-tide`    | `cubic-bezier(0.45, 0, 0.55, 1)`    | Long ambient loops |

**Durations:**

| Token | Value | Use |
|---|---|---|
| `--motion-instant`   |   80 ms | Tap response, focus rings |
| `--motion-fast`      |  160 ms | Hover lift, badge pop |
| `--motion-base`      |  260 ms | Page-section reveal, drawer |
| `--motion-slow`      |  420 ms | Modal open/close, stepper slide |
| `--motion-cinematic` |  720 ms | Login-bloom, hero entrance |
| `--motion-ambient`   | 6000 ms | Slow parallax, mote drift, glow pulse |

### Reduced-motion contract

`motion.scss` ends with a single `@media (prefers-reduced-motion: reduce)`
block that:

- Collapses every duration except `--motion-instant` to `--motion-instant`.
- Sets `--motion-ambient` to **0 ms** (not 80 ms) so any consumer that wires
  `animation-duration: var(--motion-ambient)` becomes a no-op rather than a
  12.5 Hz flicker.

The easing tokens are intentionally *not* touched — they remain valid
expressions even at zero duration.

**This is the only place reduced-motion logic lives.** Don't add per-component
`@media (prefers-reduced-motion)` guards unless you have a specific reason
documented in the ticket. Authoring through tokens means the guard is
automatic.

If your animation must run regardless (a layout-driven `transform` that breaks
when zeroed), guard it explicitly and document the exception.

---

## Materials

Five composed utility classes for recurring surface treatments. Each is a
`class=` on the element that needs the treatment — not a mixin, not a Vue
component.

| Class | Reserved for |
|---|---|
| `.mat-vellum`      | Cards, profile boxes, directory tiles, calendar day cells |
| `.mat-aetherglass` | Header, drawer, dialogs, popovers |
| `.mat-obsidian`    | Zodiark page background only |
| `.mat-crystal`     | Brand mark, theme toggle, primary CTA on hero, P&P dice |
| `.mat-parchment`   | Story body, Wiki body, Character Diary cards (cream + grain, no ruled lines) |

**Aetherglass elevation variants** mirror the §3.2 layering rule:

```html
<div class="mat-aetherglass">…</div>                  <!-- card-level (blur 14) -->
<div class="mat-aetherglass elevation-2">…</div>      <!-- popover-level (blur 22) -->
<div class="mat-aetherglass elevation-3">…</div>      <!-- dialog-level (blur 30, double rule) -->
```

**Safari fallback** — `materials.scss` includes a
`@supports not (backdrop-filter)` block that swaps Aetherglass for a solid
`--surface-pearl` / `--surface-deep` so the panel never goes transparent.
Verified manually; do not remove.

**Animations on Crystal and Obsidian** are timed off `--motion-ambient`, so
the reduced-motion guard zeroes them automatically — they become static
surfaces, not flickering ones.

### Shell shapes: facet and aether seam ("Kristallkiel")

The top bar, its menus, the mobile bar and the "Mehr" sheet use sharp edges
instead of radii. They follow the Penpot concept "Vision › M · TopBar-Konzept".
The mixins live in `layouts/shell/facet.scss`; they emit no CSS on their own.

- **Facet (keel cut).** `facet($c)` cuts the top-left and bottom-right
  corners. It is used on the search slot (7px), the avatar (8px) and the
  menu panels (bottom-right only, 16px). `facet-tl` cuts only the top-left
  corner and is used on the sheet (22px).
  - The baseline is `clip-path`; corner gradients redraw the hairline on the
    cut edge.
  - `corner-shape: bevel` is only an enhancement inside
    `@supports (corner-shape: bevel)` (Chromium 139+). `border-radius` is set
    only there.
- **Aether seam.** The bar's bottom border is the seam. The current area
  gets a 2px `--rule-strong` underline that grows from the centre, a 7px
  rhombus node on the seam (`rhombus()`) and a light shaft
  (`--rule-tint` → transparent). The same marks appear on the mobile bar's
  top edge.
- **Focus.** Use an inner `outline` (negative offset) or an inset ring,
  never an outer ring: `clip-path` cuts outlines and box-shadows.
- **Shadows on clipped panels** go on the parent as
  `filter: drop-shadow()`.
- **Condensing.** The bar condenses from 68px to 52px only through
  `animation-timeline: scroll()`, inside `@supports`, from 1024px up and
  without reduced motion. Everywhere else it stays static at 68px.
  `--nav-height` stays 68px.
- **Motion choreography.** Each motion has its own trigger, and only one
  plays at a time. Helpers are in `layouts/shell/seam-motion.ts`, styles and
  `kiel-*` keyframes in `ShellHeader.vue`. A preview is the Motion Lab
  artifact.
  - **First visit in a session (ignition):** the wedge grows, the areas
    drop in one after another, and the node lands on the seam. Then a single
    glint runs along the seam and ends in a flare at the node. Total about
    1.5s; skipped under reduced motion.
  - **Route change (seam glide):** one shared indicator (line, node, light
    shaft) glides 320ms to the new area and flares when it arrives. It uses
    transforms, not a View Transition, so it never fights the condense
    timeline.
  - **Theme switch (prism wipe):** a View Transition. The new theme opens
    as a rhombus from the crystal; under reduced motion it fades.
  - **Menus (facet unfold):** the QMenu transition `kiel` opens downwards
    out of the seam and closes back the same way. Entries follow 30ms apart.
  - **Mouse over search, cells or plate (facet highlight):** a faint aether
    light follows the pointer. Fine pointers only.
  - **Reading pages (reading seam):** the seam fills with scroll progress.
    Routes come from `isReadingRoute()`. Scroll timelines only; with no
    support, nothing is shown.
  - **Elpis petals (Hydaelyn) and fireflies (Zodiark), the only continuous
    motion:** the same seven elements in the logo facet, over its ER1 135°
    gradient.
    - **Petals:** translucent white with a warm sunlit edge and a faint
      glow, because Elpis flowers are white and turn "sun-bright" around
      joy. Each petal has two layers: the outer one falls slowly (8.6–12.5s
      per cycle) and drifts, the inner one sways gently like a pendulum (±30°
      around a pivot above it). Even petals are mirrored, and size and opacity
      vary to suggest depth. The fall loops continuously. Under reduced
      motion, three petals rest on the bottom edge instead.
    - **Fireflies:** 3px motes in `--vision-primary` drift upwards; they are
      hidden under reduced motion.
    - **Pause:** neither has a pause control. This is a deliberate exception
      to WCAG 2.2.2.
  - **Limits:** apart from the fireflies, nothing loops, and nothing lasts
    longer than 1.5s (WCAG 2.2.2). Reduced motion keeps only opacity and
    colour changes (WCAG 2.3.3, C39).

---

## Do / don't

### Colours

```scss
// ✅ Token reference — survives Hydaelyn ↔ Zodiark swap
.character-bio {
	color: var(--surface-ink);
	background-color: var(--surface-vellum);
	border-bottom: 1px solid var(--rule-gold-soft);
}

// ❌ Hardcoded hex — breaks dark mode, drifts over time
.character-bio {
	color: #2B2418;
	background-color: #FBF6EA;
	border-bottom: 1px solid rgba(186, 155, 91, 0.28);
}
```

### Sizing

```scss
// ✅ Scale-aligned
h2 { font-size: var(--type-scale-5); }
.card { padding: var(--space-4); }

// ❌ Arbitrary numbers that drift off the rhythm
h2 { font-size: 31.5px; }
.card { padding: 14px; }
```

### Motion

```scss
// ✅ Token-driven; reduced-motion guard fires automatically
.menu-item {
	transition: transform var(--motion-fast) var(--ease-elpis);
}

// ❌ Bare values; the reduced-motion guard can't reach this
.menu-item {
	transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

// ❌ Per-component @media reduced-motion that duplicates the global one
@media (prefers-reduced-motion: reduce) {
	.menu-item { transition: none; }
}
```

### Materials

```vue
<!-- ✅ Compose a card from Vellum -->
<q-card class="mat-vellum q-pa-md">…</q-card>

<!-- ❌ Hand-rolled equivalent — drifts from the canon, no dark-mode guarantee -->
<q-card style="background: #FBF6EA; border: 1px solid rgba(186,155,91,0.28); border-radius: 6px;">…</q-card>
```

```vue
<!-- ✅ Aetherglass on a dialog -->
<q-dialog>
	<q-card class="mat-aetherglass elevation-3">…</q-card>
</q-dialog>

<!-- ❌ Custom backdrop-filter on a one-off — Safari will see no fallback -->
<q-card style="backdrop-filter: blur(28px); background: rgba(255,255,255,0.6);">…</q-card>
```

### Theme awareness

```scss
// ✅ Token swap is automatic — Zodiark inherits the right value via :root vs body.body--dark
.profile-card {
	background-color: var(--surface-vellum);
	color: var(--surface-ink);
}

// ❌ Hand-rolled dark variant — drifts the moment surface tokens shift
.profile-card {
	background-color: #FBF6EA;
}
body.body--dark .profile-card {
	background-color: #111822;
}
```

---

## Adding a new token

1. **Confirm it isn't already there** — `grep` `aetherium/` for the role you
   need (e.g. "any rule colour for warning surfaces?"). Reuse before adding.
2. **Pick the right file** — colour goes in `color.scss`, geometry in
   `space.scss`, etc. New surface treatments are materials, not tokens.
3. **Pick a name that describes the *role*, not the value.** `--rule-gold` is
   right; `--colour-banana-gold` is wrong. Future themes may shift the hue;
   the role stays.
4. **Add Hydaelyn and Zodiark variants together** if the role is theme-aware.
   Skip the dark block only if the value is genuinely identical across themes
   (spacing, motion).
5. **Verify AA contrast** if the token will sit on a text or chrome surface.
   For body copy aim AAA.
6. **Reference it from a real surface in the same PR.** Tokens that aren't
   used become dead code.

## Adding a new material

Materials are composed utility classes — not Vue components. If a treatment
recurs across ≥3 surfaces *and* has clear visual identity, promote it to a
material:

1. Add the rules to `materials.scss` under a `.mat-*` selector.
2. Drive every colour, blur, shadow, and rule through tokens.
3. Provide a Zodiark variant under `body.body--dark`.
4. If it uses `backdrop-filter`, add a `@supports not (...)` solid fallback.
5. If it animates ambient drift, time it off `--motion-ambient` so the
   reduced-motion guard kills it automatically.
6. Document its reservation here (which surfaces it's allowed on).

---

## Don't introduce

- Tailwind, shadcn-vue, or any other CSS framework. Quasar stays.
- Layout changes — Aetherium is *visual only*.
- Google Fonts CDN — DSGVO blocks it. Self-host via Fontsource (ELPIS-001).
- Per-component `@media (prefers-reduced-motion)` blocks. Use motion tokens.
- Emojis in code or class names.
- Direct hex / rgb / px values when a token covers the role.
