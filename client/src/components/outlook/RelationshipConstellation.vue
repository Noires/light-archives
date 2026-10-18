<template>
  <section v-if="stars.length >= 2" class="constellation" :aria-labelledby="headingId">
    <div class="constellation__head">
      <h2 :id="headingId" class="constellation__title">Sternbild der Beziehungen</h2>
      <button
        type="button"
        class="constellation__toggle"
        :aria-pressed="listMode ? 'true' : 'false'"
        @click="listMode = !listMode"
      >
        <q-icon :name="listMode ? 'auto_awesome' : 'list'" aria-hidden="true" />
        <span>{{ listMode ? 'Als Sternbild anzeigen' : 'Als Liste anzeigen' }}</span>
      </button>
    </div>

    <div v-if="!listMode" class="constellation__frame">
      <div class="constellation__canvas">
        <svg
          class="constellation__svg"
          :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          focusable="false"
        >
          <rect class="constellation__sky" :width="CHART_WIDTH" :height="CHART_HEIGHT" />
          <circle
            v-for="(star, i) in sky"
            :key="`bg${i}`"
            class="constellation__dust"
            :class="{ 'constellation__dust--twinkle': star.twinkle }"
            :style="star.twinkle ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined"
            :cx="star.x"
            :cy="star.y"
            :r="star.r"
          />
          <ellipse
            v-for="(ring, i) in usedRings"
            :key="`ring${i}`"
            class="constellation__orbit"
            :cx="CHART_CX"
            :cy="CHART_CY"
            :rx="ring.rx"
            :ry="ring.ry"
          />
          <line
            v-for="star in placed"
            :key="`edge-${star.id}`"
            class="constellation__edge"
            :x1="CHART_CX"
            :y1="CHART_CY"
            :x2="star.x"
            :y2="star.y"
          />
          <path
            v-for="(d, i) in ringChains"
            :key="`chain${i}`"
            class="constellation__chain"
            :d="d"
          />
          <path
            v-for="star in placed"
            :key="`glyph-${star.id}`"
            class="constellation__glyph"
            :d="starPath(star.x, star.y, 9)"
          />
          <circle class="constellation__halo" :cx="CHART_CX" :cy="CHART_CY" r="46" />
        </svg>

        <div class="constellation__center" aria-hidden="true">
          <img v-if="character.avatar" class="constellation__avatar" :src="character.avatar" alt="" />
          <span v-else class="constellation__avatar constellation__avatar--initial">{{ initial }}</span>
        </div>

        <router-link
          v-for="star in placed"
          :key="star.id"
          class="constellation__node"
          :class="`constellation__node--${star.side}`"
          :style="{ left: `${(star.x / CHART_WIDTH) * 100}%`, top: `${(star.y / CHART_HEIGHT) * 100}%` }"
          :to="star.to"
        >
          <span class="constellation__hit" aria-hidden="true"></span>
          <span class="constellation__label">
            <span class="constellation__name">{{ star.label }}</span>
            <span class="constellation__relation">{{ star.relation }}</span>
          </span>
        </router-link>
      </div>
      <ul class="constellation__legend" aria-label="Ringe">
        <li v-for="ring in legend" :key="ring.index">
          <span class="constellation__legend-no" aria-hidden="true">{{ ring.index + 1 }}</span>
          {{ ring.index === 0 ? 'Innerer Ring' : ring.index === 1 ? 'Mittlerer Ring' : 'Äußerer Ring' }}: {{ ring.label }}
        </li>
      </ul>
      <p v-if="hiddenCount > 0" class="constellation__more">
        {{ hiddenCount === 1 ? 'Ein weiterer Kontakt steht' : `${hiddenCount} weitere Kontakte stehen` }} in der Liste.
      </p>
    </div>

    <div v-else class="constellation__lists">
      <section v-for="group in listGroups" :key="group.index" class="constellation__group">
        <h3 class="constellation__group-title">{{ group.label }}</h3>
        <ul class="constellation__list">
          <li v-for="star in group.stars" :key="star.id">
            <router-link class="constellation__list-link" :to="star.to">{{ star.label }}</router-link>
            <span class="constellation__list-relation">{{ star.relation }}</span>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script lang="ts">
