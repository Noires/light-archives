// ELPIS-219 — Save confirmation pulse + 7-mote particle burst.
//
// Bind to a save button as `v-elpis-save-pulse="trigger"`, where `trigger` is a
// number that increments after a successful save (e.g. `this.savePulseTrigger++`
// inside the success branch of the form's submit handler). Each new value plays
// a one-shot pulse on the button (1.0 → 1.04 → 1.0 over `--motion-base`) and
// spawns 7 motes that radiate ~80 px and dissipate over `--motion-cinematic`.
//
// The directive is a no-op when `prefers-reduced-motion: reduce` is set — the
// success toast is the only signal in that mode (see `notifySuccess` in
// `src/common/notify.ts`).

import type { Directive, DirectiveBinding } from 'vue';

const PULSE_DURATION_MS = 240;
const BURST_LIFETIME_MS = 720;
const MOTE_COUNT = 7;
const MOTE_BASE_DISTANCE_PX = 78;
const MOTE_DISTANCE_JITTER_PX = 8;
const MOTE_ANGLE_JITTER_DEG = 12;
const MOTE_DELAY_JITTER_MS = 60;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resolveButton(el: HTMLElement): HTMLElement {
  if (el.classList.contains('q-btn')) {
    return el;
  }
  const inner = el.querySelector<HTMLElement>('.q-btn');
  return inner ?? el;
}

function trigger(el: HTMLElement) {
  if (prefersReducedMotion()) {
    return;
  }

  const button = resolveButton(el);
  button.classList.remove('elpis-save-pulse--active');
  // Force a reflow so re-adding the class restarts the animation when the
  // user spams "Speichern".
  void button.offsetWidth;
  button.classList.add('elpis-save-pulse--active');

  const burst = document.createElement('span');
  burst.className = 'elpis-save-burst';
  burst.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < MOTE_COUNT; i++) {
    const mote = document.createElement('span');
    mote.className = 'elpis-save-mote';
    const baseAngle = (360 / MOTE_COUNT) * i;
    const angle = baseAngle + (Math.random() * 2 - 1) * MOTE_ANGLE_JITTER_DEG;
    const distance = MOTE_BASE_DISTANCE_PX + Math.random() * MOTE_DISTANCE_JITTER_PX;
    const delay = Math.random() * MOTE_DELAY_JITTER_MS;
    mote.style.setProperty('--mote-angle', `${angle}deg`);
    mote.style.setProperty('--mote-distance', `${distance}px`);
    mote.style.setProperty('--mote-delay', `${delay}ms`);
    burst.appendChild(mote);
  }

  button.appendChild(burst);

  window.setTimeout(() => {
    burst.remove();
  }, BURST_LIFETIME_MS);

  window.setTimeout(() => {
    button.classList.remove('elpis-save-pulse--active');
  }, PULSE_DURATION_MS + 20);
}

const elpisSavePulse: Directive<HTMLElement, number | null | undefined> = {
  updated(el, binding: DirectiveBinding<number | null | undefined>) {
    if (binding.value == null) {
      return;
    }
    if (binding.value !== binding.oldValue) {
      trigger(el);
    }
  },
};

export default elpisSavePulse;
