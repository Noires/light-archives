// Masthead + global newspaper identity.
//
// Title / region / price replace the in-template placeholders that previously
// shipped in SiteHeader (audit §27.1). Each value reads from a Quasar build
// env var first (so deployments can override without a code change) and falls
// back to a sensible default tied to the Light Archives identity:
//
//   process.env.NEWS_MASTHEAD_TITLE    → masthead lockup
//   process.env.NEWS_MASTHEAD_REGION   → left-rail location string
//   process.env.NEWS_MASTHEAD_PRICE    → right-rail price string
//
// Quasar exposes process.env via the `build.env` map in quasar.conf.js — the
// defaults here are what ships when no override is set, so the build is
// always presentable.

const env = (process.env || {}) as Record<string, string | undefined>;

export const SITE_CONFIG = {
	// "The Harborwatch" mirrors the productName declared in package.json — kept
	// in lockstep so the masthead and the document title agree.
	title: env.NEWS_MASTHEAD_TITLE || 'The Harborwatch',
	region: env.NEWS_MASTHEAD_REGION || 'Lichtwacht · Datacenter Light',
	price: env.NEWS_MASTHEAD_PRICE || 'Eine Gil',
} as const;
