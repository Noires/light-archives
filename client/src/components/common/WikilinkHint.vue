<!-- ELPIS-209 — Wikilink discoverability popover.

  Replaces the bare `<div class="text-caption">Du kannst [[Wikilinks]] ...</div>`
  hint with a `?` info icon that opens a popover demoing the syntax. Inside the
  popover, the example string types character-by-character into the editor
  preview and resolves to a styled wikilink (matches the hover treatment from
  ELPIS-508). When the popover closes the typing loop tears down so a hover-and-
  drag-away can't leave a lingering interval.

  Props:
   - `example` — the source string the popover types out. Defaults to
     `[[Charaktername]]`.
   - `display` — the resolved label (defaults to the example minus the brackets,
     or the right-hand pipe segment when the example is `[[Name|Label]]`).
   - `note` — optional plain-text caveat (e.g. "in allen Feldern außer Webseite").

  Reduced motion: the typing animation collapses to "show full string instantly,
  no looping" via the global `prefers-reduced-motion` check.
-->

<template>
  <span class="wikilink-hint">
    <q-btn
      class="wikilink-hint__trigger"
      flat
      dense
      round
      size="xs"
      color="primary"
      icon="help_outline"
      :aria-label="ariaLabel"
    >
      <q-popup-proxy
        ref="popup"
        anchor="bottom left"
        self="top left"
        transition-show="fade"
        transition-hide="fade"
        @before-show="onShow"
        @before-hide="onHide"
      >
        <q-card class="wikilink-hint__card mat-aetherglass elevation-3">
          <q-card-section>
            <div class="wikilink-hint__title">Wikilinks</div>
            <p class="wikilink-hint__copy">
              Setze einen Namen in doppelte eckige Klammern, um automatisch zu seinem Profil zu verlinken.
            </p>
            <div class="wikilink-hint__demo">
              <code class="wikilink-hint__source">
                <span class="wikilink-hint__typed">{{ typedSlice }}</span><span
                  v-if="!fullyTyped"
                  class="wikilink-hint__caret"
                  aria-hidden="true"
                >|</span>
              </code>
              <div class="wikilink-hint__resolves" :class="{ 'wikilink-hint__resolves--ready': fullyTyped }">
                <span class="wikilink-hint__arrow" aria-hidden="true">→</span>
                <span class="wikilink-hint__rendered">{{ displayLabel }}</span>
              </div>
            </div>
            <p v-if="note" class="wikilink-hint__note">{{ note }}</p>
            <p class="wikilink-hint__copy wikilink-hint__copy--muted">
              Mit <code>[[Name|Anzeigetext]]</code> kannst du auch einen abweichenden Text anzeigen lassen.
            </p>
          </q-card-section>
        </q-card>
      </q-popup-proxy>
    </q-btn>
  </span>
</template>

<script lang="ts">
import { Options, Vue, prop } from 'vue-class-component';

const TYPE_INTERVAL_MS = 90;
const SETTLE_MS = 1400;
const RESTART_MS = 600;

class Props {
  example = prop<string>({ default: '[[Charaktername]]' });
  display = prop<string>({ default: '' });
  note = prop<string>({ default: '' });
  ariaLabel = prop<string>({ default: 'Hinweis zur Wikilink-Syntax anzeigen' });
}

@Options({})
export default class WikilinkHint extends Vue.with(Props) {
  typedLength = 0;
  private typingActive = false;
  private timer: number | null = null;

  get displayLabel(): string {
    if (this.display) {
      return this.display;
    }
    const inside = this.example.replace(/^\[\[|\]\]$/g, '');
    const pipe = inside.indexOf('|');
    return pipe >= 0 ? inside.slice(pipe + 1) : inside;
  }

  get typedSlice(): string {
    return this.example.slice(0, this.typedLength);
  }

  get fullyTyped(): boolean {
    return this.typedLength >= this.example.length;
  }

  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  onShow() {
    this.clearTimer();
    if (this.prefersReducedMotion()) {
      this.typedLength = this.example.length;
      this.typingActive = false;
      return;
    }
    this.typingActive = true;
    this.typedLength = 0;
    this.scheduleNext(TYPE_INTERVAL_MS);
  }

  onHide() {
    this.typingActive = false;
    this.clearTimer();
  }

  private scheduleNext(delay: number) {
    this.clearTimer();
    this.timer = window.setTimeout(() => this.tick(), delay);
  }

  private tick() {
    if (!this.typingActive) {
      return;
    }
    if (this.typedLength < this.example.length) {
      this.typedLength += 1;
      this.scheduleNext(TYPE_INTERVAL_MS);
    } else {
      this.scheduleNext(SETTLE_MS + RESTART_MS);
      this.timer = window.setTimeout(() => {
        if (!this.typingActive) {
          return;
        }
        this.typedLength = 0;
        this.scheduleNext(RESTART_MS);
      }, SETTLE_MS);
    }
  }

