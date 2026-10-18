<template>
	<span
		class="aetheryte-badge"
		:class="[`aetheryte-badge--${size}`, `aetheryte-badge--${shape}`]"
	>
		<img
			v-if="src"
			class="aetheryte-badge__img"
			:src="src"
			:alt="alt"
			loading="lazy"
		/>
		<span v-else class="aetheryte-badge__placeholder" aria-hidden="true">
			<q-icon :name="placeholderIcon" />
		</span>
		<template v-if="shape === 'square' && glyphCorners">
			<glyph-corner :size="cornerSize" position="tl" class="aetheryte-badge__corner" />
			<glyph-corner :size="cornerSize" position="tr" class="aetheryte-badge__corner" />
			<glyph-corner :size="cornerSize" position="br" class="aetheryte-badge__corner" />
			<glyph-corner :size="cornerSize" position="bl" class="aetheryte-badge__corner" />
		</template>
	</span>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';
import GlyphCorner from './GlyphCorner.vue';

// Aetherium avatar primitive (ELPIS-202).
//
// Wraps a character avatar image in a Lodestone-flavored frame. Two shapes:
//  - `square` (default) — stamped frame with optional corner glyph flourishes,
//    the showpiece treatment used on the Character page header.
//  - `round` — gold-ring variant for member grids, sidebar mini-avatars and
//    other dense list contexts where the square chrome is too heavy.
//
// Sizes (xs 24 → xl 96) map to the 8 px baseline; corner glyphs scale with
// the badge so the stamp reads at every step.

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type CornerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

class Props {
	src = prop<string>({ default: '' });
	alt = prop<string>({ default: '' });
	size = prop<BadgeSize>({ default: 'md' });
	shape = prop<'square' | 'round'>({ default: 'square' });
	glyphCorners = prop<boolean>({ default: true });
	placeholderIcon = prop<string>({ default: 'person' });
}

@Options({
	name: 'AetheryteBadge',
	components: { GlyphCorner },
})
export default class AetheryteBadge extends Vue.with(Props) {
	get cornerSize(): CornerSize {
		switch (this.size) {
			case 'xl': return 'sm';
			case 'lg': return 'sm';
			case 'md': return 'xs';
			default:   return 'xs';
		}
	}
}
</script>

<style lang="scss">
.aetheryte-badge {
	position: relative;
	display: inline-flex;
	flex: 0 0 auto;
	overflow: visible;
	color: var(--rule-gold);
	transition:
		box-shadow var(--motion-fast) var(--ease-elpis),
		border-color var(--motion-fast) var(--ease-elpis);
}

.aetheryte-badge__img,
.aetheryte-badge__placeholder {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	background-color: var(--surface-vellum);
}

.aetheryte-badge__placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--ink-muted);
	font-size: 60%;
}

// Sizes — driven through a single var so consumers can override in scoped CSS.
.aetheryte-badge--xs { width: 24px; height: 24px; }
.aetheryte-badge--sm { width: 36px; height: 36px; }
.aetheryte-badge--md { width: 48px; height: 48px; }
.aetheryte-badge--lg { width: 72px; height: 72px; }
.aetheryte-badge--xl { width: 96px; height: 96px; }

// -----------------------------------------------------------------------------
// Square — Lodestone-style stamped tile. Image fills the frame; GlyphCorner
// stamps sit at each corner like a sealed letter. Use as the showpiece avatar
// (Character.vue header).
// -----------------------------------------------------------------------------
.aetheryte-badge--square {
	border-radius: 2px;
	background-color: var(--surface-vellum);
	box-shadow:
		inset 0 0 0 1px var(--rule-gold),
		inset 0 0 0 3px var(--surface-pearl),
		inset 0 0 0 4px var(--rule-gold-soft),
		0 4px 12px rgba(43, 36, 24, 0.14);
	padding: 4px;
}

