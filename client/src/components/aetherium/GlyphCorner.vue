<template>
	<span
		class="glyph-corner"
		:class="[`glyph-corner--${size}`, `glyph-corner--${position}`]"
		aria-hidden="true"
	>
		<svg viewBox="0 0 32 32" fill="none" stroke="currentColor"
			stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 1.25 H1.25 V12" />
			<path d="M6.25 1.25 Q6.25 6.25 1.25 6.25" stroke-width="1" />
			<path d="M7 7 L8.5 5.5 L10 7 L8.5 8.5 Z" fill="currentColor" stroke="none" />
		</svg>
	</span>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

// Aetherium corner-flourish primitive (ELPIS-106).
//
// Stamps a Lodestone-inspired bracket-and-jewel ornament into a card or hero
// corner. Five `size` steps map onto Aetherium's 8 px baseline (xs 12 px →
// xl 48 px). `position` rotates the same path 90° increments so the same
// glyph reads correctly in any of the four corners.
//
// Theme: stroke uses `currentColor`. The component sets `color` to
// `--rule-gold` on Hydaelyn and `--rule-arcane` on Zodiark. Override on the
// parent to retint (e.g. `color: var(--glow-aether)` on a hover state).
//
// Usage:
//   <GlyphCorner size="md" position="tl" />
//   <GlyphCorner size="lg" position="br" style="color: var(--glow-aether)" />

class Props {
	size = prop<'xs' | 'sm' | 'md' | 'lg' | 'xl'>({ default: 'md' });
	position = prop<'tl' | 'tr' | 'br' | 'bl'>({ default: 'tl' });
}

@Options({
	name: 'GlyphCorner',
})
export default class GlyphCorner extends Vue.with(Props) {}
</script>

<style lang="scss">
.glyph-corner {
	display: inline-flex;
	color: var(--rule-gold);
	pointer-events: none;
	line-height: 0;
}

.glyph-corner svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}

.glyph-corner--xs { width: 12px; height: 12px; }
.glyph-corner--sm { width: 16px; height: 16px; }
.glyph-corner--md { width: 24px; height: 24px; }
.glyph-corner--lg { width: 32px; height: 32px; }
.glyph-corner--xl { width: 48px; height: 48px; }

// `position` rotates the same path. Each corner expects a different elbow
// orientation; rotating 90° at a time keeps stroke joins crisp.
.glyph-corner--tl svg { transform: rotate(0deg); }
.glyph-corner--tr svg { transform: rotate(90deg); }
.glyph-corner--br svg { transform: rotate(180deg); }
.glyph-corner--bl svg { transform: rotate(270deg); }

body.body--dark .glyph-corner {
	color: var(--rule-arcane);
}
</style>
