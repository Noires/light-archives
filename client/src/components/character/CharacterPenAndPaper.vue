<template>
  <div :class="['character-sheet', { 'character-sheet--first-load': revealEnabled }]">
    <glyph-corner class="character-sheet__corner character-sheet__corner--tl" size="md" position="tl" />
    <glyph-corner class="character-sheet__corner character-sheet__corner--tr" size="md" position="tr" />
    <glyph-corner class="character-sheet__corner character-sheet__corner--br" size="md" position="br" />
    <glyph-corner class="character-sheet__corner character-sheet__corner--bl" size="md" position="bl" />

    <header class="character-sheet__hero">
      <div class="character-sheet__hero-copy character-sheet__page">
        <p class="character-sheet__eyebrow">Pen &amp; Paper Dossier</p>
        <h2 class="character-sheet__title">{{ character.name }}</h2>
        <p class="character-sheet__subtitle">
          Kompakter Charakterbogen mit Spielrunden-Fokus, inspiriert von klassischen Ermittler- und Notizbögen.
        </p>
      </div>

      <aside
        class="character-sheet__oracle character-sheet__page"
        :class="{ 'character-sheet__oracle--just-rolled': runeFlashing }"
      >
        <div class="character-sheet__oracle-head">
          <span class="character-sheet__oracle-label">Würfel-Orakel</span>
          <strong>{{ diceResultLabel }}</strong>
        </div>
        <p
          class="character-sheet__oracle-reading"
          :class="{ 'character-sheet__oracle-reading--w100': diceLabel === 'W100' && diceResult !== null }"
        >{{ diceReading }}</p>
        <div class="character-sheet__oracle-actions">
          <q-btn class="elpis-btn elpis-btn--secondary character-sheet__oracle-die" flat label="W6" @click="rollDie(6, 'W6')" />
          <q-btn class="elpis-btn elpis-btn--secondary character-sheet__oracle-die" flat label="W20" @click="rollDie(20, 'W20')" />
          <q-btn class="elpis-btn elpis-btn--primary character-sheet__oracle-die" unelevated label="W100" @click="rollPercentile" />
        </div>
        <p class="character-sheet__oracle-note">Lokaler Zufallswurf als kleines Runden-Gimmick. Es werden keine Werte gespeichert.</p>
      </aside>
    </header>

    <section v-if="summaryCards.length > 0" class="character-sheet__summary character-sheet__page">
      <article v-for="card in summaryCards" :key="card.label" class="character-sheet__summary-card">
        <span class="character-sheet__summary-label">{{ card.label }}</span>
        <div
          class="character-sheet__summary-value"
          :class="{ 'character-sheet__summary-value--empty': card.empty }"
        >
          <link-field :content="card.value" />
        </div>
      </article>
    </section>

    <section v-if="factSections.length > 0" class="character-sheet__ledger character-sheet__page">
      <article v-for="section in factSections" :key="section.title" class="character-sheet__panel">
        <div class="character-sheet__panel-head">
          <h6>{{ section.title }}</h6>
          <span>{{ section.entries.length }} Einträge</span>
        </div>

        <div class="character-sheet__facts">
          <div v-for="entry in section.entries" :key="entry.label" class="character-sheet__fact">
            <span class="character-sheet__fact-label">{{ entry.label }}</span>
            <span
              class="character-sheet__fact-value"
              :class="{ 'character-sheet__fact-value--empty': entry.empty }"
            ><link-field :content="entry.value" /></span>
          </div>
        </div>
      </article>
    </section>

    <section v-if="textBlocks.length > 0" class="character-sheet__notes character-sheet__page">
      <article v-for="block in textBlocks" :key="block.title" :class="block.accent ? 'character-sheet__note character-sheet__note--accent' : 'character-sheet__note'">
        <div class="character-sheet__panel-head">
          <h6>{{ block.title }}</h6>
          <span>{{ block.kind }}</span>
        </div>

        <html-viewer v-if="block.html" :content="block.content" />
        <div v-else class="character-sheet__plain-text"><link-field :content="block.content" /></div>
      </article>
    </section>

    <section v-if="factSections.length === 0 && textBlocks.length === 0" class="character-sheet__empty character-sheet__page">
      <h6>Noch kein Dossier</h6>
      <p>
        Für diesen Pen-&amp;-Paper-Bogen wurden noch keine kompakten Sheet-Angaben hinterlegt.
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { Options, prop, Vue } from 'vue-class-component';
import GlyphCorner from '../aetherium/GlyphCorner.vue';
import HtmlViewer from '../common/HtmlViewer.vue';
import LinkField from '../common/LinkField.vue';
import { EMPTY_FIELD_LABEL, isEmptyFieldValue } from './empty-field';

