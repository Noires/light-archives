<template>
	<header class="header">
		<glyph-corner class="header__corner header__corner--tl" size="md" position="tl" />
		<glyph-corner class="header__corner header__corner--tr" size="md" position="tr" />
		<glyph-corner class="header__corner header__corner--br" size="md" position="br" />
		<glyph-corner class="header__corner header__corner--bl" size="md" position="bl" />

		<div class="header__medallion mat-crystal" aria-hidden="true">
			<svg viewBox="-12 -12 24 24" fill="none" stroke="rgba(255,255,255,0.92)"
				stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
				<polygon points="0,-9 7.8,-4.5 7.8,4.5 0,9 -7.8,4.5 -7.8,-4.5"
					fill="rgba(255,255,255,0.18)" />
				<polygon points="0,-5 4.3,-2.5 4.3,2.5 0,5 -4.3,2.5 -4.3,-2.5"
					stroke-opacity="0.7" />
				<line x1="-7.8" y1="0" x2="7.8" y2="0" stroke-opacity="0.5" />
				<line x1="0" y1="-9" x2="0" y2="9" stroke-opacity="0.5" />
			</svg>
		</div>

		<h1 class="header__title"><router-link to="/">{{ siteTitle }}</router-link></h1>

		<hr class="header__rule header__rule--top" />
		<section class="header__info">
			<div class="header__location">{{ siteRegion }}</div>
			<div id="header-date" class="header__date"></div>
			<div class="header__price">{{ sitePrice }}</div>
		</section>
		<hr class="header__rule header__rule--bottom" />
	</header>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { SITE_CONFIG } from 'src/common/site-config';
import GlyphCorner from 'src/components/aetherium/GlyphCorner.vue';

@Options({
	components: {
		GlyphCorner,
	},
})
export default class SiteHeader extends Vue {
	get siteTitle(): string {
		return SITE_CONFIG.title;
	}

	get siteRegion(): string {
		return SITE_CONFIG.region;
	}

	get sitePrice(): string {
		return SITE_CONFIG.price;
	}
}
</script>

<style lang="scss">
.header {
	position: relative;
	margin-bottom: 3rem;
	padding: 28px 32px 22px;
}

// Four corner flourishes inset from each corner of the masthead frame.
.header__corner {
	position: absolute;
	z-index: 2;
	opacity: 0;
	animation: header-corner-fade var(--motion-cinematic) var(--ease-elpis) forwards;
	animation-delay: calc(var(--motion-base) + 80ms);
}

.header__corner--tl { top: 8px; left: 8px; }
.header__corner--tr { top: 8px; right: 8px; }
.header__corner--br { bottom: 8px; right: 8px; }
.header__corner--bl { bottom: 8px; left: 8px; }

@keyframes header-corner-fade {
	from { opacity: 0; transform: scale(0.7); }
	to   { opacity: 1; transform: scale(1); }
}

// Crystal medallion — small refractive disc above the title. Centered.
.header__medallion {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 50%;
	margin: 0 auto 14px;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.7),
		inset 0 -1px 0 rgba(167, 226, 255, 0.4),
		0 0 18px rgba(186, 155, 91, 0.28),
		0 4px 12px rgba(127, 230, 226, 0.25);
	opacity: 0;
	animation: header-medallion-bloom var(--motion-cinematic) var(--ease-elpis) forwards;
}

.header__medallion svg {
	width: 100%;
	height: 100%;
	display: block;
}

@keyframes header-medallion-bloom {
	from { opacity: 0; transform: scale(0.55); }
	to   { opacity: 1; transform: scale(1); }
}

.header__title {
	margin-top: 0;
	margin-bottom: 1.6rem;
	text-align: center;
	font-family: 'Cinzel', 'Playfair Display SC', var(--font-display), serif;
	font-size: var(--type-scale-8);
	font-weight: 600;
	letter-spacing: var(--ls-display);
	line-height: var(--lh-display);
	color: var(--surface-ink);
	text-shadow: rgba(186, 155, 91, 0.32) 4px 4px;
	opacity: 0;
	animation: header-title-rise var(--motion-cinematic) var(--ease-elpis) forwards;
	animation-delay: 80ms;
}

