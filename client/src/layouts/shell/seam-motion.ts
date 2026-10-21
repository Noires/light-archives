import { nextTick } from 'vue';

// Motion choreography for the "Kristallkiel" shell (AETHERIUM.md, Shell
// shapes): one motion per moment. First visit: ignition, then one glint
// along the seam. Route change: the indicator glides. Theme switch: prism
// wipe. Reading pages: the seam fills with scroll progress (CSS only).

const IGNITED_KEY = 'elpis.shellIgnited';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** True once per browser session, never under reduced motion. */
export function shouldIgnite(): boolean {
  if (typeof window === 'undefined' || prefersReducedMotion()) {
    return false;
  }
  try {
    if (window.sessionStorage.getItem(IGNITED_KEY)) {
      return false;
    }
    window.sessionStorage.setItem(IGNITED_KEY, '1');
  } catch {
    // Storage blocked: ignite anyway, it only costs one animation.
  }
  return true;
}

const READING_PATTERNS = [
  /^\/story\/[^/]+$/,
  /^\/wiki\/[^/]+$/,
  /^\/noticeboard\/[^/]+$/,
  /^\/(rules|faq|beginner-guide|about)$/,
];

/** Long-form pages whose seam shows reading progress. */
export function isReadingRoute(path: string): boolean {
  return READING_PATTERNS.some((pattern) => pattern.test(path));
}

type StartViewTransition = (update: () => Promise<void> | void) => { finished: Promise<void> };

/**
 * Switches the theme behind a rhombus wipe that grows from `origin` (the
 * crystal). Without View Transitions the switch is instant; under reduced
 * motion the CSS turns the wipe into a short fade.
 */
export function startThemeWipe(origin: Element | null | undefined, update: () => void): void {
  const doc = document as Document & { startViewTransition?: StartViewTransition };
  if (!doc.startViewTransition || !origin) {
    update();
    return;
  }
  const rect = origin.getBoundingClientRect();
  const html = document.documentElement;
  html.style.setProperty('--wipe-x', `${rect.left + rect.width / 2}px`);
  html.style.setProperty('--wipe-y', `${rect.top + rect.height / 2}px`);
  html.classList.add('shell-theme-wipe');
  const transition = doc.startViewTransition.call(document, async () => {
    update();
    await nextTick();
  });
  void transition.finished.finally(() => html.classList.remove('shell-theme-wipe'));
}