type SheetEntry = {
  label: string;
  value: string;
  empty?: boolean;
};

type SummaryCard = {
  label: string;
  value: string;
  empty: boolean;
};

type FactSection = {
  title: string;
  entries: SheetEntry[];
};

type TextBlock = {
  title: string;
  kind: string;
  content: string;
  html: boolean;
  accent?: boolean;
};

class Props {
  character = prop<CharacterProfileDto>({
    required: true,
  });
}

@Options({
  components: {
    GlyphCorner,
    HtmlViewer,
    LinkField,
  },
})
export default class CharacterPenAndPaper extends Vue.with(Props) {
  diceResult: number | null = null;
  diceLabel = 'Noch kein Wurf';
  runeFlashing = false;
  private runeFlashTimer: number | null = null;

  // ELPIS-211 — Pen & Paper journal-page reveal. Each major card (hero copy,
  // oracle plate, summary, ledger, notes — and the empty-state alternative)
  // wears `.character-sheet__page`; the wrapper carries `--first-load` only
  // on the first session-scoped visit so the page-turn motion never replays
  // on a route bounce. Per-card delays cascade in DOM order so the cards
  // appear to leaf through the dossier.
  revealEnabled = false;
  private revealObserver: IntersectionObserver | null = null;

  get diceResultLabel(): string {
    return this.diceResult === null ? this.diceLabel : `${this.diceLabel}: ${this.diceResult}`;
  }

  get diceReading(): string {
    if (this.diceResult === null) {
      return 'Ein schneller lokaler Wurf für spontane Entscheidungen am Spieltisch.';
    }

    if (this.diceLabel === 'W100') {
      if (this.diceResult <= 5) {
        return 'Kritischer Erfolg';
      }

      if (this.diceResult <= 25) {
        return 'Deutlicher Erfolg';
      }

      if (this.diceResult <= 50) {
        return 'Erfolg mit Druck';
      }

      if (this.diceResult <= 75) {
        return 'Komplizierter Ausgang';
      }

      if (this.diceResult <= 95) {
        return 'Fehlschlag';
      }

      return 'Patzer';
    }

    return this.diceResult === 1
      ? 'Maximales Glück'
      : this.diceResult === this.maxDiceValue
        ? 'Hartes Los'
        : 'Offenes Ergebnis';
  }

  get maxDiceValue(): number {
    return this.diceLabel === 'W20' ? 20 : 6;
  }

  get owner(): boolean {
    return !!this.character.mine;
  }

  // ER2-107 / ER2-112 — empty summary cards are dimmed "Noch leer" for the
  // owner and not rendered for visitors.
  get summaryCards(): SummaryCard[] {
    const c = this.character;
    return [
      this.summaryCard('Kernprofil', c.title, c.profession, c.nickname),
      this.summaryCard('Auftreten', c.age, c.apparentage, c.voice),
      this.summaryCard('Verortung', c.birthplace, c.residence, c.relationsshipstatus),
      this.summaryCard('Spielhaken', c.motivation, c.currently, c.wishes),
    ].filter((card) => this.owner || !card.empty);
  }