@keyframes header-title-rise {
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
}

.header__title a {
	color: inherit;
	border: inherit;
}

.header__title a:hover {
	color: var(--rule-gold);
}

// Triple-rule strip — thin / thick / thin stack painted via three stops on a
// single linear-gradient pair, the classic newspaper masthead pattern.
.header__rule {
	border: 0;
	height: 6px;
	margin: 0;
	padding: 0;
	background-color: transparent;
	background-image:
		linear-gradient(var(--surface-ink), var(--surface-ink)),
		linear-gradient(var(--surface-ink), var(--surface-ink)),
		linear-gradient(var(--surface-ink), var(--surface-ink));
	background-repeat: no-repeat;
	background-size: 100% 1px, 100% 2px, 100% 1px;
	background-position: 0 0, 0 50%, 0 100%;
	transform-origin: left center;
	transform: scaleX(0);
	animation: header-rule-strike var(--motion-cinematic) var(--ease-elpis) forwards;
}

.header__rule--top    { animation-delay: 200ms; }
.header__rule--bottom { animation-delay: 320ms; }

@keyframes header-rule-strike {
	from { transform: scaleX(0); }
	to   { transform: scaleX(1); }
}

.header__info {
	display: flex;
	align-items: end;
	padding: 14px 4px 14px;
	font-family: var(--font-ui);
	font-size: var(--type-scale-3);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	color: var(--surface-ink);
}

.header__location {
	flex-basis: 0;
	flex-grow: 1;
	text-align: left;
}

.header__price {
	flex-basis: 0;
	flex-grow: 1;
	text-align: right;
	font-feature-settings: 'tnum' 1, 'lnum' 1;
	font-variant-numeric: tabular-nums lining-nums;
}

// Mobile graceful collapse — stack info row, shrink medallion + title.
@media screen and (max-width: 600px) {
	.header {
		padding: 20px 18px 16px;
	}

	.header__medallion {
		width: 36px;
		height: 36px;
		margin-bottom: 10px;
	}

	.header__title {
		font-size: var(--type-scale-6); // 39 px
		margin-bottom: 1.2rem;
	}

	.header__info {
		flex-direction: column;
		align-items: center;
		gap: 4px;
		font-size: var(--type-scale-1);
		padding: 10px 4px 10px;
	}

	.header__location,
	.header__price {
		text-align: center;
	}

	.header__corner--tl,
	.header__corner--tr { top: 4px; }

	.header__corner--bl,
	.header__corner--br { bottom: 4px; }

	.header__corner--tl,
	.header__corner--bl { left: 4px; }

	.header__corner--tr,
	.header__corner--br { right: 4px; }
}

// Reduced motion — collapse all reveal animations to a 1-frame fade-in.
@media (prefers-reduced-motion: reduce) {
	.header__corner,
	.header__medallion,
	.header__title,
	.header__rule {
		animation-duration: var(--motion-instant);
		animation-delay: 0ms;
	}

	.header__rule {
		transform: scaleX(1);
	}
}

body.body--dark {
	.header__title {
		color: var(--ink-luminous);
		text-shadow: rgba(183, 211, 243, 0.32) 4px 4px;
	}

	.header__title a:hover {
		color: var(--glow-aether-d);
	}

	.header__rule {
		background-image:
			linear-gradient(var(--rule-arcane), var(--rule-arcane)),
			linear-gradient(var(--rule-arcane), var(--rule-arcane)),
			linear-gradient(var(--rule-arcane), var(--rule-arcane));
	}

	.header__info {
		color: var(--ink-luminous);
	}

	.header__medallion {
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.55),
			inset 0 -1px 0 rgba(158, 196, 243, 0.4),
			0 0 18px rgba(183, 211, 243, 0.28),
			0 4px 12px rgba(183, 211, 243, 0.3);
	}
}
</style>
