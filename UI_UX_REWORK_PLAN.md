# Light Archives — Visual Rework Plan
## "Elpis Reborn" — a triple-A visual upgrade for Elpisgarten

**Companion to:** [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md)
**Date:** 2026-04-27
**Constraint:** Layouts stay. Surfaces, materials, typography, color, motion and effects change.

---

## 0. North Star

Elpisgarten is named after **Elpis** — the cradle of creation in *Final Fantasy XIV: Endwalker*, where Hythlodaeus and Hermes shaped concepts into life under a sea of pastel clouds. Today the portal looks like a competent community CMS in warm gold and serif type. The opportunity: lift the site to *the same standard of polish that the source material itself demonstrates* — Crystal-Tower-tier ornamentation, Lodestone-grade typographic restraint, and motion choreography that feels diegetic to the world it documents.

**Three measurable goals:**

1. **Diegetic.** Every state — hover, load, transition, error, empty — should feel like it could exist inside the game's UI canon (HUD frames, lore tomes, journal scrolls, aetheryte beacons).
2. **Cinematic.** First paint and first interaction should *feel composed* — animations are timed, sequenced, not defaulted.
3. **Layout-stable.** No section moves, no route changes, no information architecture rework. We're re-skinning, re-animating, and re-materializing — not redesigning.

---

## 1. Reference Research

### 1.1 In-game visual canon

| Source | What we steal | Where it goes |
|---|---|---|
| **Lodestone (official portal)** | Restrained serif typography, ornamental gold rules, generous spacing, paginated journal feel | Story view, Wiki, Article, Character Profile read-mode |
| **In-game HUD frames** | Beveled translucent panels, hairline gold/silver borders, soft inner shadows | Cards, dialogs, tooltips |
| **Aetheryte / Crystal motifs** | Slow pulse, hex/triangle geometry, refracted light | Loaders, primary CTAs, level-up moments |
| **Job action icons** | Square ornamental frames, gradient fills, stamped engravings | Avatars, role badges, event-type icons |
| **Linkpearl / journal book UI** | Parchment textures, ink ruled lines, scroll/turn page transitions | Diary, Story reader, Pen & Paper sheet |
| **Aether currents / fairy motes** | Slow-drifting particle systems, soft glow | Hero backgrounds, character switcher, success states |
| **Elpis biome** | Pastel sky gradients, soft cumulus clouds, lavender-and-teal palette, Elpis flowers (orange-pink) | Light-mode theme refresh, splash/login |
| **Endwalker UI** | Hydaelyn (white/gold) vs. Zodiark (purple/black) duality | Light/dark mode visual tension |
| **Crystal of Light** | Faceted refraction, prismatic edge bleeds | Theme-toggle and brand mark |
| **The Echo / Tempering glow** | Ramping bloom, after-image, slight chromatic aberration on confirm | Save / publish / level-up beats |
| **Eorzean glyphs** | Decorative dingbats and dividers | Section dividers, empty states, footer |

### 1.2 Triple-A web peers

| Peer | Why | Lesson |
|---|---|---|
| `na.finalfantasyxiv.com` | The source itself | Spacing rhythm, masthead typography |
| Riot — League / Valorant universe sites | Cinematic hero, scroll choreography | Motion sequencing, reveal-on-scroll |
| HoYoverse — Genshin / Star Rail | Particle ambiance, audio cues | Ambient micro-life on idle screens |
| `playoverwatch.com` champion pages | Card stacks with hover parallax | Character directory hover states |
| Diablo IV codex pages | Illuminated-manuscript treatment of lore text | Wiki, Story, Diary |
| Square Enix product launch sites (FFXVI, FF7R) | Slow zoom hero, gradient washes | Index hero + page transitions |

### 1.3 Color references pulled from canon

- **Hydaelyn pearl:** `#F5EFE2` highlight, `#DCC891` mid-gold, `#7A5C2E` deep bronze.
- **Zodiark obsidian:** `#0B0612` near-black, `#2A1A3F` deep violet, `#7A5BCB` arcane.
- **Aether streams:** cyan `#7FE6E2`, lavender `#B8A5FF`, rose `#FFB7C7`.
- **Elpis sky:** sunrise `#FFD3B0`, mid-cloud `#D9E6F2`, deep horizon `#A6BFE0`.
- **Crystal of Light:** prism gradient `#A7E2FF → #FFFFFF → #E8C9FF` with a `#FFE6A8` core.