  private clearTimer() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  beforeUnmount() {
    this.typingActive = false;
    this.clearTimer();
  }

}
</script>

<style lang="scss" scoped>
.wikilink-hint {
  display: inline-flex;
  vertical-align: middle;
  margin-left: 4px;
}

.wikilink-hint__trigger.q-btn {
  color: var(--rule-gold);
  opacity: 0.8;
  transition: opacity var(--motion-fast) var(--ease-elpis);

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
}

.wikilink-hint__card {
  width: min(360px, 92vw);
  border-radius: 8px;
  font-family: var(--font-body, 'Spectral', serif);
}

.wikilink-hint__title {
  font-family: var(--font-display, 'Cinzel', serif);
  font-size: var(--type-scale-3, 18px);
  letter-spacing: var(--ls-display, 0.04em);
  color: var(--surface-ink, #2a2317);
  margin-bottom: 8px;
}

.wikilink-hint__copy {
  font-size: var(--type-scale-1, 14px);
  line-height: 1.5;
  color: var(--surface-ink, #2a2317);
  margin: 0 0 12px;
}

.wikilink-hint__copy--muted {
  color: var(--ink-muted, #6b5d44);
  font-size: var(--type-scale-0, 12px);
  margin-top: 12px;
  margin-bottom: 0;
}

.wikilink-hint__demo {
  background: rgba(186, 155, 91, 0.07);
  border: 1px solid var(--rule-gold-soft, rgba(186, 155, 91, 0.28));
  border-left: 3px solid var(--rule-gold, #ba9b5b);
  border-radius: 4px;
  padding: 12px 14px;
  margin: 4px 0 12px;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.wikilink-hint__source {
  display: block;
  font-size: var(--type-scale-1, 14px);
  color: var(--surface-ink, #2a2317);
  min-height: 1.6em;
  letter-spacing: 0.02em;
}

.wikilink-hint__caret {
  display: inline-block;
  margin-left: 1px;
  color: var(--rule-gold, #ba9b5b);
  font-weight: 600;
  animation: wikilink-hint-caret 800ms steps(2, end) infinite;
}

@keyframes wikilink-hint-caret {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

.wikilink-hint__resolves {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 8px;
  font-size: var(--type-scale-1, 14px);
  font-family: var(--font-body, 'Spectral', serif);
  opacity: 0;
  transform: translateY(2px);
  transition:
    opacity var(--motion-base, 240ms) var(--ease-elpis, ease-out),
    transform var(--motion-base, 240ms) var(--ease-elpis, ease-out);
}

.wikilink-hint__resolves--ready {
  opacity: 1;
  transform: translateY(0);
}

.wikilink-hint__arrow {
  color: var(--rule-gold, #ba9b5b);
  font-size: 0.9em;
}

.wikilink-hint__rendered {
  color: var(--rule-gold, #ba9b5b);
  text-decoration: underline;
  text-decoration-style: solid;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  font-style: italic;
}

.wikilink-hint__note {
  font-size: var(--type-scale-0, 12px);
  color: var(--ink-muted, #6b5d44);
  margin: 0 0 8px;
  font-style: italic;
}

@media (prefers-reduced-motion: reduce) {
  .wikilink-hint__caret,
  .wikilink-hint__resolves {
    animation: none;
    transition: none;
  }
}

// Body-dark variant — flips ink + rules onto the arcane palette.
body.body--dark .wikilink-hint__title { color: var(--ink-luminous, #c3dbff); }
body.body--dark .wikilink-hint__copy { color: var(--ink-luminous, #c3dbff); }
body.body--dark .wikilink-hint__source { color: var(--ink-luminous, #c3dbff); }
body.body--dark .wikilink-hint__demo {
  background: rgba(183, 211, 243, 0.10);
  border-color: var(--rule-arcane-soft, rgba(183, 211, 243, 0.32));
  border-left-color: var(--rule-arcane, #b7d3f3);
}
body.body--dark .wikilink-hint__caret,
body.body--dark .wikilink-hint__arrow,
body.body--dark .wikilink-hint__rendered {
  color: var(--rule-arcane, #b7d3f3);
}
body.body--dark .wikilink-hint__copy--muted,
body.body--dark .wikilink-hint__note {
  color: rgba(195, 219, 255, 0.74);
}
body.body--dark .wikilink-hint__trigger.q-btn {
  color: var(--rule-arcane, #b7d3f3);
}
</style>
