// Keyboard and pointer interaction checks driven through CDP Input events.
//
// Usage (dev server running, see A11Y_AUDIT_ER2.md):
//   node scripts/e2e/interactions.mjs [--base http://localhost:8095] [--theme light|dark]
//        [--out scripts/e2e/out] [--only skip-link,palette]
//
// Prints PASS/FAIL per check with a reason and writes <out>/interactions.json.
// Exit code 1 if any check fails.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DEFAULT_BASE, launch, parseArgs, prepare, sleep } from './cdp.mjs';

const args = parseArgs();
const BASE = String(args.base || DEFAULT_BASE).replace(/\/$/, '');
const THEME = String(args.theme || 'light');
const OUT = resolve(String(args.out || 'scripts/e2e/out'));
const ONLY = args.only ? String(args.only).split(',') : null;
mkdirSync(OUT, { recursive: true });

const page = await launch({ width: 1440 });
await prepare(page, BASE, THEME);

const results = [];

/** Short description of document.activeElement. */
const ACTIVE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'body';
  const label = el.getAttribute('aria-label') || el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 40);
  return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/)[0] : '') + ' "' + label + '"';
})()`;

async function goto(path, width = 1440) {
  await page.setViewport(width);
  await page.navigate(BASE + path, { min: 2500, max: 15000 });
  await page.evaluate('document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); true');
}

async function waitFor(expr, timeout = 4000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await page.evaluate(expr)) {
      return true;
    }
    await sleep(100);
  }
  return false;
}

async function check(name, fn) {
  if (ONLY && !ONLY.includes(name)) {
    return;
  }
  const steps = [];
  const assert = (ok, msg) => {
    steps.push(`${ok ? 'ok' : 'FAIL'}: ${msg}`);
    if (!ok) {
      throw new Error(msg);
    }
  };
  let pass = false;
  let reason = '';
  try {
    await fn(assert);
    pass = true;
    reason = steps.join('; ');
  } catch (e) {
    reason = steps.length && steps[steps.length - 1].startsWith('FAIL') ? steps.join('; ') : `${steps.join('; ')}; error: ${e.message}`;
  }
  results.push({ name, pass, reason });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name.padEnd(14)} ${reason}`);
}

// 1. Skip link --------------------------------------------------------------
await check('skip-link', async (assert) => {
  await goto('/profiles');
  await page.press('Tab');
  await sleep(150);
  const first = await page.evaluate(ACTIVE);
  assert(/Zum Inhalt springen/.test(first), `first Tab focuses ${first}`);
  await page.press('Enter');
  await sleep(300);
  const inMain = await page.evaluate(`(() => { const m = document.getElementById('inhalt'); return !!m && (document.activeElement === m || m.contains(document.activeElement)); })()`);
  assert(inMain, `Enter moves focus to ${await page.evaluate(ACTIVE)}`);
});

// 2. Command palette --------------------------------------------------------
await check('palette', async (assert) => {
  await goto('/profiles');
  await page.press('Tab');
  await page.press('Tab');
  await sleep(100);
  await page.evaluate(`document.activeElement.setAttribute('data-e2e-origin', ''); true`);
  const origin = await page.evaluate(ACTIVE);
  await page.press('k', ['ctrl']);
  const open = await waitFor(`!!document.querySelector('.vision-palette__input') && document.activeElement === document.querySelector('.vision-palette__input')`, 5000);
  assert(open, `Ctrl+K opens palette with focus in input (focus: ${await page.evaluate(ACTIVE)})`);
  await page.type('Nebel');
  const hasResults = await waitFor(`[...document.querySelectorAll('.vision-palette__option')].some((o) => !o.id.includes('action-'))`, 8000);
  assert(hasResults, `typing "Nebel" shows results (${await page.evaluate(`document.querySelectorAll('.vision-palette__option').length`)} options)`);
  await page.press('ArrowDown');
  await sleep(100);
  const first = await page.evaluate(`document.querySelector('.vision-palette__input').getAttribute('aria-activedescendant')`);
  await page.press('ArrowDown');
  await sleep(100);
  const second = await page.evaluate(`document.querySelector('.vision-palette__input').getAttribute('aria-activedescendant')`);
  const highlighted = await page.evaluate(`document.querySelector('.vision-palette__option--active')?.id || ''`);
  assert(!!first && !!second && first !== second && highlighted === second, `ArrowDown moves highlight (${first} -> ${second})`);
  await page.press('Escape');
  const closed = await waitFor(`!document.querySelector('.vision-palette')`, 3000);
  assert(closed, 'Esc closes palette');
  await sleep(200);
  const back = await page.evaluate(`document.activeElement && document.activeElement.hasAttribute('data-e2e-origin')`);
  assert(back, `focus returns to ${origin} (now ${await page.evaluate(ACTIVE)})`);
});