These slot beneath the existing Quasar tokens (`$primary #DDB476`, `$secondary #9F84BD`) so brand recognition is preserved.

---

## 2. Tech Strategy

> **Principle: keep Quasar.** The 60+ pages and ~75 components are deeply wired to `q-*` primitives, the boot/store/router stack, and the shared API client. Replacing it would be a *layout change* by another name and would put 18+ months of feature work at risk. Instead, we **augment** Quasar with motion, materials and effects libraries, and override its tokens with a new visual layer.

### 2.1 Stack additions (recommended)

| Layer | Library | Why this one |
|---|---|---|
| Motion | **Motion One** (`motion`) or **GSAP 3** | Web-native, tree-shakable, CSS-aware. Motion One for 90% of UI work; GSAP only where timeline orchestration is needed (hero, page transitions). |
| Scroll choreography | **`@vueuse/motion`** + IntersectionObserver | Cheap reveal-on-scroll without heavy libs |
| Particles | **`@tsparticles/vue3`** | Hero aether motes, success bursts; configurable per-route |
| 3D / WebGL hero | **Three.js + `@tresjs/core`** (only on home + login) | Crystal of Light hero, slow rotating |
| SVG illustration | **Lottie** (`lottie-web`) | Loaders, success checkmarks, empty states |
| Typography | **Fontsource** for self-hosting Cinzel, Spectral, IM Fell, Crimson Pro | DSGVO-compliant local fonts (no Google Fonts CDN) |
| Theming utilities | Stay on **CSS custom properties + SCSS** | Already idiomatic; easier than introducing a CSS-in-JS layer |
| Icon set augment | **Lucide** + a small custom SVG sprite of FFXIV-style glyphs | Material icons stay where they are; we add ornaments, not replace primitives |
| Sound | **Howler.js** (opt-in only, default off) | Soft confirmation pings; gated behind user preference |

**Bundle budget:** add at most 90 KB gzip for the visual upgrade (Motion One ~12 KB, tsparticles ~25 KB, Lottie ~32 KB, three.js loaded only on `/` and `/login` via dynamic import, ~150 KB but lazy).

### 2.2 What we *don't* introduce

- **Tailwind.** Quasar's utility classes overlap; doubling up would bloat CSS and confuse contributors.
- **A second component library** (Naive, PrimeVue, shadcn-vue). One Quasar.
- **A design tool migration.** Figma source-of-truth, but the audit-mapped components are the implementation source-of-truth.

---

## 3. The Design Language: "Aetherium"

A named system. Components reference the system, not arbitrary numbers.

### 3.1 Typography

| Role | Face | Notes |
|---|---|---|
| Display (hero, h1) | **Cinzel** 600/700 + **Cinzel Eorzea** for FFXIV-flavored ornaments | Already in repo — keep |
| Section (h2/h3) | **Spectral** 500/600 (humanist serif) | Replaces Cinzel at h3 down for readability; Cinzel reserved for ornament |
| Body | **Spectral** 400 / **Inter** 400 fallback | Replaces Noto Sans; warmer at small sizes |
| UI/labels | **Inter** 500 (tabular numerals enabled) | Replaces Michroma at small sizes; Michroma kept *only* for form-section eyebrows ≤12px uppercase |
| Lore / journal blocks | **IM Fell English** italic | Used in `CharacterProfile` background, Story body, Wiki headings |
| Numerals (stats, counts) | **Inter** with `font-variant-numeric: tabular-nums` | Solves alignment in directory toolbars |

**Hierarchy is rebuilt around a modular scale of 1.250 (Major Third):**
12 / 14 / 16 / 20 / 25 / 31 / 39 / 49 / 61 px. Audit notes h2 at 2.5rem is too loud in dense pages — new h2 lands at 31px (≈1.94rem) reserved for page titles; hero displays use 49–61.

