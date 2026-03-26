<template>
  <div class="character-sheet">
    <header class="character-sheet__hero">
      <div class="character-sheet__hero-copy">
        <p class="character-sheet__eyebrow">Pen &amp; Paper Dossier</p>
        <h2 class="character-sheet__title">{{ character.name }}</h2>
        <p class="character-sheet__subtitle">
          Kompakter Charakterbogen mit Spielrunden-Fokus, inspiriert von klassischen Ermittler- und Notizbögen.
        </p>
      </div>

      <aside class="character-sheet__oracle">
        <div class="character-sheet__oracle-head">
          <span class="character-sheet__oracle-label">Würfel-Orakel</span>
          <strong>{{ diceResultLabel }}</strong>
        </div>
        <p class="character-sheet__oracle-reading">{{ diceReading }}</p>
        <div class="character-sheet__oracle-actions">
          <q-btn unelevated color="secondary" label="W6" @click="rollDie(6, 'W6')" />
          <q-btn unelevated color="secondary" label="W20" @click="rollDie(20, 'W20')" />
          <q-btn unelevated color="accent" label="W100" @click="rollPercentile" />
        </div>
        <p class="character-sheet__oracle-note">Lokaler Zufallswurf als kleines Runden-Gimmick. Es werden keine Werte gespeichert.</p>
      </aside>
    </header>

    <section class="character-sheet__summary">
      <article class="character-sheet__summary-card">
        <span class="character-sheet__summary-label">Kernprofil</span>
        <div class="character-sheet__summary-value">
          {{ summaryValue(character.title, character.profession, character.nickname) }}
        </div>
      </article>

      <article class="character-sheet__summary-card">
        <span class="character-sheet__summary-label">Auftreten</span>
        <div class="character-sheet__summary-value">
          {{ summaryValue(character.age, character.apparentage, character.voice) }}
        </div>
      </article>

      <article class="character-sheet__summary-card">
        <span class="character-sheet__summary-label">Verortung</span>
        <div class="character-sheet__summary-value">
          {{ summaryValue(character.birthplace, character.residence, character.relationsshipstatus) }}
        </div>
      </article>

      <article class="character-sheet__summary-card">
        <span class="character-sheet__summary-label">Spielhaken</span>
        <div class="character-sheet__summary-value">
          {{ summaryValue(character.motivation, character.currently, character.wishes) }}
        </div>
      </article>
    </section>

    <section v-if="factSections.length > 0" class="character-sheet__ledger">
      <article v-for="section in factSections" :key="section.title" class="character-sheet__panel">
        <div class="character-sheet__panel-head">
          <h6>{{ section.title }}</h6>
          <span>{{ section.entries.length }} Einträge</span>
        </div>

        <div class="character-sheet__facts">
          <div v-for="entry in section.entries" :key="entry.label" class="character-sheet__fact">
            <span class="character-sheet__fact-label">{{ entry.label }}</span>
            <span class="character-sheet__fact-value">{{ entry.value }}</span>
          </div>
        </div>
      </article>
    </section>

    <section v-if="textBlocks.length > 0" class="character-sheet__notes">
      <article v-for="block in textBlocks" :key="block.title" :class="block.accent ? 'character-sheet__note character-sheet__note--accent' : 'character-sheet__note'">
        <div class="character-sheet__panel-head">
          <h6>{{ block.title }}</h6>
          <span>{{ block.kind }}</span>
        </div>

        <html-viewer v-if="block.html" :content="block.content" />
        <div v-else class="character-sheet__plain-text">{{ block.content }}</div>
      </article>
    </section>

    <section v-if="factSections.length === 0 && textBlocks.length === 0" class="character-sheet__empty">
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
import HtmlViewer from '../common/HtmlViewer.vue';

type SheetEntry = {
  label: string;
  value: string;
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
    HtmlViewer,
  },
})
export default class CharacterPenAndPaper extends Vue.with(Props) {
  diceResult: number | null = null;
  diceLabel = 'Noch kein Wurf';

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

  summaryValue(...values: Array<string | undefined>): string {
    const resolved = values.filter((value): value is string => !!value && value.trim().length > 0);
    return resolved.length > 0 ? resolved.join(' · ') : 'Nicht ausgefüllt';
  }

  rollDie(sides: number, label: string): void {
    this.diceLabel = label;
    this.diceResult = Math.floor(Math.random() * sides) + 1;
  }

  rollPercentile(): void {
    this.rollDie(100, 'W100');
  }

  private htmlBlock(title: string, kind: string, content?: string): TextBlock | null {
    return content ? { title, kind, content, html: true } : null;
  }

  private textBlock(title: string, kind: string, content?: string, accent = false): TextBlock | null {
    return content ? { title, kind, content, html: false, accent } : null;
  }

  private entries(source: Array<[string, string | undefined]>): SheetEntry[] {
    return source
      .filter(([, value]) => !!value && value.trim().length > 0)
      .map(([label, value]) => ({
        label,
        value: value as string,
      }));
  }
}
</script>

<style lang="scss">
.character-sheet {
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
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: space-between;
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

.character-sheet__summary-value {
  font-size: 1rem;
  line-height: 1.6;
  word-break: break-word;
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