// 3. Lightbox ---------------------------------------------------------------
await check('lightbox', async (assert) => {
  await goto('/gallery/screenshot');
  const tiles = await page.evaluate(`document.querySelectorAll('.page-gallery__link').length`);
  assert(tiles > 1, `gallery has ${tiles} tiles`);
  await page.evaluate(`document.querySelector('.page-gallery__link').setAttribute('data-e2e-origin', ''); true`);
  await page.clickSelector('.page-gallery__link');
  const open = await waitFor(`!!document.querySelector('.vision-lightbox__counter')`, 6000);
  assert(open, 'click opens lightbox');
  await sleep(400);
  const counter = () => page.evaluate(`document.querySelector('.vision-lightbox__counter')?.textContent.replace(/\\s+/g, ' ').trim()`);
  const before = await counter();
  await page.press('ArrowRight');
  await sleep(500);
  const after = await counter();
  assert(before !== after && /2 \//.test(after), `ArrowRight changes counter (${before} -> ${after})`);
  await page.press('Escape');
  const closed = await waitFor(`!document.querySelector('.vision-lightbox')`, 3000);
  assert(closed, 'Esc closes lightbox');
  await sleep(300);
  const back = await page.evaluate(`document.activeElement && document.activeElement.hasAttribute('data-e2e-origin')`);
  assert(back, `focus returns to the tile (now ${await page.evaluate(ACTIVE)})`);
});

// 4. Hover card -------------------------------------------------------------
await check('hover-card', async (assert) => {
  const FIND = `(() => {
    // Character paths (/Server/Name) first, then wikilinks (/link/Name).
    const links = [...document.querySelectorAll('#inhalt section a[href]')].filter((el) => !el.closest('[inert]'));
    const matching = (re) => links.find((el) => {
      try { const u = new URL(el.getAttribute('href'), location.href); return u.host === location.host && re.test(u.pathname); } catch { return false; }
    });
    const a = matching(/^\\/[A-Z][a-z]+\\/[^/]+\\/?$/) || matching(/^\\/link\\/[^/]+\\/?$/);
    if (!a) return null;
    a.setAttribute('data-e2e-origin', '');
    return a.getAttribute('href');
  })()`;
  let href = null;
  let route = null;
  for (const candidate of ['/event/44', '/wiki/Test', '/Shiva/Aeris_Khatayin']) {
    await goto(candidate);
    // Events can carry content warnings; reveal the prose first.
    await page.evaluate(`[...document.querySelectorAll('.cw-veil__card button')].find((b) => /Trotzdem lesen/.test(b.textContent))?.click(); true`);
    await sleep(300);
    href = await page.evaluate(FIND);
    if (href) {
      route = candidate;
      break;
    }
  }
  assert(!!href, `found a character link in prose (${route} ${href})`);
  // A key press first, so programmatic focus counts as keyboard focus (:focus-visible).
  await page.press('Shift');
  await page.evaluate(`(() => { const a = document.querySelector('[data-e2e-origin]'); a.scrollIntoView({ block: 'center' }); a.focus(); return true; })()`);
  const early = await page.evaluate(`!!document.getElementById('vision-hovercard')`);
  const shown = await waitFor(`!!document.getElementById('vision-hovercard')`, 4000);
  assert(!early && shown, 'card appears after the delay on keyboard focus');
  const described = await page.evaluate(`(document.querySelector('[data-e2e-origin]').getAttribute('aria-describedby') || '').includes('vision-hovercard')`);
  assert(described, 'focused link is aria-describedby the card');
  await page.press('Escape');
  const hidden = await waitFor(`!document.getElementById('vision-hovercard')`, 2000);
  const kept = await page.evaluate(`document.activeElement && document.activeElement.hasAttribute('data-e2e-origin')`);
  assert(hidden && kept, 'Esc hides the card and the link keeps focus');
});

// 5. SectionTabs on the character page -------------------------------------
await check('section-tabs', async (assert) => {
  await goto('/Shiva/Aeris_Khatayin');
  const ok = await waitFor(`!!document.querySelector('.page-character__tabs [role="tab"]')`, 6000);
  assert(ok, 'character tabs rendered');
  await page.evaluate(`(() => { const t = document.querySelector('.page-character__tabs'); window.scrollTo(0, Math.max(0, t.getBoundingClientRect().top + window.scrollY - 200)); return true; })()`);
  await sleep(300);
  await page.press('Shift');
  await page.evaluate(`document.querySelector('.page-character__tabs [role="tab"][aria-selected="true"]').focus(); true`);
  const scrollBefore = await page.evaluate('Math.round(window.scrollY)');
  const firstKey = await page.evaluate(`document.activeElement.dataset.tabKey`);
  await page.press('ArrowRight');
  await sleep(150);
  const nextKey = await page.evaluate(`document.activeElement.dataset.tabKey || ''`);
  const moved = await page.evaluate(`document.activeElement.getAttribute('role') === 'tab'`);
  assert(moved && nextKey && nextKey !== firstKey, `ArrowRight moves focus ${firstKey} -> ${nextKey}`);
  await page.press('Enter');
  await sleep(1500);
  const path = await page.evaluate('decodeURIComponent(location.pathname)');
  assert(/^\/Shiva\/Aeris_Khatayin\/[^/]+$/.test(path), `URL is ${path}`);
  const selected = await page.evaluate(`document.querySelector('.page-character__tabs [role="tab"][aria-selected="true"]')?.dataset.tabKey`);
  assert(selected === nextKey, `tab ${nextKey} is selected (${selected})`);
  const scrollAfter = await page.evaluate('Math.round(window.scrollY)');
  const tabsVisible = await page.evaluate(`(() => { const r = document.querySelector('.page-character__tabs').getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; })()`);
  assert(scrollBefore === 0 || (scrollAfter > 0 && tabsVisible), `no jump to top (scrollY ${scrollBefore} -> ${scrollAfter}, tabs in view: ${tabsVisible})`);
});

// 6. CwVeil -----------------------------------------------------------------
await check('cw-veil', async (assert) => {
  await page.evaluate('sessionStorage.clear(); true');
  await goto('/story/14');
  const veiled = await waitFor(`!!document.querySelector('.cw-veil__card')`, 6000);
  assert(veiled, 'warning card present');
  const inert = await page.evaluate(`(() => { const c = document.querySelector('.cw-veil__content'); return !!c && c.hasAttribute('inert') && c.getAttribute('aria-hidden') === 'true'; })()`);
  assert(inert, 'content is inert and aria-hidden');
  const cardFirst = await page.evaluate(`(() => { const card = document.querySelector('.cw-veil__card'); const c = document.querySelector('.cw-veil__content'); return !!(card.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING); })()`);
  assert(cardFirst, 'card precedes content in DOM order');
  await page.press('Shift');
  const focused = await page.evaluate(`(() => { const b = [...document.querySelectorAll('.cw-veil__card button')].find((el) => /Trotzdem lesen/.test(el.textContent)); if (!b) return false; b.focus(); return document.activeElement === b; })()`);
  assert(focused, '"Trotzdem lesen" is focusable');
  await page.press('Enter');
  const gone = await waitFor(`!document.querySelector('.cw-veil__card')`, 2000);
  assert(gone, 'veil removed');
  await sleep(200);
  const inContent = await page.evaluate(`(() => { const c = document.querySelector('.cw-veil__content'); return !!c && !c.hasAttribute('inert') && (document.activeElement === c || c.contains(document.activeElement)); })()`);
  assert(inContent, `focus moves into the content (${await page.evaluate(ACTIVE)})`);
});

// 7. Mobile bottom bar and "Mehr" sheet ------------------------------------
await check('mobile-sheet', async (assert) => {
  await goto('/profiles', 390);
  const bar = await page.evaluate(`(() => { const n = document.querySelector('.shell-mobile-bar'); if (!n) return false; const r = n.getBoundingClientRect(); return getComputedStyle(n).display !== 'none' && r.height > 0 && r.bottom <= window.innerHeight + 1; })()`);
  assert(bar, 'bottom bar visible at 390 px');
  await page.press('Shift');
  const focused = await page.evaluate(`(() => { const b = [...document.querySelectorAll('.shell-mobile-bar button')].find((el) => /Mehr/.test(el.textContent)); if (!b) return false; b.setAttribute('data-e2e-origin', ''); b.focus(); return document.activeElement === b; })()`);
  assert(focused, '"Mehr" button focusable');
  await page.press('Enter');
  const open = await waitFor(`!!document.querySelector('.shell-sheet')`, 3000);
  assert(open, '"Mehr" opens the sheet');
  await sleep(400);
  const trapped = await page.evaluate(`!!document.activeElement && !!document.activeElement.closest('.q-dialog')`);
  assert(trapped, `focus moves into the sheet (${await page.evaluate(ACTIVE)})`);
  await page.press('Escape');
  const closed = await waitFor(`!document.querySelector('.shell-sheet')`, 3000);
  assert(closed, 'Esc closes the sheet');
  await sleep(300);
  const back = await page.evaluate(`document.activeElement && document.activeElement.hasAttribute('data-e2e-origin')`);
  assert(back, `focus returns to "Mehr" (now ${await page.evaluate(ACTIVE)})`);
});

// 8. Theme toggle -----------------------------------------------------------
await check('theme-toggle', async (assert) => {
  await goto('/profiles');
  const seen = new Set();
  seen.add(await page.evaluate(`document.body.classList.contains('body--dark')`));
  for (let i = 0; i < 3; i++) {
    const clicked = await page.clickSelector('.shell-bar__theme');
    assert(clicked, 'theme toggle button found');
    await sleep(400);
    seen.add(await page.evaluate(`document.body.classList.contains('body--dark')`));
  }
  assert(seen.has(true) && seen.has(false), `body--dark gained and lost over 3 clicks (${[...seen].join(', ')})`);
  // Restore the run theme.
  await page.evaluate(`localStorage.setItem('themeMode', '__q_strn|${THEME}'); true`);
});

page.close();
writeFileSync(join(OUT, 'interactions.json'), JSON.stringify({ base: BASE, theme: THEME, results }, null, 1));
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