### 3.2 Color

The existing Quasar primitives stay (brand recognition). New layered tokens slot underneath:

```scss
// Brand (unchanged)
$primary:   #DDB476;  // Hydaelyn gold
$secondary: #9F84BD;  // Zodiark violet
$accent:    #EBC3DB;  // Echo rose

// New surface tokens — Hydaelyn (light)
--surface-pearl:    #F5EFE2;  // page bg
--surface-vellum:   #FBF6EA;  // card bg
--surface-ink:      #2B2418;  // body copy
--ink-muted:        #6E5F46;
--rule-gold:        #BA9B5B;  // hairline gold
--rule-gold-soft:   rgba(186, 155, 91, 0.28);
--glow-aether:      #7FE6E2;  // hover/focus aura
--glow-elpis:       #FFD3B0;
--crystal-prism:    linear-gradient(135deg, #A7E2FF 0%, #FFFFFF 45%, #E8C9FF 100%);

// Zodiark (dark)
--surface-obsidian: #0B0612;
--surface-deep:     #150B23;
--surface-lift:     #1F1130;
--ink-luminous:     #ECE3F7;
--rule-arcane:      #6B4FA8;
--glow-aether-d:    #B8A5FF;
--glow-zodiark:     #C19BFF;
```

**Semantic:** `success #4FB890`, `warning #E5B25E`, `danger #C7484F`, `info #5DA9D8`. All have AA contrast on both surfaces — a regression from the current `#C10015` negative which fails AA on `#fdfdffee`.

**Layering rule (replaces ad-hoc transparencies):**
```
elevation/0  page surface
elevation/1  card  (glass: pearl @ 88% blur 14)
elevation/2  popover (glass: pearl @ 92% blur 22, hairline gold)
elevation/3  dialog (vellum @ 96% blur 30, double hairline + ornament corners)
elevation/4  toast (obsidian on light, pearl on dark — inversion for emphasis)
```

### 3.3 Materials

Five named materials, used consistently:

1. **Vellum** — lightly textured cream surface for cards and panels. SVG noise overlay at 4% opacity. Used by directory cards, profile boxes, story body.
2. **Aetherglass** — frosted translucent panel with a `2px` inner gold rule and a subtle `inset 0 1px 0 rgba(255,255,255,0.6)` highlight. Used by header, drawer, dialogs.
3. **Obsidian** — deep purple-black with internal gradient streaks (slow CSS animation, 40 s). Dark-mode page background.
4. **Crystal** — refractive faceted accent. Reserved: brand mark, theme toggle, primary CTA on hero, Pen & Paper dice.
5. **Parchment** — cream + ink-rule horizontals. Reserved: Story view, Wiki body, Character Diary cards.

Each material is implemented as a `.mat-vellum`, `.mat-aetherglass`, etc. utility class plus a Vue mixin that provides hover/focus variants.

### 3.4 Ornament & iconography

- **Corner flourishes** — inline SVG, applied via `::before/::after` to dialogs and hero panels. Five sizes; never used on cards smaller than 320px.
- **Section dividers** — three SVG variants: a Hydaelyn glyph for h2 in profile pages, a quill-and-line for stories, a small triskelion for FAQ/rules.
- **Job-style role badges** — replace plain Quasar chips for moderator/admin/trusted with stamped square frames.
- **Material icons** stay for dense UI. **Lucide** is used for modern UI icons that lack a Material equivalent. **Custom SVG sprite** is used for ornamental items only (corners, dividers, glyphs, dice faces).

### 3.5 Spacing & rhythm

8 px baseline grid, tightened to 4 px inside cards. New spacing tokens — `--space-1` (4) through `--space-12` (96). The existing layout grids are preserved; only inner padding/margin is normalized.

---

## 4. Motion Language: "Anima"

Motion gets a name because it gets a *spec*.

### 4.1 Easing curves (named)

