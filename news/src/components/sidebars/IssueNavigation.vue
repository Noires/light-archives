<template>
	<nav v-if="issues.length">
		<!-- Desktop fixed sidebar (≥ 1024 px). Aetherglass column with parchment-strip rows. -->
		<aside class="issue-navigation issue-navigation--desktop mat-aetherglass">
			<div class="issue-navigation__label">Ausgaben</div>
			<q-list flat class="issue-navigation__list">
				<q-item
					v-for="issue in issues"
					:key="issue"
					clickable
					v-ripple
					:to="`/issue/${issue}`"
					class="issue-navigation__item"
				>
					<q-item-section>
						<q-item-label class="issue-navigation__issue-number">{{ issue }}</q-item-label>
					</q-item-section>
				</q-item>
			</q-list>
		</aside>

		<!-- Mobile fallback (< 1024 px). Aetherglass dropdown anchored top-left. -->
		<div class="issue-navigation issue-navigation--mobile">
			<q-btn round flat class="issue-navigation__mobile-trigger mat-aetherglass" aria-label="Ausgaben">
				<q-icon name="menu_book" size="22px" />
				<q-menu fit anchor="bottom left" self="top left" :offset="[0, 8]" class="issue-navigation__mobile-menu">
					<div class="issue-navigation__mobile-label">Ausgaben</div>
					<q-list class="issue-navigation__mobile-list">
						<q-item
							v-for="issue in issues"
							:key="issue"
							clickable
							v-close-popup
							:to="`/issue/${issue}`"
						>
							<q-item-section>{{ issue }}</q-item-section>
						</q-item>
					</q-list>
				</q-menu>
			</q-btn>
		</div>
	</nav>
</template>

<script lang="ts">
import { Vue } from 'vue-class-component';

export default class IssueNavigation extends Vue {
	issues: number[] = [];

	async created() {
		this.issues = await this.$api.news.getIssues();
	}
}
</script>

<style lang="scss">
// Desktop column — fixed against the right margin, only at ≥ 1024 px.
.issue-navigation--desktop {
	display: none;
}

@media screen and (min-width: 1024px) {
	.issue-navigation--desktop {
		display: flex;
		flex-direction: column;
		position: fixed;
		right: 20px;
		top: 24px;
		padding: 14px 12px 12px;
		min-width: 132px;
		max-width: 168px;
		gap: 6px;
		z-index: 10;
	}
}

.issue-navigation__label {
	font-family: var(--font-ui);
	font-size: var(--type-scale-0);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	color: var(--ink-muted);
	text-align: center;
	padding-bottom: 8px;
	margin-bottom: 4px;
	border-bottom: 1px solid var(--rule-gold-soft);
}

.issue-navigation__list {
	background: transparent;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

// Parchment-strip rows — each issue row reads as a slip of vellum stamped
// with its issue number. Hairline gold rule + warm tint on hover.
.issue-navigation__item.q-item {
	min-height: 0;
	padding: 8px 12px;
	border-radius: 4px;
	color: var(--surface-ink);
	background-color: rgba(186, 155, 91, 0.05);
	box-shadow: inset 0 0 0 1px var(--rule-gold-soft);
	transition:
		background-color var(--motion-fast) var(--ease-elpis),
		box-shadow var(--motion-fast) var(--ease-elpis),
		color var(--motion-fast) var(--ease-elpis);
}

.issue-navigation__item.q-item:hover,
.issue-navigation__item.q-item:focus-visible {
	background-color: rgba(186, 155, 91, 0.14);
	box-shadow: inset 0 0 0 1px var(--rule-gold);
	color: var(--rule-gold);
}

// Selected issue — solid gold rule + warm tint + inset gold rail on the left.
.issue-navigation__item.q-router-link--active,
.issue-navigation__item.q-router-link-exact-active {
	background-color: rgba(186, 155, 91, 0.22);
	color: var(--rule-gold);
	box-shadow:
		inset 3px 0 0 var(--rule-gold),
		inset 0 0 0 1px var(--rule-gold-soft);
}

.issue-navigation__issue-number {
	font-family: var(--font-display);
	font-size: var(--type-scale-2);
	letter-spacing: var(--ls-display);
	font-feature-settings: 'tnum' 1, 'lnum' 1;
	font-variant-numeric: tabular-nums lining-nums;
	text-align: center;
}

// Mobile floating trigger — appears below 1024 px, hides at desktop sizes.
.issue-navigation--mobile {
	display: flex;
	position: fixed;
	top: 12px;
	left: 12px;
	z-index: 1000;
}

@media screen and (min-width: 1024px) {
	.issue-navigation--mobile {
		display: none;
	}
}

.issue-navigation__mobile-trigger.q-btn {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	color: var(--surface-ink);
	box-shadow:
		inset 0 0 0 1px var(--rule-gold-soft),
		inset 0 1px 0 rgba(255, 255, 255, 0.55),
		0 6px 16px rgba(43, 36, 24, 0.16);
}

.issue-navigation__mobile-menu {
	font-family: var(--font-ui);
	font-size: var(--type-scale-1);
	min-width: 160px;
	padding: 8px 0 4px;
}

.issue-navigation__mobile-label {
	font-size: var(--type-scale-0);
	letter-spacing: var(--ls-eyebrow);
	text-transform: uppercase;
	color: var(--ink-muted);
	padding: 0 16px 6px;
	border-bottom: 1px solid var(--rule-gold-soft);
	margin-bottom: 4px;
}

.issue-navigation__mobile-list .q-item {
	color: var(--surface-ink);
	font-feature-settings: 'tnum' 1, 'lnum' 1;
	font-variant-numeric: tabular-nums lining-nums;
}

.issue-navigation__mobile-list .q-item:hover {
	background-color: rgba(186, 155, 91, 0.12);
}

// Zodiark variants — both desktop column and mobile dropdown.
body.body--dark {
	.issue-navigation__label {
		color: rgba(236, 227, 247, 0.74);
		border-bottom-color: var(--rule-arcane-soft);
	}

	.issue-navigation__item.q-item {
		color: var(--ink-luminous);
		background-color: rgba(193, 155, 255, 0.06);
		box-shadow: inset 0 0 0 1px var(--rule-arcane-soft);
	}

	.issue-navigation__item.q-item:hover,
	.issue-navigation__item.q-item:focus-visible {
		background-color: rgba(193, 155, 255, 0.16);
		box-shadow: inset 0 0 0 1px var(--rule-arcane);
		color: var(--glow-aether-d);
	}

	.issue-navigation__item.q-router-link--active,
	.issue-navigation__item.q-router-link-exact-active {
		background-color: rgba(193, 155, 255, 0.22);
		color: var(--glow-aether-d);
		box-shadow:
			inset 3px 0 0 var(--rule-arcane),
			inset 0 0 0 1px var(--rule-arcane-soft);
	}

	.issue-navigation__mobile-trigger.q-btn {
		color: var(--ink-luminous);
		box-shadow:
			inset 0 0 0 1px var(--rule-arcane-soft),
			inset 0 1px 0 rgba(184, 165, 255, 0.18),
			0 6px 16px rgba(0, 0, 0, 0.55);
	}

	.issue-navigation__mobile-label {
		color: rgba(236, 227, 247, 0.74);
		border-bottom-color: var(--rule-arcane-soft);
	}

	.issue-navigation__mobile-list .q-item {
		color: var(--ink-luminous);
	}

	.issue-navigation__mobile-list .q-item:hover {
		background-color: rgba(193, 155, 255, 0.16);
	}
}
</style>
