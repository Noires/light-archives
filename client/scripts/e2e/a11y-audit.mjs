// axe-core audit over the main routes, both themes and two widths.
//
// Usage (dev server running, see A11Y_AUDIT_ER2.md):
//   node scripts/e2e/a11y-audit.mjs [--base http://localhost:8095] [--out scripts/e2e/out]
//        [--routes /,/profiles] [--themes light,dark] [--widths 1440,390] [--label before]
//
// axe-core is downloaded from jsDelivr at run time and evaluated inside the
// headless browser only. It is never bundled with the app.
// Output: <out>/a11y-<label>.json and <out>/a11y-<label>.md
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DEFAULT_BASE, launch, parseArgs, prepare, sleep, storeTheme } from './cdp.mjs';

export const ROUTES = [
  '/',
  '/profiles',
  '/Shiva/Aeris_Khatayin',
  '/Shiva/Aeris_Khatayin/kontakte',
  '/free-companies',
  "/fc/Shiva/Nymeia's_Raben",
  '/communities',
  '/community/Akademie_Eorzea',
  '/venues',
  '/venues/karte',
  '/venue/Shiva/Ewige_Jungfer',
  '/calendar',
  '/event/44',
  '/stories',
  '/story/14',
  '/noticeboard',
  '/noticeboard/2',
  '/wiki',
  '/wiki/Test',
  '/gallery/screenshot',
  '/search?q=Nebel',
  '/benachrichtigungen',
  '/gemerkt',
];

const AXE_URL = 'https://cdn.jsdelivr.net/npm/axe-core@4/axe.min.js';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
const IMPACT_ORDER = ['critical', 'serious', 'moderate', 'minor'];

const args = parseArgs();
const BASE = String(args.base || DEFAULT_BASE).replace(/\/$/, '');
const OUT = resolve(String(args.out || 'scripts/e2e/out'));
const LABEL = String(args.label || 'latest');
const routes = args.routes ? String(args.routes).split(',') : ROUTES;
const themes = args.themes ? String(args.themes).split(',') : ['light', 'dark'];
const widths = args.widths ? String(args.widths).split(',').map(Number) : [1440, 390];

mkdirSync(OUT, { recursive: true });

const axeSource = await (await fetch(AXE_URL)).text();
if (!axeSource.includes('axe')) {
  throw new Error(`Could not download axe-core from ${AXE_URL}`);
}

const RUN_AXE = `(async () => {
  if (!window.axe) { (0, eval)(${JSON.stringify(axeSource)}); }
  const res = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ${JSON.stringify(TAGS)} },
    iframes: false,
    resultTypes: ['violations'],
  });
  return {
    version: window.axe.version,
    url: location.pathname + location.search,
    bodyClass: document.body.className,
    violations: res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 200),
        summary: (n.failureSummary || '').split('\\n').slice(0, 3).join(' ').slice(0, 300),
      })),
    })),
  };
})()`;

const results = [];
const startedAt = new Date().toISOString();

for (const theme of themes) {
  for (const width of widths) {
    const page = await launch({ width });
    try {
      await page.setViewport(width);
      await prepare(page, BASE, theme);
      for (const route of routes) {
        const entry = { route, theme, width };
        try {
          await page.navigate(BASE + route, { min: 2500, max: 15000 });
          await storeTheme(page, theme);
          // Let images, maps and lazy chunks finish before auditing.
          await sleep(800);
          const res = await page.evaluate(RUN_AXE, { timeout: 120000 });
          entry.axe = res.version;
          entry.themeApplied = theme === 'dark' ? res.bodyClass.includes('body--dark') : !res.bodyClass.includes('body--dark');
          entry.violations = res.violations;
        } catch (e) {
          entry.error = e.message;
          entry.violations = [];
        }
        results.push(entry);
        const counts = entry.violations.reduce((acc, v) => ({ ...acc, [v.impact]: (acc[v.impact] || 0) + 1 }), {});
        console.log(`${theme.padEnd(5)} ${String(width).padEnd(4)} ${route.padEnd(36)} ${entry.error ? 'ERROR ' + entry.error : JSON.stringify(counts)}`);
      }
    } finally {
      page.close();
    }
  }
}

writeFileSync(join(OUT, `a11y-${LABEL}.json`), JSON.stringify({ startedAt, base: BASE, tags: TAGS, results }, null, 1));
writeFileSync(join(OUT, `a11y-${LABEL}.md`), summarize(results));
console.log(`\nWrote ${join(OUT, `a11y-${LABEL}.json`)} and .md`);

function summarize(list) {
  const byRule = new Map();
  for (const entry of list) {
    for (const v of entry.violations) {
      const rule = byRule.get(v.id) || { id: v.id, impact: v.impact, help: v.help, pages: 0, nodes: 0, examples: [] };
      rule.pages++;
      rule.nodes += v.nodes;
      if (rule.examples.length < 3) {
        rule.examples.push(`${entry.route} (${entry.theme}, ${entry.width}): \`${v.targets[0]?.target || ''}\``);
      }
      byRule.set(v.id, rule);
    }
  }
  const rules = [...byRule.values()].sort((a, b) => IMPACT_ORDER.indexOf(a.impact) - IMPACT_ORDER.indexOf(b.impact) || b.nodes - a.nodes);
  const totals = Object.fromEntries(IMPACT_ORDER.map((i) => [i, rules.filter((r) => r.impact === i).reduce((s, r) => s + r.nodes, 0)]));

  const lines = [
    `# axe audit (${LABEL})`,
    '',
    `Run: ${startedAt}, base ${BASE}, tags ${TAGS.join(', ')}.`,
    `Pages: ${list.length} (${routes.length} routes x ${themes.length} themes x ${widths.length} widths). Errors: ${list.filter((e) => e.error).length}.`,
    '',
    '| Impact | Rules | Nodes |',
    '|---|---|---|',
    ...IMPACT_ORDER.map((i) => `| ${i} | ${rules.filter((r) => r.impact === i).length} | ${totals[i]} |`),
    '',
    '## By rule',
    '',
    '| Rule | Impact | Pages | Nodes | Help | Examples |',
    '|---|---|---|---|---|---|',
    ...rules.map((r) => `| ${r.id} | ${r.impact} | ${r.pages} | ${r.nodes} | ${r.help} | ${r.examples.join('<br>')} |`),
    '',
    '## By page',
    '',
    '| Route | Theme | Width | Violations |',
    '|---|---|---|---|',
    ...list.map((e) => `| ${e.route} | ${e.theme} | ${e.width} | ${e.error ? 'ERROR: ' + e.error : e.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes})`).join(', ') || 'none'} |`),
    '',
  ];
  return lines.join('\n');
}

process.exit(0);