// ER2 outlook — relationship constellation: the character in the centre,
// contacts as stars on three rings by relationship category. Labels are real
// links on an HTML layer above the SVG sky, in DOM order ring by ring. A
// toggle switches to a plain list (default on phones). Static under reduced
// motion. Light: parchment star chart in gold ink; dark: violet night sky.
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { Options, prop, Vue } from 'vue-class-component';
import {
  BackgroundStar,
  backgroundStars,
  CHART_CX,
  CHART_CY,
  CHART_HEIGHT,
  CHART_WIDTH,
  CONSTELLATION_RINGS,
  ConstellationRing,
  ContactStar,
  MAX_STARS,
  parseContactStars,
  PlacedStar,
  placeStars,
  RING_RADII,
  starPath,
} from './constellation-model';

let uid = 0;

class Props {
  character = prop<CharacterProfileDto>({ required: true });
}

@Options({
  name: 'RelationshipConstellation',
})
export default class RelationshipConstellation extends Vue.with(Props) {
  readonly CHART_WIDTH = CHART_WIDTH;
  readonly CHART_HEIGHT = CHART_HEIGHT;
  readonly CHART_CX = CHART_CX;
  readonly CHART_CY = CHART_CY;
  readonly headingId = `constellation-${++uid}`;
  readonly starPath = starPath;

  listMode = false;

  created() {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 599px)').matches) {
      this.listMode = true;
    }
  }

  get stars(): ContactStar[] {
    return parseContactStars(this.character);
  }

  get placed(): PlacedStar[] {
    return placeStars(this.stars.slice(0, MAX_STARS));
  }

  get hiddenCount(): number {
    return Math.max(0, this.stars.length - MAX_STARS);
  }

  get usedRings(): { rx: number; ry: number }[] {
    return RING_RADII;
  }

  get legend(): ConstellationRing[] {
    return CONSTELLATION_RINGS.filter((ring) => this.placed.some((star) => star.ring === ring.index));
  }

  /** Faint lines joining neighbouring stars of the same ring, like a star sign. */
  get ringChains(): string[] {
    return CONSTELLATION_RINGS.map((ring) => {
      const members = this.placed.filter((star) => star.ring === ring.index);
      if (members.length < 2) {
        return '';
      }
      return `M${members.map((star) => `${star.x} ${star.y}`).join(' L')}`;
    }).filter((d) => !!d);
  }

  get sky(): BackgroundStar[] {
    return backgroundStars(this.character.name || 'Elpis');
  }

  get initial(): string {
    return (this.character.name || '?').trim().charAt(0).toUpperCase();
  }

  get listGroups(): { index: number; label: string; stars: ContactStar[] }[] {
    return CONSTELLATION_RINGS
      .map((ring) => ({ index: ring.index, label: ring.label, stars: this.stars.filter((star) => star.ring === ring.index) }))
      .filter((group) => group.stars.length > 0);
  }
}
</script>

<style lang="scss" scoped>
// Light: parchment chart, gold ink. Dark overrides below: violet night sky.
.constellation {
  --cst-sky-a: var(--surface-vellum);
  --cst-sky-b: var(--surface-pearl);
  --cst-ink: var(--rule-gold);
  --cst-glyph: var(--rule-strong);
  --cst-dust: var(--rule-gold);
  --cst-orbit: var(--rule-gold-soft);
  --cst-label-bg: var(--surface-glass);

  margin-bottom: 24px;
  color: var(--ink-primary);
}

body.body--dark .constellation {
  --cst-sky-a: var(--surface-deep);
  --cst-sky-b: var(--surface-obsidian);
  --cst-ink: var(--glow-zodiark);
  --cst-glyph: var(--glow-aether-d);
  --cst-dust: var(--ink-luminous);
  --cst-orbit: var(--rule-arcane-soft);
}

.constellation__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 10px;
}