| Name | Curve | Use |
|---|---|---|
| `ease-elpis` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for hovers, drawer slides — quick start, gentle settle |
| `ease-aether` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Confirmations, badge pops — slight overshoot |
| `ease-zodiark` | `cubic-bezier(0.7, 0, 0.84, 0)` | Modals closing, errors disappearing — heavy in/light out |
| `ease-tide` | `cubic-bezier(0.45, 0, 0.55, 1)` | Long ambient loops (cloud drift, glow pulse) |

### 4.2 Duration tokens

`--motion-instant 80ms`, `--motion-fast 160ms`, `--motion-base 260ms`, `--motion-slow 420ms`, `--motion-cinematic 720ms`, `--motion-ambient 6000ms`.
All wrapped in a `@media (prefers-reduced-motion)` override that collapses everything to `--motion-instant` and disables ambient loops — non-negotiable.

### 4.3 The motion catalogue

#### Hovers
- **Card hover** — Y -2 → -4 px, shadow grows from `elevation/1` to `elevation/2`, hairline gold rule strengthens 0.28 → 0.6 alpha. `--motion-fast`, `ease-elpis`. (Today: jumpy `translateY(-2px)` with no shadow choreography — see audit §6.)
- **Primary button** — gradient sheen sweeps left→right (180 ms) on hover; pressed state inset shadow.
- **Avatar** — soft aether ring expands from `box-shadow: 0 0 0 0` to `0 0 0 4px rgba(127, 230, 226, 0.35)`; `ease-aether`.
- **Internal link in body copy** — text gains an underline that *draws in* via `text-decoration-thickness` + `background-image` gradient, never a hard underline appearing.

#### Page transitions
- Default: 220 ms cross-fade with a 4 px upward translate on the inbound view. `ease-elpis`.
- Hero pages (`/`, `/calendar`, character profile): 360 ms — outbound dims to 60% with a slight scale-down (0.99), inbound rises with a faint `--glow-aether` band sweeping top-to-bottom (think: Echo activating).
- Login → home: 720 ms cinematic — a Crystal-of-Light bloom expands from the avatar into the page, particles dispersing.

#### Drawer
The left drawer currently slides as a default Quasar drawer. Replace with: panel slides at 280 ms `ease-elpis`, with a gold-rule line that *draws downward* (clip-path) reaching full height at 240 ms, then nav items stagger-fade in (35 ms increments, 8 items max → 280 ms total).

#### Loading
- Top loading bar (Quasar): replace the flat 4px accent strip with a *prismatic* bar — a `linear-gradient` cycling across the four aether colors, animated with `background-position`.
- Skeletons replace generic gray with a faint scanning aether sheen.
- Long loads (>1.5 s) show an Aetheryte-style Lottie loader: a slowly rotating crystal silhouette with three concentric pulses on `--motion-ambient`.

#### Confirmations & errors
- Save: button scales 1.0 → 1.04 → 1.0 over 240 ms `ease-aether` while a faint particle burst (7 motes, 80 px radius) emanates and dissipates over 600 ms.
- Error: form field shakes once (3 px both directions, 160 ms total), border transitions to danger token at the *end* of the shake — current implementation flips color instantly (jarring).
- Toast in: enters from the bottom-right with a gold-rule that draws first (140 ms), then content fades in (140 ms offset 80 ms).

#### Ambient micro-life
Used **sparingly**, only on these surfaces, and disabled for `prefers-reduced-motion`:
- **Home hero** — 12 slow drifting aether motes, 0.4 vw/s, parallax depth 3 layers.
- **Login** — Crystal-of-Light hero (Three.js), low poly, ~3000 vertices, slow rotation 30 s/rev.
- **Calendar widget** when collapsed — the icon pulses every 4 s.
- **Empty states** — a single floating Elpis flower SVG idles with a 6 s sine bob.
- **Pen & Paper dice oracle** — when result lands, dice pulses with a soft rune flash.

#### Scroll choreography
- Sections reveal once on enter: `opacity 0 → 1`, `translateY 24 → 0`, `--motion-base`. Stagger 60 ms across siblings.
- The home activity grid panels reveal as a wave from top-left to bottom-right (diagonal stagger).
- Long-form content (Story, Wiki) gets a thin scroll-progress rule along the top of the content surface (gold gradient 0% → 100%).

