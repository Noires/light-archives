<template>
	<header class="vision-page-head">
		<div class="vision-page-head__row">
			<div class="vision-page-head__text">
				<p v-if="eyebrow" class="vision-page-head__eyebrow">{{ eyebrow }}</p>
				<h1 class="vision-page-head__title">{{ title }}</h1>
				<p v-if="lead" class="vision-page-head__lead">{{ lead }}</p>
			</div>
			<div v-if="$slots.actions" class="vision-page-head__actions">
				<slot name="actions" />
			</div>
		</div>
		<div v-if="$slots.default" class="vision-page-head__extra">
			<slot />
		</div>
	</header>
</template>

<script lang="ts">
import { Options, prop, Vue } from 'vue-class-component';

// ER2-007 — page head for directory and detail pages:
// eyebrow, Cinzel title (the page's h1), lead, actions slot, extras slot.

class Props {
	eyebrow = prop<string>({ default: '' });
	title = prop<string>({ required: true });
	lead = prop<string>({ default: '' });
}

@Options({
	name: 'PageHead',
})
export default class PageHead extends Vue.with(Props) {}
</script>

<style lang="scss" scoped>
.vision-page-head {
	padding: 44px 0 24px;
	color: var(--ink-primary);
}

.vision-page-head__row {
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	justify-content: space-between;
	gap: 16px 24px;
}

.vision-page-head__text {
	flex: 1 1 320px;
	min-width: 0;
}

.vision-page-head__eyebrow {
	margin: 0 0 8px;
	font-family: var(--font-ui);
	font-weight: 600;
	font-size: 11px;
	line-height: 16px;
	letter-spacing: 1.6px;
	text-transform: uppercase;
	color: var(--ink-link);
}

.vision-page-head__title {
	margin: 0;
	font-family: var(--font-display);
	font-weight: 500;
	font-size: 40px;
	line-height: 1.15;
	letter-spacing: 0;
	color: var(--ink-primary);
	overflow-wrap: anywhere;

	@media (max-width: 599px) {
		font-size: 32px;
	}
}

.vision-page-head__lead {
	max-width: 640px;
	margin: 12px 0 0;
	font-family: var(--font-ui);
	font-size: 16px;
	line-height: 1.55;
	color: var(--ink-muted);
}

.vision-page-head__actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
}

.vision-page-head__extra {
	margin-top: 20px;
}
</style>
