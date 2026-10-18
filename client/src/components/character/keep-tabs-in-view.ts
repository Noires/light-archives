// ER2-401 / ER2-410 — a tab switch keeps the scroll position (the router's
// scrollBehavior skips in-page navigations). When the reader has scrolled past
// the page header, the new tab's content would start above the viewport, so
// scroll back to just below the header. Used by the character, free company
// and community pages.
export function keepTabsInView(header: HTMLElement | null | undefined) {
	if (!header) {
		return;
	}
	const navHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--nav-height')) || 68;
	const target = Math.max(0, header.getBoundingClientRect().bottom + window.scrollY - navHeight);
	if (window.scrollY < target - 1) {
		return;
	}
	// Runs after the new tab has rendered.
	window.setTimeout(() => window.scrollTo({ top: target, left: 0 }), 0);
}