#### Hover parallax (selective)
- Character directory cards (only `gt-md`): inner avatar shifts 0–6 px to follow cursor; card itself tilts ≤4° on the X/Y axes via mouse-relative transforms. Performance gated by IntersectionObserver — only cards in viewport receive listeners.

### 4.4 What stays still
- All form inputs, dropdown menus, table rows in dense views (search results, support queue) — animation here is *cost*, not value.
- All admin/moderation routes — these are work surfaces, not showcase.

---

## 5. Audio (optional, opt-in, default OFF)

A single short audio kit, gated behind a setting in the existing `TelemetryConsentDialog`-adjacent preferences:

- `confirm.ogg` — soft chime, 220 ms, –24 LUFS.
- `error.ogg` — muted thud, 180 ms.
- `nav.ogg` — page-turn rustle, 320 ms (only on Story / Wiki / Diary).
- `levelup.ogg` — used once, on first character verification ("Echo awakens").

Implementation: Howler.js, lazy-loaded, ducked when other audio plays, never auto-plays on first paint. **Will never play without user opt-in.**

---

## 6. Component-Level Rework Map

Each row references the audit. *No layout changes* — only material/typography/motion swaps.

| Audit § | Surface | Material | Type swap | Motion additions | New ornaments |
|---|---|---|---|---|---|
| §2 | `MainLayout` header | Aetherglass | Cinzel kept; nav items → Inter 500 | Hover gold-rule sweep; theme toggle = crystal facet rotation 240 ms | Corner flourish at extreme left/right |
| §2 | Left drawer | Aetherglass (deeper) | Inter 500 nav | Open: gold-rule draw + stagger-fade items | Top divider glyph |
| §2 | Footer | Vellum (light) / Obsidian (dark) | Spectral 400 14px | – | Triskelion divider above footer |
| §6 | Home hero | Crystal hero w/ Three.js + aether motes | Cinzel 61, Spectral lead | Slow zoom-in on first paint; particle parallax | Crystal of Light brand mark |
| §6 | Activity grid panels | Vellum cards w/ hairline gold rule | Spectral h3, Inter labels | Diagonal-wave reveal on scroll | Section dividers between panels |
| §7.1 | `Character.vue` shell | Aetherglass drawer; Vellum content | Cinzel name, IM Fell italic for nicknames | Drawer mini→full hover with gold rule | Job-frame avatar treatment |
| §7.3 | `CharacterProfile` body | Parchment | IM Fell italic for background section | Section reveal stagger | Glyph rule between sections |
| §7.4 | `CharacterPenAndPaper` | Parchment + Crystal accents | Cinzel for card titles, Spectral body | Dice pulse + rune flash on roll; cards reveal as opening journal pages | Ornamental corners on cards |
| §7.10 | `EditCharacterAppearance` color picker | Crystal facets for shade buttons | – | Pickers expand with prism gradient sweep | – |
| §9.1 | `EventCalendar` grid | Vellum day cells, Aetherglass header | Inter dates | Day cells subtly highlight on hover (gold-rule); event icon hover lifts | Aetheryte motif behind "today" cell |
| §9.5 | `CalendarSidebarWidget` | Aetherglass | Spectral h6 | Idle pulse when collapsed; expand = card lift + content fade | Crystal divider at header |
| §10.2 | Venue subpages | Vellum | Spectral; Cinzel for venue name | Section drawer items have aetheryte-style "active" indicator | Overview gets ornamental hero |
| §12 | Story view | Parchment full-bleed | IM Fell h-roman, Spectral body | Page-turn transition between chapters; scroll-progress rule | Drop cap initial in Cinzel Eorzea |
| §14 | Wiki view | Parchment | Spectral; Cinzel for h2 | Wiki-link hover = soft underline draw + glow ring on hover | Illuminated-manuscript first-letter |
| §15 | Upload wizard | Aetherglass dialog | Inter | Step transitions slide horizontally with prism rule moving below | Stepper "completed" state = crystal facet |
| §17 | Support tickets | Vellum (no ornament) | Inter throughout | Minimal — work surface | – |
| §18 | Violations | Vellum (no ornament) | Inter | Minimal | – |
| §19 | Static legal pages | Parchment | IM Fell h2, Spectral body | Section reveals only | – |
| §20 | `TelemetryConsentDialog` | Aetherglass dialog (elevation/3) | Spectral | Open: corner flourishes draw in (180 ms) | Hydaelyn glyph at top |
| §21 | `HtmlEditor` | Vellum frame, gold-rule toolbar | Inter | Toolbar buttons get aether-glow on active | – |
| §22.4 | News masthead | Parchment | Cinzel display | One-time first-paint draw of horizontal rules + masthead title | Replace placeholder text (see §9 risks) |
| §22.7 | News article | Parchment columns | IM Fell italic subtitle, Spectral body | Drop cap glyphs, scroll progress | Quill divider between articles |