.aetheryte-badge--square .aetheryte-badge__img,
.aetheryte-badge--square .aetheryte-badge__placeholder {
	border-radius: 1px;
}

.aetheryte-badge--square .aetheryte-badge__corner {
	position: absolute;
	z-index: 2;
}

// Stamps hug the inner gold-rule (3 px inset). The 90° rotation built into
// GlyphCorner keeps the bracket pointing into the image.
.aetheryte-badge--square .aetheryte-badge__corner.glyph-corner--tl { top: 2px;    left: 2px;    }
.aetheryte-badge--square .aetheryte-badge__corner.glyph-corner--tr { top: 2px;    right: 2px;   }
.aetheryte-badge--square .aetheryte-badge__corner.glyph-corner--br { bottom: 2px; right: 2px;   }
.aetheryte-badge--square .aetheryte-badge__corner.glyph-corner--bl { bottom: 2px; left: 2px;    }

.aetheryte-badge--square:hover {
	box-shadow:
		inset 0 0 0 1px var(--rule-gold),
		inset 0 0 0 3px var(--surface-pearl),
		inset 0 0 0 4px var(--rule-gold),
		0 6px 18px rgba(43, 36, 24, 0.20);
}

// -----------------------------------------------------------------------------
// Round — gold-ring variant for member grids, sidebar mini-avatars, dense
// list rows. Lighter chrome, no corner glyphs.
// -----------------------------------------------------------------------------
.aetheryte-badge--round {
	border-radius: 50%;
	background-color: var(--surface-vellum);
	box-shadow:
		inset 0 0 0 1px var(--rule-gold),
		0 0 0 2px var(--rule-gold-soft),
		0 2px 6px rgba(43, 36, 24, 0.12);
}

.aetheryte-badge--round .aetheryte-badge__img,
.aetheryte-badge--round .aetheryte-badge__placeholder {
	border-radius: 50%;
}

.aetheryte-badge--round:hover {
	box-shadow:
		inset 0 0 0 1px var(--rule-gold),
		0 0 0 2px var(--rule-gold),
		0 2px 8px rgba(43, 36, 24, 0.18);
}

// -----------------------------------------------------------------------------
// Zodiark — flip the gold rule onto the arcane palette. The shadow base shifts
// to deeper greys to read on Obsidian / Aetherglass surfaces.
// -----------------------------------------------------------------------------
body.body--dark .aetheryte-badge {
	color: var(--rule-arcane);
}

body.body--dark .aetheryte-badge__img,
body.body--dark .aetheryte-badge__placeholder {
	background-color: var(--surface-lift);
}

body.body--dark .aetheryte-badge__placeholder {
	color: rgba(236, 227, 247, 0.6);
}

body.body--dark .aetheryte-badge--square {
	background-color: var(--surface-deep);
	box-shadow:
		inset 0 0 0 1px var(--rule-arcane),
		inset 0 0 0 3px var(--surface-deep),
		inset 0 0 0 4px var(--rule-arcane-soft),
		0 4px 12px rgba(0, 0, 0, 0.5);
}

body.body--dark .aetheryte-badge--square:hover {
	box-shadow:
		inset 0 0 0 1px var(--rule-arcane),
		inset 0 0 0 3px var(--surface-deep),
		inset 0 0 0 4px var(--rule-arcane),
		0 6px 18px rgba(0, 0, 0, 0.55);
}

body.body--dark .aetheryte-badge--round {
	background-color: var(--surface-deep);
	box-shadow:
		inset 0 0 0 1px var(--rule-arcane),
		0 0 0 2px var(--rule-arcane-soft),
		0 2px 6px rgba(0, 0, 0, 0.45);
}

body.body--dark .aetheryte-badge--round:hover {
	box-shadow:
		inset 0 0 0 1px var(--rule-arcane),
		0 0 0 2px var(--rule-arcane),
		0 2px 8px rgba(0, 0, 0, 0.55);
}
</style>