  get factSections(): FactSection[] {
    return [
      {
        title: 'Identität',
        entries: this.entries([
          ['Titel', this.character.title],
          ['Beruf', this.character.profession],
          ['Spitzname', this.character.nickname],
          ['Geschlecht', this.character.pronouns],
          ['Alter', this.character.age],
          ['Optisches Alter', this.character.apparentage],
          ['Namenstag', this.character.birthday],
          ['Schutzgottheit', this.character.deity],
          ['Familie', this.character.family],
        ]),
      },
      {
        title: 'Eindruck',
        entries: this.entries([
          ['Haarfarbe', this.character.haircolor],
          ['Augenfarbe', this.character.eyecolor],
          ['Hautfarbe', this.character.skintone],
          ['Statur', this.character.build],
          ['Größe', this.character.height],
          ['Gewicht', this.character.weight],
          ['Stimme', this.character.voice],
          ['Besonderheiten', this.character.specialfeatures],
        ]),
      },
      {
        title: 'Antrieb',
        entries: this.entries([
          ['Motto', this.character.slogan],
          ['Motivation', this.character.motivation],
          ['Wünsche', this.character.wishes],
          ['Ängste', this.character.fears],
          ['Liebt', this.character.loves],
          ['Hasst', this.character.hates],
          ['Stärken', this.character.strengths],
          ['Schwächen', this.character.weaknesses],
          ['Eigenheiten', this.character.ticks],
          ['Aktuell', this.character.currently],
        ]),
      },
      {
        title: 'Beziehungsnetz',
        entries: this.entries([
          ['Partner', this.character.partners],
          ['Eltern', this.character.parents],
          ['Kinder', this.character.children],
          ['Verwandte', this.character.relatives],
          ['Freunde', this.character.friends],
          ['Bekannte', this.character.acquaintances],
          ['Feinde', this.character.enemies],
          ['Erwähnt in', this.character.mentioned],
        ]),
      },
      {
        title: 'Umfeld',
        entries: this.entries([
          ['Geburtsort', this.character.birthplace],
          ['Wohnort', this.character.residence],
          ['Beziehungsstatus', this.character.relationsshipstatus],
          ['Freie Gesellschaft', this.character.freecompanies],
          ['Treffpunkte', this.character.meetingplaces],
          ['Communities', this.character.communities],
        ]),
      },
      {
        title: 'Ausrüstung',
        entries: this.entries([
          ['Besitz', this.character.possession],
          ['Besondere Gegenstände', this.character.specialitems],
        ]),
      },
    ].filter((section) => section.entries.length > 0);
  }

  get textBlocks(): TextBlock[] {
    return [
      this.htmlBlock('Hintergrund', 'Archivnotiz', this.character.background),
      this.htmlBlock('Persönlichkeit', 'Verhalten', this.character.personality),
      this.htmlBlock('Offen sichtbar', 'Erster Eindruck', this.character.openinformation),
      this.htmlBlock('Häufige Gerüchte', 'Straßengerücht', this.character.commonrumors),
      this.htmlBlock('Seltene Gerüchte', 'Flüsterpost', this.character.rarerumors),
      this.textBlock('Vergangenheit', 'Chronik', this.character.past),
      this.textBlock('OOC', 'Meta', this.character.oocInfo, true),
    ].filter((block): block is TextBlock => !!block);
  }

  summaryCard(label: string, ...values: Array<string | undefined>): SummaryCard {
    const resolved = values.filter((value): value is string => !isEmptyFieldValue(value));
    return resolved.length > 0
      ? { label, value: resolved.join(' · '), empty: false }
      : { label, value: EMPTY_FIELD_LABEL, empty: true };
  }

  rollDie(sides: number, label: string): void {
    this.diceLabel = label;
    this.diceResult = Math.floor(Math.random() * sides) + 1;
    this.triggerRuneFlash();
  }

  rollPercentile(): void {
    this.rollDie(100, 'W100');
  }

  created(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const flag = window.sessionStorage.getItem('elpis.penAndPaperRevealed');
      if (!flag) {
        this.revealEnabled = true;
        window.sessionStorage.setItem('elpis.penAndPaperRevealed', '1');
      }
    } catch (_) {
      this.revealEnabled = false;
    }
  }

  mounted(): void {
    if (!this.revealEnabled) {
      return;
    }
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      this.markAllRevealed();
      return;
    }
    const reduced =
      !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.markAllRevealed();
      return;
    }

    const cards = (this.$el as HTMLElement).querySelectorAll<HTMLElement>(
      '.character-sheet__page',
    );
    if (!cards.length) {
      return;
    }

    cards.forEach((card, idx) => {
      card.style.setProperty('--page-reveal-delay', `${Math.min(idx, 11) * 90}ms`);
    });

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('character-sheet__page--revealed');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.04 },
    );

    cards.forEach((card) => {
      this.revealObserver!.observe(card);
    });
  }

  private markAllRevealed(): void {
    const cards = (this.$el as HTMLElement).querySelectorAll<HTMLElement>(
      '.character-sheet__page',
    );
    cards.forEach((card) => card.classList.add('character-sheet__page--revealed'));
  }

  private triggerRuneFlash(): void {
    if (this.runeFlashTimer !== null) {
      window.clearTimeout(this.runeFlashTimer);
    }
    this.runeFlashing = false;
    // Force a reflow tick so re-adding the class restarts the animation.
    void window.requestAnimationFrame(() => {
      this.runeFlashing = true;
      this.runeFlashTimer = window.setTimeout(() => {
        this.runeFlashing = false;
        this.runeFlashTimer = null;
      }, 720);
    });
  }

  beforeUnmount(): void {
    if (this.runeFlashTimer !== null) {
      window.clearTimeout(this.runeFlashTimer);
      this.runeFlashTimer = null;
    }
    this.revealObserver?.disconnect();
    this.revealObserver = null;
  }

  private htmlBlock(title: string, kind: string, content?: string): TextBlock | null {
    return content && !isEmptyFieldValue(content) ? { title, kind, content, html: true } : null;
  }

  // ER2-010 — plain-text blocks render through LinkField (escaped, with
  // wikilinks) instead of raw text.
  private textBlock(title: string, kind: string, content?: string, accent = false): TextBlock | null {
    return content && !isEmptyFieldValue(content) ? { title, kind, content, html: false, accent } : null;
  }

  // Blank values stay out of the ledger; placeholders such as "(FOLGT)" are
  // hidden for visitors and shown dimmed as "Noch leer" to the owner.
  private entries(source: Array<[string, string | undefined]>): SheetEntry[] {
    return source
      .filter(([, value]) => !!value && value.trim().length > 0)
      .filter(([, value]) => this.owner || !isEmptyFieldValue(value))
      .map(([label, value]) => {
        const empty = isEmptyFieldValue(value);
        return {
          label,
          value: empty ? EMPTY_FIELD_LABEL : value as string,
          empty,
        };
      });
  }
}
</script>

