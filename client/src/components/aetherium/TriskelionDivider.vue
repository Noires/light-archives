<template>
	<div class="triskelion-divider" role="presentation" aria-hidden="true">
		<span class="triskelion-divider__rule"></span>
		<svg class="triskelion-divider__glyph" viewBox="-16 -16 32 32"
			fill="none" stroke="currentColor"
			stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">
			<!-- Three spiral arms, identical path rotated 0 / 120 / 240 degrees
			     around the origin. The "swirl" is a Q-curve hooking inward,
			     giving the triskelion its characteristic rolling motion. -->
			<g>
				<path d="M0 -3 Q -3 -10, -8 -10 Q -12 -8, -10 -4" />
			</g>
			<g transform="rotate(120)">
				<path d="M0 -3 Q -3 -10, -8 -10 Q -12 -8, -10 -4" />
			</g>
			<g transform="rotate(240)">
				<path d="M0 -3 Q -3 -10, -8 -10 Q -12 -8, -10 -4" />
			</g>
			<circle cx="0" cy="0" r="0.9" fill="currentColor" stroke="none" opacity="0.7" />
		</svg>
		<span class="triskelion-divider__rule"></span>
	</div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

// Footer ornament (ELPIS-105). A centered triskelion glyph flanked by two
// horizontal hairlines — used to separate footer chrome from page content.
// Theme-aware via `currentColor`; sits in `--rule-gold` on Hydaelyn and
// `--rule-arcane` on Zodiark. Decorative only — reduced-motion has no
// special handling because the ornament is static.

@Options({
	name: 'TriskelionDivider',
})
export default class TriskelionDivider extends Vue {}
</script>

<style lang="scss">
.triskelion-divider {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	width: 100%;
	max-width: 640px;
	margin: 0 auto;
	color: var(--rule-gold);
	pointer-events: none;
}

.triskelion-divider__rule {
	flex: 1;
	height: 1px;
	background: linear-gradient(
		to right,
		transparent 0%,
		currentColor 30%,
		currentColor 70%,
		transparent 100%
	);
	opacity: 0.55;
}

.triskelion-divider__glyph {
	flex: 0 0 auto;
	width: 28px;
	height: 28px;
	display: block;
	overflow: visible;
}

body.body--dark .triskelion-divider {
	color: var(--rule-arcane);
}
</style>