.constellation__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--type-scale-2, 1.25rem);
  letter-spacing: var(--ls-display, 0.02em);
  line-height: 1.3;
  color: var(--ink-primary);
}

.constellation__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--rule-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-primary);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  .q-icon {
    font-size: 16px;
  }

  &:hover {
    background-color: var(--rule-tint);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.constellation__frame {
  overflow-x: auto;
  border: 1px solid var(--rule-soft);
  border-radius: 12px;
  background: radial-gradient(ellipse at center, var(--cst-sky-a) 0%, var(--cst-sky-b) 100%);
}

.constellation__canvas {
  position: relative;
  min-width: 560px;
  aspect-ratio: 800 / 560;
}

.constellation__svg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.constellation__sky {
  fill: transparent;
}

.constellation__dust {
  fill: var(--cst-dust);
  fill-opacity: 0.55;
}

.constellation__orbit {
  fill: none;
  stroke: var(--cst-orbit);
  stroke-width: 1;
  stroke-dasharray: 2 6;
}

.constellation__edge {
  stroke: var(--rule-soft);
  stroke-width: 1;
}

.constellation__chain {
  fill: none;
  stroke: var(--cst-ink);
  stroke-width: 0.8;
  stroke-opacity: 0.35;
}

.constellation__glyph {
  fill: var(--cst-glyph);
}

.constellation__halo {
  fill: none;
  stroke: var(--cst-ink);
  stroke-width: 1;
  stroke-opacity: 0.6;
}

@media (prefers-reduced-motion: no-preference) {
  .constellation__dust--twinkle {
    animation: constellation-twinkle 4.2s ease-in-out infinite;
  }
}

@keyframes constellation-twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.constellation__center {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 11%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

.constellation__avatar {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 2px solid var(--cst-ink);
  border-radius: 50%;
  object-fit: cover;
  background-color: var(--surface-raised);
}

.constellation__avatar--initial {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--ink-primary);
}

.constellation__node {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 24px;
  color: var(--ink-primary);
  text-decoration: none;
  transform: translate(-12px, -50%);

  &:focus-visible {
    outline: none;
    z-index: 2;

    .constellation__label {
      box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
    }
  }

  &:hover {
    z-index: 2;

    .constellation__name {
      text-decoration: underline;
    }
  }
}

.constellation__node--end {
  flex-direction: row-reverse;
  transform: translate(calc(-100% + 12px), -50%);

  .constellation__label {
    text-align: right;
  }
}

.constellation__hit {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.constellation__label {
  display: flex;
  flex-direction: column;
  max-width: 150px;
  padding: 2px 6px;
  border-radius: 6px;
  background-color: var(--cst-label-bg);
  line-height: 1.2;
}

.constellation__name {
  overflow: hidden;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-link);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.constellation__relation {
  font-family: var(--font-lore);
  font-size: 12px;
  font-style: italic;
  color: var(--ink-muted);
}

.constellation__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 0;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--rule-soft);
  list-style: none;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-muted);
}

.constellation__legend-no {
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  border: 1px solid var(--rule-strong);
  border-radius: 50%;
  font-size: 10px;
}

.constellation__more {
  margin: 0;
  padding: 0 12px 10px;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--ink-muted);
}

.constellation__lists {
  display: grid;
  gap: 16px;
}

.constellation__group-title {
  margin: 0 0 6px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  color: var(--ink-muted);
}

.constellation__list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    min-height: 32px;
    padding: 4px 0;
    border-bottom: 1px solid var(--rule-soft);
  }
}

.constellation__list-link {
  color: var(--ink-link);
  font-family: var(--font-ui);
  font-weight: 600;

  &:focus-visible {
    outline: none;
    border-radius: 3px;
    box-shadow: 0 0 0 2px var(--glow-aether), 0 0 0 3px var(--vision-focus-edge);
  }
}

.constellation__list-relation {
  font-family: var(--font-lore);
  font-style: italic;
  font-size: 13px;
  color: var(--ink-muted);
}
</style>