<style lang="scss">
.character-sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid rgba(101, 76, 45, 0.24);
  background:
    radial-gradient(circle at top left, rgba(170, 136, 84, 0.18), transparent 30%),
    radial-gradient(circle at bottom right, rgba(83, 58, 34, 0.08), transparent 26%),
    linear-gradient(180deg, #f7f0df 0%, #efe3cb 100%);
  box-shadow: 0 18px 42px rgba(54, 37, 19, 0.16);
  color: #2d2014;
}

// ELPIS-211 — Ornamental corner stamps anchored to the dossier frame so the
// sheet reads as a journal binding rather than a bare rounded card. Inset
// 12 px desktop / 8 px on the narrowest breakpoint to stay clear of card
// content. Z-index 2 to sit above the page-turn animation's transform.
.character-sheet__corner {
  position: absolute;
  z-index: 2;
}

.character-sheet__corner--tl { top: 12px; left: 12px; }
.character-sheet__corner--tr { top: 12px; right: 12px; }
.character-sheet__corner--br { bottom: 12px; right: 12px; }
.character-sheet__corner--bl { bottom: 12px; left: 12px; }

// ELPIS-211 — Journal-page reveal. Five "pages" (hero copy, oracle plate,
// summary spread, ledger spread, notes spread — or the empty-state
// alternative) wear `character-sheet__page`. The `--first-load` parent gate
// only paints the keyframe contract on the first session-scoped visit; on
// route bounces the cards render at their default style. IntersectionObserver
// adds `--revealed` per card; per-card `--page-reveal-delay` (assigned at
// mount-time in DOM order) cascades the page-turn motion.
.character-sheet--first-load .character-sheet__page:not(.character-sheet__page--revealed) {
  opacity: 0;
  transform: perspective(1200px) rotateY(-22deg) translateX(-12px);
  transform-origin: left center;
}

.character-sheet--first-load .character-sheet__page--revealed {
  animation: character-sheet-page-turn var(--motion-slow, 420ms) var(--ease-elpis, ease-out)
    var(--page-reveal-delay, 0ms) backwards;
}

@keyframes character-sheet-page-turn {
  from {
    opacity: 0;
    transform: perspective(1200px) rotateY(-22deg) translateX(-12px);
  }
  to {
    opacity: 1;
    transform: perspective(1200px) rotateY(0) translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .character-sheet--first-load .character-sheet__page,
  .character-sheet--first-load .character-sheet__page:not(.character-sheet__page--revealed),
  .character-sheet--first-load .character-sheet__page--revealed {
    opacity: 1;
    transform: none;
    animation: none;
  }
}

.character-sheet__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.9fr);
  gap: 18px;
}

.character-sheet__hero-copy,
.character-sheet__oracle,
.character-sheet__summary-card,
.character-sheet__panel,
.character-sheet__note {
  border-radius: 16px;
  border: 1px solid rgba(101, 76, 45, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 251, 243, 0.92), rgba(244, 235, 218, 0.96));
}

.character-sheet__hero-copy {
  padding: 24px;
}

.character-sheet__eyebrow,
.character-sheet__summary-label,
.character-sheet__fact-label,
.character-sheet__panel-head span,
.character-sheet__oracle-label {
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
  color: rgba(85, 58, 29, 0.72);
}

