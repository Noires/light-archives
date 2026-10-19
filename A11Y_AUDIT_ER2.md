# Accessibility and Interaction Audit — Elpis Reborn 2

**Branch:** `er2/a11y-e2e`
**Date:** 2026-10-19
**Scope:** The visible ER2 client (`client/`) on 23 real routes, both themes, desktop and phone widths. There are two parts: an automated axe-core audit and scripted keyboard/pointer interaction checks. Fixes are in the same branch.

---

## Method

Both scripts drive headless Microsoft Edge through the Chrome DevTools Protocol (CDP). They use only Node 24 built-ins (`fetch`, `WebSocket`, `child_process`). They add no npm dependencies and nothing to the app bundle.

- `client/scripts/e2e/cdp.mjs`: a small CDP driver. It launches Edge with a throw-away profile, connects over WebSocket, wraps `Runtime.evaluate`, sets the viewport (`Emulation.setDeviceMetricsOverride`; `mobile: true` below 600 px), and sends real input via `Input.dispatchKeyEvent` / `Input.dispatchMouseEvent`. It also waits for each page to "settle": `readyState` is complete, no Quasar loading or skeleton is shown, and the DOM size is stable for two polls. On exit it kills its own Edge process tree by PID.
- **Preparation per browser:** load `/`, decline the telemetry consent dialog ("Ablehnen"), then set the theme in localStorage as `themeMode = __q_strn|light` or `__q_strn|dark`. Every audited page records whether `body--dark` matched the requested theme. All 92 pages did.
- **axe audit (`a11y-audit.mjs`):** axe-core 4.x (4.14.0 on this run) is fetched from jsDelivr in Node and evaluated inside the page. It then runs `axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice'] }, iframes: false })`. For each violation the script stores the rule id, impact, help text, node count and the first five targets. It also counts the color-contrast nodes axe could not decide on ("needs review"). The output is JSON plus a Markdown summary.
- **Interaction checks (`interactions.mjs`):** nine scripted checks that use real key and mouse events. Each reports PASS or FAIL with the reason for every step. The checks ran once in the light theme and once in the dark theme.
- **Data:** the dev server proxies `/api` to production (https://elpisgarten.de), so every page shows real content. All runs were logged out. The one moderator-only check simulates the session inside the page and stubs the API call (see below), so nothing is ever written to production.

### Coverage

| Dimension | Values |
|---|---|
| Routes (23) | `/`, `/profiles`, `/Shiva/Aeris_Khatayin`, `/Shiva/Aeris_Khatayin/kontakte`, `/free-companies`, `/fc/Shiva/Nymeia's_Raben`, `/communities`, `/community/Akademie_Eorzea`, `/venues`, `/venues/karte`, `/venue/Shiva/Ewige_Jungfer`, `/calendar`, `/event/44`, `/stories`, `/story/14`, `/noticeboard`, `/noticeboard/2`, `/wiki`, `/wiki/Test`, `/gallery/screenshot`, `/search?q=Nebel`, `/benachrichtigungen`, `/gemerkt` |
| Themes | light (Hydaelyn), dark (Zodiark) |
| Widths | 1440 px (desktop), 390 px (phone, mobile emulation) |
| Pages audited | 92 per run (23 x 2 x 2), 0 load or evaluation errors |
| Rule sets | WCAG 2.0 A/AA, WCAG 2.1 A/AA, axe best-practice |

---

## Results

### Totals by impact

| Impact | Before: rules | Before: nodes | After: rules | After: nodes |
|---|---|---|---|---|
| critical | 0 | 0 | 0 | 0 |
| serious | 2 | 68 | 0 | 0 |
| moderate | 3 | 28 | 1 | 8 |
| minor | 0 | 0 | 0 | 0 |
| **Total** | **5** | **96** | **1** | **8** |

Nodes are summed over all 92 pages, so one shared component, such as the header search button, counts once per page it appears on.

### By rule

| Rule | Impact | Before: pages / nodes | After: pages / nodes | Where | Fix |
|---|---|---|---|---|---|
| `label-content-name-mismatch` | serious | 50 / 66 | 0 / 0 | Header search button on every desktop page: `aria-label="Suchen (Strg K)"`, but the visible text is "Suchen… Strg K". Venue map ward tiles: `aria-label="Bezirk 3, 1 Treffpunkt"`, visible text "3" plus "1 Treffpunkt". Reader-rail buttons "A−" / "A+" named "Schrift kleiner" / "Schrift größer". | `ShellHeader.vue`: removed the `aria-label`, so the visible text is the name. In the icon-only range (1024–1279 px) the label is now visually hidden instead of `display: none`. `VenueMap.vue`: visible text plus visually hidden "Bezirk " and ", ". `StoryReaderRail.vue`: names now start with the glyph ("A−, Schrift kleiner"). WCAG 2.5.3. |
| `scrollable-region-focusable` | serious | 2 / 2 | 0 / 0 | Home timeline scroller at 390 px when no event bar is a link: it scrolls sideways but nothing inside can take focus. | `TimelineStrip.vue`: the scroller gets `tabindex="0"` (with the Aetherium focus ring) only when it contains no links. |
| `heading-order` | moderate | 16 / 20 | 4 / 8 | `EmptyState` always rendered an `h3`, even directly under the page `h1` (`/…/kontakte`, `/benachrichtigungen`, `/gemerkt`). The `h6` headings on `/venue/Shiva/Ewige_Jungfer` come from the venue description. | `EmptyState.vue`: new `headingLevel` prop (2–6, default 3). Set to 2 for page-level states in `Character.vue`, `Bookmarks.vue` and `Notifications.vue`. The venue `h6` findings remain (see "Remaining issues"). |
| `region` | moderate | 4 / 4 | 0 / 0 | Home hero logo (`.q-toolbar__title`) sits outside every landmark. | `ShellHero.vue`: the hero only repeats the top-bar logo link, so it is now `aria-hidden` and its link has `tabindex="-1"`. |
| `landmark-unique` | moderate | 4 / 4 | 0 / 0 | `/gallery/screenshot`: two `QPagination` instances, both `role="navigation"` without a name. | `Gallery.vue`: `aria-label="Seiten (oben)"` / `"Seiten (unten)"`. |

The audit found no critical violations and no `color-contrast` violations, before or after. axe marks about 2,500 contrast nodes over the 92 pages as "needs review" (it cannot decide them). A sample of five routes in each theme shows why:
- about three quarters sit on a background image (the parchment and stone surface textures)
- the rest sit on gradients or pseudo-element content, or are one-character strings

The contrast table from ER2-003 in `client/src/css/aetherium/AETHERIUM.md` already checks these token pairs against the solid surface colors (4.5:1 for text, 3:1 for indicators). This audit therefore does not treat them as findings.

### Interaction checks

All checks ran with real CDP key and mouse events at 1440 px; the mobile check ran at 390 px. The table shows the final run. The light and dark runs gave identical results.

| Check | Route | What is verified | Before fixes | After (light) | After (dark) |
|---|---|---|---|---|---|
| skip-link | `/profiles` | The first Tab focuses "Zum Inhalt springen"; Enter moves focus to `#inhalt`. | PASS | PASS | PASS |
| palette | `/profiles` | Ctrl+K opens the palette with focus in the combobox input. Typing "Nebel" shows results after the debounce. ArrowDown moves `aria-activedescendant` and the highlight. Esc closes it and focus returns to the element focused before. | PASS | PASS | PASS |
| lightbox | `/gallery/screenshot` | A mouse click on a tile opens it. ArrowRight changes the counter ("Bild 1 / 20" to "Bild 2 / 20"). Esc closes it and focus returns to the tile. | PASS | PASS | PASS |
| hover-card | `/event/44` | After revealing the event's CW veil, keyboard focus on a character wikilink in the prose shows the card only after the delay, sets `aria-describedby`, and Esc hides it while the link keeps focus. | PASS | PASS | PASS |
| section-tabs | `/Shiva/Aeris_Khatayin` | ArrowRight moves focus to the next tab; Enter activates it. The URL becomes `/Shiva/Aeris_Khatayin/pen-and-paper` and that tab is selected. scrollY stays the same (234 to 234) and the tabs stay in view. | PASS | PASS | PASS |
| cw-veil | `/story/14` | The warning card is present and comes before the content. The content is `inert` and `aria-hidden`. "Trotzdem lesen" removes the veil and moves focus into the content. | PASS | PASS | PASS |
| mobile-sheet | `/profiles` @ 390 | The bottom bar is visible. "Mehr" opens the sheet with focus inside it. Esc closes it and focus returns to "Mehr". | PASS | PASS | PASS |
| noticeboard-pin | `/noticeboard` | Moderator view (simulated): pinning moves the card to "Angeheftet" and focus follows to the same card's pin button (`aria-pressed="true"`). Focus stays there after the request. Unpinning moves focus back to the button in the list. | **FAIL**: focus fell to `body` | PASS | PASS |
| theme-toggle | `/profiles` | The header theme button cycles the modes; `body--dark` is gained and lost over three clicks. | PASS | PASS | PASS |

**The noticeboard-pin check.** Nobody can log in as a moderator against production from a test script. So the check commits a fake moderator session to the Vuex store inside the page and replaces `$api.noticeboard.setPinned` with a 400 ms stub, and nothing reaches the API. To confirm the check, it was run against the pre-fix code: it failed there (focus fell to `body`) and passes with the fix.

**The fix (`Noticeboard.vue`, `NoticeboardCard.vue`):**
- The pin button carries `data-nb-pin="<id>"`.
- `togglePin` calls `refocusPin(id)` after the optimistic flip, and again after a rollback. On the next tick, `refocusPin` focuses the same card's button in its new list.
- If the card has left the current page, focus falls back to `#inhalt`.
- While a request runs, the button uses `aria-disabled` instead of `disabled`. A disabled button cannot hold focus, which was a second way to lose it. Clicks are ignored while busy.

---

## Remaining issues

| Issue | Impact | Why it remains |
|---|---|---|
| `heading-order` on `/venue/Shiva/Ewige_Jungfer` (2 `h6` per page, 4 pages) | moderate | The headings are in the venue owner's own description HTML, rendered by `HtmlViewer`. Rewriting heading levels in user content would change what authors wrote and how the same content looks elsewhere. The better fix is editorial: the editor's heading menu could offer only levels that fit under the page outline. That is a candidate for a follow-up ticket, not this audit. |
| Contrast "needs review" (about 2,500 nodes) | n/a | axe cannot measure text on background images or gradients. The token pairs are covered by the ER2-003 contrast table (AA in both themes). For a spot check, use the existing probe or check forced states by hand. |
| Logged-in views not audited | n/a | All runs were logged out against production data. Editors (TinyMCE/HugeRTE), notification lists with content, the RSVP flow and the account menu were not reached by axe. Third-party embeds (Carrd iframes, editor iframes) are excluded anyway via `iframes: false`. Re-run with a session against a staging API before sign-off. |
| Mobile sheet focus target | n/a | When the sheet opens, Quasar focuses the dialog container (`.q-dialog__inner`), not its first control. This is valid for a modal dialog (the name "Mehr" is announced), so it was left as Quasar's default. |
| Screen-reader behavior | n/a | axe and CDP checks do not replace a real NVDA or VoiceOver pass. The checklist is in `UI_UX_USER_TEST_KIT.md` §8. |

---

## Files changed

| File | Change |
|---|---|
| `client/scripts/e2e/cdp.mjs` | new: CDP driver for headless Edge/Chrome |
| `client/scripts/e2e/a11y-audit.mjs` | new: axe audit over routes x themes x widths |
| `client/scripts/e2e/interactions.mjs` | new: nine interaction checks |
| `client/.gitignore` | ignore `scripts/e2e/out` |
| `client/src/layouts/shell/ShellHeader.vue` | search button name from visible text |
| `client/src/layouts/shell/ShellHero.vue` | decorative hero logo hidden from AT and tab order |
| `client/src/components/outlook/VenueMap.vue` | ward tile names match visible text |
| `client/src/components/stories/StoryReaderRail.vue` | size button names start with the glyph |
| `client/src/components/vision/EmptyState.vue` | `headingLevel` prop |
| `client/src/pages/Character.vue`, `Bookmarks.vue`, `Notifications.vue` | page-level empty states use `h2` |
| `client/src/pages/Gallery.vue` | distinct pagination landmark names |
| `client/src/components/vision/TimelineStrip.vue` | scroller is focusable when it has no links |
| `client/src/pages/Noticeboard.vue`, `client/src/components/noticeboard/NoticeboardCard.vue` | pin focus follows the card; `aria-disabled` while busy |

---

## How to re-run

1. Start the dev server from the worktree (it proxies `/api` to production):

   ```bash
   cd client
   npx quasar dev --port 8095
   ```

2. In a second shell, from `client/`:

   ```bash
   # Full axe audit (about 8 minutes): writes scripts/e2e/out/a11y-<label>.json and .md
   node scripts/e2e/a11y-audit.mjs --label after

   # Subsets
   node scripts/e2e/a11y-audit.mjs --routes /story/14,/venues/karte --themes dark --widths 390 --label spot

   # Interaction checks (exit code 1 on any FAIL): writes scripts/e2e/out/interactions.json
   node scripts/e2e/interactions.mjs
   node scripts/e2e/interactions.mjs --theme dark --out scripts/e2e/out/dark
   node scripts/e2e/interactions.mjs --only palette,lightbox
   ```

   Options: `--base` (default `http://localhost:8095`, or env `E2E_BASE`), `--out`. To use another Chromium browser, set the env `E2E_BROWSER`.

3. In Git Bash on Windows, prefix the command with `MSYS_NO_PATHCONV=1`. Otherwise MSYS rewrites route arguments like `/` into Windows paths. PowerShell and cmd do not need this.

4. Lint the scripts. They are ES modules with top-level await, which the app's ESLint 7 config does not parse, so lint them standalone:

   ```bash
   npx eslint --no-eslintrc --env node,es2021,browser --parser @typescript-eslint/parser \
     --parser-options=ecmaVersion:2022,sourceType:module \
     --rule '{"no-unused-vars":"error","no-undef":"error","prefer-const":"error","eqeqeq":"error"}' \
     scripts/e2e/*.mjs
   ```

Data comes from production, so counts can drift as content changes. For example, an event with links can appear in the timeline, or a venue description can be edited. Compare by rule rather than by raw node count.
