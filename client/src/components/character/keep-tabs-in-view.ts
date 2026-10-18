// ER2-401 / ER2-410 — the router scrolls to the top on every navigation,
// including a tab switch that only changes a param or the query. When the
// reader has already scrolled past the page header, that hides the content
// they asked for, so scroll back to just below the header afterwards.
export function keepTabsInView(header: HTMLElement | null | undefined) {
	if (!header) {
		return;
	}
	const navHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--nav-height')) || 68;
	const target = Math.max(0, header.getBoundingClientRect().bottom + window.scrollY - navHeight);
	if (window.scrollY < target - 1) {
		return;
	}
	// Runs after the router's own scroll-to-top.
	window.setTimeout(() => window.scrollTo({ top: target, left: 0 }), 0);
}