.character-sheet__title {
  margin: 10px 0 0;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  line-height: 1.05;
  color: #3f2918;
}

.character-sheet__subtitle {
  margin: 12px 0 0;
  max-width: 38rem;
  line-height: 1.6;
  color: rgba(45, 32, 20, 0.78);
}

.character-sheet__oracle {
  position: relative;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: space-between;
  overflow: hidden;
}

// ELPIS-212 — Rune flash overlay that paints once when a die lands.
// The pseudo carries a faceted-hex SVG plus a soft warm radial halo. The
// `--just-rolled` modifier owns animation; the base rule keeps the pseudo
// invisible so unrelated re-renders don't repaint it.
.character-sheet__oracle::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  opacity: 0;
  background:
    radial-gradient(circle at 50% 38%, rgba(245, 213, 133, 0.28) 0%, rgba(186, 155, 91, 0.14) 38%, transparent 72%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><polygon points='32,4 58,18 58,46 32,60 6,46 6,18' fill='none' stroke='%23BA9B5B' stroke-width='1.4' opacity='0.55'/><polygon points='32,16 48,24 48,40 32,48 16,40 16,24' fill='none' stroke='%23BA9B5B' stroke-width='1' opacity='0.45'/><line x1='32' y1='4' x2='32' y2='60' stroke='%23BA9B5B' stroke-width='0.8' opacity='0.35'/><line x1='6' y1='18' x2='58' y2='46' stroke='%23BA9B5B' stroke-width='0.8' opacity='0.3'/><line x1='58' y1='18' x2='6' y2='46' stroke='%23BA9B5B' stroke-width='0.8' opacity='0.3'/></svg>");
  background-repeat: no-repeat, no-repeat;
  background-position: center 26%, center 26%;
  background-size: 100% 100%, 110px 110px;
}

.character-sheet__oracle--just-rolled::after {
  animation: character-sheet-rune-flash 720ms cubic-bezier(0.18, 0.78, 0.32, 1.06) forwards;
}

@keyframes character-sheet-rune-flash {
  0% { opacity: 0; transform: scale(0.92); }
  18% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0; transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .character-sheet__oracle--just-rolled::after {
    animation: none;
    opacity: 0;
  }
}

// ER2-103 — dice use the shared button hierarchy (W100 = primary, W6/W20 =
// secondary) instead of the one-off gold/lilac crystal gradients.
.character-sheet__oracle-die.q-btn {
  min-height: 40px;
}