### Specific noted regressions to fix (from audit §27)

- §27.2 — TinyMCE API key moves to env config as part of Phase 1 (we touch the editor anyway).
- §27.3 — `isDirty` becomes a per-instance `ref` while we add motion to revert/save.
- §27.4 / §27.5 — Inventory preview gets its own `CharacterInventory` component while we re-skin the section.
- §27.8 — Wikilink syntax help becomes a small `?`-icon popover with an animated example, not just caption text.

---

## 7. Theming: Hydaelyn / Zodiark Duality

Today the toggle cycles Light → Dark → System. The tokens stay; we add **narrative**.

- **Light mode** rebrands to *Hydaelyn* — pearl/gold/Elpis palette, soft glow, parchment textures.
- **Dark mode** rebrands to *Zodiark* — obsidian/violet, arcane glow, deeper shadow.
- The toggle becomes a small Crystal of Light/Dark medallion. Switching plays a 480 ms cross-fade where surfaces *shift hue* before *shifting brightness* (avoids the harsh black-flash Quasar's default toggle produces).

Both modes pass WCAG AA on body copy and AAA on headlines; the audit's `#C10015` negative is replaced with `#C7484F` to clear AA on `--surface-pearl`.

---

## 8. Phased Roadmap

A safe, incremental rollout. Each phase shippable independently.

### Phase 0 — Foundations (1 sprint, ~2 weeks)
- Self-host fonts via Fontsource (DSGVO win — closes a `PRIVACY_COMPLIANCE_CHECKLIST` gap).
- Introduce the new color/motion/space token files.
- Add Motion One; build the `.mat-*` material utilities.
- Migrate the loading bar and reduced-motion guard.
- **No visible page rework yet** — prepare the system.

### Phase 1 — Shell & home (1 sprint)
- `MainLayout` re-skin (header Aetherglass, drawer animation, footer ornament).
- `Index.vue` hero with Crystal-of-Light + aether motes (Three.js dynamic import).
- Activity grid wave-reveal.
- Theme toggle re-implemented as Hydaelyn/Zodiark medallion.
- **Demo target:** a recognizable AAA-feel landing experience.

### Phase 2 — Character domain (2 sprints)
- `Character.vue` shell + drawer motion.
- Profile / Appearance / Personality / Contacts / Diary / Rumors re-skin.
- Pen & Paper sheet (Parchment, Crystal dice, journal-page reveals).
- Character switcher dialog ornamental treatment.
- **Demo target:** showpiece for community spotlight.

### Phase 3 — Events & calendar (1 sprint)
- Calendar grid Vellum cells + Aetheryte today-marker.
- Event detail page hero treatment.
- Sidebar widget refinement.
- Event stepper: prism rule under steps, completed-state crystal.

### Phase 4 — Venues / Communities / FCs (1 sprint)
- Vellum cards across directories.
- Venue subpage drawer ornaments.
- Profile pages parchment treatment for description.

### Phase 5 — Long-form: Stories / Wiki / Noticeboard (1 sprint)
- Parchment full-bleed treatment.
- Drop caps, illuminated initials.
- Scroll progress rule.
- Page-turn transitions.

### Phase 6 — Editors, gallery, upload (1 sprint)
- `HtmlEditor` frame + toolbar.
- Upload wizard dialog motion.
- `BannerEditSection` crop tool refresh.

### Phase 7 — News app (1 sprint)
- Masthead final design (resolves audit §27.1 placeholder text).
- Article body parchment + drop caps.
- Sidebar (`UserNavigation`, `IssueNavigation`) styling pass.

### Phase 8 — Polish, audio, QA (1 sprint)
- Optional audio kit behind opt-in.
- Reduced-motion audit (every animation reviewed).
- Performance pass (CLS, LCP, INP budgets).
- Cross-browser verification (Safari blur fallbacks).

**Total runway:** ~10 sprints (~5 calendar months at 2-week sprints).

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Performance regression from particles/Three.js | Medium | High | Lazy-load 3D assets; gate particles behind `prefers-reduced-motion` and battery-saver checks; LCP budget enforced in CI |
| Bundle bloat | Medium | Medium | 90 KB gzip cap; dynamic imports for hero-only deps; tree-shake Motion One |
| Safari `backdrop-filter` quirks for Aetherglass | Medium | Medium | Solid-color fallback per surface; feature-query check |
| Accessibility regression | Medium | High | Every new animation reviewed against `prefers-reduced-motion`; AA audit per phase |
| FF14 trademark / asset infringement | Low | High | Use *original* SVG ornaments inspired by canon; never extract game assets; keep Square Enix footer attribution; escalate to legal review pre-launch |
| Brand drift from established gold | Low | Medium | Quasar primary (`#DDB476`) preserved; Aetherium tokens layered, not replacing |
| Contributor friction (new tokens, materials) | Medium | Medium | Single `aetherium.md` README in `client/src/css/`; Storybook of materials and motion primitives |
| News-app placeholder masthead (audit §27.1) | High (already broken) | Medium | Phase 7 delivers final masthead with config-driven title/region/price |
| TinyMCE key exposure (audit §27.2) | High | High | Move to env in Phase 0, before any editor restyle work |

---

## 10. Acceptance Criteria

A phase is *done* when, in the affected area:

1. Every interactive surface has a defined hover, focus, active and disabled state expressed in the Aetherium tokens.
2. Every animation has an explicit `prefers-reduced-motion` fallback (and a manual test passes with the OS flag enabled).
3. Body text passes WCAG AA on both Hydaelyn and Zodiark surfaces; headlines pass AAA.
4. Lighthouse Performance score stays ≥85 on a throttled "Slow 4G / Moderate CPU" home-page run.
5. Cumulative Layout Shift ≤ 0.05; INP ≤ 200 ms p75.
6. The visual-regression suite (Percy or Chromatic on key routes) is green.
7. A 5-second test ("what site is this?") with three internal testers returns answers in the cluster of *"FFXIV community / Lodestone-feeling / fantasy journal / aetheryte"* — never *"generic CMS"*.

---

## 11. Out of scope (explicit)

- IA changes, route renames, page consolidations.
- Replacing Quasar.
- Changing the API surface.
- Adding new content domains.
- i18n framework introduction (it's needed — see audit §27.7 — but it is a *separate, parallel* effort, not a visual rework).
- Mobile-first redesign of the news app sidebars (audit §22.10) — handled as a layout fix outside this plan.

---

## 12. Deliverables

1. **`client/src/css/aetherium/`** — token files (`color.scss`, `motion.scss`, `space.scss`, `type.scss`), material utilities, ornament sprite.
2. **`client/src/composables/useMotion.ts`** — Motion One wrappers respecting reduced motion.
3. **`client/src/components/aether/`** — new low-level visual primitives: `<AetherCard>`, `<CrystalIcon>`, `<GlyphDivider>`, `<AetheryteBadge>`, `<ParchmentSurface>`, `<HoverParallax>`.
4. **Storybook (or Histoire) of the system** under `client/storybook/` so contributors can see motion and material specs in isolation.
5. **`AETHERIUM.md`** at `client/src/css/aetherium/` — the contributor's guide.
6. **Updated `UI_UX_AUDIT.md`** at end of each phase to reflect implemented surfaces.

---

## 13. The one-line elevator pitch

> *"Lodestone-grade typography, Aetheryte-grade motion, Endwalker-grade restraint — same site, with the soul turned up."*