.character-sheet__oracle-reading--w100 {
  font-family: var(--font-section, 'Spectral', serif);
  font-style: italic;
  font-size: 1.05rem;
  letter-spacing: 0.01em;
  color: #5d3a16;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

.character-sheet__oracle-head {
  display: grid;
  gap: 6px;
}

.character-sheet__oracle-head strong {
  font-size: 1.4rem;
  color: #613d1f;
}

.character-sheet__oracle-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.character-sheet__oracle-note {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: rgba(45, 32, 20, 0.72);
}

.character-sheet__oracle-reading {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4d3421;
}

.character-sheet__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.character-sheet__summary-card {
  min-height: 132px;
  padding: 16px;
  display: grid;
  align-content: start;
  gap: 12px;
}

// ER2-107 — break long German compounds at syllables (lang="de" + hyphens)
// instead of mid-word ("Hä ndlerin").
.character-sheet__summary-value {
  font-size: 1rem;
  line-height: 1.6;
  overflow-wrap: break-word;
  hyphens: auto;
}

.character-sheet__summary-value--empty,
.character-sheet__fact-value--empty {
  color: var(--ink-muted);
  font-style: italic;
}

body.body--dark .character-sheet__summary-value--empty,
body.body--dark .character-sheet__fact-value--empty {
  color: var(--ink-muted);
}

.character-sheet__ledger {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.character-sheet__panel,
.character-sheet__note {
  padding: 18px;
}

.character-sheet__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px dashed rgba(101, 76, 45, 0.22);
}

.character-sheet__panel-head h6 {
  margin: 0;
  font-size: 1rem;
  color: #5b3820;
}

.character-sheet__facts {
  display: grid;
  gap: 12px;
}

.character-sheet__fact {
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(101, 76, 45, 0.1);
}

.character-sheet__fact:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.character-sheet__fact-value,
.character-sheet__plain-text {
  hyphens: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
}

.character-sheet__notes {
  display: grid;
  gap: 16px;
}

.character-sheet__note--accent {
  background:
    linear-gradient(180deg, rgba(244, 230, 201, 0.98), rgba(255, 247, 233, 0.92));
}

.character-sheet__empty {
  border-radius: 16px;
  border: 1px dashed rgba(101, 76, 45, 0.3);
  padding: 22px;
  text-align: center;
  background: rgba(255, 250, 240, 0.7);
}

.character-sheet__empty h6,
.character-sheet__empty p {
  margin: 0;
}

.character-sheet__empty p {
  margin-top: 8px;
  line-height: 1.6;
}

body.body--dark .character-sheet {
  border-color: rgba(197, 165, 120, 0.22);
  background:
    radial-gradient(circle at top left, rgba(154, 111, 64, 0.18), transparent 30%),
    radial-gradient(circle at bottom right, rgba(204, 164, 109, 0.08), transparent 24%),
    linear-gradient(180deg, #251c15 0%, #1a130f 100%);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
  color: rgba(241, 228, 206, 0.92);
}

body.body--dark .character-sheet__hero-copy,
body.body--dark .character-sheet__oracle,
body.body--dark .character-sheet__summary-card,
body.body--dark .character-sheet__panel,
body.body--dark .character-sheet__note {
  border-color: rgba(197, 165, 120, 0.18);
  background:
    linear-gradient(180deg, rgba(45, 33, 25, 0.96), rgba(28, 22, 18, 0.98));
}

body.body--dark .character-sheet__title,
body.body--dark .character-sheet__panel-head h6,
body.body--dark .character-sheet__oracle-head strong {
  color: #f1d3a8;
}

body.body--dark .character-sheet__eyebrow,
body.body--dark .character-sheet__summary-label,
body.body--dark .character-sheet__fact-label,
body.body--dark .character-sheet__panel-head span,
body.body--dark .character-sheet__oracle-label,
body.body--dark .character-sheet__subtitle,
body.body--dark .character-sheet__oracle-note {
  color: rgba(241, 228, 206, 0.72);
}

body.body--dark .character-sheet__oracle-reading {
  color: rgba(241, 228, 206, 0.88);
}

body.body--dark .character-sheet__oracle-reading--w100 {
  color: rgba(245, 220, 178, 0.94);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

body.body--dark .character-sheet__oracle::after {
  background:
    radial-gradient(circle at 50% 38%, rgba(213, 196, 255, 0.32) 0%, rgba(184, 165, 255, 0.16) 38%, transparent 72%),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><polygon points='32,4 58,18 58,46 32,60 6,46 6,18' fill='none' stroke='%23B8A5FF' stroke-width='1.4' opacity='0.6'/><polygon points='32,16 48,24 48,40 32,48 16,40 16,24' fill='none' stroke='%23B8A5FF' stroke-width='1' opacity='0.5'/><line x1='32' y1='4' x2='32' y2='60' stroke='%23B8A5FF' stroke-width='0.8' opacity='0.4'/><line x1='6' y1='18' x2='58' y2='46' stroke='%23B8A5FF' stroke-width='0.8' opacity='0.35'/><line x1='58' y1='18' x2='6' y2='46' stroke='%23B8A5FF' stroke-width='0.8' opacity='0.35'/></svg>");
  background-repeat: no-repeat, no-repeat;
  background-position: center 26%, center 26%;
  background-size: 100% 100%, 110px 110px;
}

body.body--dark .character-sheet__panel-head {
  border-bottom-color: rgba(197, 165, 120, 0.2);
}

body.body--dark .character-sheet__fact {
  border-bottom-color: rgba(197, 165, 120, 0.1);
}

body.body--dark .character-sheet__note--accent {
  background:
    linear-gradient(180deg, rgba(62, 45, 31, 0.98), rgba(28, 22, 18, 0.98));
}

body.body--dark .character-sheet__empty {
  border-color: rgba(197, 165, 120, 0.28);
  background: rgba(38, 28, 21, 0.76);
}

@media screen and (max-width: 1100px) {
  .character-sheet__hero,
  .character-sheet__summary,
  .character-sheet__ledger {
    grid-template-columns: minmax(0, 1fr);
  }

  .character-sheet__summary-card {
    min-height: 0;
  }
}

@media screen and (max-width: 700px) {
  .character-sheet {
    padding: 18px;
  }

  .character-sheet__hero-copy,
  .character-sheet__oracle,
  .character-sheet__summary-card,
  .character-sheet__panel,
  .character-sheet__note {
    padding: 16px;
  }

  .character-sheet__oracle-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
